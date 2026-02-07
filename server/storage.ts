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
} from "../shared/schema.js";

// ─── Storage Interface ───────────────────────────────────────────────

export interface IStorage {
  // Sources
  createSource(data: InsertSource): Promise<Source>;
  getSource(id: string): Promise<Source | undefined>;
  getSources(): Promise<Source[]>;
  getSourceByDomain(domain: string): Promise<Source | undefined>;

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

  // Evidence
  createEvidence(data: InsertEvidence): Promise<EvidenceItem>;
  getEvidenceByClaim(claimId: string): Promise<EvidenceItem[]>;

  // Verdicts
  createVerdict(data: InsertVerdict): Promise<Verdict>;
  getVerdictByClaim(claimId: string): Promise<Verdict | undefined>;
  deleteVerdictByClaim(claimId: string): Promise<void>;

  // Resolutions
  createResolution(data: Omit<Resolution, "id">): Promise<Resolution>;
  getResolutionByClaim(claimId: string): Promise<Resolution | undefined>;

  // Stories
  createStory(data: InsertStory): Promise<Story>;
  getStory(id: string): Promise<Story | undefined>;
  getStories(): Promise<Story[]>;
  addClaimToStory(storyId: string, claimId: string): Promise<void>;
  getStoryWithClaims(storyId: string): Promise<{ story: Story; claims: Claim[] } | undefined>;

  // Source Scores
  createSourceScore(data: Omit<SourceScore, "id">): Promise<SourceScore>;
  getSourceScore(sourceId: string): Promise<SourceScore | undefined>;

  // Pipeline Stats
  getPipelineStats(): Promise<PipelineStats>;
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

// ─── StoryClaim join type ────────────────────────────────────────────

interface StoryClaim {
  id: string;
  storyId: string;
  claimId: string;
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
  private sourceScores: Map<string, SourceScore> = new Map();
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

  async addClaimToStory(storyId: string, claimId: string): Promise<void> {
    const id = crypto.randomUUID();
    this.storyClaims.set(id, { id, storyId, claimId });
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
    logoUrl: "https://logo.clearbit.com/sec.gov",
    metadata: { description: "U.S. Securities and Exchange Commission" },
  });

  const reutersSource = await storage.createSource({
    type: "publisher",
    handleOrDomain: "reuters.com",
    displayName: "Reuters",
    logoUrl: "https://logo.clearbit.com/reuters.com",
    metadata: { description: "Global news wire service" },
  });

  const bloombergSource = await storage.createSource({
    type: "publisher",
    handleOrDomain: "bloomberg.com",
    displayName: "Bloomberg Crypto",
    logoUrl: "https://logo.clearbit.com/bloomberg.com",
    metadata: { description: "Bloomberg digital asset coverage" },
  });

  const theBlockSource = await storage.createSource({
    type: "publisher",
    handleOrDomain: "theblock.co",
    displayName: "The Block",
    logoUrl: "https://logo.clearbit.com/theblock.co",
    metadata: { description: "Crypto research and journalism" },
  });

  const coinDeskSource = await storage.createSource({
    type: "publisher",
    handleOrDomain: "coindesk.com",
    displayName: "CoinDesk",
    logoUrl: "https://logo.clearbit.com/coindesk.com",
    metadata: { description: "Crypto news and media" },
  });

  const coinTelegraphSource = await storage.createSource({
    type: "publisher",
    handleOrDomain: "cointelegraph.com",
    displayName: "Cointelegraph",
    logoUrl: "https://logo.clearbit.com/cointelegraph.com",
    metadata: { description: "Crypto and blockchain media" },
  });

  const cryptoWhaleSource = await storage.createSource({
    type: "x_handle",
    handleOrDomain: "@CryptoWhale",
    displayName: "Crypto Whale",
    logoUrl: "https://logo.clearbit.com/x.com",
    metadata: { description: "Anonymous crypto Twitter personality" },
  });

