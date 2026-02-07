/**
 * Due Diligence Analyst Agent
 * Analyzes claims with evidence to produce verdicts
 * Uses LLM to assess credibility and generate structured verdicts
 */

import type { Claim, EvidenceItem, VerdictOutput, VerdictLabel } from '../models/types';

const PROMPT_VERSION = 'v1.0.0';

// System prompt for due diligence analysis
const SYSTEM_PROMPT = `You are a due diligence analyst specializing in crypto news verification. Your task is to assess claims using provided evidence.

EVIDENCE GRADES:
- A: Primary/authoritative (official filings, project announcements, on-chain data)
- B: Strong secondary (reputable outlets quoting primary sources)
- C: Weak secondary (aggregators, unsourced articles)
- D: Speculative (influencer posts, anonymous tips, rumors)

VERDICT LABELS:
- verified: Primary evidence (grade A/B) directly confirms the claim
- plausible_unverified: Credible hints but no primary evidence
- speculative: Mostly grade C/D evidence; not falsified but unsubstantiated
- misleading: Contradicted by strong evidence or demonstrably false

SCORING:
- probability_true: 0.0-1.0 likelihood claim is factually accurate
- evidence_strength: 0.0-1.0 based on grade distribution and stance coherence

OUTPUT FORMAT (strict JSON):
{
  "verdict_label": "verified | plausible_unverified | speculative | misleading",
  "probability_true": 0.0-1.0,
  "evidence_strength": 0.0-1.0,
  "key_evidence_urls": ["url1", "url2", ...],
  "reasoning_summary": "80-120 word explanation",
  "invalidation_triggers": "What would flip this verdict"
}

IMPORTANT: Be conservative. Only use "verified" when A/B grade evidence directly confirms. Output ONLY valid JSON.`;

// Build user prompt with claim and evidence
function buildUserPrompt(claim: Claim, evidence: EvidenceItem[]): string {
  const evidenceJson = evidence.map(e => ({
    url: e.url,
    publisher: e.publisher,
    published_at: e.publishedAt?.toISOString(),
    excerpt: e.excerpt,
    grade: e.evidenceGrade,
    stance: e.stance,
  }));

  return `CLAIM TO ANALYZE:
"${claim.claimText}"

Claim Type: ${claim.claimType}
Assets: ${claim.assetSymbols.join(', ') || 'None specified'}
Asserted: ${claim.assertedAt.toISOString()}

EVIDENCE (${evidence.length} items):
${JSON.stringify(evidenceJson, null, 2)}

---
Analyze the claim against the evidence and provide your verdict. Output JSON only.`;
}

// Parse LLM response into structured verdict
function parseVerdictResponse(response: string): VerdictOutput | null {
  try {
    let cleaned = response.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.slice(7);
    }
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.slice(3);
    }
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.slice(0, -3);
    }
    cleaned = cleaned.trim();

    const parsed = JSON.parse(cleaned);

    return {
      verdictLabel: validateVerdictLabel(parsed.verdict_label || parsed.verdictLabel),
      probabilityTrue: clamp(parseFloat(parsed.probability_true || parsed.probabilityTrue) || 0.5, 0, 1),
      evidenceStrength: clamp(parseFloat(parsed.evidence_strength || parsed.evidenceStrength) || 0.5, 0, 1),
      keyEvidenceUrls: parsed.key_evidence_urls || parsed.keyEvidenceUrls || [],
      reasoningSummary: parsed.reasoning_summary || parsed.reasoningSummary || '',
      invalidationTriggers: parsed.invalidation_triggers || parsed.invalidationTriggers || '',
    };
  } catch (error) {
    console.error('Failed to parse verdict response:', error);
    return null;
  }
}

