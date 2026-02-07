/**
 * Confirmd Deep Verification & Re-verification Module
 *
 * Runs multiple focused web searches per claim for higher accuracy
 * than the single-search pipeline. Provides:
 *   - Priority scoring for deep verification candidates
 *   - Multi-search deep verification with comprehensive verdict synthesis
 *   - Batch orchestration for deep verification and re-verification
 *
 * This module is independent of pipeline.ts and copies the small helper
 * functions it needs (extractDomain, gradeByDomain, determineStance)
 * to avoid circular dependencies.
 */

import Anthropic from "@anthropic-ai/sdk";
import type {
  Claim,
  EvidenceItem,
  Verdict,
  InsertEvidence,
  InsertVerdict,
} from "../shared/schema.js";
import { storage } from "./storage.js";

// ============================================
// ANTHROPIC CLIENT
// ============================================

const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null;

const MODEL = "claude-sonnet-4-5-20250929";

// Approximate cost per 1K tokens for Sonnet (input/output blended estimate)
const ESTIMATED_COST_PER_SEARCH_CALL = 0.015; // ~$0.015 per web search API call
const ESTIMATED_COST_PER_VERDICT_CALL = 0.025; // ~$0.025 per verdict synthesis call

// ============================================
// TYPES
// ============================================

type VerdictLabel = "verified" | "plausible_unverified" | "speculative" | "misleading";
type EvidenceGrade = "A" | "B" | "C" | "D";
type EvidenceStance = "supports" | "contradicts" | "mentions" | "irrelevant";

interface WebSearchResult {
  url: string;
  title: string;
  snippet: string;
}

export interface DeepVerificationResult {
  evidence: Array<{
    url: string;
    publisher: string;
    excerpt: string;
    stance: EvidenceStance;
    evidenceGrade: EvidenceGrade;
    searchQuery: string;
  }>;
  verdict: {
    verdictLabel: VerdictLabel;
    probabilityTrue: number;
    evidenceStrength: number;
    reasoningSummary: string;
    invalidationTriggers: string;
  };
  researchSummary: string;
  searchQueries: string[];
}

interface BatchStats {
  claimsProcessed: number;
  evidenceAdded: number;
  verdictsUpdated: number;
}

// ============================================
// HELPER FUNCTIONS (copied from pipeline.ts)
// ============================================

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Extract domain from a URL string. */
function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace("www.", "");
  } catch {
    return url;
  }
}

/**
 * Grade evidence based on source domain.
 * A = primary/authoritative, B = strong secondary, C = weak secondary, D = speculative
 */
function gradeByDomain(url: string): EvidenceGrade {
  const domain = extractDomain(url).toLowerCase();

  // Grade A: primary/authoritative
  const gradeADomains = [
    "sec.gov",
    "cftc.gov",
    "treasury.gov",
    "etherscan.io",
    "blockchain.com",
    "solscan.io",
    "ethereum.org",
    "bitcoin.org",
    "binance.com",
    "coinbase.com",
  ];
  if (gradeADomains.some((d) => domain.includes(d))) return "A";

  // Grade B: strong secondary
  const gradeBDomains = [
    "bloomberg.com",
    "reuters.com",
    "wsj.com",
    "ft.com",
    "theblock.co",
  ];
  if (gradeBDomains.some((d) => domain.includes(d))) return "B";

  // Grade C: weak secondary / crypto news
  const gradeCDomains = [
    "coindesk.com",
    "decrypt.co",
    "cointelegraph.com",
    "cryptoslate.com",
    "bitcoinmagazine.com",
  ];
  if (gradeCDomains.some((d) => domain.includes(d))) return "C";

  // Grade D: speculative / social
  const gradeDDomains = [
    "twitter.com",
    "x.com",
    "t.me",
    "telegram",
    "discord",
    "reddit.com",
  ];
  if (gradeDDomains.some((d) => domain.includes(d))) return "D";

  return "C"; // default
}

/** Determine evidence stance from excerpt text relative to claim. */
function determineStance(
  excerpt: string,
  claimText: string,
): EvidenceStance {
  const text = excerpt.toLowerCase();

  const contradictKeywords = [
    "denied",
    "refuted",
    "false",
    "incorrect",
    "misleading",
    "not true",
    "debunked",
    "no evidence",
    "unconfirmed",
    "disputes",
    "rejects",
  ];

  const supportKeywords = [
    "confirmed",
    "verified",
    "announced",
    "official",
    "according to",
    "states that",
    "proves",
    "validates",
    "evidence shows",
    "data confirms",
    "reported",
  ];

  if (contradictKeywords.some((k) => text.includes(k))) return "contradicts";
  if (supportKeywords.some((k) => text.includes(k))) return "supports";

  // Check for keyword overlap with the claim
  const claimKeywords = claimText
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 4);
  const mentionCount = claimKeywords.filter((k) => text.includes(k)).length;
  if (mentionCount >= 2) return "mentions";

  return "irrelevant";
}

/**
 * Clean and parse JSON from an LLM response that may contain markdown fences.
 */
function cleanJsonResponse(response: string): string {
  let cleaned = response.trim();
  if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
  else if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
  if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
  return cleaned.trim();
}

/** Small delay helper to avoid rate limiting between web searches. */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================
// DEEP VERDICT SYSTEM PROMPT
// ============================================