  const defiAlphaSource = await storage.createSource({
    type: "telegram",
    handleOrDomain: "t.me/defialpha",
    displayName: "DeFi Alpha Leaks",
    logoUrl: "https://logo.clearbit.com/telegram.org",
    metadata: { description: "Anonymous DeFi alpha Telegram channel" },
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

  // ── 3. Items (one per claim to match schema foreign keys) ─────

  const item1 = await storage.createItem({
    sourceId: bloombergSource.id,
    url: "https://bloomberg.com/crypto/sec-eth-etf-meeting-scheduled",
    publishedAt: new Date("2024-01-15T14:00:00Z") as any,
    rawText: "The SEC has scheduled a key meeting to discuss pending spot Ethereum ETF applications from major asset managers including BlackRock, Fidelity, and Invesco.",
    title: "SEC Schedules Ethereum ETF Discussion for February",
    contentHash: "blake3_etf_meeting_001",
    itemType: "article",
    metadata: {},
  });

  const item2 = await storage.createItem({
    sourceId: cryptoWhaleSource.id,
    url: "https://twitter.com/CryptoWhale/status/1234567890",
    publishedAt: new Date("2024-01-15T16:00:00Z") as any,
    rawText: "BREAKING: ETH ETF will be approved THIS WEEK. My insider source at a major US regulator confirms imminent announcement. Don't say I didn't warn you. $ETH to $5000.",
    title: null,
    contentHash: "blake3_whale_tweet_001",
    itemType: "tweet",
    metadata: {},
  });

  const item3 = await storage.createItem({
    sourceId: theBlockSource.id,
    url: "https://theblock.co/post/nexus-protocol-exploit-45m",
    publishedAt: new Date("2024-01-15T07:30:00Z") as any,
    rawText: "Nexus Protocol suffered a devastating smart contract exploit, losing approximately $45 million through a reentrancy vulnerability in its staking contract.",
    title: "Nexus Protocol Loses $45M in Reentrancy Exploit",
    contentHash: "blake3_nexus_exploit_001",
    itemType: "article",
    metadata: {},
  });

  const item4 = await storage.createItem({
    sourceId: defiAlphaSource.id,
    url: "https://t.me/defialpha/789",
    publishedAt: new Date("2024-01-13T15:30:00Z") as any,
    rawText: "ALPHA LEAK: Arbitrum Foundation finalizing massive airdrop for active users. Snapshot taken last week. Distribution next week. Get your wallets ready.",
    title: null,
    contentHash: "blake3_arb_airdrop_001",
    itemType: "other",
    metadata: {},
  });

  const item5 = await storage.createItem({
    sourceId: reutersSource.id,
    url: "https://reuters.com/business/finance/ecb-digital-euro-preparation-phase",
    publishedAt: new Date("2024-01-12T08:30:00Z") as any,
    rawText: "The European Central Bank announced it has advanced the Digital Euro project to its preparation phase, with ECB President Lagarde citing a potential launch timeline of 2027.",
    title: "ECB Advances Digital Euro to Preparation Phase, Eyes 2027 Launch",
    contentHash: "blake3_ecb_digital_euro_001",
    itemType: "article",
    metadata: {},
  });

  const item6 = await storage.createItem({
    sourceId: coinTelegraphSource.id,
    url: "https://cointelegraph.com/news/bitcoin-150k-halving-prediction",
    publishedAt: new Date("2024-01-14T13:30:00Z") as any,
    rawText: "Market analysts predict Bitcoin will reach $150,000 following the upcoming halving event in 2024, driven by reduced supply issuance and growing institutional demand.",
    title: "Bitcoin Price Could Hit $150K Post-Halving, Analysts Predict",
    contentHash: "blake3_btc_prediction_001",
    itemType: "article",
    metadata: {},
  });

  // ── 4. Claims ──────────────────────────────────────────────────

  const claim1 = await storage.createClaim({
    sourceId: bloombergSource.id,
    itemId: item1.id,
    claimText: "The SEC has scheduled a meeting to discuss spot Ethereum ETF applications on February 15, 2024",
    claimType: "filing_approved_or_denied",
    assetSymbols: ["ETH"],
    assertedAt: new Date("2024-01-15T14:30:00Z") as any,
    resolveBy: new Date("2024-02-15T23:59:00Z") as any,
    resolutionType: "scheduled",
    falsifiabilityScore: 0.95,
    llmConfidence: 0.82,
    status: "reviewed",
    metadata: {},
  });

  const claim2 = await storage.createClaim({
    sourceId: cryptoWhaleSource.id,
    itemId: item2.id,
    claimText: "ETH ETF will be approved THIS WEEK, insider source confirms imminent announcement",
    claimType: "filing_approved_or_denied",
    assetSymbols: ["ETH"],
    assertedAt: new Date("2024-01-15T16:20:00Z") as any,
    resolveBy: new Date("2024-01-22T23:59:00Z") as any,
    resolutionType: "scheduled",
    falsifiabilityScore: 0.85,
    llmConfidence: 0.25,
    status: "reviewed",
    metadata: {},
  });

  const claim3 = await storage.createClaim({
    sourceId: theBlockSource.id,
    itemId: item3.id,
    claimText: "Nexus Protocol lost approximately $45 million in a smart contract exploit via reentrancy vulnerability",
    claimType: "exploit_or_hack",
    assetSymbols: ["NEXUS", "ETH"],
    assertedAt: new Date("2024-01-15T08:00:00Z") as any,
    resolutionType: "immediate",
    falsifiabilityScore: 0.98,
    llmConfidence: 0.95,
    status: "resolved",
    metadata: {},
  });

  const claim4 = await storage.createClaim({
    sourceId: defiAlphaSource.id,
    itemId: item4.id,
    claimText: "Arbitrum preparing massive airdrop for active users, launching next week",
    claimType: "rumor",
    assetSymbols: ["ARB"],
    assertedAt: new Date("2024-01-13T16:00:00Z") as any,
    resolveBy: new Date("2024-01-20T23:59:00Z") as any,
    resolutionType: "scheduled",
    falsifiabilityScore: 0.6,
    llmConfidence: 0.15,
    status: "reviewed",
    metadata: {},
  });

  const claim5 = await storage.createClaim({
    sourceId: reutersSource.id,
    itemId: item5.id,
    claimText: "The European Central Bank has advanced the Digital Euro project to its preparation phase, with potential launch by 2027",
    claimType: "regulatory_action",
    assetSymbols: ["EUR"],
    assertedAt: new Date("2024-01-12T09:00:00Z") as any,
    resolutionType: "immediate",
    falsifiabilityScore: 0.92,
    llmConfidence: 0.94,
    status: "resolved",
    metadata: {},
  });

  const claim6 = await storage.createClaim({
    sourceId: coinTelegraphSource.id,
    itemId: item6.id,
    claimText: "Bitcoin will reach $150,000 following the halving event in 2024",
    claimType: "price_prediction",
    assetSymbols: ["BTC"],
    assertedAt: new Date("2024-01-14T14:00:00Z") as any,
    resolutionType: "indefinite",
    falsifiabilityScore: 0.35,
    llmConfidence: 0.3,
    status: "reviewed",
    metadata: {},
  });

  const allClaims = [claim1, claim2, claim3, claim4, claim5, claim6];

  // ── 5. Evidence Items ──────────────────────────────────────────

  // Claim 1 - ETH ETF meeting (3 evidence items)
  const ev1 = await storage.createEvidence({
    claimId: claim1.id,
    url: "https://sec.gov/calendar",
    publisher: "SEC",
    publishedAt: new Date("2024-01-15T12:00:00Z") as any,
    excerpt: "Commission meeting scheduled for February 15 to discuss pending ETF applications including spot Ethereum products from BlackRock and Fidelity.",
    stance: "supports",
    evidenceGrade: "A",
    primaryFlag: true,
    metadata: {},
  });

  const ev2 = await storage.createEvidence({
    claimId: claim1.id,
    url: "https://bloomberg.com/etf-timeline",
    publisher: "Bloomberg",
    publishedAt: new Date("2024-01-15T14:00:00Z") as any,
    excerpt: "Sources familiar with the matter confirm SEC readiness to evaluate spot Ethereum ETF applications during the February review window.",
    stance: "supports",
    evidenceGrade: "B",
    primaryFlag: false,
    metadata: {},
  });

  const ev3 = await storage.createEvidence({
    claimId: claim1.id,
    url: "https://theblock.co/analysis/eth-etf-regulatory-signals",
    publisher: "The Block",
    publishedAt: new Date("2024-01-15T15:00:00Z") as any,
    excerpt: "Industry insiders expect a decision within the scheduled window based on regulatory signals from recent SEC public comments and filing amendments.",
    stance: "supports",
    evidenceGrade: "B",
    primaryFlag: false,
    metadata: {},
  });

  // Claim 2 - ETH ETF THIS WEEK (4 evidence items)
  const ev4 = await storage.createEvidence({
    claimId: claim2.id,
    url: "https://twitter.com/CryptoWhale/status/1234567890",
    publisher: "Crypto Whale",
    publishedAt: new Date("2024-01-15T16:20:00Z") as any,
    excerpt: "My source at [redacted] confirms approval coming this week. Trust me on this one. Last time I called BTC bottom perfectly.",
    stance: "supports",
    evidenceGrade: "D",
    primaryFlag: false,
    metadata: {},
  });

  const ev5 = await storage.createEvidence({
    claimId: claim2.id,
    url: "https://sec.gov/statement/2024-01-etf",
    publisher: "SEC",
    publishedAt: new Date("2024-01-14T10:00:00Z") as any,
    excerpt: "The Commission has not set a definitive timeline for ETF application decisions. Each application is evaluated on its merits through the standard review process.",
    stance: "contradicts",
    evidenceGrade: "A",
    primaryFlag: true,
    metadata: {},
  });

  const ev5b = await storage.createEvidence({
    claimId: claim2.id,
    url: "https://reuters.com/sec-no-imminent-etf",
    publisher: "Reuters",
    publishedAt: new Date("2024-01-15T09:00:00Z") as any,
    excerpt: "SEC officials speaking on background say no imminent decision is planned on Ethereum spot ETF applications. Standard review timelines remain in effect.",
    stance: "contradicts",
    evidenceGrade: "B",
    primaryFlag: false,
    metadata: {},
  });

  const ev5c = await storage.createEvidence({
    claimId: claim2.id,
    url: "https://coindesk.com/whale-track-record",
    publisher: "CoinDesk",
    publishedAt: new Date("2024-01-15T17:00:00Z") as any,
    excerpt: "Analysis of @CryptoWhale's previous 'insider' predictions shows a 12% accuracy rate over the past 18 months, with most claims failing to materialize.",
    stance: "contradicts",
    evidenceGrade: "C",
    primaryFlag: false,
    metadata: {},
  });

  // Claim 3 - Nexus Protocol exploit (5 evidence items)
  const ev6 = await storage.createEvidence({
    claimId: claim3.id,
    url: "https://etherscan.io/tx/0xabc123def456",
    publisher: "Etherscan",
    publishedAt: new Date("2024-01-15T07:15:00Z") as any,
    excerpt: "Transaction shows transfer of 15,000 ETH from Nexus Protocol staking contract (0x7B3...4Fa2) to unknown wallet (0xD41...8eC1) in a single block.",
    stance: "supports",
    evidenceGrade: "A",
    primaryFlag: true,
    metadata: {},
  });

  const ev7 = await storage.createEvidence({
    claimId: claim3.id,
    url: "https://twitter.com/NexusProtocol/status/9876543210",
    publisher: "Nexus Protocol",
    publishedAt: new Date("2024-01-15T08:30:00Z") as any,
    excerpt: "We are aware of a security incident affecting our smart contracts. Investigation is ongoing. User funds in affected pools have been moved. We are working with security partners.",
    stance: "supports",
    evidenceGrade: "A",
    primaryFlag: false,
    metadata: {},
  });

  const ev8 = await storage.createEvidence({
    claimId: claim3.id,
    url: "https://theblock.co/post/nexus-exploit-analysis",
    publisher: "The Block",
    publishedAt: new Date("2024-01-15T09:00:00Z") as any,
    excerpt: "Security researchers at PeckShield confirm the exploit utilized a classic reentrancy vulnerability in the withdraw function of Nexus's staking contract.",
    stance: "supports",
    evidenceGrade: "B",
    primaryFlag: false,
    metadata: {},
  });

  const ev8b = await storage.createEvidence({
    claimId: claim3.id,
    url: "https://peckshield.com/report/nexus-2024-01",
    publisher: "PeckShield",
    publishedAt: new Date("2024-01-15T10:00:00Z") as any,
    excerpt: "Our post-mortem analysis confirms the reentrancy attack vector. Total losses are estimated at $44.8M based on on-chain data at time of exploit.",
    stance: "supports",
    evidenceGrade: "A",
    primaryFlag: false,
    metadata: {},
  });

  const ev8c = await storage.createEvidence({
    claimId: claim3.id,
    url: "https://coindesk.com/nexus-exploit-timeline",
    publisher: "CoinDesk",
    publishedAt: new Date("2024-01-15T11:00:00Z") as any,
    excerpt: "Timeline reconstruction shows the attacker prepared 3 transactions over 48 hours before executing the reentrancy exploit at 07:12 UTC.",
    stance: "supports",
    evidenceGrade: "B",
    primaryFlag: false,
    metadata: {},
  });

  // Claim 4 - Arbitrum airdrop (3 evidence items)
  const ev9 = await storage.createEvidence({
    claimId: claim4.id,
    url: "https://t.me/defialpha/789",
    publisher: "DeFi Alpha Leaks",
    publishedAt: new Date("2024-01-13T16:00:00Z") as any,
    excerpt: "Insider info: ARB team finalizing massive airdrop. Snapshot was taken last Wednesday. Get your wallets ready for distribution next week.",
    stance: "supports",
    evidenceGrade: "D",
    primaryFlag: false,
    metadata: {},
  });

  const ev9b = await storage.createEvidence({
    claimId: claim4.id,
    url: "https://twitter.com/arbitrum/status/1230000000",
    publisher: "Arbitrum Foundation",
    publishedAt: new Date("2024-01-14T10:00:00Z") as any,
    excerpt: "We have no current plans for additional token distributions. Beware of scams and fake airdrop announcements from unofficial channels.",
    stance: "contradicts",
    evidenceGrade: "A",
    primaryFlag: true,
    metadata: {},
  });

  const ev9c = await storage.createEvidence({
    claimId: claim4.id,
    url: "https://theblock.co/defi-alpha-credibility",
    publisher: "The Block",
    publishedAt: new Date("2024-01-14T14:00:00Z") as any,
    excerpt: "DeFi Alpha Leaks channel has previously made at least 5 similar airdrop claims in the past 6 months, none of which materialized as described.",
    stance: "contradicts",
    evidenceGrade: "B",
    primaryFlag: false,
    metadata: {},
  });

  // Claim 5 - ECB Digital Euro (4 evidence items)
  const ev10 = await storage.createEvidence({
    claimId: claim5.id,
    url: "https://ecb.europa.eu/press/pr/date/2024/html/ecb.pr240112.en.html",
    publisher: "ECB",
    publishedAt: new Date("2024-01-12T08:00:00Z") as any,
    excerpt: "The Governing Council has decided to advance the digital euro project to its preparation phase. This phase will lay the groundwork for potential issuance.",
    stance: "supports",
    evidenceGrade: "A",
    primaryFlag: true,
    metadata: {},
  });

  const ev11 = await storage.createEvidence({
    claimId: claim5.id,
    url: "https://reuters.com/business/finance/ecb-digital-euro-next-steps",
    publisher: "Reuters",
    publishedAt: new Date("2024-01-12T09:00:00Z") as any,
    excerpt: "ECB President Lagarde confirmed the 2027 target during a press conference, citing regulatory framework completion as a key precondition for launch.",
    stance: "supports",
    evidenceGrade: "B",
    primaryFlag: false,
    metadata: {},
  });

  const ev11b = await storage.createEvidence({
    claimId: claim5.id,
    url: "https://bloomberg.com/ecb-cbdc-analysis",
    publisher: "Bloomberg",
    publishedAt: new Date("2024-01-12T10:00:00Z") as any,
    excerpt: "The ECB preparation phase will include finalizing technical architecture, selecting infrastructure providers, and completing legislative review over the next two years.",
    stance: "supports",
    evidenceGrade: "B",
    primaryFlag: false,
    metadata: {},
  });

  const ev11c = await storage.createEvidence({
    claimId: claim5.id,
    url: "https://theblock.co/ecb-digital-euro-details",
    publisher: "The Block",
    publishedAt: new Date("2024-01-12T12:00:00Z") as any,
    excerpt: "ECB board member Fabio Panetta described the preparation phase as a 'no-go/go' milestone, emphasizing that issuance is not guaranteed by the 2027 date.",
    stance: "mentions",
    evidenceGrade: "B",
    primaryFlag: false,
    metadata: {},
  });

  // Claim 6 - BTC $150K prediction (3 evidence items)
  const ev12 = await storage.createEvidence({
    claimId: claim6.id,
    url: "https://cointelegraph.com/news/bitcoin-150k-halving-prediction",
    publisher: "Cointelegraph",
    publishedAt: new Date("2024-01-14T14:00:00Z") as any,
    excerpt: "Analysts predict BTC could reach new highs post-halving based on supply reduction mechanics. Historical data from 2012, 2016, and 2020 halvings shows 300-1000% gains.",
    stance: "supports",
    evidenceGrade: "C",
    primaryFlag: false,
    metadata: {},
  });

  const ev12b = await storage.createEvidence({
    claimId: claim6.id,
    url: "https://coindesk.com/btc-halving-history-analysis",
    publisher: "CoinDesk",
    publishedAt: new Date("2024-01-14T16:00:00Z") as any,
    excerpt: "While previous halvings have preceded bull runs, macroeconomic conditions, regulatory landscape, and market maturity make direct comparisons unreliable.",
    stance: "mentions",
    evidenceGrade: "B",
    primaryFlag: false,
    metadata: {},
  });

  const ev12c = await storage.createEvidence({
    claimId: claim6.id,
    url: "https://bloomberg.com/opinion/btc-prediction-analysis",
    publisher: "Bloomberg",
    publishedAt: new Date("2024-01-14T17:00:00Z") as any,
    excerpt: "Specific price targets like $150K lack methodological rigor. Market conditions in 2024 differ substantially from previous halving cycles due to institutional participation.",
    stance: "contradicts",
    evidenceGrade: "B",
    primaryFlag: false,
    metadata: {},
  });

  // ── 6. Verdicts ────────────────────────────────────────────────

  await storage.createVerdict({
    claimId: claim1.id,
    model: "gpt-4-turbo",
    promptVersion: "v2.1",
    verdictLabel: "verified",
    probabilityTrue: 0.91,
    evidenceStrength: 0.88,
    keyEvidenceIds: [ev1.id, ev2.id, ev3.id],
    reasoningSummary: "SEC public calendar confirms the scheduled meeting. Multiple institutional sources corroborate the timeline. Primary evidence directly supports this claim.",
    invalidationTriggers: "SEC announcement of postponement or cancellation would invalidate this verdict.",
  });

  await storage.createVerdict({
    claimId: claim2.id,
    model: "gpt-4-turbo",
    promptVersion: "v2.1",
    verdictLabel: "speculative",
    probabilityTrue: 0.18,
    evidenceStrength: 0.22,
    keyEvidenceIds: [ev5.id],
    reasoningSummary: "No primary source evidence supports this accelerated timeline. SEC communications indicate no imminent decision. Anonymous claim with no corroborating evidence. Source track record is very poor.",
    invalidationTriggers: "Official SEC announcement of approval within the claimed timeframe.",
  });

  await storage.createVerdict({
    claimId: claim3.id,
    model: "gpt-4-turbo",
    promptVersion: "v2.1",
    verdictLabel: "verified",
    probabilityTrue: 0.97,
    evidenceStrength: 0.95,
    keyEvidenceIds: [ev6.id, ev7.id, ev8.id, ev8b.id],
    reasoningSummary: "On-chain transaction data confirms fund movement from protocol contracts. Official team acknowledgment. Security researchers independently verified the reentrancy attack vector.",
    invalidationTriggers: "Protocol clarification that funds are safe or evidence of transaction reversal.",
  });

  await storage.createVerdict({
    claimId: claim4.id,
    model: "gpt-4-turbo",
    promptVersion: "v2.1",
    verdictLabel: "speculative",
    probabilityTrue: 0.12,
    evidenceStrength: 0.15,
    keyEvidenceIds: [ev9b.id],
    reasoningSummary: "No official announcement from Arbitrum Foundation. Anonymous source with poor track record. Arbitrum Foundation explicitly denied upcoming distributions. Previous similar claims from this channel have failed to materialize.",
    invalidationTriggers: "Official Arbitrum Foundation announcement confirming airdrop details.",
  });

  await storage.createVerdict({
    claimId: claim5.id,
    model: "gpt-4-turbo",
    promptVersion: "v2.1",
    verdictLabel: "verified",
    probabilityTrue: 0.96,
    evidenceStrength: 0.94,
    keyEvidenceIds: [ev10.id, ev11.id],
    reasoningSummary: "Official ECB press release confirms preparation phase advancement. Named ECB officials quoted on 2027 timeline. Multiple primary sources in agreement.",
    invalidationTriggers: "ECB retraction or policy reversal announcement.",
  });

  await storage.createVerdict({
    claimId: claim6.id,
    model: "gpt-4-turbo",
    promptVersion: "v2.1",
    verdictLabel: "speculative",
    probabilityTrue: 0.25,
    evidenceStrength: 0.2,
    keyEvidenceIds: [ev12.id],
    reasoningSummary: "Price predictions are inherently speculative. Historical halving data shows varied outcomes. No methodology or evidence supports the specific $150K target. Market conditions differ substantially from previous cycles.",
    invalidationTriggers: "This prediction will be resolved by market price movement over time.",
  });

  // ── 7. Resolutions (claims 3 and 5 are resolved) ─────────────

  await storage.createResolution({
    claimId: claim3.id,
    outcome: "true",
    resolvedAt: new Date("2024-01-15T12:00:00Z"),
    resolutionEvidenceUrl: "https://etherscan.io/tx/0xabc123def456",
    notes: "Protocol confirmed exploit; funds not recovered. Post-mortem published by PeckShield confirms reentrancy vector. Total confirmed loss: $44.8M.",
  });

  await storage.createResolution({
    claimId: claim5.id,
    outcome: "true",
    resolvedAt: new Date("2024-01-12T11:00:00Z"),
    resolutionEvidenceUrl: "https://ecb.europa.eu/press/pr/date/2024/html/ecb.pr240112.en.html",
    notes: "ECB official press release confirmed preparation phase advancement. Timeline is aspirational; no binding commitment to 2027 issuance.",
  });

  // ── 8. Stories ─────────────────────────────────────────────────

  const story1 = await storage.createStory({
    title: "Ethereum ETF: Regulatory Progress vs. Speculation",
    summary: "Tracking verified SEC activity alongside speculative claims about Ethereum ETF approval timelines. Official SEC calendar confirms February meeting while anonymous sources push unsubstantiated acceleration narratives.",
    imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80",
    category: "Regulation",
    metadata: {},
  });

  await storage.addClaimToStory(story1.id, claim1.id);
  await storage.addClaimToStory(story1.id, claim2.id);

  const story2 = await storage.createStory({
    title: "DeFi Security: The Nexus Protocol Exploit",
    summary: "A verified smart contract exploit drained $45M from Nexus Protocol via a reentrancy vulnerability. On-chain evidence and independent security audits confirm the attack vector and fund movement.",
    imageUrl: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80",
    category: "Security",
    metadata: {},
  });

  await storage.addClaimToStory(story2.id, claim3.id);

  // Mark initial pipeline run
  storage.setLastPipelineRun(new Date().toISOString());
}

// ─── Singleton ───────────────────────────────────────────────────────

export const storage = new MemStorage();
