import { eq, desc, asc, sql } from "drizzle-orm";
import type { DrizzleDB } from "./db.js";
import type { IStorage, ClaimFilters, PipelineStats } from "./storage.js";
import {
  sources,
  items,
  claims,
  evidenceItems,
  verdicts,
  resolutions,
  stories,
  storyClaims,
  sourceScores,
  users,
} from "../shared/schema.js";
import type {
  Source,
  InsertSource,
  Item,
  InsertItem,
  Claim,
  InsertClaim,
  EvidenceItem,
  InsertEvidence,
  Verdict,
  InsertVerdict,
  Resolution,
  Story,
  InsertStory,
  SourceScore,
  User,
  InsertUser,
} from "../shared/schema.js";

export class DrizzleStorage implements IStorage {
  private lastPipelineRun: string | null = null;

  constructor(private db: DrizzleDB) {}

  // ── Sources ──────────────────────────────────────────────────────

  async createSource(data: InsertSource): Promise<Source> {
    const [source] = await this.db.insert(sources).values(data).returning();
    return source;
  }

  async getSource(id: string): Promise<Source | undefined> {
    const [source] = await this.db.select().from(sources).where(eq(sources.id, id));
    return source;
  }

  async getSources(): Promise<Source[]> {
    return this.db.select().from(sources);
  }

  async getSourceByDomain(domain: string): Promise<Source | undefined> {
    const [source] = await this.db
      .select()
      .from(sources)
      .where(eq(sources.handleOrDomain, domain));
    return source;
  }

  // ── Items ────────────────────────────────────────────────────────

  async createItem(data: InsertItem): Promise<Item> {
    const [item] = await this.db.insert(items).values(data).returning();
    return item;
  }

  async getItem(id: string): Promise<Item | undefined> {
    const [item] = await this.db.select().from(items).where(eq(items.id, id));
    return item;
  }

  async getItemByUrl(url: string): Promise<Item | undefined> {
    const [item] = await this.db.select().from(items).where(eq(items.url, url));
    return item;
  }

  async getItems(): Promise<Item[]> {
    return this.db.select().from(items);
  }

  // ── Claims ───────────────────────────────────────────────────────

  async createClaim(data: InsertClaim): Promise<Claim> {
    const [claim] = await this.db.insert(claims).values(data).returning();
    return claim;
  }

  async getClaim(id: string): Promise<Claim | undefined> {
    const [claim] = await this.db.select().from(claims).where(eq(claims.id, id));
    return claim;
  }

  async getClaims(filters?: ClaimFilters): Promise<Claim[]> {
    let query = this.db.select().from(claims).$dynamic();

    if (filters?.status) {
      query = query.where(eq(claims.status, filters.status as any));
    }

    // Sort
    const sort = filters?.sort ?? "newest";
    if (sort === "newest") {
      query = query.orderBy(desc(claims.assertedAt));
    } else if (sort === "oldest") {
      query = query.orderBy(asc(claims.assertedAt));
    }

    // Pagination
    const limit = filters?.limit ?? 50;
    const offset = filters?.offset ?? 0;
    query = query.limit(limit).offset(offset);

    let results = await query;

    // Filter by asset (done in JS since array contains is complex in SQL)
    if (filters?.asset) {
      const asset = filters.asset.toUpperCase();
      results = results.filter((c) =>
        c.assetSymbols?.some((s) => s.toUpperCase() === asset)
      );
    }

    // Filter by verdict (requires a join or subquery, simpler in JS for now)
    if (filters?.verdict) {
      const verdictLabel = filters.verdict;
      const filtered: Claim[] = [];
      for (const c of results) {
        const v = await this.getVerdictByClaim(c.id);
        if (v?.verdictLabel === verdictLabel) {
          filtered.push(c);
        }
      }
      results = filtered;
    }

    // Sort by confidence (requires verdict lookup)
    if (sort === "confidence") {
      const withVerdicts = await Promise.all(
        results.map(async (c) => ({
          claim: c,
          verdict: await this.getVerdictByClaim(c.id),
        }))
      );
      withVerdicts.sort(
        (a, b) => (b.verdict?.probabilityTrue ?? 0) - (a.verdict?.probabilityTrue ?? 0)
      );
      results = withVerdicts.map((wv) => wv.claim);
    }

    return results;
  }

  async getClaimsBySource(sourceId: string): Promise<Claim[]> {
    return this.db.select().from(claims).where(eq(claims.sourceId, sourceId));
  }

  async getClaimsByItem(itemId: string): Promise<Claim[]> {
    return this.db.select().from(claims).where(eq(claims.itemId, itemId));
  }

  // ── Evidence ─────────────────────────────────────────────────────

  async createEvidence(data: InsertEvidence): Promise<EvidenceItem> {
    const [ev] = await this.db.insert(evidenceItems).values(data).returning();
    return ev;
  }