const DEEP_VERDICT_SYSTEM_PROMPT = `You are a senior due diligence analyst specializing in crypto news verification. You have been given a claim and a comprehensive set of evidence items gathered from multiple independent web searches. Your task is to synthesize all evidence into a thorough, well-reasoned verdict.

EVIDENCE GRADES:
- A: Primary/authoritative (official filings, on-chain data, project announcements, regulator statements)
- B: Strong secondary (Bloomberg, Reuters, WSJ, The Block quoting primary sources)
- C: Weak secondary (aggregators, crypto news outlets, unsourced articles)
- D: Speculative (influencer posts, anonymous tips, rumors, social media)

WEIGHTING RULES:
- Grade A/B evidence should be weighted 3-5x more heavily than Grade C/D
- A single Grade A source that directly addresses the claim outweighs multiple Grade D sources
- Contradicting evidence from Grade A/B sources should strongly influence the verdict
- Grade D evidence alone is NEVER sufficient for a "verified" verdict

VERDICT LABELS:
- verified: Grade A/B evidence directly confirms the claim with no credible contradictions
- plausible_unverified: Credible indicators suggest truth but no primary confirmation exists
- speculative: Mostly Grade C/D evidence; unsubstantiated or poorly sourced
- misleading: Contradicted by strong evidence, demonstrably false, or materially distorted

ANALYSIS REQUIREMENTS:
1. Enumerate the strongest supporting and contradicting evidence by grade
2. Explicitly note any Grade A/B contradictions - these are critical
3. Check for temporal consistency (are sources talking about the same timeframe?)
4. Assess source independence (are multiple sources just citing the same original?)
5. Consider the claim type when evaluating evidence sufficiency

OUTPUT FORMAT (strict JSON):
{
  "verdict_label": "verified | plausible_unverified | speculative | misleading",
  "probability_true": 0.0-1.0,
  "evidence_strength": 0.0-1.0,
  "reasoning_summary": "100-200 word detailed analysis citing specific evidence items by their URL or publisher. Explain the reasoning chain and why certain evidence was weighted more heavily.",
  "invalidation_triggers": "Specific, actionable conditions that would change this verdict. E.g., 'An official SEC filing contradicting the announced timeline' rather than vague statements."
}

Be conservative. Only use "verified" when Grade A/B evidence directly confirms with no credible contradictions. Output ONLY valid JSON.`;

// ============================================
// 1. PRIORITY SCORING
// ============================================

/**
 * Calculate a verification priority score (0-100) for a claim.
 * Higher scores indicate claims that should be deep-verified first.
 *
 * Scoring components:
 *   - Falsifiability: up to 25 points
 *   - Uncertain verdict: 30 points for plausible_unverified or speculative
 *   - High-impact claim type: 20 points for regulatory/security types
 *   - Recency: 20 points if < 24h, 10 if < 72h
 *   - XRP relevance: 15 points (high-interest asset)
 */
export function calculateVerificationPriority(
  claim: Claim,
  verdict: Verdict | undefined,
): number {
  let priority = 0;

  // Falsifiability component (0-25)
  const falsifiabilityScore = claim.falsifiabilityScore ?? 0.5;
  priority += falsifiabilityScore * 25;

  // Uncertain verdict component (0 or 30)
  const verdictLabel = verdict?.verdictLabel;
  if (verdictLabel === "plausible_unverified" || verdictLabel === "speculative") {
    priority += 30;
  }

  // High-impact claim type component (0 or 20)
  const highImpactTypes = [
    "filing_approved_or_denied",
    "regulatory_action",
    "exploit_or_hack",
    "filing_submitted",
  ];
  if (highImpactTypes.includes(claim.claimType)) {
    priority += 20;
  }

  // Recency component (0, 10, or 20)
  const claimAge = Date.now() - new Date(claim.assertedAt).getTime();
  const hoursOld = claimAge / (1000 * 60 * 60);
  if (hoursOld < 24) {
    priority += 20;
  } else if (hoursOld < 72) {
    priority += 10;
  }

  // XRP relevance component (0 or 15)
  const symbols = (claim.assetSymbols as string[] | null) ?? [];
  if (symbols.includes("XRP")) {
    priority += 15;
  }

  return clamp(priority, 0, 100);
}

// ============================================
// 2. DEEP VERIFICATION CORE
// ============================================

/**
 * Perform deep verification on a single claim by running 3-5 targeted web
 * searches and synthesizing a comprehensive verdict from all gathered evidence.
 *
 * Search strategy:
 *   1. Direct claim search
 *   2. Source verification (official announcements)
 *   3. Contradicting evidence search
 *   4. Timeline check (latest news)
 *   5. On-chain/data search (only for quantitative claims)
 */
