import { eq, desc, asc, sql } from "drizzle-orm";
import type { DrizzleDB } from "./db.js";
import type { IStorage, ClaimFilters, PipelineStats, StoryFeedItem } from "./storage.js";
import {
  sources,
  items,
  claims,
  evidenceItems,
  verdicts,
  resolutions,
  stories,
  storyClaims,
  storyItems,
  sourceScores,
  users,
  creators,
  creatorVideos,
  creatorClaims,
  creatorScores,
  disputes,
  gifts,
  newsletterSubscribers,
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
  Creator,
  InsertCreator,
  CreatorVideo,
  InsertCreatorVideo,
  CreatorClaim,
  InsertCreatorClaim,
  CreatorScore,
  InsertCreatorScore,
  Dispute,
  InsertDispute,
  Gift,
  NewsletterSubscriber,
  InsertNewsletterSubscriber,
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

  async updateSource(id: string, data: Partial<Pick<Source, "displayName" | "logoUrl" | "metadata">>): Promise<Source | undefined> {
    const [updated] = await this.db.update(sources).set({ ...data, updatedAt: new Date() }).where(eq(sources.id, id)).returning();
    return updated;
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

  async updateClaimMetadata(claimId: string, metadata: Record<string, any>): Promise<void> {
    const claim = await this.getClaim(claimId);
    if (claim) {
      const merged = { ...(claim.metadata as any || {}), ...metadata };
      await this.db.update(claims).set({ metadata: merged }).where(eq(claims.id, claimId));
    }
  }

  async updateClaim(id: string, data: Partial<Pick<Claim, "claimText" | "claimType" | "status" | "assetSymbols">>): Promise<Claim | undefined> {
    const [updated] = await this.db.update(claims).set(data).where(eq(claims.id, id)).returning();
    return updated;
  }

  async deleteClaim(id: string): Promise<boolean> {
    const claim = await this.getClaim(id);
    if (!claim) return false;
    // Delete related evidence
    await this.db.delete(evidenceItems).where(eq(evidenceItems.claimId, id));
    // Delete related verdicts
    await this.db.delete(verdicts).where(eq(verdicts.claimId, id));
    // Delete related storyClaims
    await this.db.delete(storyClaims).where(eq(storyClaims.claimId, id));
    // Delete the claim
    await this.db.delete(claims).where(eq(claims.id, id));
    return true;
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

  async getVerdictHistoryByClaim(claimId: string): Promise<Verdict[]> {
    return await this.db.select().from(verdicts).where(eq(verdicts.claimId, claimId)).orderBy(desc(verdicts.createdAt));
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

  async updateStory(id: string, data: Partial<Pick<Story, "title" | "summary" | "imageUrl" | "category" | "assetSymbols" | "sourceCount">>): Promise<void> {
    await this.db.update(stories).set({ ...data, updatedAt: new Date() }).where(eq(stories.id, id));
  }

  async deleteStory(id: string): Promise<boolean> {
    const story = await this.getStory(id);
    if (!story) return false;
    await this.db.delete(storyClaims).where(eq(storyClaims.storyId, id));
    await this.db.delete(storyItems).where(eq(storyItems.storyId, id));
    await this.db.delete(stories).where(eq(stories.id, id));
    return true;
  }

  async addClaimToStory(storyId: string, claimId: string): Promise<void> {
    await this.db.insert(storyClaims).values({ storyId, claimId });
  }

  async addItemToStory(storyId: string, itemId: string): Promise<void> {
    // Avoid duplicates: check if already linked
    const existing = await this.db
      .select()
      .from(storyItems)
      .where(sql`${storyItems.storyId} = ${storyId} AND ${storyItems.itemId} = ${itemId}`)
      .limit(1);
    if (existing.length > 0) return;
    await this.db.insert(storyItems).values({ storyId, itemId });
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

  async getStoryByClaimId(claimId: string): Promise<Story | null> {
    const [link] = await this.db
      .select()
      .from(storyClaims)
      .where(eq(storyClaims.claimId, claimId))
      .limit(1);
    if (!link) return null;
    const [story] = await this.db
      .select()
      .from(stories)
      .where(eq(stories.id, link.storyId));
    return story ?? null;
  }

  async getStoriesForFeed(limit: number = 50, offset: number = 0): Promise<StoryFeedItem[]> {
    const allStories = await this.db
      .select()
      .from(stories)
      .orderBy(desc(stories.updatedAt))
      .limit(limit)
      .offset(offset);

    const result: StoryFeedItem[] = [];

    for (const story of allStories) {
      // Get items linked to this story
      const itemLinks = await this.db
        .select()
        .from(storyItems)
        .where(eq(storyItems.storyId, story.id));

      // Get claims linked to this story
      const claimLinks = await this.db
        .select()
        .from(storyClaims)
        .where(eq(storyClaims.storyId, story.id));

      // Get unique sources from items (or fall back to claims->items)
      const sourceMap = new Map<string, Source>();
      let latestItemTimestamp: Date | null = null;

      const itemIds = itemLinks.map((l) => l.itemId);

      // If no storyItems, derive from claims
      if (itemIds.length === 0) {
        for (const cl of claimLinks) {
          const [claim] = await this.db.select().from(claims).where(eq(claims.id, cl.claimId));
          if (claim) itemIds.push(claim.itemId);
        }
      }

      for (const itemId of itemIds) {
        const [item] = await this.db.select().from(items).where(eq(items.id, itemId));
        if (!item) continue;
        if (!sourceMap.has(item.sourceId)) {
          const [source] = await this.db.select().from(sources).where(eq(sources.id, item.sourceId));
          if (source) sourceMap.set(source.id, source);
        }
        if (item.publishedAt && (!latestItemTimestamp || item.publishedAt > latestItemTimestamp)) {
          latestItemTimestamp = item.publishedAt;
        }
      }

      // Compute credibility distribution
      const dist = { high: 0, medium: 0, low: 0 };
      const topSources: StoryFeedItem["topSources"] = [];

      for (const source of sourceMap.values()) {
        const [score] = await this.db
          .select()
          .from(sourceScores)
          .where(eq(sourceScores.sourceId, source.id))
          .orderBy(desc(sourceScores.computedAt))
          .limit(1);
        const tr = score?.trackRecord ?? 50;
        if (tr >= 70) dist.high++;
        else if (tr >= 50) dist.medium++;
        else dist.low++;
        topSources.push({
          id: source.id,
          displayName: source.displayName,
          logoUrl: source.logoUrl,
          trackRecord: tr,
        });
      }

      topSources.sort((a, b) => (b.trackRecord ?? 0) - (a.trackRecord ?? 0));

      result.push({
        id: story.id,
        title: story.title,
        summary: story.summary,
        imageUrl: story.imageUrl,
        category: story.category,
        createdAt: story.createdAt,
        assetSymbols: story.assetSymbols ?? [],
        sourceCount: sourceMap.size || story.sourceCount || 0,
        claimCount: claimLinks.length,
        credibilityDistribution: dist,
        topSources: topSources.slice(0, 5),
        latestItemTimestamp,
      });
    }

    return result;
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

  async updateUserTier(userId: string, tier: string): Promise<void> {
    await this.db
      .update(users)
      .set({ subscriptionTier: tier })
      .where(eq(users.id, userId));
  }

  // ── Creators ─────────────────────────────────────────────────────

  async createCreator(data: InsertCreator): Promise<Creator> {
    const [creator] = await this.db.insert(creators).values(data).returning();
    return creator;
  }

  async getCreator(id: string): Promise<Creator | undefined> {
    const [creator] = await this.db.select().from(creators).where(eq(creators.id, id));
    return creator;
  }

  async getCreatorByChannelId(channelId: string): Promise<Creator | undefined> {
    const [creator] = await this.db
      .select()
      .from(creators)
      .where(eq(creators.youtubeChannelId, channelId));
    return creator;
  }

  async getCreators(activeOnly?: boolean): Promise<Creator[]> {
    if (activeOnly) {
      return this.db.select().from(creators).where(eq(creators.isActive, true));
    }
    return this.db.select().from(creators);
  }

  async updateCreator(id: string, data: Partial<Creator>): Promise<void> {
    await this.db.update(creators).set({ ...data, updatedAt: new Date() }).where(eq(creators.id, id));
  }

  // ── Creator Videos ──────────────────────────────────────────────

  async createCreatorVideo(data: InsertCreatorVideo): Promise<CreatorVideo> {
    const [video] = await this.db.insert(creatorVideos).values(data).returning();
    return video;
  }

  async getCreatorVideo(id: string): Promise<CreatorVideo | undefined> {
    const [video] = await this.db.select().from(creatorVideos).where(eq(creatorVideos.id, id));
    return video;
  }

  async getCreatorVideoByYoutubeId(youtubeVideoId: string): Promise<CreatorVideo | undefined> {
    const [video] = await this.db
      .select()
      .from(creatorVideos)
      .where(eq(creatorVideos.youtubeVideoId, youtubeVideoId));
    return video;
  }

  async getCreatorVideos(creatorId: string, limit?: number): Promise<CreatorVideo[]> {
    let query = this.db
      .select()
      .from(creatorVideos)
      .where(eq(creatorVideos.creatorId, creatorId))
      .orderBy(desc(creatorVideos.createdAt))
      .$dynamic();
    if (limit) {
      query = query.limit(limit);
    }
    return query;
  }

  async getAllCreatorVideos(): Promise<CreatorVideo[]> {
    return this.db.select().from(creatorVideos).orderBy(desc(creatorVideos.createdAt));
  }

  async updateCreatorVideo(id: string, data: Partial<CreatorVideo>): Promise<void> {
    await this.db.update(creatorVideos).set(data).where(eq(creatorVideos.id, id));
  }

  // ── Creator Claims ──────────────────────────────────────────────

  async createCreatorClaim(data: InsertCreatorClaim): Promise<CreatorClaim> {
    const [claim] = await this.db.insert(creatorClaims).values(data).returning();
    return claim;
  }

  async getCreatorClaim(id: string): Promise<CreatorClaim | undefined> {
    const [claim] = await this.db.select().from(creatorClaims).where(eq(creatorClaims.id, id));
    return claim;
  }

  async getCreatorClaims(filters?: { creatorId?: string; status?: string; category?: string; limit?: number; offset?: number }): Promise<CreatorClaim[]> {
    let query = this.db.select().from(creatorClaims).$dynamic();
    if (filters?.creatorId) {
      query = query.where(eq(creatorClaims.creatorId, filters.creatorId));
    }
    if (filters?.status) {
      query = query.where(eq(creatorClaims.status, filters.status as any));
    }
    if (filters?.category) {
      query = query.where(eq(creatorClaims.category, filters.category as any));
    }
    query = query.orderBy(desc(creatorClaims.createdAt));
    const limit = filters?.limit ?? 50;
    const offset = filters?.offset ?? 0;
    query = query.limit(limit).offset(offset);
    return query;
  }

  async updateCreatorClaim(id: string, data: Partial<CreatorClaim>): Promise<void> {
    await this.db.update(creatorClaims).set({ ...data, updatedAt: new Date() }).where(eq(creatorClaims.id, id));
  }

  // ── Creator Scores ──────────────────────────────────────────────

  async createCreatorScore(data: InsertCreatorScore): Promise<CreatorScore> {
    const [score] = await this.db.insert(creatorScores).values(data).returning();
    return score;
  }

  async getCreatorScoreHistory(creatorId: string): Promise<CreatorScore[]> {
    return this.db
      .select()
      .from(creatorScores)
      .where(eq(creatorScores.creatorId, creatorId))
      .orderBy(desc(creatorScores.calculatedAt));
  }

  // ── Disputes ────────────────────────────────────────────────────

  async createDispute(data: InsertDispute): Promise<Dispute> {
    const [dispute] = await this.db.insert(disputes).values(data).returning();
    return dispute;
  }

  async getDisputesByClaimId(claimId: string): Promise<Dispute[]> {
    return this.db
      .select()
      .from(disputes)
      .where(eq(disputes.claimId, claimId));
  }

  async updateDispute(id: string, data: Partial<Dispute>): Promise<void> {
    await this.db.update(disputes).set(data).where(eq(disputes.id, id));
  }

  // ── Gifts ──────────────────────────────────────────────────────

  async createGift(data: Omit<Gift, "id" | "createdAt" | "redeemedAt" | "redeemedByUserId">): Promise<Gift> {
    const [gift] = await this.db.insert(gifts).values(data).returning();
    return gift;
  }

  async getGiftByCode(code: string): Promise<Gift | undefined> {
    const [gift] = await this.db.select().from(gifts).where(eq(gifts.code, code));
    return gift;
  }

  async getGiftByStripeSession(sessionId: string): Promise<Gift | undefined> {
    const [gift] = await this.db.select().from(gifts).where(eq(gifts.stripeSessionId, sessionId));
    return gift;
  }

  async redeemGift(giftId: string, userId: string): Promise<void> {
    await this.db
      .update(gifts)
      .set({ status: "redeemed", redeemedByUserId: userId, redeemedAt: new Date() })
      .where(eq(gifts.id, giftId));
  }

  async activateGiftSubscription(userId: string, durationMonths: number): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + durationMonths);
    await this.db
      .update(users)
      .set({ subscriptionTier: "premium", subscriptionExpiresAt: expiresAt })
      .where(eq(users.id, userId));
  }

  // ── Newsletter ──────────────────────────────────────────────────

  async subscribeNewsletter(data: InsertNewsletterSubscriber): Promise<NewsletterSubscriber> {
    // Check for existing subscriber
    const [existing] = await this.db.select().from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.email, data.email));
    if (existing) {
      if (!existing.isActive) {
        await this.db.update(newsletterSubscribers)
          .set({ isActive: true, unsubscribedAt: null, preferences: data.preferences ?? existing.preferences })
          .where(eq(newsletterSubscribers.id, existing.id));
        return { ...existing, isActive: true, unsubscribedAt: null };
      }
      return existing;
    }
    const [subscriber] = await this.db.insert(newsletterSubscribers).values(data).returning();
    return subscriber;
  }

  async unsubscribeNewsletter(email: string): Promise<boolean> {
    const result = await this.db.update(newsletterSubscribers)
      .set({ isActive: false, unsubscribedAt: new Date() })
      .where(eq(newsletterSubscribers.email, email));
    return (result as any).rowCount > 0;
  }

  async getNewsletterSubscriber(email: string): Promise<NewsletterSubscriber | undefined> {
    const [subscriber] = await this.db.select().from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.email, email));
    return subscriber;
  }

  async getActiveNewsletterSubscribers(): Promise<NewsletterSubscriber[]> {
    return this.db.select().from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.isActive, true));
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
