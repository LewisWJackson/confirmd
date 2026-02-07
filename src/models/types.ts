// Confirmd Data Types v1
// Matches the Postgres schema exactly

// ============================================
// ENUMS
// ============================================

export type SourceType =
  | 'publisher'
  | 'x_handle'
  | 'telegram'
  | 'youtube'
  | 'reddit'
  | 'blog'
  | 'exchange'
  | 'regulator'
  | 'unknown';

export type ItemType =
  | 'article'
  | 'tweet'
  | 'release'
  | 'filing'
  | 'onchain_alert'
  | 'announcement'
  | 'other';

export type ClaimType =
  // Market structure / regulation
  | 'filing_submitted'
  | 'filing_approved_or_denied'
  | 'regulatory_action'
  // Exchange / listings
  | 'listing_announced'
  | 'listing_live'
  | 'delisting_announced'
  | 'trading_halt'
  // Protocol / product
  | 'mainnet_launch'
  | 'testnet_launch'
  | 'upgrade_released'
  | 'exploit_or_hack'
  | 'audit_result'
  // Corporate / partnerships
  | 'partnership_announced'
  | 'investment_or_acquisition'
  // On-chain / supply
  | 'large_transfer_or_whale'
  | 'mint_or_burn'
  | 'wallet_attribution'
  // Forecasting
  | 'price_prediction'
  | 'timeline_prediction'
  // Other
  | 'rumor'
  | 'misc_claim';

export type ResolutionType = 'immediate' | 'scheduled' | 'indefinite';

export type ClaimStatus = 'unreviewed' | 'needs_evidence' | 'reviewed' | 'resolved';

export type EvidenceStance = 'supports' | 'contradicts' | 'mentions' | 'irrelevant';

export type EvidenceGrade = 'A' | 'B' | 'C' | 'D';

export type VerdictLabel = 'verified' | 'plausible_unverified' | 'speculative' | 'misleading';

export type ResolutionOutcome = 'true' | 'false' | 'unresolved' | 'partially_true';

export type SubscriptionTier = 'free' | 'plus' | 'pro' | 'team' | 'enterprise';

// ============================================
// CORE ENTITIES
// ============================================

export interface Source {
  id: string;
  type: SourceType;
  handleOrDomain: string;
  displayName: string;
  logoUrl?: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Item {
  id: string;
  sourceId: string;
  url?: string;
  publishedAt?: Date;
  ingestedAt: Date;
  rawText: string;
  title?: string;
  contentHash: string;
  itemType: ItemType;
  metadata: Record<string, any>;
}

export interface Claim {
  id: string;
  sourceId: string;
  itemId: string;
  claimText: string;
  claimType: ClaimType;
  assetSymbols: string[];
  createdAt: Date;
  assertedAt: Date;
  resolveBy?: Date;
  resolutionType: ResolutionType;
  falsifiabilityScore?: number;
  llmConfidence?: number;
  status: ClaimStatus;
  metadata: Record<string, any>;
}

export interface EvidenceItem {
  id: string;
  claimId: string;
  url: string;
  publisher?: string;
  publishedAt?: Date;
  retrievedAt: Date;
  excerpt: string;
  stance: EvidenceStance;
  evidenceGrade: EvidenceGrade;
  primaryFlag: boolean;
  metadata: Record<string, any>;
}

export interface Verdict {
  id: string;
  claimId: string;
  model: string;
  promptVersion: string;
  verdictLabel: VerdictLabel;
  probabilityTrue?: number;
  evidenceStrength?: number;
  keyEvidenceIds: string[];
  reasoningSummary?: string;
  invalidationTriggers?: string;
  createdAt: Date;
}

export interface Resolution {
  id: string;
  claimId: string;
  outcome: ResolutionOutcome;
  resolvedAt: Date;
  resolutionEvidenceUrl?: string;
  notes?: string;
}

// ============================================
// SCORE ENTITIES
// ============================================

export interface ClaimScore {
  id: string;
  claimId: string;
  scoreVersion: string;
  accuracyScore?: number;
  timelinessScore?: number;
  evidenceDisciplineScore?: number;
  correctionScore: number;
  finalClaimScore: number;
  computedAt: Date;
  metadata: Record<string, any>;
}

export interface SourceScore {
  id: string;
  sourceId: string;
  scoreVersion: string;
  trackRecord: number;
  methodDiscipline: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  sampleSize: number;
  computedAt: Date;
  metadata: Record<string, any>;
}

// ============================================
// USER ENTITIES
// ============================================

export interface User {
  id: string;
  email: string;
  username: string;
  subscriptionTier: SubscriptionTier;
  creditsBalance: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreditLedgerEntry {
  id: string;
  userId: string;
  amount: number;
  balanceAfter: number;
  description: string;
  createdAt: Date;
}

// ============================================
// CLAIM EXTRACTION OUTPUT (LLM)
// ============================================

export interface ExtractedClaim {
  claimText: string;
  claimType: ClaimType;
  assetSymbols: string[];
  assertedAt: string;
  resolutionType: ResolutionType;
  resolveBy?: string;
  falsifiabilityScore: number;
  llmConfidence: number;
  notes?: string;
}

export interface ClaimExtractionResult {
  claims: ExtractedClaim[];
  itemId: string;
  model: string;
  promptVersion: string;
}

// ============================================
// DUE DILIGENCE OUTPUT (LLM)
// ============================================

export interface VerdictOutput {
  verdictLabel: VerdictLabel;
  probabilityTrue: number;
  evidenceStrength: number;
  keyEvidenceUrls: string[];
  reasoningSummary: string;
  invalidationTriggers: string;
}

// ============================================
// ENRICHED TYPES (for UI)
// ============================================

export interface ClaimWithContext extends Claim {
  source: Source;
  item: Item;
  verdict?: Verdict;
  evidence: EvidenceItem[];
  resolution?: Resolution;
  score?: ClaimScore;
}

export interface SourceWithScore extends Source {
  score?: SourceScore;
  recentClaims: ClaimWithContext[];
}

// ============================================
// API TYPES
// ============================================

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ClaimFilters {
  asset?: string;
  verdict?: VerdictLabel;
  status?: ClaimStatus;
  claimType?: ClaimType;
  since?: Date;
  sourceId?: string;
}

// ============================================
// PRICING & CREDITS
// ============================================

export const TIER_LIMITS = {
  free: {
    monthlyCredits: 10,
    watchlistItems: 3,
    alertsEnabled: false,
    evidenceLadderFull: false,
    sourceHistoryFull: false,
    exports: false,
    apiAccess: false,
  },
  plus: {
    monthlyCredits: 30,
    watchlistItems: 25,
    alertsEnabled: true,
    evidenceLadderFull: true,
    sourceHistoryFull: true,
    exports: false,
    apiAccess: false,
  },
  pro: {
    monthlyCredits: 120,
    watchlistItems: 100,
    alertsEnabled: true,
    evidenceLadderFull: true,
    sourceHistoryFull: true,
    exports: true,
    apiAccess: false,
  },
  team: {
    monthlyCredits: 300,
    watchlistItems: 500,
    alertsEnabled: true,
    evidenceLadderFull: true,
    sourceHistoryFull: true,
    exports: true,
    apiAccess: true,
  },
  enterprise: {
    monthlyCredits: 1000,
    watchlistItems: -1, // unlimited
    alertsEnabled: true,
    evidenceLadderFull: true,
    sourceHistoryFull: true,
    exports: true,
    apiAccess: true,
  },
} as const;

export const CREDIT_COSTS = {
  deepResearchBrief: 15,
  continuousMonitoringPerDay: 2,
  incidentBrief: 25,
} as const;
