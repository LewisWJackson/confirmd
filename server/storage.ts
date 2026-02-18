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
import { db } from "./db.js";
import { DrizzleStorage } from "./drizzle-storage.js";

// ─── Storage Interface ───────────────────────────────────────────────

export interface IStorage {
  // Sources
  createSource(data: InsertSource): Promise<Source>;
  getSource(id: string): Promise<Source | undefined>;
  getSources(): Promise<Source[]>;
  getSourceByDomain(domain: string): Promise<Source | undefined>;
  updateSource(id: string, data: Partial<Pick<Source, "displayName" | "logoUrl" | "metadata">>): Promise<Source | undefined>;

  // Items
  createItem(data: InsertItem): Promise<Item>;
  getItem(id: string): Promise<Item | undefined>;
  getItemByUrl(url: string): Promise<Item | undefined>;
  getItems(): Promise<Item[]>;

  // Claims
  createClaim(data: InsertClaim): Promise<Claim>;
  getClaim(id: string): Promise<Claim | undefined>;
  getClaims(filters?: ClaimFilters): Promise<Claim[]>;
  getClaimsBySource(sourceId: string): Promise<Claim[]>;
  getClaimsByItem(itemId: string): Promise<Claim[]>;
  updateClaimMetadata(claimId: string, metadata: Record<string, any>): Promise<void>;
  updateClaim(id: string, data: Partial<Pick<Claim, "claimText" | "claimType" | "status" | "assetSymbols">>): Promise<Claim | undefined>;
  deleteClaim(id: string): Promise<boolean>;

  // Evidence
  createEvidence(data: InsertEvidence): Promise<EvidenceItem>;
  getEvidenceByClaim(claimId: string): Promise<EvidenceItem[]>;

  // Verdicts
  createVerdict(data: InsertVerdict): Promise<Verdict>;
  getVerdictByClaim(claimId: string): Promise<Verdict | undefined>;
  getVerdictHistoryByClaim(claimId: string): Promise<Verdict[]>;
  deleteVerdictByClaim(claimId: string): Promise<void>;

  // Resolutions
  createResolution(data: Omit<Resolution, "id">): Promise<Resolution>;
  getResolutionByClaim(claimId: string): Promise<Resolution | undefined>;

  // Stories
  createStory(data: InsertStory): Promise<Story>;
  getStory(id: string): Promise<Story | undefined>;
  getStories(): Promise<Story[]>;
  updateStory(id: string, data: Partial<Pick<Story, "title" | "summary" | "imageUrl" | "category" | "assetSymbols" | "sourceCount" | "status">>): Promise<void>;
  deleteStory(id: string): Promise<boolean>;
  addClaimToStory(storyId: string, claimId: string): Promise<void>;
  addItemToStory(storyId: string, itemId: string): Promise<void>;
  getStoryWithClaims(storyId: string): Promise<{ story: Story; claims: Claim[] } | undefined>;
  getStoryByClaimId(claimId: string): Promise<Story | null>;
  getStoriesForFeed(limit?: number, offset?: number, statusFilter?: string): Promise<StoryFeedItem[]>;

  // Source Scores
  createSourceScore(data: Omit<SourceScore, "id">): Promise<SourceScore>;
  getSourceScore(sourceId: string): Promise<SourceScore | undefined>;

  // Users
  createUser(data: InsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  updateUserTier(userId: string, tier: string): Promise<void>;

  // Creators
  createCreator(data: InsertCreator): Promise<Creator>;
  getCreator(id: string): Promise<Creator | undefined>;
  getCreatorByChannelId(channelId: string): Promise<Creator | undefined>;
  getCreators(activeOnly?: boolean): Promise<Creator[]>;
  updateCreator(id: string, data: Partial<Creator>): Promise<void>;

  // Creator Videos
  createCreatorVideo(data: InsertCreatorVideo): Promise<CreatorVideo>;
  getCreatorVideo(id: string): Promise<CreatorVideo | undefined>;
  getCreatorVideoByYoutubeId(youtubeVideoId: string): Promise<CreatorVideo | undefined>;
  getCreatorVideos(creatorId: string, limit?: number): Promise<CreatorVideo[]>;
  getAllCreatorVideos(): Promise<CreatorVideo[]>;
  updateCreatorVideo(id: string, data: Partial<CreatorVideo>): Promise<void>;

  // Creator Claims
  createCreatorClaim(data: InsertCreatorClaim): Promise<CreatorClaim>;
  getCreatorClaim(id: string): Promise<CreatorClaim | undefined>;
  getCreatorClaims(filters?: { creatorId?: string; status?: string; category?: string; limit?: number; offset?: number }): Promise<CreatorClaim[]>;
  updateCreatorClaim(id: string, data: Partial<CreatorClaim>): Promise<void>;

  // Creator Scores
  createCreatorScore(data: InsertCreatorScore): Promise<CreatorScore>;
  getCreatorScoreHistory(creatorId: string): Promise<CreatorScore[]>;

  // Disputes
  createDispute(data: InsertDispute): Promise<Dispute>;
  getDisputesByClaimId(claimId: string): Promise<Dispute[]>;
  updateDispute(id: string, data: Partial<Dispute>): Promise<void>;

  // Gifts
  createGift(data: Omit<Gift, "id" | "createdAt" | "redeemedAt" | "redeemedByUserId">): Promise<Gift>;
  getGiftByCode(code: string): Promise<Gift | undefined>;
  getGiftByStripeSession(sessionId: string): Promise<Gift | undefined>;
  redeemGift(giftId: string, userId: string): Promise<void>;
  activateGiftSubscription(userId: string, durationMonths: number): Promise<void>;

  // Newsletter
  subscribeNewsletter(data: InsertNewsletterSubscriber): Promise<NewsletterSubscriber>;
  unsubscribeNewsletter(email: string): Promise<boolean>;
  getNewsletterSubscriber(email: string): Promise<NewsletterSubscriber | undefined>;
  getActiveNewsletterSubscribers(): Promise<NewsletterSubscriber[]>;

  // Pipeline Stats
  getPipelineStats(): Promise<PipelineStats>;

  // Search
  search(query: string, options?: { type?: string; limit?: number; offset?: number }): Promise<SearchResults>;
}

export interface ClaimFilters {
  asset?: string;
  verdict?: string;
  status?: string;
  sort?: "newest" | "oldest" | "confidence";
  limit?: number;
  offset?: number;
}

export interface PipelineStats {
  totalSources: number;
  totalItems: number;
  totalClaims: number;
  totalEvidence: number;
  totalVerdicts: number;
  totalResolutions: number;
  totalStories: number;
  lastRunAt: string | null;
}

export interface SearchResults {
  claims: Claim[];
  stories: Story[];
  sources: Source[];
}

export interface StoryFeedItem {
  id: string;
  title: string;
  summary: string | null;
  imageUrl: string | null;
  category: string | null;
  status: string;
  createdAt: Date | null;
  assetSymbols: string[];
  sourceCount: number;
  claimCount: number;
  credibilityDistribution: { high: number; medium: number; low: number };
  topSources: Array<{ id: string; displayName: string; logoUrl: string | null; trackRecord: number | null }>;
  latestItemTimestamp: Date | null;
}

// ─── StoryClaim join type ────────────────────────────────────────────

interface StoryClaim {
  id: string;
  storyId: string;
  claimId: string;
}

interface StoryItemJoin {
  id: string;
  storyId: string;
  itemId: string;
}

// ─── In-Memory Storage Implementation ────────────────────────────────

export class MemStorage implements IStorage {
  private sources: Map<string, Source> = new Map();
  private items: Map<string, Item> = new Map();
  private claims: Map<string, Claim> = new Map();
  private evidence: Map<string, EvidenceItem> = new Map();
  private verdicts: Map<string, Verdict> = new Map();
  private resolutions: Map<string, Resolution> = new Map();
  private stories: Map<string, Story> = new Map();
  private storyClaims: Map<string, StoryClaim> = new Map();
  private storyItemJoins: Map<string, StoryItemJoin> = new Map();
  private sourceScores: Map<string, SourceScore> = new Map();
  private users: Map<string, User> = new Map();
  private creatorsMap: Map<string, Creator> = new Map();
  private creatorVideosMap: Map<string, CreatorVideo> = new Map();
  private creatorClaimsMap: Map<string, CreatorClaim> = new Map();
  private creatorScoresMap: Map<string, CreatorScore> = new Map();
  private disputesMap: Map<string, Dispute> = new Map();
  private giftsMap: Map<string, Gift> = new Map();
  private newsletterSubscribersMap: Map<string, NewsletterSubscriber> = new Map();
  private lastPipelineRun: string | null = null;

