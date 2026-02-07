/**
 * Confirmd Scoring Engine v1
 * Deterministic scoring for claims and sources
 * NO LLM calls - pure mathematical computation
 */

import type {
  Claim,
  ClaimScore,
  SourceScore,
  Resolution,
  Verdict,
  EvidenceItem,
  ResolutionOutcome,
} from '../models/types';

const SCORE_VERSION = 'v1.0.0';

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
  // Weights for final claim score
  ACCURACY_WEIGHT: 0.60,
  TIMELINESS_WEIGHT: 0.20,
  EVIDENCE_DISCIPLINE_WEIGHT: 0.20,

  // Timeliness sigmoid parameters
  TIMELINESS_HALF_LIFE_HOURS: 48,

  // Shrinkage parameters for source aggregation
  PRIOR_STRENGTH: 20, // "virtual claims" for new sources
  GLOBAL_MEAN: 0.5, // Prior mean for new sources

  // Method discipline weights
  EVIDENCE_STRENGTH_WEIGHT: 0.60,
  PRIMARY_SHARE_WEIGHT: 0.40,

  // Minimum falsifiability clamp
  MIN_FALSIFIABILITY: 0.2,
};

// ============================================
// CLAIM SCORING
// ============================================

/**
 * Calculate Brier score for probability calibration
 * Lower is better, 0 = perfect calibration
 */
function brierScore(predictedProbability: number, actualOutcome: number): number {
  return Math.pow(predictedProbability - actualOutcome, 2);
}

/**
 * Convert outcome enum to numeric value
 */
function outcomeToNumeric(outcome: ResolutionOutcome): number {
  switch (outcome) {
    case 'true': return 1;
    case 'false': return 0;
    case 'partially_true': return 0.5;
    case 'unresolved': return 0.5; // Neutral for unresolved
  }
}

/**
 * Sigmoid function for timeliness calculation
 */
function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

/**
 * Calculate timeliness score based on lead time
 * Rewards early accurate claims
 */
function calculateTimelinessScore(
  assertedAt: Date,
  resolvedAt: Date,
  halfLifeHours: number = CONFIG.TIMELINESS_HALF_LIFE_HOURS
): number {
  const leadTimeMs = resolvedAt.getTime() - assertedAt.getTime();
  const leadTimeHours = leadTimeMs / (1000 * 60 * 60);

  // Normalize and apply sigmoid
  // Claims made closer to resolution get lower scores
  // Claims made well before resolution get higher scores
  const normalizedTime = leadTimeHours / halfLifeHours;
  return sigmoid(normalizedTime - 1); // Shift so 50% is at halfLife
}

/**
 * Calculate accuracy score from resolution
 */
function calculateAccuracyScore(
  claim: Claim,
  resolution: Resolution,
  verdict?: Verdict
): number {
  const outcome = outcomeToNumeric(resolution.outcome);

  // If we have a verdict with probability, use Brier score
  if (verdict && typeof verdict.probabilityTrue === 'number') {
    const brier = brierScore(verdict.probabilityTrue, outcome);
    return 1 - brier; // Convert to 0-1 where 1 is best
  }

  // Fallback to LLM confidence if available
  if (typeof claim.llmConfidence === 'number') {
    const brier = brierScore(claim.llmConfidence, outcome);
    return 1 - brier;
  }

  // No probability available - use binary accuracy
  if (resolution.outcome === 'true') return 1;
  if (resolution.outcome === 'false') return 0;
  return 0.5; // Partial or unresolved
}

/**
 * Calculate evidence discipline score
 * Based on quality of evidence available at assertion time
 */
function calculateEvidenceDisciplineScore(
  verdict?: Verdict,
  evidence?: EvidenceItem[]
): number {
  if (!verdict && !evidence) return 0.5;

  // If we have verdict evidence strength, use it
  if (verdict && typeof verdict.evidenceStrength === 'number') {
    return verdict.evidenceStrength;
  }

  // Calculate from evidence directly
  if (evidence && evidence.length > 0) {
    const gradeWeights = { A: 1.0, B: 0.75, C: 0.5, D: 0.25 };
    const totalWeight = evidence.reduce((sum, e) => sum + gradeWeights[e.evidenceGrade], 0);
    return totalWeight / evidence.length;
  }

  return 0.5;
}

/**
 * Calculate primary evidence share
 * Percentage of evidence that is grade A or B
 */
function calculatePrimaryShare(evidence: EvidenceItem[]): number {
  if (!evidence || evidence.length === 0) return 0;

  const primaryCount = evidence.filter(e =>
    e.evidenceGrade === 'A' || e.evidenceGrade === 'B'
  ).length;

  return primaryCount / evidence.length;
}

/**
 * Compute full claim score
 */