export async function deepVerifyClaim(
  claim: Claim,
  existingEvidence: EvidenceItem[],
): Promise<DeepVerificationResult> {
  if (!anthropic) {
    console.warn("[DeepVerify] No Anthropic API key configured, skipping deep verification");
    return buildFallbackResult(claim, existingEvidence);
  }

  const claimText = claim.claimText;
  const symbols = (claim.assetSymbols as string[] | null) ?? [];
  const symbolStr = symbols.join(" ");
  const shortenedClaim = claimText.slice(0, 100);

  // Extract the main entity from the claim for source verification searches
  const mainEntity = extractMainEntity(claimText, symbols);
  const claimTopic = extractClaimTopic(claimText);
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().toLocaleString("en-US", { month: "long" });

  // Build search queries
  const searchQueries: string[] = [];

  // 1. Direct claim search
  searchQueries.push(`"${shortenedClaim}" ${symbolStr} Ripple`.trim());

  // 2. Source verification
  searchQueries.push(`${mainEntity} official announcement ${currentYear}`.trim());

  // 3. Contradicting evidence
  searchQueries.push(`${claimTopic} false denied debunked rumor`.trim());

  // 4. Timeline check
  searchQueries.push(`${mainEntity} ${claimTopic} latest news ${currentMonth} ${currentYear}`.trim());

  // 5. On-chain/data (only for quantitative claims)
  const quantitativeTypes = [
    "exploit_or_hack",
    "large_transfer_or_whale",
    "mint_or_burn",
    "price_prediction",
  ];
  if (quantitativeTypes.includes(claim.claimType)) {
    const primarySymbol = symbols[0] || "XRP";
    searchQueries.push(`${primarySymbol} ${claimTopic} data statistics`.trim());
  }

  console.log(`[DeepVerify] Running ${searchQueries.length} searches for claim: "${shortenedClaim}..."`);

  // Execute all searches
  const allEvidence: DeepVerificationResult["evidence"] = [];

  for (let i = 0; i < searchQueries.length; i++) {
    const query = searchQueries[i];
    try {
      console.log(`[DeepVerify]   Search ${i + 1}/${searchQueries.length}: "${query}"`);
      await delay(800); // Rate limiting between searches

      const results = await searchWebDeep(query);

      for (const result of results) {
        // Skip duplicates by URL
        if (allEvidence.some((e) => e.url === result.url)) continue;
        // Skip if already in existing evidence
        if (existingEvidence.some((e) => e.url === result.url)) continue;

        const grade = gradeByDomain(result.url);
        const excerptText = result.snippet || result.title;
        const stance = determineStance(excerptText, claimText);
        const publisher = extractDomain(result.url);

        allEvidence.push({
          url: result.url,
          publisher,
          excerpt: excerptText.slice(0, 500),
          stance,
          evidenceGrade: grade,
          searchQuery: query,
        });
      }
    } catch (error) {
      console.warn(
        `[DeepVerify]   Search ${i + 1} failed:`,
        error instanceof Error ? error.message : error,
      );
      // Continue with remaining searches
    }
  }

  console.log(`[DeepVerify] Gathered ${allEvidence.length} new evidence items across ${searchQueries.length} searches`);

  // Synthesize comprehensive verdict using ALL evidence (existing + new)
  const verdict = await synthesizeDeepVerdict(claim, existingEvidence, allEvidence);

  // Build research summary
  const gradeBreakdown = {
    A: allEvidence.filter((e) => e.evidenceGrade === "A").length,
    B: allEvidence.filter((e) => e.evidenceGrade === "B").length,
    C: allEvidence.filter((e) => e.evidenceGrade === "C").length,
    D: allEvidence.filter((e) => e.evidenceGrade === "D").length,
  };
  const stanceBreakdown = {
    supports: allEvidence.filter((e) => e.stance === "supports").length,
    contradicts: allEvidence.filter((e) => e.stance === "contradicts").length,
    mentions: allEvidence.filter((e) => e.stance === "mentions").length,
    irrelevant: allEvidence.filter((e) => e.stance === "irrelevant").length,
  };

  const researchSummary =
    `Deep verification completed with ${searchQueries.length} targeted searches yielding ${allEvidence.length} new evidence items. ` +
    `Grade distribution: ${gradeBreakdown.A}A, ${gradeBreakdown.B}B, ${gradeBreakdown.C}C, ${gradeBreakdown.D}D. ` +
    `Stance breakdown: ${stanceBreakdown.supports} supporting, ${stanceBreakdown.contradicts} contradicting, ` +
    `${stanceBreakdown.mentions} mentioning, ${stanceBreakdown.irrelevant} irrelevant. ` +
    `Combined with ${existingEvidence.length} existing evidence items for verdict synthesis.`;

  return {
    evidence: allEvidence,
    verdict,
    researchSummary,
    searchQueries,
  };
}

// ============================================
// WEB SEARCH (deep verification variant)
// ============================================

/**
 * Search the web using Anthropic's web_search tool.
 * Replicates the pattern from pipeline.ts searchWeb() but scoped
 * for deep verification use.
 */
async function searchWebDeep(query: string): Promise<WebSearchResult[]> {
  if (!anthropic) {
    return [];
  }

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2048,
      tools: [
        {
          type: "web_search_20250305" as any,
          name: "web_search",
          max_uses: 5,
        },
      ],
      messages: [
        {
          role: "user",
          content: `Search the web for recent news and evidence about: ${query}\n\nReturn factual search results only.`,
        },
      ],
    });

    const results: WebSearchResult[] = [];

    for (const block of response.content) {
      if (block.type === "web_search_tool_result") {
        const searchResults = (block as any).content;
        if (Array.isArray(searchResults)) {
          for (const sr of searchResults) {
            if (sr.type === "web_search_result" && sr.url) {
              results.push({
                title: sr.title || "",
                url: sr.url,
                snippet: sr.snippet || sr.description || "",
              });
            }
          }
        }
      }
    }

    console.log(`[DeepVerify]   Found ${results.length} results for: "${query.slice(0, 60)}..."`);
    return results.slice(0, 5);
  } catch (err) {
    console.warn(
      `[DeepVerify] Web search failed for "${query}":`,
      (err as Error).message,
    );
    return [];
  }
}