function validateVerdictLabel(label: string): VerdictLabel {
  const valid: VerdictLabel[] = ['verified', 'plausible_unverified', 'speculative', 'misleading'];
  return valid.includes(label as VerdictLabel) ? label as VerdictLabel : 'speculative';
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Main analysis function
 */
export async function analyzeClaimWithEvidence(
  claim: Claim,
  evidence: EvidenceItem[],
  llmProvider?: {
    complete: (system: string, user: string) => Promise<string>;
  }
): Promise<VerdictOutput> {
  const userPrompt = buildUserPrompt(claim, evidence);

  let response: string;

  if (llmProvider) {
    response = await llmProvider.complete(SYSTEM_PROMPT, userPrompt);
  } else {
    response = simulateAnalysis(claim, evidence);
  }

  const verdict = parseVerdictResponse(response);

  if (!verdict) {
    // Fallback verdict if parsing fails
    return {
      verdictLabel: 'speculative',
      probabilityTrue: 0.5,
      evidenceStrength: 0.3,
      keyEvidenceUrls: evidence.slice(0, 3).map(e => e.url),
      reasoningSummary: 'Unable to parse LLM response. Defaulting to speculative verdict.',
      invalidationTriggers: 'Any primary source confirmation would change this verdict.',
    };
  }

  return verdict;
}

/**
 * Simulate analysis for demo purposes
 */
function simulateAnalysis(claim: Claim, evidence: EvidenceItem[]): string {
  // Calculate evidence quality metrics
  const gradeWeights = { A: 4, B: 3, C: 2, D: 1 };
  const totalWeight = evidence.reduce((sum, e) => sum + gradeWeights[e.evidenceGrade], 0);
  const maxWeight = evidence.length * 4;
  const evidenceQuality = maxWeight > 0 ? totalWeight / maxWeight : 0;

  // Calculate stance balance
  const supports = evidence.filter(e => e.stance === 'supports').length;
  const contradicts = evidence.filter(e => e.stance === 'contradicts').length;
  const supportRatio = evidence.length > 0 ? supports / evidence.length : 0;
  const contradictRatio = evidence.length > 0 ? contradicts / evidence.length : 0;

  // Count primary sources
  const primaryCount = evidence.filter(e => e.evidenceGrade === 'A' || e.evidenceGrade === 'B').length;
  const hasPrimarySupport = evidence.some(e =>
    (e.evidenceGrade === 'A' || e.evidenceGrade === 'B') && e.stance === 'supports'
  );
  const hasPrimaryContradiction = evidence.some(e =>
    (e.evidenceGrade === 'A' || e.evidenceGrade === 'B') && e.stance === 'contradicts'
  );

  // Determine verdict
  let verdictLabel: VerdictLabel;
  let probabilityTrue: number;
  let evidenceStrength: number;

  if (hasPrimaryContradiction && contradictRatio > 0.3) {
    verdictLabel = 'misleading';
    probabilityTrue = 0.1 + (supportRatio * 0.2);
    evidenceStrength = 0.7 + (evidenceQuality * 0.2);
  } else if (hasPrimarySupport && supportRatio > 0.5) {
    verdictLabel = 'verified';
    probabilityTrue = 0.8 + (evidenceQuality * 0.15);
    evidenceStrength = 0.8 + (evidenceQuality * 0.15);
  } else if (primaryCount > 0 && supportRatio > 0.3) {
    verdictLabel = 'plausible_unverified';
    probabilityTrue = 0.5 + (supportRatio * 0.25);
    evidenceStrength = 0.5 + (evidenceQuality * 0.3);
  } else {
    verdictLabel = 'speculative';
    probabilityTrue = 0.3 + (supportRatio * 0.2);
    evidenceStrength = 0.2 + (evidenceQuality * 0.3);
  }

  // Clamp values
  probabilityTrue = clamp(probabilityTrue, 0, 1);
  evidenceStrength = clamp(evidenceStrength, 0, 1);

  // Generate reasoning
  const gradeDistribution = {
    A: evidence.filter(e => e.evidenceGrade === 'A').length,
    B: evidence.filter(e => e.evidenceGrade === 'B').length,
    C: evidence.filter(e => e.evidenceGrade === 'C').length,
    D: evidence.filter(e => e.evidenceGrade === 'D').length,
  };

  let reasoning = `Analysis of ${evidence.length} evidence items: `;
  reasoning += `${gradeDistribution.A} primary (A), ${gradeDistribution.B} strong secondary (B), `;
  reasoning += `${gradeDistribution.C} weak secondary (C), ${gradeDistribution.D} speculative (D). `;

  if (verdictLabel === 'verified') {
    reasoning += `Primary sources directly confirm this claim with consistent supporting evidence.`;
  } else if (verdictLabel === 'plausible_unverified') {
    reasoning += `Credible indicators suggest the claim may be accurate, but primary confirmation is lacking.`;
  } else if (verdictLabel === 'misleading') {
    reasoning += `Strong evidence contradicts this claim. Primary sources refute the assertion.`;
  } else {
    reasoning += `Insufficient high-quality evidence. Most sources are speculative or unverified.`;
  }

  // Generate invalidation triggers
  let invalidation: string;
  if (verdictLabel === 'verified') {
    invalidation = 'Official retraction, contradicting on-chain data, or regulatory denial would downgrade this verdict.';
  } else if (verdictLabel === 'plausible_unverified') {
    invalidation = 'Primary source confirmation would upgrade to verified; official denial would downgrade to speculative.';
  } else if (verdictLabel === 'misleading') {
    invalidation = 'New primary evidence supporting the claim, or retraction of contradicting sources.';
  } else {
    invalidation = 'Any grade A/B evidence directly confirming or refuting the claim.';
  }

  const keyUrls = evidence
    .filter(e => e.stance === 'supports' || e.stance === 'contradicts')
    .sort((a, b) => gradeWeights[b.evidenceGrade] - gradeWeights[a.evidenceGrade])
    .slice(0, 5)
    .map(e => e.url);

  return JSON.stringify({
    verdict_label: verdictLabel,
    probability_true: probabilityTrue,
    evidence_strength: evidenceStrength,
    key_evidence_urls: keyUrls,
    reasoning_summary: reasoning,
    invalidation_triggers: invalidation,
  });
}

export { SYSTEM_PROMPT, PROMPT_VERSION };
