/**
 * Claim Extractor Agent
 * Extracts atomic, falsifiable claims from ingested content
 * Uses LLM to parse and classify claims
 */

import type { Item, ExtractedClaim, ClaimExtractionResult, ClaimType } from '../models/types';

const PROMPT_VERSION = 'v1.0.0';

// System prompt for claim extraction
const SYSTEM_PROMPT = `You are a specialized claim extraction agent for crypto news analysis. Your task is to extract atomic, falsifiable claims from news content.

RULES:
1. Claims must be ATOMIC - one testable assertion per claim
2. Claims must be FALSIFIABLE - can be proven true or false
3. Claims should be SPECIFIC - include dates, amounts, entities when available
4. Separate FACTS from PREDICTIONS - use appropriate claim_type
5. Assign falsifiability_score based on specificity (1.0 = very specific & time-bounded, 0.2 = vague)
6. Estimate llm_confidence as probability claim is true based on evidence in the item

CLAIM TYPES:
- filing_submitted, filing_approved_or_denied, regulatory_action
- listing_announced, listing_live, delisting_announced, trading_halt
- mainnet_launch, testnet_launch, upgrade_released, exploit_or_hack, audit_result
- partnership_announced, investment_or_acquisition
- large_transfer_or_whale, mint_or_burn, wallet_attribution
- price_prediction, timeline_prediction
- rumor, misc_claim

OUTPUT FORMAT (strict JSON):
{
  "claims": [
    {
      "claim_text": "string - the atomic claim",
      "claim_type": "one of the types above",
      "asset_symbols": ["BTC", "ETH"],
      "asserted_at": "ISO timestamp",
      "resolution_type": "immediate | scheduled | indefinite",
      "resolve_by": "ISO timestamp or null",
      "falsifiability_score": 0.0-1.0,
      "llm_confidence": 0.0-1.0,
      "notes": "optional reasoning"
    }
  ]
}

IMPORTANT: Output ONLY valid JSON. No markdown, no explanations.`;

// Build user prompt with item content
function buildUserPrompt(item: Item): string {
  return `ITEM TO ANALYZE:
- Title: ${item.title || 'Untitled'}
- Published: ${item.publishedAt?.toISOString() || 'Unknown'}
- Source: ${item.sourceId}
- Type: ${item.itemType}

CONTENT:
${item.rawText}

---
Extract all atomic, falsifiable claims from this content. Output JSON only.`;
}

// Parse LLM response into structured claims
function parseExtractionResponse(response: string): ExtractedClaim[] {
  try {
    // Clean response - remove markdown code blocks if present
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

    if (!parsed.claims || !Array.isArray(parsed.claims)) {
      console.error('Invalid extraction response structure');
      return [];
    }

    return parsed.claims.map((c: any) => ({
      claimText: c.claim_text || c.claimText,
      claimType: validateClaimType(c.claim_type || c.claimType),
      assetSymbols: c.asset_symbols || c.assetSymbols || [],
      assertedAt: c.asserted_at || c.assertedAt,
      resolutionType: c.resolution_type || c.resolutionType || 'indefinite',
      resolveBy: c.resolve_by || c.resolveBy || null,
      falsifiabilityScore: clamp(parseFloat(c.falsifiability_score || c.falsifiabilityScore) || 0.5, 0, 1),
      llmConfidence: clamp(parseFloat(c.llm_confidence || c.llmConfidence) || 0.5, 0, 1),
      notes: c.notes || undefined,
    }));
  } catch (error) {
    console.error('Failed to parse extraction response:', error);
    return [];
  }
}

// Validate claim type
function validateClaimType(type: string): ClaimType {
  const validTypes: ClaimType[] = [
    'filing_submitted', 'filing_approved_or_denied', 'regulatory_action',
    'listing_announced', 'listing_live', 'delisting_announced', 'trading_halt',
    'mainnet_launch', 'testnet_launch', 'upgrade_released', 'exploit_or_hack', 'audit_result',
    'partnership_announced', 'investment_or_acquisition',
    'large_transfer_or_whale', 'mint_or_burn', 'wallet_attribution',
    'price_prediction', 'timeline_prediction',
    'rumor', 'misc_claim'
  ];

  return validTypes.includes(type as ClaimType) ? type as ClaimType : 'misc_claim';
}

// Clamp value between min and max
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Main extraction function
 * In production, this would call the LLM API
 * For demo, we simulate the extraction
 */
