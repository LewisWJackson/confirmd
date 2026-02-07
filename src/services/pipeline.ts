/**
 * Confirmd Pipeline Orchestrator
 * End-to-end flow from item ingestion to scoring
 */

import type {
  Item,
  Claim,
  EvidenceItem,
  Verdict,
  Resolution,
  ClaimScore,
  SourceScore,
  Source,
} from '../models/types';

import { extractClaims } from '../agents/claimExtractor';
import { analyzeClaimWithEvidence } from '../agents/dueDiligenceAnalyst';
import { retrieveEvidence } from './evidenceRetrieval';
import { computeClaimScore, computeSourceScore, computeGlobalMean } from '../scoring/engine';
import { processClaimResolution, createInitialSchedule, requiresHumanReview } from './resolutionEngine';

// ============================================
// PIPELINE EVENTS
// ============================================

export type PipelineEvent =
  | { type: 'ITEM_INGESTED'; item: Item }
  | { type: 'CLAIMS_EXTRACTED'; claims: Claim[]; itemId: string }
  | { type: 'EVIDENCE_COLLECTED'; claimId: string; evidence: EvidenceItem[] }
  | { type: 'VERDICT_CREATED'; claimId: string; verdict: Verdict }
  | { type: 'RESOLUTION_UPDATED'; claimId: string; resolution: Resolution }
  | { type: 'SCORES_UPDATED'; sourceId: string; score: SourceScore }
  | { type: 'HUMAN_REVIEW_REQUIRED'; claimId: string; reason: string };

export type EventHandler = (event: PipelineEvent) => Promise<void>;

// ============================================
// PIPELINE STATE
// ============================================

interface PipelineState {
  items: Map<string, Item>;
  claims: Map<string, Claim>;
  evidence: Map<string, EvidenceItem[]>;
  verdicts: Map<string, Verdict>;
  resolutions: Map<string, Resolution>;
  claimScores: Map<string, ClaimScore>;
  sourceScores: Map<string, SourceScore>;
  sources: Map<string, Source>;
  scheduledRechecks: Map<string, Date>;
}

// ============================================
// PIPELINE ORCHESTRATOR
// ============================================

export class PipelineOrchestrator {
  private state: PipelineState;
  private eventHandlers: EventHandler[] = [];
  private llmProvider?: {
    complete: (system: string, user: string) => Promise<string>;
  };

  constructor(llmProvider?: typeof PipelineOrchestrator.prototype.llmProvider) {
    this.state = {
      items: new Map(),
      claims: new Map(),
      evidence: new Map(),
      verdicts: new Map(),
      resolutions: new Map(),
      claimScores: new Map(),
      sourceScores: new Map(),
      sources: new Map(),
      scheduledRechecks: new Map(),
    };
    this.llmProvider = llmProvider;
  }

  /**
   * Register event handler
   */
  onEvent(handler: EventHandler): void {
    this.eventHandlers.push(handler);
  }

  /**
   * Emit event to all handlers
   */
  private async emit(event: PipelineEvent): Promise<void> {
    for (const handler of this.eventHandlers) {
      await handler(event);
    }
  }

  /**
   * Step 1: Ingest an item
   */
  async ingestItem(item: Item): Promise<void> {
    // Check for duplicates
    if (this.state.items.has(item.contentHash)) {
      console.log(`Duplicate item detected: ${item.contentHash}`);
      return;
    }

    // Store item
    this.state.items.set(item.id, item);

    await this.emit({ type: 'ITEM_INGESTED', item });

    // Proceed to claim extraction
    await this.extractClaimsFromItem(item);
  }

