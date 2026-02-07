export type Page = "home" | "story" | "blindspot" | "profile" | "topics" | "claims" | "sources" | "about" | "faq" | "privacy" | "plus" | "signals";

export enum VeracityRating {
  VERIFIED = "Verified",
  BALANCED = "Balanced",
  SPECULATIVE = "Speculative",
}

export interface NewsSource {
  id: string;
  name: string;
  logo: string;
  rating: VeracityRating;
  url: string;
}

export interface VeracityDistribution {
  verified: number;
  balanced: number;
  speculative: number;
}

export interface NewsStory {
  id: string;
  title: string;
  summary: string;
  fullContent?: string;
  imageUrl: string;
  sources: NewsSource[];
  timeLabel: string;
  category: string;
  veracity: VeracityDistribution;
  isBlindspot?: boolean;
  isSynthesized?: boolean;
  synthesisNotes?: string[];
}

export interface SidebarTopic {
  id: string;
  name: string;
  trend: "up" | "down" | "neutral";
}

export type ClaimType =
  | "filing_submitted"
  | "filing_approved_or_denied"
  | "regulatory_action"
  | "listing_announced"
  | "listing_live"
  | "delisting_announced"
  | "exploit_or_hack"
  | "mainnet_launch"
  | "partnership_announced"
  | "price_prediction"
  | "rumor"
  | "misc_claim";

export type VerdictLabel = "verified" | "plausible_unverified" | "speculative" | "misleading";
export type EvidenceGrade = "A" | "B" | "C" | "D";
export type EvidenceStance = "supports" | "contradicts" | "mentions";
export type ResolutionOutcome = "true" | "false" | "unresolved" | "partially_true";

export interface EvidenceItem {
  id: string;
  url: string;
  publisher: string;
  grade: EvidenceGrade;
  stance: EvidenceStance;
  excerpt: string;
  publishedAt?: string;
}

export interface Verdict {
  verdictLabel: VerdictLabel;
  probabilityTrue: number;
  evidenceStrength: number;
  reasoningSummary: string;
  invalidationTriggers: string;
}

export interface Resolution {
  outcome: ResolutionOutcome;
  resolvedAt: string;
  notes?: string;
}

export interface Claim {
  id: string;
  sourceId: string;
  claimText: string;
  claimType: ClaimType;
  assetSymbols: string[];
  assertedAt: string;
  resolveBy?: string;
  resolutionType: "immediate" | "scheduled" | "indefinite";
  falsifiabilityScore: number;
  llmConfidence: number;
  status: "unreviewed" | "reviewed" | "resolved";
  verdict?: Verdict;
  evidence: EvidenceItem[];
  resolution?: Resolution;
  source?: CredibilitySource;
}

export interface SourceScore {
  trackRecord: number;
  methodDiscipline: number;
  sampleSize: number;
  confidenceInterval: { lower: number; upper: number };
}

export interface CredibilitySource {
  id: string;
  type: "publisher" | "x_handle" | "telegram" | "exchange" | "regulator";
  handleOrDomain: string;
  displayName: string;
  logo: string;
  score: SourceScore;
}