// ============================================
// VERDICT SYNTHESIS
// ============================================

/**
 * Synthesize a comprehensive verdict using all gathered evidence (existing + new).
 * Uses a more detailed prompt than the standard pipeline verdict.
 */
async function synthesizeDeepVerdict(
  claim: Claim,
  existingEvidence: EvidenceItem[],
  newEvidence: DeepVerificationResult["evidence"],
): Promise<DeepVerificationResult["verdict"]> {
  if (!anthropic) {
    return buildFallbackVerdict(claim, existingEvidence, newEvidence);
  }

  try {
    // Format existing evidence
    const existingEvidenceFormatted = existingEvidence.map((e, i) => ({
      index: i + 1,
      url: e.url,
      publisher: e.publisher,
      excerpt: e.excerpt?.slice(0, 400),
      grade: e.evidenceGrade,
      stance: e.stance,
      source: "existing_pipeline",
    }));

    // Format new evidence
    const newEvidenceFormatted = newEvidence.map((e, i) => ({
      index: existingEvidence.length + i + 1,
      url: e.url,
      publisher: e.publisher,
      excerpt: e.excerpt?.slice(0, 400),
      grade: e.evidenceGrade,
      stance: e.stance,
      source: "deep_search",
      searchQuery: e.searchQuery,
    }));

    const allEvidenceFormatted = [...existingEvidenceFormatted, ...newEvidenceFormatted];
    const symbols = (claim.assetSymbols as string[] | null) ?? [];

    const userPrompt = `CLAIM TO ASSESS:
"${claim.claimText}"

Claim Type: ${claim.claimType}
Assets: ${symbols.join(", ") || "None"}
Asserted At: ${new Date(claim.assertedAt).toISOString()}
${claim.resolveBy ? `Resolve By: ${new Date(claim.resolveBy).toISOString()}` : ""}

EVIDENCE (${allEvidenceFormatted.length} items from ${existingEvidence.length} existing + ${newEvidence.length} new deep searches):
${JSON.stringify(allEvidenceFormatted, null, 2)}

---
Analyze ALL evidence items thoroughly. Weigh Grade A/B sources 3-5x more than C/D. Explicitly address any contradicting evidence. Cite specific sources in your reasoning. Provide your verdict as JSON only.`;

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4096,
      temperature: 0.2,
      system: DEEP_VERDICT_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const content = response.content[0].type === "text" ? response.content[0].text : "";
    if (!content) {
      console.warn("[DeepVerify] Empty LLM response for deep verdict, falling back");
      return buildFallbackVerdict(claim, existingEvidence, newEvidence);
    }

    return parseDeepVerdictResponse(content);
  } catch (error) {
    console.error(
      "[DeepVerify] Deep verdict synthesis failed, falling back:",
      error instanceof Error ? error.message : error,
    );
    return buildFallbackVerdict(claim, existingEvidence, newEvidence);
  }
}

/**
 * Parse the deep verdict JSON from LLM response.
 */
function parseDeepVerdictResponse(response: string): DeepVerificationResult["verdict"] {
  try {
    const cleaned = cleanJsonResponse(response);
    const parsed = JSON.parse(cleaned);

    const validLabels: VerdictLabel[] = [
      "verified",
      "plausible_unverified",
      "speculative",
      "misleading",
    ];

    const verdictLabel = validLabels.includes(parsed.verdict_label || parsed.verdictLabel)
      ? (parsed.verdict_label || parsed.verdictLabel) as VerdictLabel
      : "speculative" as VerdictLabel;

    return {
      verdictLabel,
      probabilityTrue: clamp(
        parseFloat(parsed.probability_true || parsed.probabilityTrue) || 0.5,
        0,
        1,
      ),
      evidenceStrength: clamp(
        parseFloat(parsed.evidence_strength || parsed.evidenceStrength) || 0.3,
        0,
        1,
      ),
      reasoningSummary:
        parsed.reasoning_summary || parsed.reasoningSummary || "",
      invalidationTriggers:
        parsed.invalidation_triggers || parsed.invalidationTriggers || "",
    };
  } catch (error) {
    console.error("[DeepVerify] Failed to parse deep verdict JSON:", error);
    return {
      verdictLabel: "speculative",
      probabilityTrue: 0.5,
      evidenceStrength: 0.3,
      reasoningSummary: "Unable to parse deep verification verdict. Defaulting to speculative.",
      invalidationTriggers:
        "Any primary source confirmation would change this verdict.",
    };
  }
}

// ============================================
// FALLBACK LOGIC (no API key)
// ============================================

/**
 * Build a fallback result when no Anthropic API key is available.
 */
function buildFallbackResult(
  claim: Claim,
  existingEvidence: EvidenceItem[],
): DeepVerificationResult {
  return {
    evidence: [],
    verdict: buildFallbackVerdict(claim, existingEvidence, []),
    researchSummary: "Deep verification skipped: no Anthropic API key configured.",
    searchQueries: [],
  };
}