  // ── Sources ──────────────────────────────────────────────────────

  async createSource(data: InsertSource): Promise<Source> {
    const id = crypto.randomUUID();
    const now = new Date();
    const source: Source = {
      id,
      type: data.type ?? "unknown",
      handleOrDomain: data.handleOrDomain,
      displayName: data.displayName,
      logoUrl: data.logoUrl ?? null,
      metadata: data.metadata ?? {},
      createdAt: now,
      updatedAt: now,
    };
    this.sources.set(id, source);
    return source;
  }

  async getSource(id: string): Promise<Source | undefined> {
    return this.sources.get(id);
  }

  async getSources(): Promise<Source[]> {
    return Array.from(this.sources.values());
  }

  async getSourceByDomain(domain: string): Promise<Source | undefined> {
    return Array.from(this.sources.values()).find(
      (s) => s.handleOrDomain === domain
    );
  }

  async updateSource(id: string, data: Partial<Pick<Source, "displayName" | "logoUrl" | "metadata">>): Promise<Source | undefined> {
    const source = this.sources.get(id);
    if (!source) return undefined;
    Object.assign(source, data, { updatedAt: new Date() });
    return source;
  }

  // ── Items ────────────────────────────────────────────────────────

  async createItem(data: InsertItem): Promise<Item> {
    const id = crypto.randomUUID();
    const item: Item = {
      id,
      sourceId: data.sourceId,
      url: data.url ?? null,
      publishedAt: data.publishedAt ? new Date(data.publishedAt as unknown as string) : null,
      ingestedAt: new Date(),
      rawText: data.rawText,
      title: data.title ?? null,
      contentHash: data.contentHash,
      itemType: data.itemType ?? "article",
      metadata: data.metadata ?? {},
    };
    this.items.set(id, item);
    return item;
  }

  async getItem(id: string): Promise<Item | undefined> {
    return this.items.get(id);
  }

  async getItemByUrl(url: string): Promise<Item | undefined> {
    return Array.from(this.items.values()).find((i) => i.url === url);
  }

  async getItems(): Promise<Item[]> {
    return Array.from(this.items.values());
  }

  // ── Claims ───────────────────────────────────────────────────────

  async createClaim(data: InsertClaim): Promise<Claim> {
    const id = crypto.randomUUID();
    const claim: Claim = {
      id,
      sourceId: data.sourceId,
      itemId: data.itemId,
      claimText: data.claimText,
      claimType: data.claimType,
      assetSymbols: (data.assetSymbols as string[] | null) ?? [],
      createdAt: new Date(),
      assertedAt: new Date(data.assertedAt as unknown as string),
      resolveBy: data.resolveBy ? new Date(data.resolveBy as unknown as string) : null,
      resolutionType: data.resolutionType ?? "indefinite",
      falsifiabilityScore: data.falsifiabilityScore ?? null,
      llmConfidence: data.llmConfidence ?? null,
      status: data.status ?? "unreviewed",
      metadata: data.metadata ?? {},
    };
    this.claims.set(id, claim);
    return claim;
  }

  async getClaim(id: string): Promise<Claim | undefined> {
    return this.claims.get(id);
  }

