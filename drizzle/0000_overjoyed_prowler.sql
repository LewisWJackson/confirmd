CREATE TYPE "public"."claim_status" AS ENUM('unreviewed', 'needs_evidence', 'reviewed', 'resolved');--> statement-breakpoint
CREATE TYPE "public"."claim_type" AS ENUM('filing_submitted', 'filing_approved_or_denied', 'regulatory_action', 'listing_announced', 'listing_live', 'delisting_announced', 'trading_halt', 'mainnet_launch', 'testnet_launch', 'upgrade_released', 'exploit_or_hack', 'audit_result', 'partnership_announced', 'investment_or_acquisition', 'large_transfer_or_whale', 'mint_or_burn', 'wallet_attribution', 'price_prediction', 'timeline_prediction', 'rumor', 'misc_claim');--> statement-breakpoint
CREATE TYPE "public"."evidence_grade" AS ENUM('A', 'B', 'C', 'D');--> statement-breakpoint
CREATE TYPE "public"."evidence_stance" AS ENUM('supports', 'contradicts', 'mentions', 'irrelevant');--> statement-breakpoint
CREATE TYPE "public"."item_type" AS ENUM('article', 'tweet', 'release', 'filing', 'onchain_alert', 'announcement', 'other');--> statement-breakpoint
CREATE TYPE "public"."resolution_outcome" AS ENUM('true', 'false', 'unresolved', 'partially_true');--> statement-breakpoint
CREATE TYPE "public"."resolution_type" AS ENUM('immediate', 'scheduled', 'indefinite');--> statement-breakpoint
CREATE TYPE "public"."source_type" AS ENUM('publisher', 'x_handle', 'telegram', 'youtube', 'reddit', 'blog', 'exchange', 'regulator', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."verdict_label" AS ENUM('verified', 'plausible_unverified', 'speculative', 'misleading');--> statement-breakpoint
CREATE TABLE "claim" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"claim_text" text NOT NULL,
	"claim_type" "claim_type" NOT NULL,
	"asset_symbols" text[] DEFAULT '{}',
	"created_at" timestamp DEFAULT now(),
	"asserted_at" timestamp NOT NULL,
	"resolve_by" timestamp,
	"resolution_type" "resolution_type" DEFAULT 'indefinite' NOT NULL,
	"falsifiability_score" real,
	"llm_confidence" real,
	"status" "claim_status" DEFAULT 'unreviewed' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "evidence_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"claim_id" uuid NOT NULL,
	"url" text NOT NULL,
	"publisher" text,
	"published_at" timestamp,
	"retrieved_at" timestamp DEFAULT now(),
	"excerpt" text NOT NULL,
	"stance" "evidence_stance" NOT NULL,
	"evidence_grade" "evidence_grade" NOT NULL,
	"primary_flag" boolean DEFAULT false,
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" uuid NOT NULL,
	"url" text,
	"published_at" timestamp,
	"ingested_at" timestamp DEFAULT now(),
	"raw_text" text NOT NULL,
	"title" text,
	"content_hash" text NOT NULL,
	"item_type" "item_type" DEFAULT 'article' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	CONSTRAINT "item_content_hash_unique" UNIQUE("content_hash")
);
--> statement-breakpoint
CREATE TABLE "resolution" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"claim_id" uuid NOT NULL,
	"outcome" "resolution_outcome" NOT NULL,
	"resolved_at" timestamp DEFAULT now(),
	"resolution_evidence_url" text,
	"notes" text,
	CONSTRAINT "resolution_claim_id_unique" UNIQUE("claim_id")
);
--> statement-breakpoint
CREATE TABLE "source_score" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" uuid NOT NULL,
	"score_version" text NOT NULL,
	"track_record" real,
	"method_discipline" real,
	"confidence_interval" jsonb DEFAULT '{}'::jsonb,
	"sample_size" integer DEFAULT 0,
	"computed_at" timestamp DEFAULT now(),
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "source" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "source_type" DEFAULT 'unknown' NOT NULL,
	"handle_or_domain" text NOT NULL,
	"display_name" text NOT NULL,
	"logo_url" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "source_handle_or_domain_unique" UNIQUE("handle_or_domain")
);
--> statement-breakpoint
CREATE TABLE "story" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"summary" text,
	"image_url" text,
	"category" text,
	"asset_symbols" text[] DEFAULT '{}',
	"source_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "story_claim" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"story_id" uuid NOT NULL,
	"claim_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "story_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"story_id" uuid NOT NULL,
	"item_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"display_name" text NOT NULL,
	"subscription_tier" text DEFAULT 'free' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verdict" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"claim_id" uuid NOT NULL,
	"model" text NOT NULL,
	"prompt_version" text NOT NULL,
	"verdict_label" "verdict_label" NOT NULL,
	"probability_true" real,
	"evidence_strength" real,
	"key_evidence_ids" text[],
	"reasoning_summary" text,
	"invalidation_triggers" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "claim" ADD CONSTRAINT "claim_source_id_source_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."source"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim" ADD CONSTRAINT "claim_item_id_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."item"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_item" ADD CONSTRAINT "evidence_item_claim_id_claim_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."claim"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item" ADD CONSTRAINT "item_source_id_source_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."source"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resolution" ADD CONSTRAINT "resolution_claim_id_claim_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."claim"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_score" ADD CONSTRAINT "source_score_source_id_source_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."source"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_claim" ADD CONSTRAINT "story_claim_story_id_story_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."story"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_claim" ADD CONSTRAINT "story_claim_claim_id_claim_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."claim"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_item" ADD CONSTRAINT "story_item_story_id_story_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."story"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_item" ADD CONSTRAINT "story_item_item_id_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."item"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verdict" ADD CONSTRAINT "verdict_claim_id_claim_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."claim"("id") ON DELETE no action ON UPDATE no action;