-- Confirmd Database Schema v1
-- Purpose: Store claims, evidence, verdicts, and credibility scores

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE source_type AS ENUM (
    'publisher',
    'x_handle',
    'telegram',
    'youtube',
    'reddit',
    'blog',
    'exchange',
    'regulator',
    'unknown'
);

CREATE TYPE item_type AS ENUM (
    'article',
    'tweet',
    'release',
    'filing',
    'onchain_alert',
    'announcement',
    'other'
);

CREATE TYPE claim_type AS ENUM (
    -- Market structure / regulation
    'filing_submitted',
    'filing_approved_or_denied',
    'regulatory_action',
    -- Exchange / listings
    'listing_announced',
    'listing_live',
    'delisting_announced',
    'trading_halt',
    -- Protocol / product
    'mainnet_launch',
    'testnet_launch',
    'upgrade_released',
    'exploit_or_hack',
    'audit_result',
    -- Corporate / partnerships
    'partnership_announced',
    'investment_or_acquisition',
    -- On-chain / supply
    'large_transfer_or_whale',
    'mint_or_burn',
    'wallet_attribution',
    -- Forecasting
    'price_prediction',
    'timeline_prediction',
    -- Other
    'rumor',
    'misc_claim'
);

CREATE TYPE resolution_type AS ENUM (
    'immediate',
    'scheduled',
    'indefinite'
);

CREATE TYPE claim_status AS ENUM (
    'unreviewed',
    'needs_evidence',
    'reviewed',
    'resolved'
);

CREATE TYPE evidence_stance AS ENUM (
    'supports',
    'contradicts',
    'mentions',
    'irrelevant'
);

CREATE TYPE evidence_grade AS ENUM (
    'A',  -- Primary / authoritative
    'B',  -- Strong secondary
    'C',  -- Weak secondary / interpretive
    'D'   -- Speculative / social / anonymous
);

CREATE TYPE verdict_label AS ENUM (
    'verified',
    'plausible_unverified',
    'speculative',
    'misleading'
);

CREATE TYPE resolution_outcome AS ENUM (
    'true',
    'false',
    'unresolved',
    'partially_true'
);

CREATE TYPE subscription_tier AS ENUM (
    'free',
    'plus',
    'pro',
    'team',
    'enterprise'
);

-- ============================================
-- TABLES
-- ============================================