  async getClaims(filters?: ClaimFilters): Promise<Claim[]> {
    let results = Array.from(this.claims.values());

    if (filters?.asset) {
      const asset = filters.asset.toUpperCase();
      results = results.filter((c) =>
        c.assetSymbols?.some((s) => s.toUpperCase() === asset)
      );
    }

    if (filters?.verdict) {
      const verdictLabel = filters.verdict;
      results = results.filter((c) => {
        const v = Array.from(this.verdicts.values()).find(
          (v) => v.claimId === c.id
        );
        return v?.verdictLabel === verdictLabel;
      });
    }

    if (filters?.status) {
      results = results.filter((c) => c.status === filters.status);
    }

    // Sort
    const sort = filters?.sort ?? "newest";
    if (sort === "newest") {
      results.sort(
        (a, b) =>
          new Date(b.assertedAt).getTime() - new Date(a.assertedAt).getTime()
      );
    } else if (sort === "oldest") {
      results.sort(
        (a, b) =>
          new Date(a.assertedAt).getTime() - new Date(b.assertedAt).getTime()
      );
    } else if (sort === "confidence") {
      results.sort((a, b) => {
        const va = Array.from(this.verdicts.values()).find(
          (v) => v.claimId === a.id
        );
        const vb = Array.from(this.verdicts.values()).find(
          (v) => v.claimId === b.id
        );
        return (vb?.probabilityTrue ?? 0) - (va?.probabilityTrue ?? 0);
      });
    }

    // Pagination
    const offset = filters?.offset ?? 0;
    const limit = filters?.limit ?? 50;
    return results.slice(offset, offset + limit);
  }

  async getClaimsBySource(sourceId: string): Promise<Claim[]> {
    return Array.from(this.claims.values()).filter(
      (c) => c.sourceId === sourceId
    );
  }

  async getClaimsByItem(itemId: string): Promise<Claim[]> {
    return Array.from(this.claims.values()).filter(
      (c) => c.itemId === itemId
    );
  }

  async updateClaimMetadata(claimId: string, metadata: Record<string, any>): Promise<void> {
    const claim = this.claims.get(claimId);
    if (claim) {
      claim.metadata = { ...(claim.metadata as any || {}), ...metadata };
    }
  }

  async updateClaim(id: string, data: Partial<Pick<Claim, "claimText" | "claimType" | "status" | "assetSymbols">>): Promise<Claim | undefined> {
    const claim = this.claims.get(id);
    if (!claim) return undefined;
    Object.assign(claim, data);
    return claim;
  }

  async deleteClaim(id: string): Promise<boolean> {
    if (!this.claims.has(id)) return false;
    this.claims.delete(id);
    // Delete related evidence
    for (const [eid, ev] of this.evidence.entries()) {
      if (ev.claimId === id) this.evidence.delete(eid);
    }
    // Delete related verdicts
    for (const [vid, v] of this.verdicts.entries()) {
      if (v.claimId === id) this.verdicts.delete(vid);
    }
    // Delete related storyClaims
    for (const [scid, sc] of this.storyClaims.entries()) {
      if (sc.claimId === id) this.storyClaims.delete(scid);
    }
    return true;
  }

  // ── Evidence ─────────────────────────────────────────────────────

  async createEvidence(data: InsertEvidence): Promise<EvidenceItem> {
    const id = crypto.randomUUID();
    const ev: EvidenceItem = {
      id,
      claimId: data.claimId,
      url: data.url,
      publisher: data.publisher ?? null,
      publishedAt: data.publishedAt ? new Date(data.publishedAt as unknown as string) : null,
      retrievedAt: new Date(),
      excerpt: data.excerpt,
      stance: data.stance,
      evidenceGrade: data.evidenceGrade,
      primaryFlag: data.primaryFlag ?? false,
      metadata: data.metadata ?? {},
    };
    this.evidence.set(id, ev);
    return ev;
  }

  async getEvidenceByClaim(claimId: string): Promise<EvidenceItem[]> {
    return Array.from(this.evidence.values()).filter(
      (e) => e.claimId === claimId
    );
  }

  // ── Verdicts ─────────────────────────────────────────────────────

  async createVerdict(data: InsertVerdict): Promise<Verdict> {
    const id = crypto.randomUUID();
    const verdict: Verdict = {
      id,
      claimId: data.claimId,
      model: data.model,
      promptVersion: data.promptVersion,
      verdictLabel: data.verdictLabel,
      probabilityTrue: data.probabilityTrue ?? null,
      evidenceStrength: data.evidenceStrength ?? null,
      keyEvidenceIds: (data.keyEvidenceIds as string[] | null) ?? null,
      reasoningSummary: data.reasoningSummary ?? null,
      invalidationTriggers: data.invalidationTriggers ?? null,
      createdAt: new Date(),
    };
    this.verdicts.set(id, verdict);
    return verdict;
  }

  async getVerdictByClaim(claimId: string): Promise<Verdict | undefined> {
    return Array.from(this.verdicts.values()).find(
      (v) => v.claimId === claimId
    );
  }