export async function extractClaims(
  item: Item,
  llmProvider?: {
    complete: (system: string, user: string) => Promise<string>;
  }
): Promise<ClaimExtractionResult> {
  const userPrompt = buildUserPrompt(item);

  let response: string;

  if (llmProvider) {
    // Production: Use real LLM
    response = await llmProvider.complete(SYSTEM_PROMPT, userPrompt);
  } else {
    // Demo: Simulate extraction
    response = simulateExtraction(item);
  }

  const claims = parseExtractionResponse(response);

  return {
    claims,
    itemId: item.id,
    model: 'gpt-4o',
    promptVersion: PROMPT_VERSION,
  };
}

/**
 * Simulate extraction for demo purposes
 * Generates realistic claims based on item content
 */
function simulateExtraction(item: Item): string {
  const text = (item.rawText + ' ' + (item.title || '')).toLowerCase();
  const claims: ExtractedClaim[] = [];
  const now = new Date().toISOString();

  // Detect ETF-related claims
  if (text.includes('etf') && (text.includes('approved') || text.includes('approval'))) {
    claims.push({
      claimText: 'SEC has approved a spot Ethereum ETF application',
      claimType: 'filing_approved_or_denied',
      assetSymbols: ['ETH'],
      assertedAt: now,
      resolutionType: 'immediate',
      falsifiabilityScore: 0.95,
      llmConfidence: 0.7,
    });
  }

  // Detect listing claims
  if (text.includes('list') && (text.includes('exchange') || text.includes('coinbase') || text.includes('binance'))) {
    claims.push({
      claimText: 'A major exchange will list a new cryptocurrency token',
      claimType: 'listing_announced',
      assetSymbols: [],
      assertedAt: now,
      resolutionType: 'scheduled',
      resolveBy: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      falsifiabilityScore: 0.8,
      llmConfidence: 0.6,
    });
  }

  // Detect hack/exploit claims
  if (text.includes('hack') || text.includes('exploit') || text.includes('stolen') || text.includes('drained')) {
    claims.push({
      claimText: 'A DeFi protocol has suffered a security exploit resulting in fund losses',
      claimType: 'exploit_or_hack',
      assetSymbols: [],
      assertedAt: now,
      resolutionType: 'immediate',
      falsifiabilityScore: 0.9,
      llmConfidence: 0.75,
    });
  }

  // Detect price predictions
  if (text.includes('will reach') || text.includes('price target') || text.includes('to $')) {
    claims.push({
      claimText: 'Bitcoin will reach a new all-time high price',
      claimType: 'price_prediction',
      assetSymbols: ['BTC'],
      assertedAt: now,
      resolutionType: 'indefinite',
      falsifiabilityScore: 0.3,
      llmConfidence: 0.4,
    });
  }

  // Detect regulatory claims
  if (text.includes('sec') || text.includes('cftc') || text.includes('regulation') || text.includes('lawsuit')) {
    claims.push({
      claimText: 'US regulatory agency is taking enforcement action against a crypto entity',
      claimType: 'regulatory_action',
      assetSymbols: [],
      assertedAt: now,
      resolutionType: 'scheduled',
      falsifiabilityScore: 0.85,
      llmConfidence: 0.65,
    });
  }

  // Detect partnership claims
  if (text.includes('partner') || text.includes('collaboration') || text.includes('integration')) {
    claims.push({
      claimText: 'A crypto project has announced a new partnership or integration',
      claimType: 'partnership_announced',
      assetSymbols: [],
      assertedAt: now,
      resolutionType: 'immediate',
      falsifiabilityScore: 0.75,
      llmConfidence: 0.7,
    });
  }

  // Detect launch claims
  if (text.includes('mainnet') || text.includes('launch') || text.includes('release')) {
    claims.push({
      claimText: 'A blockchain project is launching mainnet or major upgrade',
      claimType: 'mainnet_launch',
      assetSymbols: [],
      assertedAt: now,
      resolutionType: 'scheduled',
      falsifiabilityScore: 0.85,
      llmConfidence: 0.75,
    });
  }

  // Detect whale/transfer claims
  if (text.includes('whale') || text.includes('large transfer') || text.includes('moved') && text.includes('million')) {
    claims.push({
      claimText: 'A large cryptocurrency transfer has been detected on-chain',
      claimType: 'large_transfer_or_whale',
      assetSymbols: [],
      assertedAt: now,
      resolutionType: 'immediate',
      falsifiabilityScore: 0.95,
      llmConfidence: 0.9,
    });
  }

  // Default: treat as rumor if no specific patterns matched
  if (claims.length === 0) {
    claims.push({
      claimText: `Unverified claim from ${item.title || 'untitled source'}`,
      claimType: 'rumor',
      assetSymbols: [],
      assertedAt: now,
      resolutionType: 'indefinite',
      falsifiabilityScore: 0.4,
      llmConfidence: 0.3,
    });
  }

  return JSON.stringify({ claims });
}

export { SYSTEM_PROMPT, PROMPT_VERSION };