export function computeClaimScore(
  claim: Claim,
  resolution: Resolution,
  verdict?: Verdict,
  evidence?: EvidenceItem[]
): ClaimScore {
  // 1. Calculate accuracy score
  const rawAccuracy = calculateAccuracyScore(claim, resolution, verdict);

  // 2. Apply falsifiability weighting
  const falsifiability = Math.max(
    claim.falsifiabilityScore || 0.5,
    CONFIG.MIN_FALSIFIABILITY
  );
  const weightedAccuracy = rawAccuracy * falsifiability;

  // 3. Calculate timeliness score (only if accurate)
  let timelinessScore = 0;
  if (rawAccuracy > 0.5 && resolution.resolvedAt) {
    const rawTimeliness = calculateTimelinessScore(
      claim.assertedAt,
      resolution.resolvedAt
    );
    timelinessScore = weightedAccuracy * rawTimeliness;
  }

  // 4. Calculate evidence discipline score
  const evidenceDisciplineScore = calculateEvidenceDisciplineScore(verdict, evidence);

  // 5. Compute final score with weights
  const finalClaimScore =
    CONFIG.ACCURACY_WEIGHT * weightedAccuracy +
    CONFIG.TIMELINESS_WEIGHT * timelinessScore +
    CONFIG.EVIDENCE_DISCIPLINE_WEIGHT * evidenceDisciplineScore;

  return {
    id: generateId(),
    claimId: claim.id,
    scoreVersion: SCORE_VERSION,
    accuracyScore: weightedAccuracy,
    timelinessScore,
    evidenceDisciplineScore,
    correctionScore: 0.5, // Not implemented in v1
    finalClaimScore: clamp(finalClaimScore, 0, 1),
    computedAt: new Date(),
    metadata: {
      rawAccuracy,
      falsifiability,
      outcomeValue: outcomeToNumeric(resolution.outcome),
    },
  };
}

// ============================================
// SOURCE SCORING
// ============================================

interface ClaimScoreData {
  finalClaimScore: number;
  evidenceDisciplineScore?: number;
  primaryShare?: number;
}

/**
 * Compute source score with Bayesian shrinkage
 * Prevents new sources from gaming the system with few lucky claims
 */
export function computeSourceScore(
  sourceId: string,
  claimScores: ClaimScoreData[],
  globalMean: number = CONFIG.GLOBAL_MEAN
): SourceScore {
  const n = claimScores.length;

  if (n === 0) {
    // No claims - return prior-based score
    return {
      id: generateId(),
      sourceId,
      scoreVersion: SCORE_VERSION,
      trackRecord: globalMean * 100,
      methodDiscipline: globalMean * 100,
      confidenceInterval: { lower: 0, upper: 100 },
      sampleSize: 0,
      computedAt: new Date(),
      metadata: { priorOnly: true },
    };
  }

  // Calculate raw mean
  const rawMean = claimScores.reduce((sum, s) => sum + s.finalClaimScore, 0) / n;

  // Apply Bayesian shrinkage toward global mean
  const shrunkMean = (n * rawMean + CONFIG.PRIOR_STRENGTH * globalMean) /
    (n + CONFIG.PRIOR_STRENGTH);

  // Calculate standard deviation
  const variance = claimScores.reduce((sum, s) =>
    sum + Math.pow(s.finalClaimScore - rawMean, 2), 0
  ) / Math.max(n - 1, 1);
  const std = Math.sqrt(variance);

  // Calculate standard error and confidence interval
  const se = std / Math.sqrt(Math.max(n, 1));
  const ci95Lower = clamp(shrunkMean - 1.96 * se, 0, 1);
  const ci95Upper = clamp(shrunkMean + 1.96 * se, 0, 1);

  // Calculate method discipline
  const avgEvidenceStrength = claimScores.reduce((sum, s) =>
    sum + (s.evidenceDisciplineScore || 0.5), 0
  ) / n;

  const avgPrimaryShare = claimScores.reduce((sum, s) =>
    sum + (s.primaryShare || 0), 0
  ) / n;

  const methodDiscipline =
    CONFIG.EVIDENCE_STRENGTH_WEIGHT * avgEvidenceStrength +
    CONFIG.PRIMARY_SHARE_WEIGHT * avgPrimaryShare;

  return {
    id: generateId(),
    sourceId,
    scoreVersion: SCORE_VERSION,
    trackRecord: shrunkMean * 100,
    methodDiscipline: methodDiscipline * 100,
    confidenceInterval: {
      lower: ci95Lower * 100,
      upper: ci95Upper * 100,
    },
    sampleSize: n,
    computedAt: new Date(),
    metadata: {
      rawMean,
      shrunkMean,
      standardDeviation: std,
      priorStrength: CONFIG.PRIOR_STRENGTH,
    },
  };
}

// ============================================
// BATCH OPERATIONS
// ============================================

/**
 * Compute all claim scores for a source
 */