  /**
   * Step 2: Extract claims from item
   */
  async extractClaimsFromItem(item: Item): Promise<void> {
    const result = await extractClaims(item, this.llmProvider);

    const claims: Claim[] = result.claims.map((ec, i) => ({
      id: `${item.id}-claim-${i}`,
      sourceId: item.sourceId,
      itemId: item.id,
      claimText: ec.claimText,
      claimType: ec.claimType,
      assetSymbols: ec.assetSymbols,
      createdAt: new Date(),
      assertedAt: new Date(ec.assertedAt),
      resolveBy: ec.resolveBy ? new Date(ec.resolveBy) : undefined,
      resolutionType: ec.resolutionType,
      falsifiabilityScore: ec.falsifiabilityScore,
      llmConfidence: ec.llmConfidence,
      status: 'unreviewed',
      metadata: { notes: ec.notes },
    }));

    // Store claims
    for (const claim of claims) {
      this.state.claims.set(claim.id, claim);

      // Create scheduled recheck if needed
      const schedule = createInitialSchedule(claim);
      if (schedule) {
        this.state.scheduledRechecks.set(claim.id, schedule.scheduledFor);
      }
    }

    await this.emit({ type: 'CLAIMS_EXTRACTED', claims, itemId: item.id });

    // Proceed to evidence retrieval for each claim
    for (const claim of claims) {
      await this.collectEvidenceForClaim(claim);
    }
  }

  /**
   * Step 3: Collect evidence for a claim
   */
  async collectEvidenceForClaim(claim: Claim): Promise<void> {
    const evidence = await retrieveEvidence(claim);

    this.state.evidence.set(claim.id, evidence);

    // Update claim status
    const storedClaim = this.state.claims.get(claim.id);
    if (storedClaim) {
      storedClaim.status = 'needs_evidence';
      this.state.claims.set(claim.id, storedClaim);
    }

    await this.emit({ type: 'EVIDENCE_COLLECTED', claimId: claim.id, evidence });

    // Proceed to due diligence
    await this.analyzeClaim(claim, evidence);
  }

  /**
   * Step 4: Analyze claim with evidence
   */
  async analyzeClaim(claim: Claim, evidence: EvidenceItem[]): Promise<void> {
    const verdictOutput = await analyzeClaimWithEvidence(claim, evidence, this.llmProvider);

    const verdict: Verdict = {
      id: `${claim.id}-verdict`,
      claimId: claim.id,
      model: 'gpt-4o',
      promptVersion: 'v1.0.0',
      verdictLabel: verdictOutput.verdictLabel,
      probabilityTrue: verdictOutput.probabilityTrue,
      evidenceStrength: verdictOutput.evidenceStrength,
      keyEvidenceIds: evidence
        .filter(e => verdictOutput.keyEvidenceUrls.includes(e.url))
        .map(e => e.id),
      reasoningSummary: verdictOutput.reasoningSummary,
      invalidationTriggers: verdictOutput.invalidationTriggers,
      createdAt: new Date(),
    };

    this.state.verdicts.set(claim.id, verdict);

    // Update claim status
    const storedClaim = this.state.claims.get(claim.id);
    if (storedClaim) {
      storedClaim.status = 'reviewed';
      this.state.claims.set(claim.id, storedClaim);
    }

    await this.emit({ type: 'VERDICT_CREATED', claimId: claim.id, verdict });

    // Check if human review is required
    if (requiresHumanReview(claim)) {
      await this.emit({
        type: 'HUMAN_REVIEW_REQUIRED',
        claimId: claim.id,
        reason: `High-risk claim type: ${claim.claimType}`,
      });
    }

    // Try immediate resolution if applicable
    if (claim.resolutionType === 'immediate') {
      await this.tryResolve(claim);
    }
  }

  /**
   * Step 5: Try to resolve a claim
   */
  async tryResolve(claim: Claim): Promise<void> {
    const evidence = this.state.evidence.get(claim.id) || [];
    const verdict = this.state.verdicts.get(claim.id);

    const result = processClaimResolution(claim, evidence, verdict);

    if (result.resolution) {
      this.state.resolutions.set(claim.id, result.resolution);

      // Update claim status
      const storedClaim = this.state.claims.get(claim.id);
      if (storedClaim) {
        storedClaim.status = 'resolved';
        this.state.claims.set(claim.id, storedClaim);
      }

      await this.emit({ type: 'RESOLUTION_UPDATED', claimId: claim.id, resolution: result.resolution });

      // Update scores
      await this.updateScores(claim.sourceId);
    } else if (result.shouldRecheck && result.nextRecheckAt) {
      this.state.scheduledRechecks.set(claim.id, result.nextRecheckAt);
    }
  }