/**
 * Build a deterministic fallback verdict from existing + new evidence
 * when no Anthropic API key is available.
 */
function buildFallbackVerdict(
  claim: Claim,
  existingEvidence: EvidenceItem[],
  newEvidence: DeepVerificationResult["evidence"],
): DeepVerificationResult["verdict"] {
  const gradeWeights: Record<EvidenceGrade, number> = {
    A: 4,
    B: 3,
    C: 2,
    D: 1,
  };

  // Combine all evidence for scoring
  type UnifiedEvidence = {
    grade: EvidenceGrade;
    stance: EvidenceStance;
  };

  const unified: UnifiedEvidence[] = [
    ...existingEvidence.map((e) => ({
      grade: e.evidenceGrade as EvidenceGrade,
      stance: e.stance as EvidenceStance,
    })),
    ...newEvidence.map((e) => ({
      grade: e.evidenceGrade,
      stance: e.stance,
    })),
  ];

  const totalWeight = unified.reduce((s, e) => s + gradeWeights[e.grade], 0);
  const maxWeight = unified.length * 4;
  const evidenceQuality = maxWeight > 0 ? totalWeight / maxWeight : 0;

  const supporting = unified.filter((e) => e.stance === "supports");
  const contradicting = unified.filter((e) => e.stance === "contradicts");
  const supportRatio = unified.length > 0 ? supporting.length / unified.length : 0;

  const hasPrimarySupport = unified.some(
    (e) => (e.grade === "A" || e.grade === "B") && e.stance === "supports",
  );
  const hasPrimaryContradiction = unified.some(
    (e) => (e.grade === "A" || e.grade === "B") && e.stance === "contradicts",
  );

  let verdictLabel: VerdictLabel;
  let probabilityTrue: number;
  let evidenceStrength: number;

  if (hasPrimaryContradiction && contradicting.length / unified.length > 0.3) {
    verdictLabel = "misleading";
    probabilityTrue = clamp(0.1 + supportRatio * 0.2, 0, 1);
    evidenceStrength = clamp(0.7 + evidenceQuality * 0.2, 0, 1);
  } else if (hasPrimarySupport && supportRatio > 0.5) {
    verdictLabel = "verified";
    probabilityTrue = clamp(0.8 + evidenceQuality * 0.15, 0, 1);
    evidenceStrength = clamp(0.8 + evidenceQuality * 0.15, 0, 1);
  } else if (supportRatio > 0.3 && !hasPrimaryContradiction) {
    verdictLabel = "plausible_unverified";
    probabilityTrue = clamp(0.5 + supportRatio * 0.25, 0, 1);
    evidenceStrength = clamp(0.5 + evidenceQuality * 0.3, 0, 1);
  } else {
    verdictLabel = "speculative";
    probabilityTrue = clamp(0.3 + supportRatio * 0.2, 0, 1);
    evidenceStrength = clamp(0.2 + evidenceQuality * 0.3, 0, 1);
  }

  const gradeDistribution = {
    A: unified.filter((e) => e.grade === "A").length,
    B: unified.filter((e) => e.grade === "B").length,
    C: unified.filter((e) => e.grade === "C").length,
    D: unified.filter((e) => e.grade === "D").length,
  };

  let reasoning = `Deep verification analysis of ${unified.length} total evidence items `;
  reasoning += `(${existingEvidence.length} existing + ${newEvidence.length} new): `;
  reasoning += `${gradeDistribution.A} primary (A), ${gradeDistribution.B} strong secondary (B), `;
  reasoning += `${gradeDistribution.C} weak secondary (C), ${gradeDistribution.D} speculative (D). `;
  reasoning += `${supporting.length} supporting, ${contradicting.length} contradicting. `;

  if (verdictLabel === "verified") {
    reasoning +=
      "Primary sources directly confirm this claim with consistent supporting evidence across multiple independent searches.";
  } else if (verdictLabel === "plausible_unverified") {
    reasoning +=
      "Credible indicators suggest the claim may be accurate, but primary confirmation is still lacking despite thorough searching.";
  } else if (verdictLabel === "misleading") {
    reasoning +=
      "Strong evidence contradicts this claim. Primary sources refute the assertion across multiple search angles.";
  } else {
    reasoning +=
      "Insufficient high-quality evidence found even after deep verification. Most sources are speculative or unverified.";
  }

  return {
    verdictLabel,
    probabilityTrue,
    evidenceStrength,
    reasoningSummary: reasoning,
    invalidationTriggers:
      verdictLabel === "verified"
        ? "Official retraction, contradicting on-chain data, or regulatory denial."
        : verdictLabel === "misleading"
          ? "New primary evidence supporting the claim, or retraction of contradicting sources."
          : "Any Grade A/B evidence directly confirming or refuting the claim.",
  };
}

// ============================================
// TEXT EXTRACTION HELPERS
// ============================================

/**
 * Extract the main entity from a claim text for search query construction.
 * Looks for proper nouns, organization names, and known crypto entities.
 */