  async getEvidenceByClaim(claimId: string): Promise<EvidenceItem[]> {
    return this.db
      .select()
      .from(evidenceItems)
      .where(eq(evidenceItems.claimId, claimId));
  }

  // ── Verdicts ─────────────────────────────────────────────────────

  async createVerdict(data: InsertVerdict): Promise<Verdict> {
    const [verdict] = await this.db.insert(verdicts).values(data).returning();
    return verdict;
  }

  async getVerdictByClaim(claimId: string): Promise<Verdict | undefined> {
    const [verdict] = await this.db
      .select()
      .from(verdicts)
      .where(eq(verdicts.claimId, claimId))
      .orderBy(desc(verdicts.createdAt))
      .limit(1);
    return verdict;
  }

  async deleteVerdictByClaim(claimId: string): Promise<void> {
    await this.db.delete(verdicts).where(eq(verdicts.claimId, claimId));
  }

  // ── Resolutions ──────────────────────────────────────────────────

  async createResolution(data: Omit<Resolution, "id">): Promise<Resolution> {
    const [resolution] = await this.db.insert(resolutions).values(data).returning();
    return resolution;
  }

  async getResolutionByClaim(claimId: string): Promise<Resolution | undefined> {
    const [resolution] = await this.db
      .select()
      .from(resolutions)
      .where(eq(resolutions.claimId, claimId));
    return resolution;
  }

  // ── Stories ──────────────────────────────────────────────────────

  async createStory(data: InsertStory): Promise<Story> {
    const [story] = await this.db.insert(stories).values(data).returning();
    return story;
  }

  async getStory(id: string): Promise<Story | undefined> {
    const [story] = await this.db.select().from(stories).where(eq(stories.id, id));
    return story;
  }

  async getStories(): Promise<Story[]> {
    return this.db.select().from(stories);
  }

  async addClaimToStory(storyId: string, claimId: string): Promise<void> {
    await this.db.insert(storyClaims).values({ storyId, claimId });
  }

  async getStoryWithClaims(
    storyId: string
  ): Promise<{ story: Story; claims: Claim[] } | undefined> {
    const [story] = await this.db.select().from(stories).where(eq(stories.id, storyId));
    if (!story) return undefined;

    const links = await this.db
      .select()
      .from(storyClaims)
      .where(eq(storyClaims.storyId, storyId));

    const claimResults: Claim[] = [];
    for (const link of links) {
      const [claim] = await this.db
        .select()
        .from(claims)
        .where(eq(claims.id, link.claimId));
      if (claim) claimResults.push(claim);
    }

    return { story, claims: claimResults };
  }

  // ── Source Scores ────────────────────────────────────────────────

  async createSourceScore(data: Omit<SourceScore, "id">): Promise<SourceScore> {
    const [score] = await this.db.insert(sourceScores).values(data).returning();
    return score;
  }

  async getSourceScore(sourceId: string): Promise<SourceScore | undefined> {
    const [score] = await this.db
      .select()
      .from(sourceScores)
      .where(eq(sourceScores.sourceId, sourceId))
      .orderBy(desc(sourceScores.computedAt))
      .limit(1);
    return score;
  }

  // ── Users ──────────────────────────────────────────────────

  async createUser(data: InsertUser): Promise<User> {
    const [user] = await this.db.insert(users).values(data).returning();
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email));
    return user;
  }

  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.id, id));
    return user;
  }

  // ── Pipeline Stats ───────────────────────────────────────────────

  async getPipelineStats(): Promise<PipelineStats> {
    const [sourceCount] = await this.db.select({ count: sql<number>`count(*)` }).from(sources);
    const [itemCount] = await this.db.select({ count: sql<number>`count(*)` }).from(items);
    const [claimCount] = await this.db.select({ count: sql<number>`count(*)` }).from(claims);
    const [evidenceCount] = await this.db.select({ count: sql<number>`count(*)` }).from(evidenceItems);
    const [verdictCount] = await this.db.select({ count: sql<number>`count(*)` }).from(verdicts);
    const [resolutionCount] = await this.db.select({ count: sql<number>`count(*)` }).from(resolutions);
    const [storyCount] = await this.db.select({ count: sql<number>`count(*)` }).from(stories);

    return {
      totalSources: Number(sourceCount.count),
      totalItems: Number(itemCount.count),
      totalClaims: Number(claimCount.count),
      totalEvidence: Number(evidenceCount.count),
      totalVerdicts: Number(verdictCount.count),
      totalResolutions: Number(resolutionCount.count),
      totalStories: Number(storyCount.count),
      lastRunAt: this.lastPipelineRun,
    };
  }

  setLastPipelineRun(ts: string): void {
    this.lastPipelineRun = ts;
  }
}