export function computeAllClaimScoresForSource(
  claims: Claim[],
  resolutions: Map<string, Resolution>,
  verdicts: Map<string, Verdict>,
  evidenceByClaimId: Map<string, EvidenceItem[]>
): ClaimScore[] {
  return claims
    .filter(c => resolutions.has(c.id))
    .map(claim => {
      const resolution = resolutions.get(claim.id)!;
      const verdict = verdicts.get(claim.id);
      const evidence = evidenceByClaimId.get(claim.id);
      return computeClaimScore(claim, resolution, verdict, evidence);
    });
}

/**
 * Compute global mean across all sources
 * Used for shrinkage calculation
 */
export function computeGlobalMean(allClaimScores: ClaimScore[]): number {
  if (allClaimScores.length === 0) return CONFIG.GLOBAL_MEAN;

  const sum = allClaimScores.reduce((acc, s) => acc + s.finalClaimScore, 0);
  return sum / allClaimScores.length;
}

// ============================================
// HELPERS
// ============================================

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// ============================================
// SCORE EXPLANATION
// ============================================

export interface ScoreExplanation {
  score: number;
  components: {
    name: string;
    value: number;
    weight: number;
    contribution: number;
    explanation: string;
  }[];
  summary: string;
}

/**
 * Generate human-readable explanation for a claim score
 */
export function explainClaimScore(score: ClaimScore): ScoreExplanation {
  const components = [
    {
      name: 'Accuracy',
      value: score.accuracyScore || 0,
      weight: CONFIG.ACCURACY_WEIGHT,
      contribution: (score.accuracyScore || 0) * CONFIG.ACCURACY_WEIGHT,
      explanation: score.accuracyScore && score.accuracyScore > 0.7
        ? 'Claim outcome matched prediction with high confidence'
        : score.accuracyScore && score.accuracyScore < 0.3
          ? 'Claim outcome contradicted prediction'
          : 'Claim outcome was partially aligned with prediction',
    },
    {
      name: 'Timeliness',
      value: score.timelinessScore || 0,
      weight: CONFIG.TIMELINESS_WEIGHT,
      contribution: (score.timelinessScore || 0) * CONFIG.TIMELINESS_WEIGHT,
      explanation: score.timelinessScore && score.timelinessScore > 0.5
        ? 'Claim was made well before resolution'
        : 'Claim was made close to resolution time',
    },
    {
      name: 'Evidence Discipline',
      value: score.evidenceDisciplineScore || 0,
      weight: CONFIG.EVIDENCE_DISCIPLINE_WEIGHT,
      contribution: (score.evidenceDisciplineScore || 0) * CONFIG.EVIDENCE_DISCIPLINE_WEIGHT,
      explanation: score.evidenceDisciplineScore && score.evidenceDisciplineScore > 0.7
        ? 'Claim was supported by high-quality primary evidence'
        : 'Claim relied on lower-quality or speculative sources',
    },
  ];

  const summary = `This claim scored ${(score.finalClaimScore * 100).toFixed(1)} out of 100. ` +
    `Accuracy contributed ${(components[0].contribution * 100).toFixed(1)}%, ` +
    `timeliness ${(components[1].contribution * 100).toFixed(1)}%, ` +
    `and evidence quality ${(components[2].contribution * 100).toFixed(1)}%.`;

  return {
    score: score.finalClaimScore,
    components,
    summary,
  };
}

/**
 * Generate human-readable explanation for a source score
 */
export function explainSourceScore(score: SourceScore): ScoreExplanation {
  const components = [
    {
      name: 'Track Record',
      value: score.trackRecord,
      weight: 1,
      contribution: score.trackRecord,
      explanation: score.trackRecord > 70
        ? 'Source has a strong history of accurate claims'
        : score.trackRecord > 50
          ? 'Source has a mixed track record'
          : 'Source has frequently made inaccurate claims',
    },
    {
      name: 'Method Discipline',
      value: score.methodDiscipline,
      weight: 1,
      contribution: score.methodDiscipline,
      explanation: score.methodDiscipline > 70
        ? 'Source consistently uses high-quality primary evidence'
        : 'Source often relies on speculative or secondary sources',
    },
  ];

  const ciWidth = score.confidenceInterval.upper - score.confidenceInterval.lower;
  const uncertaintyNote = score.sampleSize < 10
    ? ` Note: Only ${score.sampleSize} resolved claims - score has high uncertainty.`
    : score.sampleSize < 30
      ? ` Based on ${score.sampleSize} resolved claims.`
      : ` Based on ${score.sampleSize} resolved claims with narrow confidence interval.`;

  const summary = `Track Record: ${score.trackRecord.toFixed(1)} ± ${(ciWidth / 2).toFixed(1)} | ` +
    `Method Discipline: ${score.methodDiscipline.toFixed(1)}` + uncertaintyNote;

  return {
    score: (score.trackRecord + score.methodDiscipline) / 2,
    components,
    summary,
  };
}

export { SCORE_VERSION, CONFIG };