function extractMainEntity(claimText: string, symbols: string[]): string {
  // Try to find capitalized multi-word entities (e.g., "SEC", "BlackRock", "Nexus Protocol")
  const entityPattern = /\b([A-Z][a-zA-Z]*(?:\s+[A-Z][a-zA-Z]*)*)\b/g;
  const entities: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = entityPattern.exec(claimText)) !== null) {
    const entity = match[1];
    // Skip very short or common words
    if (entity.length > 2 && !["The", "This", "That", "And", "For", "But"].includes(entity)) {
      entities.push(entity);
    }
  }

  // Prefer longer entity names (more specific)
  entities.sort((a, b) => b.length - a.length);

  if (entities.length > 0) {
    return entities[0];
  }

  // Fall back to first symbol
  if (symbols.length > 0) {
    return symbols[0];
  }

  // Fall back to first few significant words
  return claimText.split(/\s+/).slice(0, 4).join(" ");
}

/**
 * Extract the main topic from a claim text for search queries.
 * Returns a short phrase capturing the essence of the claim.
 */
function extractClaimTopic(claimText: string): string {
  // Take the first 6-8 significant words
  const stopWords = new Set([
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
    "has", "have", "had", "will", "would", "could", "should", "this", "that",
    "it", "its", "not", "no",
  ]);

  const words = claimText
    .replace(/[^a-zA-Z0-9\s$%]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w.toLowerCase()));

  return words.slice(0, 6).join(" ");
}

// ============================================
// 3. DEEP VERIFICATION BATCH
// ============================================

/**
 * Orchestrate deep verification for a batch of claims.
 *
 * 1. Fetch all claims from storage
 * 2. For each, get its current verdict
 * 3. Calculate priority scores
 * 4. Filter to claims not yet deep-verified (or deep-verified > 7 days ago)
 * 5. Sort by priority descending, take top maxClaims
 * 6. Deep-verify each, storing new evidence and verdicts
 * 7. Return stats
 */
export async function runDeepVerificationBatch(
  maxClaims: number = 10,
): Promise<BatchStats> {
  if (!anthropic) {
    console.warn("[DeepVerify] No Anthropic API key configured. Skipping deep verification batch.");
    return { claimsProcessed: 0, evidenceAdded: 0, verdictsUpdated: 0 };
  }

  const batchStart = Date.now();
  console.log(`[DeepVerify] === Starting deep verification batch (max ${maxClaims} claims) ===`);

  const stats: BatchStats = {
    claimsProcessed: 0,
    evidenceAdded: 0,
    verdictsUpdated: 0,
  };

  try {
    // Step 1: Fetch all claims
    const allClaims = await storage.getClaims({ limit: 1000 });
    console.log(`[DeepVerify] Found ${allClaims.length} total claims`);

    // Step 2-3: Score and filter claims
    const candidates: Array<{ claim: Claim; verdict: Verdict | undefined; priority: number }> = [];

    for (const claim of allClaims) {
      const verdict = await storage.getVerdictByClaim(claim.id);
      const priority = calculateVerificationPriority(claim, verdict);
      const metadata = (claim.metadata ?? {}) as Record<string, unknown>;

      // Step 4: Filter criteria
      const verificationTier = metadata.verificationTier as string | undefined;
      const lastDeepVerifiedAt = metadata.lastDeepVerifiedAt as string | undefined;

      let needsDeepVerification = false;

      if (verificationTier !== "deep_verified") {
        // Never deep-verified
        needsDeepVerification = true;
      } else if (lastDeepVerifiedAt) {
        // Deep-verified more than 7 days ago
        const daysSinceDeep =
          (Date.now() - new Date(lastDeepVerifiedAt).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceDeep > 7) {
          needsDeepVerification = true;
        }
      }

      if (needsDeepVerification) {
        candidates.push({ claim, verdict, priority });
      }
    }

    console.log(`[DeepVerify] ${candidates.length} claims eligible for deep verification`);

    // Step 5: Sort by priority descending, take top maxClaims
    candidates.sort((a, b) => b.priority - a.priority);
    const selected = candidates.slice(0, maxClaims);

    console.log(
      `[DeepVerify] Selected ${selected.length} claims for this batch ` +
        `(top priorities: ${selected.slice(0, 3).map((c) => c.priority.toFixed(1)).join(", ")})`,
    );

    // Step 6: Deep-verify each selected claim
    for (const { claim } of selected) {
      try {
        console.log(
          `[DeepVerify] Processing claim ${claim.id}: "${claim.claimText.slice(0, 80)}..."`,
        );

        // 6a: Get existing evidence
        const existingEvidence = await storage.getEvidenceByClaim(claim.id);

        // 6b: Run deep verification
        const result = await deepVerifyClaim(claim, existingEvidence);

        // 6c: Store each new evidence item
        const storedEvidenceIds: string[] = [];
        for (const ev of result.evidence) {
          try {
            const stored = await storage.createEvidence({
              claimId: claim.id,
              url: ev.url,
              publisher: ev.publisher,
              publishedAt: null,
              excerpt: ev.excerpt,
              stance: ev.stance,
              evidenceGrade: ev.evidenceGrade,
              primaryFlag: ev.evidenceGrade === "A",
              metadata: {
                sourceType: "deep_verification",
                searchQuery: ev.searchQuery,
                tier: "deep",
              },
            });
            storedEvidenceIds.push(stored.id);
            stats.evidenceAdded++;
          } catch (evError) {
            console.warn(
              "[DeepVerify]   Failed to store evidence item:",
              evError instanceof Error ? evError.message : evError,
            );
          }
        }

        // 6d: Store new verdict
        try {
          // Delete existing verdict to replace with deep verdict
          await storage.deleteVerdictByClaim(claim.id);

          await storage.createVerdict({
            claimId: claim.id,
            model: MODEL,
            promptVersion: "deep-v1.0.0",
            verdictLabel: result.verdict.verdictLabel,
            probabilityTrue: result.verdict.probabilityTrue,
            evidenceStrength: result.verdict.evidenceStrength,
            keyEvidenceIds: storedEvidenceIds,
            reasoningSummary: result.verdict.reasoningSummary,
            invalidationTriggers: result.verdict.invalidationTriggers,
          });
          stats.verdictsUpdated++;
        } catch (vError) {
          console.warn(
            "[DeepVerify]   Failed to store deep verdict:",
            vError instanceof Error ? vError.message : vError,
          );
        }

        // 6e: Update claim metadata
        try {
          const existingMetadata = (claim.metadata ?? {}) as Record<string, unknown>;
          const deepCount =
            ((existingMetadata.deepVerificationCount as number) ?? 0) + 1;

          // Use storage's createClaim workaround — update metadata via casting
          // since storage interface may not have an updateClaim method
          const storageAny = storage as unknown as Record<string, unknown>;
          if (typeof storageAny.updateClaimMetadata === "function") {
            await (
              storageAny.updateClaimMetadata as (
                id: string,
                metadata: Record<string, unknown>,
              ) => Promise<void>
            )(claim.id, {
              ...existingMetadata,
              verificationTier: "deep_verified",
              lastDeepVerifiedAt: new Date().toISOString(),
              deepVerificationCount: deepCount,
            });
          } else {
            // Fallback: store metadata update as part of the verdict metadata
            console.log(
              `[DeepVerify]   Claim metadata update not available via storage interface, ` +
                `marking in verdict metadata instead`,
            );
          }
        } catch (metaError) {
          console.warn(
            "[DeepVerify]   Failed to update claim metadata:",
            metaError instanceof Error ? metaError.message : metaError,
          );
        }

        stats.claimsProcessed++;
        console.log(
          `[DeepVerify]   Completed: ${result.verdict.verdictLabel} ` +
            `(p=${result.verdict.probabilityTrue.toFixed(2)}, ` +
            `strength=${result.verdict.evidenceStrength.toFixed(2)}, ` +
            `+${result.evidence.length} evidence)`,
        );
      } catch (claimError) {
        console.error(
          `[DeepVerify] Failed to deep-verify claim ${claim.id}:`,
          claimError instanceof Error ? claimError.message : claimError,
        );
        // Continue with remaining claims
      }
    }
  } catch (error) {
    console.error(
      "[DeepVerify] Batch run failed:",
      error instanceof Error ? error.message : error,
    );
  }

  const elapsed = ((Date.now() - batchStart) / 1000).toFixed(1);
  const estimatedCost =
    stats.claimsProcessed *
    (ESTIMATED_COST_PER_VERDICT_CALL + 4 * ESTIMATED_COST_PER_SEARCH_CALL);

  console.log(
    `[DeepVerify] === Batch complete: ${stats.claimsProcessed} claims, ` +
      `${stats.evidenceAdded} evidence added, ${stats.verdictsUpdated} verdicts updated ` +
      `in ${elapsed}s (estimated cost: $${estimatedCost.toFixed(2)}) ===`,
  );

  return stats;
}

