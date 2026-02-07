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
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  metadata: jsonb("metadata").default({}),
});

export const storyClaims = pgTable("story_claim", {
  id: uuid("id").primaryKey().defaultRandom(),
  storyId: uuid("story_id").notNull().references(() => stories.id),
  claimId: uuid("claim_id").notNull().references(() => claims.id),
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
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