  async getVerdictHistoryByClaim(claimId: string): Promise<Verdict[]> {
    return Array.from(this.verdicts.values())
      .filter(v => v.claimId === claimId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async deleteVerdictByClaim(claimId: string): Promise<void> {
    for (const [id, v] of this.verdicts.entries()) {
      if (v.claimId === claimId) {
        this.verdicts.delete(id);
        return;
      }
    }
  }

  // ── Resolutions ──────────────────────────────────────────────────

  async createResolution(data: Omit<Resolution, "id">): Promise<Resolution> {
    const id = crypto.randomUUID();
    const resolution: Resolution = {
      id,
      claimId: data.claimId,
      outcome: data.outcome,
      resolvedAt: data.resolvedAt ?? new Date(),
      resolutionEvidenceUrl: data.resolutionEvidenceUrl ?? null,
      notes: data.notes ?? null,
    };
    this.resolutions.set(id, resolution);
    return resolution;
  }

  async getResolutionByClaim(claimId: string): Promise<Resolution | undefined> {
    return Array.from(this.resolutions.values()).find(
      (r) => r.claimId === claimId
    );
  }

  // ── Stories ──────────────────────────────────────────────────────

  async createStory(data: InsertStory): Promise<Story> {
    const id = crypto.randomUUID();
    const now = new Date();
    const story: Story = {
      id,
      title: data.title,
      summary: data.summary ?? null,
      imageUrl: data.imageUrl ?? null,
      category: data.category ?? null,
      assetSymbols: (data.assetSymbols as string[] | null) ?? [],
      sourceCount: data.sourceCount ?? 0,
      status: (data as any).status ?? "complete",
      createdAt: now,
      updatedAt: now,
      metadata: data.metadata ?? {},
    };
    this.stories.set(id, story);
    return story;
  }

  async getStory(id: string): Promise<Story | undefined> {
    return this.stories.get(id);
  }

  async getStories(): Promise<Story[]> {
    return Array.from(this.stories.values());
  }

  async updateStory(id: string, data: Partial<Pick<Story, "title" | "summary" | "imageUrl" | "category" | "assetSymbols" | "sourceCount" | "status">>): Promise<void> {
    const story = this.stories.get(id);
    if (!story) return;
    Object.assign(story, data, { updatedAt: new Date() });
  }

  async deleteStory(id: string): Promise<boolean> {
    if (!this.stories.has(id)) return false;
    this.stories.delete(id);
    // Delete related storyClaims
    for (const [scid, sc] of this.storyClaims.entries()) {
      if (sc.storyId === id) this.storyClaims.delete(scid);
    }
    // Delete related storyItemJoins
    for (const [siid, si] of this.storyItemJoins.entries()) {
      if (si.storyId === id) this.storyItemJoins.delete(siid);
    }
    return true;
  }

  async addClaimToStory(storyId: string, claimId: string): Promise<void> {
    const id = crypto.randomUUID();
    this.storyClaims.set(id, { id, storyId, claimId });
  }

  async addItemToStory(storyId: string, itemId: string): Promise<void> {
    // Avoid duplicates
    const exists = Array.from(this.storyItemJoins.values()).some(
      (si) => si.storyId === storyId && si.itemId === itemId
    );
    if (exists) return;
    const id = crypto.randomUUID();
    this.storyItemJoins.set(id, { id, storyId, itemId });
  }

  async getStoryWithClaims(
    storyId: string
  ): Promise<{ story: Story; claims: Claim[] } | undefined> {
    const story = this.stories.get(storyId);
    if (!story) return undefined;

    const claimIds = Array.from(this.storyClaims.values())
      .filter((sc) => sc.storyId === storyId)
      .map((sc) => sc.claimId);

    const claims = claimIds
      .map((id) => this.claims.get(id))
      .filter((c): c is Claim => c !== undefined);

    return { story, claims };
  }

  async getStoryByClaimId(claimId: string): Promise<Story | null> {
    const link = Array.from(this.storyClaims.values()).find(sc => sc.claimId === claimId);
    if (!link) return null;
    return this.stories.get(link.storyId) ?? null;
  }

  async getStoriesForFeed(limit: number = 50, offset: number = 0, statusFilter?: string): Promise<StoryFeedItem[]> {
    let allStories = Array.from(this.stories.values())
      .sort((a, b) => ((b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0)));

    // Filter to "complete" stories by default; "all" bypasses the filter
    if (statusFilter !== "all") {
      const filterStatus = statusFilter ?? "complete";
      allStories = allStories.filter(s => (s as any).status === filterStatus);
    }

    const paged = allStories.slice(offset, offset + limit);
    const result: StoryFeedItem[] = [];

    for (const story of paged) {
      // Get claims for this story
      const claimIds = Array.from(this.storyClaims.values())
        .filter((sc) => sc.storyId === story.id)
        .map((sc) => sc.claimId);

      // Get items for this story
      const itemIds = Array.from(this.storyItemJoins.values())
        .filter((si) => si.storyId === story.id)
        .map((si) => si.itemId);

      // Get unique sources from items
      const sourceMap = new Map<string, Source>();
      let latestItemTimestamp: Date | null = null;

      for (const itemId of itemIds) {
        const item = this.items.get(itemId);
        if (!item) continue;
        const source = this.sources.get(item.sourceId);
        if (source) sourceMap.set(source.id, source);
        if (item.publishedAt && (!latestItemTimestamp || item.publishedAt > latestItemTimestamp)) {
          latestItemTimestamp = item.publishedAt;
        }
      }

      // If no storyItems yet, fall back to deriving sources from claims->items
      if (sourceMap.size === 0) {
        for (const cid of claimIds) {
          const claim = this.claims.get(cid);
          if (!claim) continue;
          const item = this.items.get(claim.itemId);
          if (!item) continue;
          const source = this.sources.get(item.sourceId);
          if (source) sourceMap.set(source.id, source);
          if (item.publishedAt && (!latestItemTimestamp || item.publishedAt > latestItemTimestamp)) {
            latestItemTimestamp = item.publishedAt;
          }
        }
      }

      // Compute credibility distribution
      const dist = { high: 0, medium: 0, low: 0 };
      const topSources: StoryFeedItem["topSources"] = [];

      for (const source of sourceMap.values()) {
        const score = Array.from(this.sourceScores.values()).find((ss) => ss.sourceId === source.id);
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

      // Sort topSources by trackRecord descending
      topSources.sort((a, b) => (b.trackRecord ?? 0) - (a.trackRecord ?? 0));

      result.push({
        id: story.id,
        title: story.title,
        summary: story.summary,
        imageUrl: story.imageUrl,
        category: story.category,
        status: (story as any).status ?? "complete",
        createdAt: story.createdAt,
        assetSymbols: story.assetSymbols ?? [],
        sourceCount: sourceMap.size || story.sourceCount || 0,
        claimCount: claimIds.length,
        credibilityDistribution: dist,
        topSources: topSources.slice(0, 5),
        latestItemTimestamp,
      });
    }

    return result;
  }

  // ── Source Scores ────────────────────────────────────────────────

  async createSourceScore(data: Omit<SourceScore, "id">): Promise<SourceScore> {
    const id = crypto.randomUUID();
    const score: SourceScore = {
      id,
      sourceId: data.sourceId,
      scoreVersion: data.scoreVersion,
      trackRecord: data.trackRecord ?? null,
      methodDiscipline: data.methodDiscipline ?? null,
      confidenceInterval: data.confidenceInterval ?? {},
      sampleSize: data.sampleSize ?? 0,
      computedAt: data.computedAt ?? new Date(),
      metadata: data.metadata ?? {},
    };
    this.sourceScores.set(id, score);
    return score;
  }

  async getSourceScore(sourceId: string): Promise<SourceScore | undefined> {
    return Array.from(this.sourceScores.values()).find(
      (s) => s.sourceId === sourceId
    );
  }

  // ── Users ──────────────────────────────────────────────────

  async createUser(data: InsertUser): Promise<User> {
    const id = crypto.randomUUID();
    const user: User = {
      id,
      email: data.email,
      passwordHash: data.passwordHash,
      displayName: data.displayName,
      subscriptionTier: data.subscriptionTier ?? "free",
      subscriptionExpiresAt: null,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
  }

  async getUserById(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async updateUserTier(userId: string, tier: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      this.users.set(userId, { ...user, subscriptionTier: tier });
    }
  }

  // ── Creators ─────────────────────────────────────────────────────

  async createCreator(data: InsertCreator): Promise<Creator> {
    const id = crypto.randomUUID();
    const now = new Date();
    const creator: Creator = {
      id,
      youtubeChannelId: data.youtubeChannelId,
      channelHandle: data.channelHandle ?? null,
      channelName: data.channelName,
      channelUrl: data.channelUrl,
      avatarUrl: data.avatarUrl ?? null,
      bannerUrl: data.bannerUrl ?? null,
      subscriberCount: data.subscriberCount ?? 0,
      description: data.description ?? null,
      primaryNiche: data.primaryNiche ?? "crypto",
      trackingSince: now,
      isActive: data.isActive ?? true,
      overallAccuracy: data.overallAccuracy ?? 0,
      totalClaims: data.totalClaims ?? 0,
      verifiedTrue: data.verifiedTrue ?? 0,
      verifiedFalse: data.verifiedFalse ?? 0,
      pendingClaims: data.pendingClaims ?? 0,
      tier: data.tier ?? "unranked",
      rankOverall: data.rankOverall ?? null,
      rankChange: data.rankChange ?? 0,
      currentSentiment: data.currentSentiment ?? "neutral",
      priceAccuracy: data.priceAccuracy ?? 0,
      timelineAccuracy: data.timelineAccuracy ?? 0,
      regulatoryAccuracy: data.regulatoryAccuracy ?? 0,
      partnershipAccuracy: data.partnershipAccuracy ?? 0,
      technologyAccuracy: data.technologyAccuracy ?? 0,
      marketAccuracy: data.marketAccuracy ?? 0,
      createdAt: now,
      updatedAt: now,
    };
    this.creatorsMap.set(id, creator);
    return creator;
  }

  async getCreator(id: string): Promise<Creator | undefined> {
    return this.creatorsMap.get(id);
  }

  async getCreatorByChannelId(channelId: string): Promise<Creator | undefined> {
    return Array.from(this.creatorsMap.values()).find(
      (c) => c.youtubeChannelId === channelId
    );
  }

  async getCreators(activeOnly?: boolean): Promise<Creator[]> {
    let results = Array.from(this.creatorsMap.values());
    if (activeOnly) {
      results = results.filter((c) => c.isActive);
    }
    return results;
  }

  async updateCreator(id: string, data: Partial<Creator>): Promise<void> {
    const creator = this.creatorsMap.get(id);
    if (creator) {
      Object.assign(creator, data, { updatedAt: new Date() });
    }
  }

  // ── Creator Videos ──────────────────────────────────────────────

  async createCreatorVideo(data: InsertCreatorVideo): Promise<CreatorVideo> {
    const id = crypto.randomUUID();
    const video: CreatorVideo = {
      id,
      creatorId: data.creatorId,
      youtubeVideoId: data.youtubeVideoId,
      title: data.title,
      description: data.description ?? null,
      publishedAt: data.publishedAt ? new Date(data.publishedAt as unknown as string) : null,
      durationSeconds: data.durationSeconds ?? 0,
      viewCount: data.viewCount ?? 0,
      thumbnailUrl: data.thumbnailUrl ?? null,
      transcriptStatus: data.transcriptStatus ?? "pending",
      transcriptText: data.transcriptText ?? null,
      transcriptSource: data.transcriptSource ?? null,
      claimsExtracted: data.claimsExtracted ?? false,
      createdAt: new Date(),
    };
    this.creatorVideosMap.set(id, video);
    return video;
  }

  async getCreatorVideo(id: string): Promise<CreatorVideo | undefined> {
    return this.creatorVideosMap.get(id);
  }

  async getCreatorVideoByYoutubeId(youtubeVideoId: string): Promise<CreatorVideo | undefined> {
    return Array.from(this.creatorVideosMap.values()).find(
      (v) => v.youtubeVideoId === youtubeVideoId
    );
  }

  async getCreatorVideos(creatorId: string, limit?: number): Promise<CreatorVideo[]> {
    let results = Array.from(this.creatorVideosMap.values()).filter(
      (v) => v.creatorId === creatorId
    );
    results.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
    if (limit) {
      results = results.slice(0, limit);
    }
    return results;
  }

  async getAllCreatorVideos(): Promise<CreatorVideo[]> {
    return Array.from(this.creatorVideosMap.values());
  }

  async updateCreatorVideo(id: string, data: Partial<CreatorVideo>): Promise<void> {
    const video = this.creatorVideosMap.get(id);
    if (video) {
      Object.assign(video, data);
    }
  }

  // ── Creator Claims ──────────────────────────────────────────────

  async createCreatorClaim(data: InsertCreatorClaim): Promise<CreatorClaim> {
    const id = crypto.randomUUID();
    const now = new Date();
    const claim: CreatorClaim = {
      id,
      creatorId: data.creatorId,
      videoId: data.videoId,
      claimText: data.claimText,
      category: data.category,
      specificityScore: data.specificityScore ?? 5,
      confidenceLanguage: data.confidenceLanguage ?? "medium",
      statedTimeframe: data.statedTimeframe ?? null,
      timeframeDeadline: data.timeframeDeadline ? new Date(data.timeframeDeadline as unknown as string) : null,
      isVerifiable: data.isVerifiable ?? true,
      videoTimestampSeconds: data.videoTimestampSeconds ?? 0,
      status: data.status ?? "pending",
      verificationDate: data.verificationDate ? new Date(data.verificationDate as unknown as string) : null,
      verificationEvidence: data.verificationEvidence ?? null,
      verificationNotes: data.verificationNotes ?? null,
      aiExtractionConfidence: data.aiExtractionConfidence ?? 0.8,
      assetSymbols: (data.assetSymbols as string[] | null) ?? [],
      createdAt: now,
      updatedAt: now,
    };
    this.creatorClaimsMap.set(id, claim);
    return claim;
  }

  async getCreatorClaim(id: string): Promise<CreatorClaim | undefined> {
    return this.creatorClaimsMap.get(id);
  }

  async getCreatorClaims(filters?: { creatorId?: string; status?: string; category?: string; limit?: number; offset?: number }): Promise<CreatorClaim[]> {
    let results = Array.from(this.creatorClaimsMap.values());
    if (filters?.creatorId) {
      results = results.filter((c) => c.creatorId === filters.creatorId);
    }
    if (filters?.status) {
      results = results.filter((c) => c.status === filters.status);
    }
    if (filters?.category) {
      results = results.filter((c) => c.category === filters.category);
    }
    results.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
    const offset = filters?.offset ?? 0;
    const limit = filters?.limit ?? 50;
    return results.slice(offset, offset + limit);
  }

  async updateCreatorClaim(id: string, data: Partial<CreatorClaim>): Promise<void> {
    const claim = this.creatorClaimsMap.get(id);
    if (claim) {
      Object.assign(claim, data, { updatedAt: new Date() });
    }
  }

  // ── Creator Scores ──────────────────────────────────────────────

  async createCreatorScore(data: InsertCreatorScore): Promise<CreatorScore> {
    const id = crypto.randomUUID();
    const score: CreatorScore = {
      id,
      creatorId: data.creatorId,
      calculatedAt: new Date(),
      overallAccuracy: data.overallAccuracy,
      priceAccuracy: data.priceAccuracy ?? 0,
      timelineAccuracy: data.timelineAccuracy ?? 0,
      regulatoryAccuracy: data.regulatoryAccuracy ?? 0,
      partnershipAccuracy: data.partnershipAccuracy ?? 0,
      technologyAccuracy: data.technologyAccuracy ?? 0,
      marketAccuracy: data.marketAccuracy ?? 0,
      totalClaimsScored: data.totalClaimsScored,
      claimsPending: data.claimsPending ?? 0,
      rankOverall: data.rankOverall,
      rankChange: data.rankChange ?? 0,
    };
    this.creatorScoresMap.set(id, score);
    return score;
  }

  async getCreatorScoreHistory(creatorId: string): Promise<CreatorScore[]> {
    return Array.from(this.creatorScoresMap.values())
      .filter((s) => s.creatorId === creatorId)
      .sort((a, b) => new Date(b.calculatedAt!).getTime() - new Date(a.calculatedAt!).getTime());
  }

  // ── Disputes ────────────────────────────────────────────────────

  async createDispute(data: InsertDispute): Promise<Dispute> {
    const id = crypto.randomUUID();
    const dispute: Dispute = {
      id,
      claimId: data.claimId,
      disputeType: data.disputeType,
      evidence: data.evidence ?? null,
      submitterNote: data.submitterNote ?? null,
      status: data.status ?? "pending",
      aiAnalysis: data.aiAnalysis ?? null,
      aiConfidence: data.aiConfidence ?? null,
      resolvedAt: data.resolvedAt ? new Date(data.resolvedAt as unknown as string) : null,
      createdAt: new Date(),
    };
    this.disputesMap.set(id, dispute);
    return dispute;
  }

  async getDisputesByClaimId(claimId: string): Promise<Dispute[]> {
    return Array.from(this.disputesMap.values()).filter(
      (d) => d.claimId === claimId
    );
  }

  async updateDispute(id: string, data: Partial<Dispute>): Promise<void> {
    const dispute = this.disputesMap.get(id);
    if (dispute) {
      Object.assign(dispute, data);
    }
  }

  // ── Gifts ──────────────────────────────────────────────────────

  async createGift(data: Omit<Gift, "id" | "createdAt" | "redeemedAt" | "redeemedByUserId">): Promise<Gift> {
    const id = crypto.randomUUID();
    const gift: Gift = {
      id,
      code: data.code,
      purchaserEmail: data.purchaserEmail,
      stripeSessionId: data.stripeSessionId,
      durationMonths: data.durationMonths,
      amountCents: data.amountCents,
      status: data.status ?? "pending",
      redeemedByUserId: null,
      redeemedAt: null,
      createdAt: new Date(),
    };
    this.giftsMap.set(id, gift);
    return gift;
  }

  async getGiftByCode(code: string): Promise<Gift | undefined> {
    return Array.from(this.giftsMap.values()).find((g) => g.code === code);
  }

  async getGiftByStripeSession(sessionId: string): Promise<Gift | undefined> {
    return Array.from(this.giftsMap.values()).find((g) => g.stripeSessionId === sessionId);
  }

  async redeemGift(giftId: string, userId: string): Promise<void> {
    const gift = this.giftsMap.get(giftId);
    if (gift) {
      this.giftsMap.set(giftId, {
        ...gift,
        status: "redeemed",
        redeemedByUserId: userId,
        redeemedAt: new Date(),
      });
    }
  }

  async activateGiftSubscription(userId: string, durationMonths: number): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + durationMonths);
      this.users.set(userId, {
        ...user,
        subscriptionTier: "premium",
        subscriptionExpiresAt: expiresAt,
      });
    }
  }

  // ── Newsletter ──────────────────────────────────────────────────

  async subscribeNewsletter(data: InsertNewsletterSubscriber): Promise<NewsletterSubscriber> {
    // Check if already subscribed
    const existing = Array.from(this.newsletterSubscribersMap.values()).find(
      (s) => s.email.toLowerCase() === data.email.toLowerCase()
    );
    if (existing) {
      // Re-activate if previously unsubscribed
      if (!existing.isActive) {
        existing.isActive = true;
        existing.unsubscribedAt = null;
        existing.preferences = data.preferences ?? existing.preferences;
      }
      return existing;
    }
    const id = crypto.randomUUID();
    const subscriber: NewsletterSubscriber = {
      id,
      email: data.email,
      preferences: data.preferences ?? { dailyBriefing: true, blindspotReport: true, weeklyDigest: true },
      isActive: data.isActive ?? true,
      subscribedAt: new Date(),
      unsubscribedAt: null,
    };
    this.newsletterSubscribersMap.set(id, subscriber);
    return subscriber;
  }

  async unsubscribeNewsletter(email: string): Promise<boolean> {
    const subscriber = Array.from(this.newsletterSubscribersMap.values()).find(
      (s) => s.email.toLowerCase() === email.toLowerCase()
    );
    if (!subscriber) return false;
    subscriber.isActive = false;
    subscriber.unsubscribedAt = new Date();
    return true;
  }

  async getNewsletterSubscriber(email: string): Promise<NewsletterSubscriber | undefined> {
    return Array.from(this.newsletterSubscribersMap.values()).find(
      (s) => s.email.toLowerCase() === email.toLowerCase()
    );
  }

  async getActiveNewsletterSubscribers(): Promise<NewsletterSubscriber[]> {
    return Array.from(this.newsletterSubscribersMap.values()).filter((s) => s.isActive);
  }

  // ── Search ─────────────────────────────────────────────────────────

  async search(query: string, options?: { type?: string; limit?: number; offset?: number }): Promise<SearchResults> {
    const q = query.toLowerCase();
    const limit = options?.limit ?? 20;
    const offset = options?.offset ?? 0;
    const type = options?.type ?? "all";

    let matchedClaims: Claim[] = [];
    let matchedStories: Story[] = [];
    let matchedSources: Source[] = [];

    if (type === "all" || type === "claims") {
      matchedClaims = Array.from(this.claims.values())
        .filter((c) => c.claimText.toLowerCase().includes(q))
        .slice(offset, offset + limit);
    }

    if (type === "all" || type === "stories") {
      matchedStories = Array.from(this.stories.values())
        .filter(
          (s) =>
            s.title.toLowerCase().includes(q) ||
            (s.summary?.toLowerCase().includes(q) ?? false)
        )
        .slice(offset, offset + limit);
    }

    if (type === "all" || type === "sources") {
      matchedSources = Array.from(this.sources.values())
        .filter(
          (s) =>
            s.displayName.toLowerCase().includes(q) ||
            s.handleOrDomain.toLowerCase().includes(q)
        )
        .slice(offset, offset + limit);
    }

    return { claims: matchedClaims, stories: matchedStories, sources: matchedSources };
  }

  // ── Pipeline Stats ───────────────────────────────────────────────

  async getPipelineStats(): Promise<PipelineStats> {
    return {
      totalSources: this.sources.size,
      totalItems: this.items.size,
      totalClaims: this.claims.size,
      totalEvidence: this.evidence.size,
      totalVerdicts: this.verdicts.size,
      totalResolutions: this.resolutions.size,
      totalStories: this.stories.size,
      lastRunAt: this.lastPipelineRun,
    };
  }

  setLastPipelineRun(ts: string): void {
    this.lastPipelineRun = ts;
  }
}

// ─── Seed Data ───────────────────────────────────────────────────────

export async function seedInitialData(storage: MemStorage): Promise<void> {
  // ── 1. Sources ─────────────────────────────────────────────────

  const secSource = await storage.createSource({
    type: "regulator",
    handleOrDomain: "sec.gov",
    displayName: "SEC",
    logoUrl: "https://www.google.com/s2/favicons?domain=sec.gov&sz=128",
    metadata: { description: "U.S. Securities and Exchange Commission" },
  });

  const reutersSource = await storage.createSource({
    type: "publisher",
    handleOrDomain: "reuters.com",
    displayName: "Reuters",
    logoUrl: "https://www.google.com/s2/favicons?domain=reuters.com&sz=128",
    metadata: { description: "Global news wire service" },
  });

  const bloombergSource = await storage.createSource({
    type: "publisher",
    handleOrDomain: "bloomberg.com",
    displayName: "Bloomberg Crypto",
    logoUrl: "https://www.google.com/s2/favicons?domain=bloomberg.com&sz=128",
    metadata: { description: "Bloomberg digital asset coverage" },
  });

  const theBlockSource = await storage.createSource({
    type: "publisher",
    handleOrDomain: "theblock.co",
    displayName: "The Block",
    logoUrl: "https://www.google.com/s2/favicons?domain=theblock.co&sz=128",
    metadata: { description: "Crypto research and journalism" },
  });

  const coinDeskSource = await storage.createSource({
    type: "publisher",
    handleOrDomain: "coindesk.com",
    displayName: "CoinDesk",
    logoUrl: "https://www.google.com/s2/favicons?domain=coindesk.com&sz=128",
    metadata: { description: "Crypto news and media" },
  });

  const coinTelegraphSource = await storage.createSource({
    type: "publisher",
    handleOrDomain: "cointelegraph.com",
    displayName: "Cointelegraph",
    logoUrl: "https://www.google.com/s2/favicons?domain=cointelegraph.com&sz=128",
    metadata: { description: "Crypto and blockchain media" },
  });

  const cryptoWhaleSource = await storage.createSource({
    type: "x_handle",
    handleOrDomain: "@CryptoWhale",
    displayName: "Crypto Whale",
    logoUrl: "https://www.google.com/s2/favicons?domain=x.com&sz=128",
    metadata: { description: "Anonymous crypto Twitter personality" },
  });

  const defiAlphaSource = await storage.createSource({
    type: "telegram",
    handleOrDomain: "t.me/defialpha",
    displayName: "DeFi Alpha Leaks",
    logoUrl: "https://www.google.com/s2/favicons?domain=telegram.org&sz=128",
    metadata: { description: "Anonymous DeFi alpha Telegram channel" },
  });

  const cryptoSlateSource = await storage.createSource({
    type: "publisher",
    handleOrDomain: "cryptoslate.com",
    displayName: "CryptoSlate",
    logoUrl: "https://www.google.com/s2/favicons?domain=cryptoslate.com&sz=128",
    metadata: { description: "Crypto news and data" },
  });

  const theDefiantSource = await storage.createSource({
    type: "publisher",
    handleOrDomain: "thedefiant.io",
    displayName: "The Defiant",
    logoUrl: "https://www.google.com/s2/favicons?domain=thedefiant.io&sz=128",
    metadata: { description: "DeFi news and analysis" },
  });

  const blockworksSource = await storage.createSource({
    type: "publisher",
    handleOrDomain: "blockworks.co",
    displayName: "Blockworks",
    logoUrl: "https://www.google.com/s2/favicons?domain=blockworks.co&sz=128",
    metadata: { description: "Crypto and blockchain news" },
  });

  const dlNewsSource = await storage.createSource({
    type: "publisher",
    handleOrDomain: "dlnews.com",
    displayName: "DL News",
    logoUrl: "https://www.google.com/s2/favicons?domain=dlnews.com&sz=128",
    metadata: { description: "Digital asset news" },
  });

  const unchainedSource = await storage.createSource({
    type: "publisher",
    handleOrDomain: "unchainedcrypto.com",
    displayName: "Unchained",
    logoUrl: "https://www.google.com/s2/favicons?domain=unchainedcrypto.com&sz=128",
    metadata: { description: "Crypto news and podcasts" },
  });

  const allSources = [
    secSource,
    reutersSource,
    bloombergSource,
    theBlockSource,
    coinDeskSource,
    coinTelegraphSource,
    cryptoWhaleSource,
    defiAlphaSource,
    cryptoSlateSource,
    theDefiantSource,
    blockworksSource,
    dlNewsSource,
    unchainedSource,
  ];

  // ── 2. Source Scores ───────────────────────────────────────────

  const scoreData: Array<{
    source: Source;
    trackRecord: number;
    methodDiscipline: number;
    sampleSize: number;
    ci: { lower: number; upper: number };
  }> = [
    { source: secSource, trackRecord: 98, methodDiscipline: 99, sampleSize: 45, ci: { lower: 95, upper: 100 } },
    { source: reutersSource, trackRecord: 91, methodDiscipline: 94, sampleSize: 203, ci: { lower: 88, upper: 94 } },
    { source: bloombergSource, trackRecord: 89, methodDiscipline: 92, sampleSize: 156, ci: { lower: 85, upper: 93 } },
    { source: theBlockSource, trackRecord: 82, methodDiscipline: 85, sampleSize: 189, ci: { lower: 78, upper: 86 } },
    { source: coinDeskSource, trackRecord: 76, methodDiscipline: 78, sampleSize: 234, ci: { lower: 72, upper: 80 } },
    { source: coinTelegraphSource, trackRecord: 58, methodDiscipline: 52, sampleSize: 312, ci: { lower: 54, upper: 62 } },
    { source: cryptoWhaleSource, trackRecord: 34, methodDiscipline: 22, sampleSize: 89, ci: { lower: 28, upper: 40 } },
    { source: defiAlphaSource, trackRecord: 28, methodDiscipline: 18, sampleSize: 67, ci: { lower: 20, upper: 36 } },
    { source: cryptoSlateSource, trackRecord: 68, methodDiscipline: 72, sampleSize: 150, ci: { lower: 64, upper: 72 } },
    { source: theDefiantSource, trackRecord: 75, methodDiscipline: 78, sampleSize: 120, ci: { lower: 71, upper: 79 } },
    { source: blockworksSource, trackRecord: 80, methodDiscipline: 82, sampleSize: 140, ci: { lower: 76, upper: 84 } },
    { source: dlNewsSource, trackRecord: 74, methodDiscipline: 76, sampleSize: 100, ci: { lower: 70, upper: 78 } },
    { source: unchainedSource, trackRecord: 78, methodDiscipline: 80, sampleSize: 110, ci: { lower: 74, upper: 82 } },
  ];

  for (const sd of scoreData) {
    await storage.createSourceScore({
      sourceId: sd.source.id,
      scoreVersion: "v1.0",
      trackRecord: sd.trackRecord,
      methodDiscipline: sd.methodDiscipline,
      confidenceInterval: sd.ci,
      sampleSize: sd.sampleSize,
      computedAt: new Date(),
      metadata: {},
    });
  }

  console.log(`[Seed] ${allSources.length} sources + scores seeded (no demo stories — pipeline will generate real ones)`);
}

// ─── Seed Creators (works for ALL storage types) ─────────────────────

const SEED_CREATORS: Array<{
  youtubeChannelId: string;
  channelName: string;
  channelHandle: string;
  channelUrl: string;
  description: string;
}> = [
  {
    youtubeChannelId: "UCqK_GSMbpiV8spgD3ZGloSw",
    channelName: "Coin Bureau",
    channelHandle: "@CoinBureau",
    channelUrl: "https://www.youtube.com/@CoinBureau",
    description: "Crypto education and market analysis",
  },
  {
    youtubeChannelId: "UCRvqjQPSeaWn-uEx-w0XOIg",
    channelName: "Benjamin Cowen",
    channelHandle: "@BenjaminCowen",
    channelUrl: "https://www.youtube.com/@BenjaminCowen",
    description: "Data-driven crypto analysis and risk management",
  },
  {
    youtubeChannelId: "UCbLhGKVY-bJPcawebgtNfbw",
    channelName: "Altcoin Daily",
    channelHandle: "@AltcoinDaily",
    channelUrl: "https://www.youtube.com/@AltcoinDaily",
    description: "Daily cryptocurrency news and analysis",
  },
  {
    youtubeChannelId: "UCCatR7nWbYrkVXdxXb4cGXg",
    channelName: "DataDash",
    channelHandle: "@DataDash",
    channelUrl: "https://www.youtube.com/@DataDash",
    description: "Crypto trading and technical analysis",
  },
  {
    youtubeChannelId: "UCN9Nj4tjXbVTLYWN0EKly_Q",
    channelName: "Crypto Banter",
    channelHandle: "@CryptoBanter",
    channelUrl: "https://www.youtube.com/@CryptoBanter",
    description: "Live crypto trading shows and market commentary",
  },
];

export async function seedCreators(storage: IStorage): Promise<void> {
  const existing = await storage.getCreators();
  if (existing.length > 0) {
    console.log(`[SeedCreators] ${existing.length} creators already exist — skipping`);
    return;
  }

  console.log(`[SeedCreators] No creators found — seeding ${SEED_CREATORS.length} channels`);

  for (const seed of SEED_CREATORS) {
    await storage.createCreator({
      youtubeChannelId: seed.youtubeChannelId,
      channelName: seed.channelName,
      channelHandle: seed.channelHandle,
      channelUrl: seed.channelUrl,
      description: seed.description,
      primaryNiche: "crypto",
      isActive: true,
    });
    console.log(`[SeedCreators]   Created: ${seed.channelName}`);
  }

  console.log("[SeedCreators] Done");
}

// ─── Singleton ───────────────────────────────────────────────────────

export type StorageInstance = IStorage & { setLastPipelineRun(ts: string): void };

function createStorage(): StorageInstance {
  if (db) {
    console.log("[Storage] Using PostgreSQL (Drizzle) storage");
    return new DrizzleStorage(db);
  }
  console.log("[Storage] Using in-memory storage");
  return new MemStorage();
}

export const storage: StorageInstance = createStorage();