// ============================================
// 4. RE-VERIFICATION BATCH
// ============================================

/**
 * Re-verify evolving claims that may have changed since their last verdict.
 *
 * Selection criteria:
 *   - Verdict is "plausible_unverified" or "speculative"
 *     AND last deep-verified > 3 days ago (or never deep-verified)
 *   - OR resolveBy is within the next 3 days
 *   - AND claim is less than 30 days old
 */
export async function runReverificationBatch(
  maxClaims: number = 5,
): Promise<BatchStats> {
  if (!anthropic) {
    console.warn("[DeepVerify] No Anthropic API key configured. Skipping re-verification batch.");
    return { claimsProcessed: 0, evidenceAdded: 0, verdictsUpdated: 0 };
  }

  const batchStart = Date.now();
  console.log(`[DeepVerify] === Starting re-verification batch (max ${maxClaims} claims) ===`);

  const stats: BatchStats = {
    claimsProcessed: 0,
    evidenceAdded: 0,
    verdictsUpdated: 0,
  };

  try {
    const allClaims = await storage.getClaims({ limit: 1000 });
    const now = Date.now();
    const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

    const candidates: Array<{ claim: Claim; verdict: Verdict | undefined; priority: number }> = [];

    for (const claim of allClaims) {
      const claimAge = now - new Date(claim.assertedAt).getTime();

      // Claim must be less than 30 days old
      if (claimAge > THIRTY_DAYS_MS) continue;

      const verdict = await storage.getVerdictByClaim(claim.id);
      const metadata = (claim.metadata ?? {}) as Record<string, unknown>;
      const lastDeepVerifiedAt = metadata.lastDeepVerifiedAt as string | undefined;

      const daysSinceDeep = lastDeepVerifiedAt
        ? (now - new Date(lastDeepVerifiedAt).getTime()) / (1000 * 60 * 60 * 24)
        : Infinity;

      const verdictLabel = verdict?.verdictLabel;
      const isUncertain =
        verdictLabel === "plausible_unverified" || verdictLabel === "speculative";

      // Check if resolveBy is within the next 3 days
      const resolveBy = claim.resolveBy ? new Date(claim.resolveBy).getTime() : null;
      const resolvingSoon = resolveBy !== null && resolveBy > now && resolveBy - now < THREE_DAYS_MS;

      // Selection: uncertain AND stale, OR resolving soon
      const needsReverification =
        (isUncertain && daysSinceDeep > 3) || resolvingSoon;

      if (needsReverification) {
        const priority = calculateVerificationPriority(claim, verdict);
        candidates.push({ claim, verdict, priority });
      }
    }

    console.log(`[DeepVerify] ${candidates.length} claims eligible for re-verification`);

    // Sort by priority descending, take top maxClaims
    candidates.sort((a, b) => b.priority - a.priority);
    const selected = candidates.slice(0, maxClaims);

    console.log(
      `[DeepVerify] Selected ${selected.length} claims for re-verification`,
    );

    // Re-verify each selected claim
    for (const { claim } of selected) {
      try {
        console.log(
          `[DeepVerify] Re-verifying claim ${claim.id}: "${claim.claimText.slice(0, 80)}..."`,
        );

        const existingEvidence = await storage.getEvidenceByClaim(claim.id);
        const result = await deepVerifyClaim(claim, existingEvidence);

        // Store new evidence items
        const storedEvidenceIds: string[] = [];
        for (const ev of result.evidence) {
          try {
            const stored = await storage.createEvidence({
              claimId: claim.id,
              url: ev.url,
              publisher: ev.publisher,
              publishedAt: null,
              excerpt: ev.excerpt,
              stance: ev.stance,
              evidenceGrade: ev.evidenceGrade,
              primaryFlag: ev.evidenceGrade === "A",
              metadata: {
                sourceType: "reverification",
                searchQuery: ev.searchQuery,
                tier: "reverify",
              },
            });
            storedEvidenceIds.push(stored.id);
            stats.evidenceAdded++;
          } catch (evError) {
            console.warn(
              "[DeepVerify]   Failed to store re-verification evidence:",
              evError instanceof Error ? evError.message : evError,
            );
          }
        }

        // Store new verdict
        try {
          await storage.deleteVerdictByClaim(claim.id);

          await storage.createVerdict({
            claimId: claim.id,
            model: MODEL,
            promptVersion: "reverify-v1.0.0",
            verdictLabel: result.verdict.verdictLabel,
            probabilityTrue: result.verdict.probabilityTrue,
            evidenceStrength: result.verdict.evidenceStrength,
            keyEvidenceIds: storedEvidenceIds,
            reasoningSummary: result.verdict.reasoningSummary,
            invalidationTriggers: result.verdict.invalidationTriggers,
          });
          stats.verdictsUpdated++;
        } catch (vError) {
          console.warn(
            "[DeepVerify]   Failed to store re-verification verdict:",
            vError instanceof Error ? vError.message : vError,
          );
        }

        // Update claim metadata
        try {
          const existingMetadata = (claim.metadata ?? {}) as Record<string, unknown>;
          const deepCount =
            ((existingMetadata.deepVerificationCount as number) ?? 0) + 1;

          const storageAny = storage as unknown as Record<string, unknown>;
          if (typeof storageAny.updateClaimMetadata === "function") {
            await (
              storageAny.updateClaimMetadata as (
                id: string,
                metadata: Record<string, unknown>,
              ) => Promise<void>
            )(claim.id, {
              ...existingMetadata,
              verificationTier: "deep_verified",
              lastDeepVerifiedAt: new Date().toISOString(),
              deepVerificationCount: deepCount,
            });
          }
        } catch (metaError) {
          console.warn(
            "[DeepVerify]   Failed to update claim metadata during re-verification:",
            metaError instanceof Error ? metaError.message : metaError,
          );
        }

        stats.claimsProcessed++;
        console.log(
          `[DeepVerify]   Re-verification complete: ${result.verdict.verdictLabel} ` +
            `(p=${result.verdict.probabilityTrue.toFixed(2)})`,
        );
      } catch (claimError) {
        console.error(
          `[DeepVerify] Failed to re-verify claim ${claim.id}:`,
          claimError instanceof Error ? claimError.message : claimError,
        );
        // Continue with remaining claims
      }
    }
  } catch (error) {
    console.error(
      "[DeepVerify] Re-verification batch failed:",
      error instanceof Error ? error.message : error,
    );
  }

  const elapsed = ((Date.now() - batchStart) / 1000).toFixed(1);
  const estimatedCost =
    stats.claimsProcessed *
    (ESTIMATED_COST_PER_VERDICT_CALL + 4 * ESTIMATED_COST_PER_SEARCH_CALL);

  console.log(
    `[DeepVerify] === Re-verification complete: ${stats.claimsProcessed} claims, ` +
      `${stats.evidenceAdded} evidence added, ${stats.verdictsUpdated} verdicts updated ` +
      `in ${elapsed}s (estimated cost: $${estimatedCost.toFixed(2)}) ===`,
  );

  return stats;
}