-- Sources (publishers, social accounts, etc.)
CREATE TABLE source (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type source_type NOT NULL DEFAULT 'unknown',
    handle_or_domain TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    logo_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_source_type ON source(type);
CREATE INDEX idx_source_handle ON source(handle_or_domain);

-- Items (ingested content)
CREATE TABLE item (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID NOT NULL REFERENCES source(id),
    url TEXT,
    published_at TIMESTAMPTZ,
    ingested_at TIMESTAMPTZ DEFAULT NOW(),
    raw_text TEXT NOT NULL,
    title TEXT,
    content_hash TEXT NOT NULL,
    item_type item_type NOT NULL DEFAULT 'article',
    metadata JSONB DEFAULT '{}',
    UNIQUE(content_hash)
);

CREATE INDEX idx_item_source ON item(source_id);
CREATE INDEX idx_item_published ON item(published_at DESC);
CREATE INDEX idx_item_hash ON item(content_hash);

-- Claims (atomic assertions)
CREATE TABLE claim (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID NOT NULL REFERENCES source(id),
    item_id UUID NOT NULL REFERENCES item(id),
    claim_text TEXT NOT NULL,
    claim_type claim_type NOT NULL,
    asset_symbols TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    asserted_at TIMESTAMPTZ NOT NULL,
    resolve_by TIMESTAMPTZ,
    resolution_type resolution_type NOT NULL DEFAULT 'indefinite',
    falsifiability_score FLOAT CHECK (falsifiability_score >= 0 AND falsifiability_score <= 1),
    llm_confidence FLOAT CHECK (llm_confidence >= 0 AND llm_confidence <= 1),
    status claim_status NOT NULL DEFAULT 'unreviewed',
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_claim_source ON claim(source_id);
CREATE INDEX idx_claim_item ON claim(item_id);
CREATE INDEX idx_claim_type ON claim(claim_type);
CREATE INDEX idx_claim_status ON claim(status);
CREATE INDEX idx_claim_assets ON claim USING GIN(asset_symbols);
CREATE INDEX idx_claim_resolve_by ON claim(resolve_by) WHERE resolve_by IS NOT NULL;

-- Evidence Items
CREATE TABLE evidence_item (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    claim_id UUID NOT NULL REFERENCES claim(id),
    url TEXT NOT NULL,
    publisher TEXT,
    published_at TIMESTAMPTZ,
    retrieved_at TIMESTAMPTZ DEFAULT NOW(),
    excerpt TEXT NOT NULL,
    stance evidence_stance NOT NULL,
    evidence_grade evidence_grade NOT NULL,
    primary_flag BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_evidence_claim ON evidence_item(claim_id);
CREATE INDEX idx_evidence_grade ON evidence_item(evidence_grade);
CREATE INDEX idx_evidence_stance ON evidence_item(stance);

-- Verdicts (LLM assessments)
CREATE TABLE verdict (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    claim_id UUID NOT NULL REFERENCES claim(id),
    model TEXT NOT NULL,
    prompt_version TEXT NOT NULL,
    verdict_label verdict_label NOT NULL,
    probability_true FLOAT CHECK (probability_true >= 0 AND probability_true <= 1),
    evidence_strength FLOAT CHECK (evidence_strength >= 0 AND evidence_strength <= 1),
    key_evidence_ids UUID[],
    reasoning_summary TEXT,
    invalidation_triggers TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(claim_id, prompt_version)
);

CREATE INDEX idx_verdict_claim ON verdict(claim_id);
CREATE INDEX idx_verdict_label ON verdict(verdict_label);

-- Resolutions (ground truth outcomes)
CREATE TABLE resolution (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    claim_id UUID NOT NULL REFERENCES claim(id) UNIQUE,
    outcome resolution_outcome NOT NULL,
    resolved_at TIMESTAMPTZ DEFAULT NOW(),
    resolution_evidence_url TEXT,
    notes TEXT
);

CREATE INDEX idx_resolution_claim ON resolution(claim_id);
CREATE INDEX idx_resolution_outcome ON resolution(outcome);

-- Claim Scores
CREATE TABLE claim_score (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    claim_id UUID NOT NULL REFERENCES claim(id),
    score_version TEXT NOT NULL,
    accuracy_score FLOAT,
    timeliness_score FLOAT,
    evidence_discipline_score FLOAT,
    correction_score FLOAT DEFAULT 0.5,
    final_claim_score FLOAT NOT NULL,
    computed_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    UNIQUE(claim_id, score_version)
);

CREATE INDEX idx_claim_score_claim ON claim_score(claim_id);

-- Source Scores (aggregated credibility)
CREATE TABLE source_score (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID NOT NULL REFERENCES source(id),
    score_version TEXT NOT NULL,
    track_record FLOAT CHECK (track_record >= 0 AND track_record <= 100),
    method_discipline FLOAT CHECK (method_discipline >= 0 AND method_discipline <= 100),
    confidence_interval JSONB DEFAULT '{}',
    sample_size INTEGER DEFAULT 0,
    computed_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    UNIQUE(source_id, score_version)
);

CREATE INDEX idx_source_score_source ON source_score(source_id);

-- ============================================
-- USER & SUBSCRIPTION TABLES
-- ============================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    subscription_tier subscription_tier DEFAULT 'free',
    credits_balance INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE credit_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    amount INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_credit_ledger_user ON credit_ledger(user_id);

CREATE TABLE watchlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    asset_symbol TEXT,
    topic TEXT,
    claim_id UUID REFERENCES claim(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_watchlist_user ON watchlist(user_id);

CREATE TABLE alert (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    claim_id UUID REFERENCES claim(id),
    source_id UUID REFERENCES source(id),
    alert_type TEXT NOT NULL,
    triggered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_alert_user ON alert(user_id);

-- ============================================
-- AUDIT LOG (for LLM outputs)
-- ============================================

CREATE TABLE llm_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operation TEXT NOT NULL,
    model TEXT NOT NULL,
    prompt_version TEXT NOT NULL,
    input_hash TEXT NOT NULL,
    output_json JSONB NOT NULL,
    tokens_used INTEGER,
    latency_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_operation ON llm_audit_log(operation);
CREATE INDEX idx_audit_created ON llm_audit_log(created_at DESC);

-- ============================================
-- SCHEDULED TASKS
-- ============================================

CREATE TABLE scheduled_recheck (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    claim_id UUID NOT NULL REFERENCES claim(id),
    scheduled_for TIMESTAMPTZ NOT NULL,
    attempts INTEGER DEFAULT 0,
    last_attempt TIMESTAMPTZ,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recheck_scheduled ON scheduled_recheck(scheduled_for) WHERE NOT completed;