  /**
   * Step 6: Update source scores
   */
  async updateScores(sourceId: string): Promise<void> {
    // Get all resolved claims for this source
    const sourceClaims = Array.from(this.state.claims.values())
      .filter(c => c.sourceId === sourceId && this.state.resolutions.has(c.id));

    // Compute claim scores
    const claimScores: ClaimScore[] = [];
    for (const claim of sourceClaims) {
      const resolution = this.state.resolutions.get(claim.id)!;
      const verdict = this.state.verdicts.get(claim.id);
      const evidence = this.state.evidence.get(claim.id);

      const score = computeClaimScore(claim, resolution, verdict, evidence);
      this.state.claimScores.set(claim.id, score);
      claimScores.push(score);
    }

    // Compute global mean
    const allClaimScores = Array.from(this.state.claimScores.values());
    const globalMean = computeGlobalMean(allClaimScores);

    // Compute source score with primary share
    const claimScoreData = claimScores.map(cs => {
      const evidence = this.state.evidence.get(cs.claimId) || [];
      const primaryCount = evidence.filter(e => e.evidenceGrade === 'A' || e.evidenceGrade === 'B').length;
      const primaryShare = evidence.length > 0 ? primaryCount / evidence.length : 0;

      return {
        finalClaimScore: cs.finalClaimScore,
        evidenceDisciplineScore: cs.evidenceDisciplineScore,
        primaryShare,
      };
    });

    const sourceScore = computeSourceScore(sourceId, claimScoreData, globalMean);
    this.state.sourceScores.set(sourceId, sourceScore);

    await this.emit({ type: 'SCORES_UPDATED', sourceId, score: sourceScore });
  }

  /**
   * Process scheduled rechecks
   */
  async processScheduledRechecks(): Promise<void> {
    const now = new Date();

    for (const [claimId, scheduledFor] of this.state.scheduledRechecks) {
      if (scheduledFor <= now) {
        const claim = this.state.claims.get(claimId);
        if (claim && claim.status !== 'resolved') {
          // Re-collect evidence
          await this.collectEvidenceForClaim(claim);
          // Remove from schedule (will be re-added if needed)
          this.state.scheduledRechecks.delete(claimId);
        }
      }
    }
  }

  // ============================================
  // GETTERS
  // ============================================

  getClaim(id: string) {
    return this.state.claims.get(id);
  }

  getClaimWithContext(id: string) {
    const claim = this.state.claims.get(id);
    if (!claim) return null;

    return {
      ...claim,
      evidence: this.state.evidence.get(id) || [],
      verdict: this.state.verdicts.get(id),
      resolution: this.state.resolutions.get(id),
      score: this.state.claimScores.get(id),
      source: this.state.sources.get(claim.sourceId),
      item: this.state.items.get(claim.itemId),
    };
  }

  getAllClaims() {
    return Array.from(this.state.claims.values());
  }

  getSourceScore(sourceId: string) {
    return this.state.sourceScores.get(sourceId);
  }

  getAllSourceScores() {
    return Array.from(this.state.sourceScores.entries());
  }
}

// ============================================
// DEMO PIPELINE
// ============================================

/**
 * Run a demo pipeline with sample data
 */
export async function runDemoPipeline(): Promise<PipelineOrchestrator> {
  const pipeline = new PipelineOrchestrator();

  // Add event logging
  pipeline.onEvent(async (event) => {
    console.log(`[Pipeline] ${event.type}`, event);
  });

  // Sample source
  const source: Source = {
    id: 'bloomberg-crypto',
    type: 'publisher',
    handleOrDomain: 'bloomberg.com',
    displayName: 'Bloomberg Crypto',
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Sample item
  const item: Item = {
    id: 'item-001',
    sourceId: source.id,
    url: 'https://bloomberg.com/crypto/eth-etf-update',
    publishedAt: new Date(),
    ingestedAt: new Date(),
    rawText: `The Securities and Exchange Commission has scheduled a meeting to discuss spot Ethereum ETF applications. Industry sources suggest a decision could come within weeks. The meeting is set for February 15, 2024.`,
    title: 'SEC to Meet on Ethereum ETF Applications',
    contentHash: 'abc123',
    itemType: 'article',
    metadata: {},
  };

  // Run pipeline
  await pipeline.ingestItem(item);

  return pipeline;
}

export { PipelineState };
