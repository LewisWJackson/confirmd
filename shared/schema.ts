import { pgTable, text, uuid, timestamp, real, integer, boolean, jsonb, pgEnum, uniqueIndex, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const sourceTypeEnum = pgEnum("source_type", [
  "publisher", "x_handle", "telegram", "youtube", "reddit", "blog", "exchange", "regulator", "unknown"
]);

export const itemTypeEnum = pgEnum("item_type", [
  "article", "tweet", "release", "filing", "onchain_alert", "announcement", "other"
]);

export const claimTypeEnum = pgEnum("claim_type", [
  "filing_submitted", "filing_approved_or_denied", "regulatory_action",
  "listing_announced", "listing_live", "delisting_announced", "trading_halt",
  "mainnet_launch", "testnet_launch", "upgrade_released", "exploit_or_hack", "audit_result",
  "partnership_announced", "investment_or_acquisition",
  "large_transfer_or_whale", "mint_or_burn", "wallet_attribution",
  "price_prediction", "timeline_prediction",
  "rumor", "misc_claim"
]);

export const resolutionTypeEnum = pgEnum("resolution_type", ["immediate", "scheduled", "indefinite"]);
export const claimStatusEnum = pgEnum("claim_status", ["unreviewed", "needs_evidence", "reviewed", "resolved"]);
export const evidenceStanceEnum = pgEnum("evidence_stance", ["supports", "contradicts", "mentions", "irrelevant"]);
export const evidenceGradeEnum = pgEnum("evidence_grade", ["A", "B", "C", "D"]);
export const verdictLabelEnum = pgEnum("verdict_label", ["verified", "plausible_unverified", "speculative", "misleading"]);
export const resolutionOutcomeEnum = pgEnum("resolution_outcome", ["true", "false", "unresolved", "partially_true"]);

// Creator enums
export const creatorTierEnum = pgEnum("creator_tier", ["diamond", "gold", "silver", "bronze", "unranked"]);
export const creatorClaimStatusEnum = pgEnum("creator_claim_status", [
  "pending", "verified_true", "verified_false", "partially_true", "expired", "unverifiable"
]);
export const creatorClaimCategoryEnum = pgEnum("creator_claim_category", [
  "price_prediction", "regulatory", "partnership", "technology",
  "market_prediction", "technical_analysis", "etf_approval",
  "partnership_adoption", "market_analysis"
]);
export const creatorClaimStrengthEnum = pgEnum("creator_claim_strength", ["strong", "medium", "weak"]);
export const disputeTypeEnum = pgEnum("dispute_type", ["never_said", "misquoted", "out_of_context", "wrong_creator"]);
export const disputeStatusEnum = pgEnum("dispute_status", ["pending", "upheld", "rejected", "under_investigation"]);

// Tables
export const sources = pgTable("source", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: sourceTypeEnum("type").notNull().default("unknown"),
  handleOrDomain: text("handle_or_domain").notNull().unique(),
  displayName: text("display_name").notNull(),
  logoUrl: text("logo_url"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const items = pgTable("item", {
  id: uuid("id").primaryKey().defaultRandom(),
  sourceId: uuid("source_id").notNull().references(() => sources.id),
  url: text("url"),
  publishedAt: timestamp("published_at"),
  ingestedAt: timestamp("ingested_at").defaultNow(),
  rawText: text("raw_text").notNull(),
  title: text("title"),
  contentHash: text("content_hash").notNull().unique(),
  itemType: itemTypeEnum("item_type").notNull().default("article"),
  metadata: jsonb("metadata").default({}),
});

export const claims = pgTable("claim", {
  id: uuid("id").primaryKey().defaultRandom(),
  sourceId: uuid("source_id").notNull().references(() => sources.id),
  itemId: uuid("item_id").notNull().references(() => items.id),
  claimText: text("claim_text").notNull(),
  claimType: claimTypeEnum("claim_type").notNull(),
  assetSymbols: text("asset_symbols").array().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  assertedAt: timestamp("asserted_at").notNull(),
  resolveBy: timestamp("resolve_by"),
  resolutionType: resolutionTypeEnum("resolution_type").notNull().default("indefinite"),
  falsifiabilityScore: real("falsifiability_score"),
  llmConfidence: real("llm_confidence"),
  status: claimStatusEnum("status").notNull().default("unreviewed"),
  metadata: jsonb("metadata").default({}),
});

export const evidenceItems = pgTable("evidence_item", {
  id: uuid("id").primaryKey().defaultRandom(),
  claimId: uuid("claim_id").notNull().references(() => claims.id),
  url: text("url").notNull(),
  publisher: text("publisher"),
  publishedAt: timestamp("published_at"),
  retrievedAt: timestamp("retrieved_at").defaultNow(),
  excerpt: text("excerpt").notNull(),
  stance: evidenceStanceEnum("stance").notNull(),
  evidenceGrade: evidenceGradeEnum("evidence_grade").notNull(),
  primaryFlag: boolean("primary_flag").default(false),
  metadata: jsonb("metadata").default({}),
});

export const verdicts = pgTable("verdict", {
  id: uuid("id").primaryKey().defaultRandom(),
  claimId: uuid("claim_id").notNull().references(() => claims.id),
  model: text("model").notNull(),
  promptVersion: text("prompt_version").notNull(),
  verdictLabel: verdictLabelEnum("verdict_label").notNull(),
  probabilityTrue: real("probability_true"),
  evidenceStrength: real("evidence_strength"),
  keyEvidenceIds: text("key_evidence_ids").array(),
  reasoningSummary: text("reasoning_summary"),
  invalidationTriggers: text("invalidation_triggers"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const resolutions = pgTable("resolution", {
  id: uuid("id").primaryKey().defaultRandom(),
  claimId: uuid("claim_id").notNull().references(() => claims.id).unique(),
  outcome: resolutionOutcomeEnum("outcome").notNull(),
  resolvedAt: timestamp("resolved_at").defaultNow(),
  resolutionEvidenceUrl: text("resolution_evidence_url"),
  notes: text("notes"),
});

export const stories = pgTable("story", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  summary: text("summary"),
  imageUrl: text("image_url"),
  category: text("category"),
  assetSymbols: text("asset_symbols").array().default([]),
  sourceCount: integer("source_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  metadata: jsonb("metadata").default({}),
});

export const storyClaims = pgTable("story_claim", {
  id: uuid("id").primaryKey().defaultRandom(),
  storyId: uuid("story_id").notNull().references(() => stories.id),
  claimId: uuid("claim_id").notNull().references(() => claims.id),
});

export const storyItems = pgTable("story_item", {
  id: uuid("id").primaryKey().defaultRandom(),
  storyId: uuid("story_id").notNull().references(() => stories.id),
  itemId: uuid("item_id").notNull().references(() => items.id),
});

export const sourceScores = pgTable("source_score", {
  id: uuid("id").primaryKey().defaultRandom(),
  sourceId: uuid("source_id").notNull().references(() => sources.id),
  scoreVersion: text("score_version").notNull(),
  trackRecord: real("track_record"),
  methodDiscipline: real("method_discipline"),
  confidenceInterval: jsonb("confidence_interval").default({}),
  sampleSize: integer("sample_size").default(0),
  computedAt: timestamp("computed_at").defaultNow(),
  metadata: jsonb("metadata").default({}),
});

export const users = pgTable("user", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name").notNull(),
  subscriptionTier: text("subscription_tier").notNull().default("free"),
  subscriptionExpiresAt: timestamp("subscription_expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const gifts = pgTable("gift", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  purchaserEmail: text("purchaser_email").notNull(),
  stripeSessionId: text("stripe_session_id").notNull(),
  durationMonths: integer("duration_months").notNull(),
  amountCents: integer("amount_cents").notNull(),
  status: text("status").notNull().default("pending"),
  redeemedByUserId: uuid("redeemed_by_user_id"),
  redeemedAt: timestamp("redeemed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── Creator Tables ──────────────────────────────────────────────────

export const creators = pgTable("creator", {
  id: uuid("id").primaryKey().defaultRandom(),
  youtubeChannelId: text("youtube_channel_id").notNull().unique(),
  channelHandle: text("channel_handle"),
  channelName: text("channel_name").notNull(),
  channelUrl: text("channel_url").notNull(),
  avatarUrl: text("avatar_url"),
  bannerUrl: text("banner_url"),
  subscriberCount: integer("subscriber_count").default(0),
  description: text("description"),
  primaryNiche: text("primary_niche").notNull().default("crypto"),
  trackingSince: timestamp("tracking_since").defaultNow(),
  isActive: boolean("is_active").default(true),
  overallAccuracy: real("overall_accuracy").default(0),
  totalClaims: integer("total_claims").default(0),
  verifiedTrue: integer("verified_true").default(0),
  verifiedFalse: integer("verified_false").default(0),
  pendingClaims: integer("pending_claims").default(0),
  tier: creatorTierEnum("tier").notNull().default("unranked"),
  rankOverall: integer("rank_overall"),
  rankChange: integer("rank_change").default(0),
  currentSentiment: text("current_sentiment").notNull().default("neutral"),
  // Radar chart scores (0-100)
  priceAccuracy: real("price_accuracy").default(0),
  timelineAccuracy: real("timeline_accuracy").default(0),
  regulatoryAccuracy: real("regulatory_accuracy").default(0),
  partnershipAccuracy: real("partnership_accuracy").default(0),
  technologyAccuracy: real("technology_accuracy").default(0),
  marketAccuracy: real("market_accuracy").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const creatorVideos = pgTable("creator_video", {
  id: uuid("id").primaryKey().defaultRandom(),
  creatorId: uuid("creator_id").notNull().references(() => creators.id),
  youtubeVideoId: text("youtube_video_id").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  publishedAt: timestamp("published_at"),
  durationSeconds: integer("duration_seconds").default(0),
  viewCount: integer("view_count").default(0),
  thumbnailUrl: text("thumbnail_url"),
  transcriptStatus: text("transcript_status").notNull().default("pending"),
  transcriptText: text("transcript_text"),
  transcriptSource: text("transcript_source"),
  claimsExtracted: boolean("claims_extracted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const creatorClaims = pgTable("creator_claim", {
  id: uuid("id").primaryKey().defaultRandom(),
  creatorId: uuid("creator_id").notNull().references(() => creators.id),
  videoId: uuid("video_id").notNull().references(() => creatorVideos.id),
  claimText: text("claim_text").notNull(),
  category: creatorClaimCategoryEnum("category").notNull(),
  specificityScore: real("specificity_score").default(5),
  confidenceLanguage: creatorClaimStrengthEnum("confidence_language").notNull().default("medium"),
  statedTimeframe: text("stated_timeframe"),
  timeframeDeadline: timestamp("timeframe_deadline"),
  isVerifiable: boolean("is_verifiable").default(true),
  videoTimestampSeconds: integer("video_timestamp_seconds").default(0),
  status: creatorClaimStatusEnum("status").notNull().default("pending"),
  verificationDate: timestamp("verification_date"),
  verificationEvidence: text("verification_evidence"),
  verificationNotes: text("verification_notes"),
  aiExtractionConfidence: real("ai_extraction_confidence").default(0.8),
  assetSymbols: text("asset_symbols").array().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const creatorScores = pgTable("creator_score", {
  id: uuid("id").primaryKey().defaultRandom(),
  creatorId: uuid("creator_id").notNull().references(() => creators.id),
  calculatedAt: timestamp("calculated_at").defaultNow(),
  overallAccuracy: real("overall_accuracy").notNull(),
  priceAccuracy: real("price_accuracy").default(0),
  timelineAccuracy: real("timeline_accuracy").default(0),
  regulatoryAccuracy: real("regulatory_accuracy").default(0),
  partnershipAccuracy: real("partnership_accuracy").default(0),
  technologyAccuracy: real("technology_accuracy").default(0),
  marketAccuracy: real("market_accuracy").default(0),
  totalClaimsScored: integer("total_claims_scored").notNull(),
  claimsPending: integer("claims_pending").default(0),
  rankOverall: integer("rank_overall").notNull(),
  rankChange: integer("rank_change").default(0),
});

export const disputes = pgTable("dispute", {
  id: uuid("id").primaryKey().defaultRandom(),
  claimId: uuid("claim_id").notNull().references(() => creatorClaims.id),
  disputeType: disputeTypeEnum("dispute_type").notNull(),
  evidence: text("evidence"),
  submitterNote: text("submitter_note"),
  status: disputeStatusEnum("status").notNull().default("pending"),
  aiAnalysis: text("ai_analysis"),
  aiConfidence: real("ai_confidence"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertSourceSchema = createInsertSchema(sources).omit({ id: true, createdAt: true, updatedAt: true });
export const insertItemSchema = createInsertSchema(items).omit({ id: true, ingestedAt: true });
export const insertClaimSchema = createInsertSchema(claims).omit({ id: true, createdAt: true });
export const insertEvidenceSchema = createInsertSchema(evidenceItems).omit({ id: true, retrievedAt: true });
export const insertVerdictSchema = createInsertSchema(verdicts).omit({ id: true, createdAt: true });
export const insertStorySchema = createInsertSchema(stories).omit({ id: true, createdAt: true, updatedAt: true });
export const insertStoryItemSchema = createInsertSchema(storyItems).omit({ id: true });
export const insertCreatorSchema = createInsertSchema(creators).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCreatorVideoSchema = createInsertSchema(creatorVideos).omit({ id: true, createdAt: true });
export const insertCreatorClaimSchema = createInsertSchema(creatorClaims).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCreatorScoreSchema = createInsertSchema(creatorScores).omit({ id: true });
export const insertDisputeSchema = createInsertSchema(disputes).omit({ id: true, createdAt: true });
export const insertGiftSchema = createInsertSchema(gifts).omit({ id: true, createdAt: true });

// Types
export type Source = typeof sources.$inferSelect;
export type InsertSource = z.infer<typeof insertSourceSchema>;
export type Item = typeof items.$inferSelect;
export type InsertItem = z.infer<typeof insertItemSchema>;
export type Claim = typeof claims.$inferSelect;
export type InsertClaim = z.infer<typeof insertClaimSchema>;
export type EvidenceItem = typeof evidenceItems.$inferSelect;
export type InsertEvidence = z.infer<typeof insertEvidenceSchema>;
export type Verdict = typeof verdicts.$inferSelect;
export type InsertVerdict = z.infer<typeof insertVerdictSchema>;
export type Resolution = typeof resolutions.$inferSelect;
export type Story = typeof stories.$inferSelect;
export type InsertStory = z.infer<typeof insertStorySchema>;
export type SourceScore = typeof sourceScores.$inferSelect;
export type StoryItem = typeof storyItems.$inferSelect;
export type InsertStoryItem = z.infer<typeof insertStoryItemSchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Creator = typeof creators.$inferSelect;
export type InsertCreator = z.infer<typeof insertCreatorSchema>;
export type CreatorVideo = typeof creatorVideos.$inferSelect;
export type InsertCreatorVideo = z.infer<typeof insertCreatorVideoSchema>;
export type CreatorClaim = typeof creatorClaims.$inferSelect;
export type InsertCreatorClaim = z.infer<typeof insertCreatorClaimSchema>;
export type CreatorScore = typeof creatorScores.$inferSelect;
export type InsertCreatorScore = z.infer<typeof insertCreatorScoreSchema>;
export type Dispute = typeof disputes.$inferSelect;
export type InsertDispute = z.infer<typeof insertDisputeSchema>;
export type Gift = typeof gifts.$inferSelect;
export type InsertGift = z.infer<typeof insertGiftSchema>;
