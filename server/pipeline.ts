/**
 * Confirmd Verification Pipeline
 * Automated RSS ingestion -> claim extraction -> evidence gathering ->
 * verdict generation -> story grouping
 *
 * Operates in two modes:
 * - Full mode: Uses Anthropic Claude for extraction and verdicts (ANTHROPIC_API_KEY set)
 * - Simulation mode: Deterministic pattern matching and heuristics (no API key)
 */

import Parser from "rss-parser";
import Anthropic from "@anthropic-ai/sdk";
import type {
  Source,
  InsertSource,
  Item,
  InsertItem,
  InsertClaim,
  InsertEvidence,
  InsertVerdict,
  InsertStory,
  Claim,
  EvidenceItem,
  Verdict,
  Story,
} from "../shared/schema.js";
import { storage } from "./storage.js";

// ============================================
// CONFIGURATION
// ============================================

const RSS_FEEDS: { name: string; url: string; domain: string }[] = [
  {
    name: "CoinDesk",
    url: "https://www.coindesk.com/arc/outboundfeeds/rss/",
    domain: "coindesk.com",
  },
  {
    name: "The Block",
    url: "https://www.theblock.co/rss/all",
    domain: "theblock.co",
  },
  {
    name: "Decrypt",
    url: "https://decrypt.co/feed",
    domain: "decrypt.co",
  },
  {
    name: "CoinTelegraph",
    url: "https://cointelegraph.com/rss",
    domain: "cointelegraph.com",
  },
  {
    name: "Bitcoin Magazine",
    url: "https://bitcoinmagazine.com/feed",
    domain: "bitcoinmagazine.com",
  },
  {
    name: "CryptoSlate",
    url: "https://cryptoslate.com/feed/",
    domain: "cryptoslate.com",
  },
  {
    name: "The Defiant",
    url: "https://thedefiant.io/feed",
    domain: "thedefiant.io",
  },
  {
    name: "Blockworks",
    url: "https://blockworks.co/feed",
    domain: "blockworks.co",
  },
  {
    name: "DL News",
    url: "https://www.dlnews.com/rss/",
    domain: "dlnews.com",
  },
  {
    name: "Unchained",
    url: "https://unchainedcrypto.com/feed/",
    domain: "unchainedcrypto.com",
  },
];

const MAX_ARTICLES_PER_BATCH = 30;
const DEFAULT_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours
const WEB_SEARCH_ENABLED = process.env.WEB_SEARCH_ENABLED !== "false"; // default true
const WEB_SEARCH_MAX_RESULTS = 5;

const CLAIM_EXTRACTION_SYSTEM_PROMPT = `You are a specialized claim extraction agent for crypto news analysis. Your task is to extract atomic, falsifiable claims from news content.

RULES:
1. Claims must be ATOMIC - one testable assertion per claim
2. Claims must be FALSIFIABLE - can be proven true or false
3. Claims should be SPECIFIC - include dates, amounts, entities when available
4. Claims should be TIME-BOUNDED - include deadlines or expected timeframes
5. Separate FACTS from PREDICTIONS - use appropriate claim_type
6. Assign falsifiability_score based on specificity (1.0 = very specific & time-bounded, 0.2 = vague)
7. Estimate llm_confidence as probability claim is true based on evidence in the article

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
      "resolution_type": "immediate | scheduled | indefinite",
      "resolve_by": "ISO timestamp or null",
      "falsifiability_score": 0.0-1.0,
      "llm_confidence": 0.0-1.0
    }
  ]
}

IMPORTANT: Output ONLY valid JSON. No markdown, no explanations.`;

const VERDICT_SYSTEM_PROMPT = `You are a due diligence analyst specializing in crypto news verification. Assess the claim using the provided evidence.

EVIDENCE GRADES:
- A: Primary/authoritative (official filings, on-chain data, project announcements)
- B: Strong secondary (Bloomberg, Reuters, The Block quoting primary)
- C: Weak secondary (aggregators, unsourced articles)
- D: Speculative (influencer posts, anonymous tips, rumors)

VERDICT LABELS:
- verified: Grade A/B evidence directly confirms the claim
- plausible_unverified: Credible hints but no primary evidence
- speculative: Mostly grade C/D evidence; unsubstantiated
- misleading: Contradicted by strong evidence or demonstrably false

OUTPUT FORMAT (strict JSON):
{
  "verdict_label": "verified | plausible_unverified | speculative | misleading",
  "probability_true": 0.0-1.0,
  "evidence_strength": 0.0-1.0,
  "reasoning_summary": "80-120 word explanation",
  "invalidation_triggers": "What would flip this verdict"
}

Be conservative. Only use "verified" when A/B grade evidence directly confirms. Output ONLY valid JSON.`;

// ============================================
// ANTHROPIC CLIENT
// ============================================

const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null;

// ============================================
// TYPES
// ============================================

type ClaimType =
  | "filing_submitted"
  | "filing_approved_or_denied"
  | "regulatory_action"
  | "listing_announced"
  | "listing_live"
  | "delisting_announced"
  | "trading_halt"
  | "mainnet_launch"
  | "testnet_launch"
  | "upgrade_released"
  | "exploit_or_hack"
  | "audit_result"
  | "partnership_announced"
  | "investment_or_acquisition"
  | "large_transfer_or_whale"
  | "mint_or_burn"
  | "wallet_attribution"
  | "price_prediction"
  | "timeline_prediction"
  | "rumor"
  | "misc_claim";

type VerdictLabel =
  | "verified"
  | "plausible_unverified"
  | "speculative"
  | "misleading";

type EvidenceGrade = "A" | "B" | "C" | "D";

type EvidenceStance = "supports" | "contradicts" | "mentions" | "irrelevant";

interface ExtractedClaim {
  claimText: string;
  claimType: ClaimType;
  assetSymbols: string[];
  resolutionType: "immediate" | "scheduled" | "indefinite";
  resolveBy: string | null;
  falsifiabilityScore: number;
  llmConfidence: number;
}

interface GatheredEvidence {
  url: string;
  publisher: string;
  excerpt: string;
  grade: EvidenceGrade;
  stance: EvidenceStance;
  primaryFlag: boolean;
  publishedAt: Date | null;
  metadata: Record<string, unknown>;
}

interface VerdictResult {
  verdictLabel: VerdictLabel;
  probabilityTrue: number;
  evidenceStrength: number;
  reasoningSummary: string;
  invalidationTriggers: string;
}

interface ParsedArticle {
  title: string;
  content: string;
  link: string;
  publishedAt: Date | null;
  feedName: string;
  feedDomain: string;
}

interface PipelineStatus {
  lastRunAt: Date | null;
  articlesProcessed: number;
  claimsExtracted: number;
  isRunning: boolean;
}

// ============================================
// HELPERS
// ============================================

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

const VALID_CLAIM_TYPES: ClaimType[] = [
  "filing_submitted",
  "filing_approved_or_denied",
  "regulatory_action",
  "listing_announced",
  "listing_live",
  "delisting_announced",
  "trading_halt",
  "mainnet_launch",
  "testnet_launch",
  "upgrade_released",
  "exploit_or_hack",
  "audit_result",
  "partnership_announced",
  "investment_or_acquisition",
  "large_transfer_or_whale",
  "mint_or_burn",
  "wallet_attribution",
  "price_prediction",
  "timeline_prediction",
  "rumor",
  "misc_claim",
];

function validateClaimType(type: string): ClaimType {
  return VALID_CLAIM_TYPES.includes(type as ClaimType)
    ? (type as ClaimType)
    : "misc_claim";
}

function validateVerdictLabel(label: string): VerdictLabel {
  const valid: VerdictLabel[] = [
    "verified",
    "plausible_unverified",
    "speculative",
    "misleading",
  ];
  return valid.includes(label as VerdictLabel)
    ? (label as VerdictLabel)
    : "speculative";
}

/** Simple content hash from URL for dedup. */
function hashContent(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
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
 * Strip HTML tags and decode entities from RSS content.
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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

/** Significant words for grouping (excludes common stop words). */
const STOP_WORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "but",
  "in",
  "on",
  "at",
  "to",
  "for",
  "of",
  "with",
  "by",
  "from",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "has",
  "have",
  "had",
  "do",
  "does",
  "did",
  "will",
  "would",
  "could",
  "should",
  "may",
  "might",
  "can",
  "shall",
  "it",
  "its",
  "this",
  "that",
  "these",
  "those",
  "not",
  "no",
  "nor",
  "as",
  "if",
  "than",
  "too",
  "very",
  "so",
  "up",
  "out",
  "about",
  "into",
  "over",
  "after",
  "new",
  "says",
  "said",
  "crypto",
  "cryptocurrency",
  "blockchain",
  "report",
  "reports",
  "according",
]);

function getSignificantWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

// ============================================
// RSS FEED INGESTION
// ============================================

const rssParser = new Parser({
  timeout: 15000,
  headers: {
    "User-Agent": "Confirmd/1.0 RSS Verification Pipeline",
  },
});

/**
 * Fetch and parse a single RSS feed. Returns parsed articles.
 * Gracefully handles errors by returning an empty array on failure.
 */
async function fetchFeed(feed: {
  name: string;
  url: string;
  domain: string;
}): Promise<ParsedArticle[]> {
  try {
    console.log(`[Pipeline] Fetching RSS feed: ${feed.name}`);
    const result = await rssParser.parseURL(feed.url);
    const articles: ParsedArticle[] = [];

    for (const entry of result.items || []) {
      if (!entry.link) continue;

      const content = stripHtml(
        entry.contentSnippet ||
          entry["content:encoded"] ||
          entry.content ||
          entry.summary ||
          entry.title ||
          "",
      );

      const title = stripHtml(entry.title || "Untitled");

      let publishedAt: Date | null = null;
      if (entry.pubDate || entry.isoDate) {
        const parsed = new Date(entry.pubDate || entry.isoDate || "");
        if (!isNaN(parsed.getTime())) {
          publishedAt = parsed;
        }
      }

      articles.push({
        title,
        content: content.slice(0, 5000), // limit content length
        link: entry.link,
        publishedAt,
        feedName: feed.name,
        feedDomain: feed.domain,
      });
    }

    console.log(
      `[Pipeline] Fetched ${articles.length} articles from ${feed.name}`,
    );
    return articles;
  } catch (error) {
    console.error(
      `[Pipeline] Failed to fetch feed ${feed.name}:`,
      error instanceof Error ? error.message : error,
    );
    return [];
  }
}

/**
 * Fetch all configured RSS feeds and return deduplicated articles.
 */
async function fetchAllFeeds(): Promise<ParsedArticle[]> {
  const feedResults = await Promise.allSettled(
    RSS_FEEDS.map((feed) => fetchFeed(feed)),
  );

  const allArticles: ParsedArticle[] = [];
  for (const result of feedResults) {
    if (result.status === "fulfilled") {
      allArticles.push(...result.value);
    }
  }

  // Deduplicate by link URL
  const seen = new Set<string>();
  const unique = allArticles.filter((a) => {
    if (seen.has(a.link)) return false;
    seen.add(a.link);
    return true;
  });

  console.log(
    `[Pipeline] Total unique articles from all feeds: ${unique.length}`,
  );
  return unique;
}

// ============================================
// CLAIM EXTRACTION
// ============================================

/**
 * Extract claims from an article using Anthropic Claude.
 */
async function extractClaimsWithLLM(
  article: ParsedArticle,
): Promise<ExtractedClaim[]> {
  if (!anthropic) return extractClaimsSimulated(article);

  try {
    const userPrompt = `ARTICLE TO ANALYZE:
- Title: ${article.title}
- Source: ${article.feedName} (${article.feedDomain})
- Published: ${article.publishedAt?.toISOString() || "Unknown"}

CONTENT:
${article.content}

---
Extract all atomic, falsifiable claims from this article. Output JSON only.`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 4096,
      temperature: 0.2,
      system: CLAIM_EXTRACTION_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const content = response.content[0].type === 'text' ? response.content[0].text : '';
    if (!content) {
      console.warn("[Pipeline] Empty LLM response for claim extraction");
      return extractClaimsSimulated(article);
    }

    return parseClaimExtractionResponse(content);
  } catch (error) {
    console.error(
      "[Pipeline] LLM claim extraction failed, falling back to simulation:",
      error instanceof Error ? error.message : error,
    );
    return extractClaimsSimulated(article);
  }
}

/**
 * Parse the LLM claim extraction response JSON.
 */
function parseClaimExtractionResponse(response: string): ExtractedClaim[] {
  try {
    const cleaned = cleanJsonResponse(response);
    const parsed = JSON.parse(cleaned);

    if (!parsed.claims || !Array.isArray(parsed.claims)) {
      console.error("[Pipeline] Invalid claim extraction response structure");
      return [];
    }

    return parsed.claims.map((c: Record<string, unknown>) => ({
      claimText: (c.claim_text || c.claimText || "") as string,
      claimType: validateClaimType(
        ((c.claim_type || c.claimType || "misc_claim") as string),
      ),
      assetSymbols: (c.asset_symbols || c.assetSymbols || []) as string[],
      resolutionType: (c.resolution_type ||
        c.resolutionType ||
        "indefinite") as "immediate" | "scheduled" | "indefinite",
      resolveBy: (c.resolve_by || c.resolveBy || null) as string | null,
      falsifiabilityScore: clamp(
        parseFloat(String(c.falsifiability_score || c.falsifiabilityScore)) ||
          0.5,
        0,
        1,
      ),
      llmConfidence: clamp(
        parseFloat(String(c.llm_confidence || c.llmConfidence)) || 0.5,
        0,
        1,
      ),
    }));
  } catch (error) {
    console.error("[Pipeline] Failed to parse claim extraction JSON:", error);
    return [];
  }
}

/**
 * Simulate claim extraction using pattern matching (no LLM required).
 * Detects common crypto claim types from headline and content keywords.
 */
function extractClaimsSimulated(article: ParsedArticle): ExtractedClaim[] {
  const text = `${article.title} ${article.content}`.toLowerCase();
  const claims: ExtractedClaim[] = [];

  // ETF-related claims
  if (text.includes("etf") && (text.includes("approv") || text.includes("fil") || text.includes("sec"))) {
    const symbols: string[] = [];
    if (text.includes("bitcoin") || text.includes("btc")) symbols.push("BTC");
    if (text.includes("ethereum") || text.includes("eth")) symbols.push("ETH");
    if (text.includes("solana") || text.includes("sol")) symbols.push("SOL");

    claims.push({
      claimText: `ETF-related regulatory development reported: ${article.title}`,
      claimType: text.includes("approv")
        ? "filing_approved_or_denied"
        : "filing_submitted",
      assetSymbols: symbols.length > 0 ? symbols : ["BTC"],
      resolutionType: "scheduled",
      resolveBy: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      falsifiabilityScore: 0.9,
      llmConfidence: 0.65,
    });
  }

  // Hack / exploit claims
  if (
    text.includes("hack") ||
    text.includes("exploit") ||
    text.includes("stolen") ||
    text.includes("drained") ||
    text.includes("breach")
  ) {
    claims.push({
      claimText: `Security incident reported: ${article.title}`,
      claimType: "exploit_or_hack",
      assetSymbols: extractAssetSymbols(text),
      resolutionType: "immediate",
      resolveBy: null,
      falsifiabilityScore: 0.9,
      llmConfidence: 0.7,
    });
  }

  // Listing claims
  if (
    text.includes("list") &&
    (text.includes("exchange") ||
      text.includes("coinbase") ||
      text.includes("binance") ||
      text.includes("kraken"))
  ) {
    claims.push({
      claimText: `Exchange listing reported: ${article.title}`,
      claimType: "listing_announced",
      assetSymbols: extractAssetSymbols(text),
      resolutionType: "scheduled",
      resolveBy: new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      falsifiabilityScore: 0.8,
      llmConfidence: 0.6,
    });
  }

  // Regulatory claims
  if (
    text.includes("sec ") ||
    text.includes("cftc") ||
    text.includes("regulation") ||
    text.includes("lawsuit") ||
    text.includes("enforcement")
  ) {
    // Avoid double-counting if already captured as ETF
    if (!claims.some((c) => c.claimType === "filing_approved_or_denied" || c.claimType === "filing_submitted")) {
      claims.push({
        claimText: `Regulatory development reported: ${article.title}`,
        claimType: "regulatory_action",
        assetSymbols: extractAssetSymbols(text),
        resolutionType: "scheduled",
        resolveBy: new Date(
          Date.now() + 14 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        falsifiabilityScore: 0.85,
        llmConfidence: 0.6,
      });
    }
  }

  // Partnership claims
  if (
    text.includes("partner") ||
    text.includes("collaborat") ||
    text.includes("integrat")
  ) {
    claims.push({
      claimText: `Partnership or integration reported: ${article.title}`,
      claimType: "partnership_announced",
      assetSymbols: extractAssetSymbols(text),
      resolutionType: "immediate",
      resolveBy: null,
      falsifiabilityScore: 0.75,
      llmConfidence: 0.65,
    });
  }

  // Price prediction claims
  if (
    text.includes("price target") ||
    text.includes("will reach") ||
    text.includes("could hit") ||
    text.includes("to $")
  ) {
    claims.push({
      claimText: `Price prediction reported: ${article.title}`,
      claimType: "price_prediction",
      assetSymbols: extractAssetSymbols(text),
      resolutionType: "indefinite",
      resolveBy: null,
      falsifiabilityScore: 0.3,
      llmConfidence: 0.35,
    });
  }

  // Launch / upgrade claims
  if (
    text.includes("mainnet") ||
    text.includes("launch") ||
    text.includes("upgrade") ||
    text.includes("hard fork")
  ) {
    claims.push({
      claimText: `Protocol launch or upgrade reported: ${article.title}`,
      claimType: "mainnet_launch",
      assetSymbols: extractAssetSymbols(text),
      resolutionType: "scheduled",
      resolveBy: new Date(
        Date.now() + 14 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      falsifiabilityScore: 0.85,
      llmConfidence: 0.7,
    });
  }

  // Default: treat as a general rumor/misc claim
  if (claims.length === 0) {
    claims.push({
      claimText: `Unverified claim: ${article.title}`,
      claimType: "rumor",
      assetSymbols: extractAssetSymbols(text),
      resolutionType: "indefinite",
      resolveBy: null,
      falsifiabilityScore: 0.4,
      llmConfidence: 0.3,
    });
  }

  return claims;
}

/**
 * Extract common crypto asset symbols from text.
 */
function extractAssetSymbols(text: string): string[] {
  const symbolPatterns: [RegExp, string][] = [
    [/\bbitcoin\b|\bbtc\b/i, "BTC"],
    [/\bethereum\b|\beth\b/i, "ETH"],
    [/\bsolana\b|\bsol\b/i, "SOL"],
    [/\bcardano\b|\bada\b/i, "ADA"],
    [/\bpolkadot\b|\bdot\b/i, "DOT"],
    [/\bavalanche\b|\bavax\b/i, "AVAX"],
    [/\bchainlink\b|\blink\b/i, "LINK"],
    [/\bpolygon\b|\bmatic\b/i, "MATIC"],
    [/\bripple\b|\bxrp\b/i, "XRP"],
    [/\bdogecoin\b|\bdoge\b/i, "DOGE"],
    [/\blitecoin\b|\bltc\b/i, "LTC"],
    [/\buniswap\b|\buni\b/i, "UNI"],
    [/\baave\b/i, "AAVE"],
    [/\bbnb\b/i, "BNB"],
  ];

  const found: string[] = [];
  for (const [pattern, symbol] of symbolPatterns) {
    if (pattern.test(text) && !found.includes(symbol)) {
      found.push(symbol);
    }
  }

  return found;
}

// ============================================
// WEB SEARCH
// ============================================

interface WebSearchResult {
  url: string;
  title: string;
  snippet: string;
}

/**
 * Search the web using Anthropic's web search tool, with DuckDuckGo fallback.
 */
async function searchWeb(query: string, maxResults: number = WEB_SEARCH_MAX_RESULTS): Promise<WebSearchResult[]> {
  if (!WEB_SEARCH_ENABLED) {
    return [];
  }

  if (!anthropic) {
    return searchWebDuckDuckGo(query, maxResults);
  }

  try {
    console.log(`[Pipeline] Searching web (Anthropic) for: ${query}`);

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 2048,
      tools: [{
        type: "web_search_20250305" as any,
        name: "web_search",
        max_uses: maxResults,
      }],
      messages: [{
        role: "user",
        content: `Search the web for recent news and evidence about: ${query}\n\nReturn factual search results only.`,
      }],
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

    console.log(`[Pipeline] Found ${results.length} web results (Anthropic)`);
    return results.slice(0, maxResults);
  } catch (err) {
    console.warn(`[Pipeline] Anthropic web search failed for "${query}":`, (err as Error).message);
    return [];
  }
}

/**
 * Fallback: Search DuckDuckGo's HTML endpoint for web results.
 * Used when Anthropic API key is not configured.
 */
async function searchWebDuckDuckGo(query: string, maxResults: number = WEB_SEARCH_MAX_RESULTS): Promise<WebSearchResult[]> {
  try {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://html.duckduckgo.com/html/?q=${encodedQuery}`;
    console.log(`[Pipeline] Searching web (DuckDuckGo) for: ${query}`);

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Confirmd/1.0 Verification Pipeline",
        "Accept": "text/html",
      },
    });

    if (!response.ok) {
      console.warn(`[Pipeline] Web search returned status ${response.status}`);
      return [];
    }

    const html = await response.text();
    const results: WebSearchResult[] = [];

    const resultLinkRegex = /<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
    const snippetRegex = /<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;

    const links: { href: string; title: string }[] = [];
    let linkMatch: RegExpExecArray | null;
    while ((linkMatch = resultLinkRegex.exec(html)) !== null) {
      links.push({
        href: linkMatch[1],
        title: stripHtml(linkMatch[2]),
      });
    }

    const snippets: string[] = [];
    let snippetMatch: RegExpExecArray | null;
    while ((snippetMatch = snippetRegex.exec(html)) !== null) {
      snippets.push(stripHtml(snippetMatch[1]));
    }

    for (let i = 0; i < Math.min(links.length, maxResults); i++) {
      const link = links[i];
      const snippet = snippets[i] || "";

      let realUrl = link.href;
      const uddgMatch = link.href.match(/[?&]uddg=([^&]+)/);
      if (uddgMatch) {
        try {
          realUrl = decodeURIComponent(uddgMatch[1]);
        } catch {
          realUrl = uddgMatch[1];
        }
      }

      if (!realUrl || realUrl.length < 10) continue;

      if (!realUrl.startsWith("http")) {
        if (realUrl.startsWith("//")) {
          realUrl = "https:" + realUrl;
        } else {
          continue;
        }
      }

      results.push({
        url: realUrl,
        title: link.title,
        snippet,
      });
    }

    console.log(`[Pipeline] Found ${results.length} web results (DuckDuckGo)`);
    return results;
  } catch (error) {
    console.error(
      "[Pipeline] DuckDuckGo web search failed:",
      error instanceof Error ? error.message : error,
    );
    return [];
  }
}

/**
 * Small delay helper to avoid rate limiting between web searches.
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================
// STORY IMAGE MAPPING
// ============================================

/**
 * Generate a unique AI-generated image URL for a story via Pollinations.ai.
 * Each story gets a truly unique image based on its title and category.
 */
function getStoryImageUrl(title: string, category: string): string {
  // Build a descriptive prompt for AI image generation
  const cleanTitle = title.replace(/[^a-zA-Z0-9 ]/g, '').slice(0, 80);
  const prompt = `professional editorial news photograph about ${cleanTitle}, ${category}, photojournalism style, high quality, detailed`;
  const encoded = encodeURIComponent(prompt);
  return `https://image.pollinations.ai/prompt/${encoded}?width=1200&height=675&nologo=true`;
}

// ============================================
// EVIDENCE GATHERING
// ============================================

/**
 * Gather evidence for a claim from the source article, web search results,
 * and optionally via AI analysis.
 */
async function gatherEvidence(
  claim: ExtractedClaim,
  article: ParsedArticle,
): Promise<GatheredEvidence[]> {
  const evidence: GatheredEvidence[] = [];

  // Evidence item 1: The source article itself (Grade C - weak secondary)
  const articleGrade = gradeByDomain(article.link);
  evidence.push({
    url: article.link,
    publisher: article.feedName,
    excerpt: article.content.slice(0, 500),
    grade: articleGrade,
    stance: "supports", // The source article inherently supports claims it contains
    primaryFlag: articleGrade === "A",
    publishedAt: article.publishedAt,
    metadata: {
      sourceType: "rss_article",
      feedDomain: article.feedDomain,
    },
  });

  // Evidence from web search: search for corroborating / contradicting sources
  if (WEB_SEARCH_ENABLED) {
    try {
      // Build a search query from the claim text and asset symbols
      const assetPart = claim.assetSymbols.length > 0
        ? ` ${claim.assetSymbols.join(" ")}`
        : "";
      // Use a trimmed version of the claim text to form a focused query
      const claimQueryText = claim.claimText
        .replace(/^(Unverified claim:|Security incident reported:|ETF-related regulatory development reported:|Regulatory development reported:|Exchange listing reported:|Partnership or integration reported:|Price prediction reported:|Protocol launch or upgrade reported:)\s*/i, "")
        .slice(0, 120);
      const searchQuery = `${claimQueryText}${assetPart} crypto`;

      // Add a small delay to avoid rate limiting
      await delay(500);

      const webResults = await searchWeb(searchQuery);

      for (const result of webResults) {
        // Skip if the result URL is the same as the source article
        const resultDomain = extractDomain(result.url);
        if (result.url === article.link) continue;

        const grade = gradeByDomain(result.url);
        const excerptText = result.snippet || result.title;
        const stance = determineStance(excerptText, claim.claimText);

        evidence.push({
          url: result.url,
          publisher: resultDomain,
          excerpt: excerptText.slice(0, 500),
          grade,
          stance,
          primaryFlag: grade === "A",
          publishedAt: null, // We don't know the publish date from search results
          metadata: {
            sourceType: "web_search",
            searchQuery,
            resultTitle: result.title,
          },
        });
      }
    } catch (error) {
      console.warn(
        "[Pipeline] Web search evidence gathering failed:",
        error instanceof Error ? error.message : error,
      );
    }
  }

  // Evidence from AI analysis (if Anthropic available)
  if (anthropic) {
    try {
      const aiEvidence = await generateAIAnalysis(claim, article);
      if (aiEvidence) {
        evidence.push(aiEvidence);
      }
    } catch (error) {
      console.warn(
        "[Pipeline] AI evidence generation failed:",
        error instanceof Error ? error.message : error,
      );
    }
  }

  return evidence;
}

/**
 * Generate an AI analysis evidence item using Anthropic Claude.
 * This is always Grade D since it is AI-generated, not a primary source.
 */
async function generateAIAnalysis(
  claim: ExtractedClaim,
  article: ParsedArticle,
): Promise<GatheredEvidence | null> {
  if (!anthropic) return null;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 4096,
      temperature: 0.3,
      system: "You are a crypto news analyst. Briefly assess the plausibility of the following claim based on the provided article context. Be concise (2-3 sentences).",
      messages: [
        {
          role: "user",
          content: `Claim: "${claim.claimText}"\n\nArticle: ${article.title}\nContent: ${article.content.slice(0, 2000)}`,
        },
      ],
    });

    const analysis = response.content[0].type === 'text' ? response.content[0].text : '';
    if (!analysis) return null;

    // Determine stance from AI analysis text
    const stance = determineStance(analysis, claim.claimText);

    return {
      url: article.link,
      publisher: "Confirmd AI Analysis",
      excerpt: analysis.slice(0, 500),
      grade: "D", // AI-generated evidence is always Grade D
      stance,
      primaryFlag: false,
      publishedAt: new Date(),
      metadata: {
        aiGenerated: true,
        model: "claude-sonnet-4-5-20250929",
        sourceArticle: article.link,
      },
    };
  } catch (error) {
    console.error(
      "[Pipeline] AI analysis generation failed:",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

// ============================================
// VERDICT GENERATION
// ============================================

/**
 * Generate a verdict for a claim given its evidence.
 */
async function generateVerdict(
  claim: ExtractedClaim,
  evidence: GatheredEvidence[],
): Promise<VerdictResult> {
  if (anthropic) {
    return generateVerdictWithLLM(claim, evidence);
  }
  return generateVerdictSimulated(claim, evidence);
}

/**
 * Generate a verdict using Anthropic Claude.
 */
async function generateVerdictWithLLM(
  claim: ExtractedClaim,
  evidence: GatheredEvidence[],
): Promise<VerdictResult> {
  try {
    const evidenceJson = evidence.map((e) => ({
      url: e.url,
      publisher: e.publisher,
      excerpt: e.excerpt,
      grade: e.grade,
      stance: e.stance,
      ai_generated: e.metadata?.aiGenerated || false,
    }));

    const userPrompt = `CLAIM TO ASSESS:
"${claim.claimText}"

Claim Type: ${claim.claimType}
Assets: ${claim.assetSymbols.join(", ") || "None"}

EVIDENCE (${evidence.length} items):
${JSON.stringify(evidenceJson, null, 2)}

---
Provide your verdict. Output JSON only.`;

    const response = await anthropic!.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 4096,
      temperature: 0.2,
      system: VERDICT_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const content = response.content[0].type === 'text' ? response.content[0].text : '';
    if (!content) {
      console.warn("[Pipeline] Empty LLM response for verdict, falling back");
      return generateVerdictSimulated(claim, evidence);
    }

    return parseVerdictResponse(content);
  } catch (error) {
    console.error(
      "[Pipeline] LLM verdict generation failed, falling back:",
      error instanceof Error ? error.message : error,
    );
    return generateVerdictSimulated(claim, evidence);
  }
}

/**
 * Parse verdict JSON from LLM response.
 */
function parseVerdictResponse(response: string): VerdictResult {
  try {
    const cleaned = cleanJsonResponse(response);
    const parsed = JSON.parse(cleaned);

    return {
      verdictLabel: validateVerdictLabel(
        parsed.verdict_label || parsed.verdictLabel || "speculative",
      ),
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
    console.error("[Pipeline] Failed to parse verdict JSON:", error);
    return {
      verdictLabel: "speculative",
      probabilityTrue: 0.5,
      evidenceStrength: 0.3,
      reasoningSummary: "Unable to parse LLM verdict. Defaulting to speculative.",
      invalidationTriggers:
        "Any primary source confirmation would change this verdict.",
    };
  }
}

/**
 * Generate a deterministic verdict without LLM based on evidence quality.
 */
function generateVerdictSimulated(
  claim: ExtractedClaim,
  evidence: GatheredEvidence[],
): VerdictResult {
  const gradeWeights: Record<EvidenceGrade, number> = {
    A: 4,
    B: 3,
    C: 2,
    D: 1,
  };

  // Calculate evidence quality
  const totalWeight = evidence.reduce((s, e) => s + gradeWeights[e.grade], 0);
  const maxWeight = evidence.length * 4;
  const evidenceQuality = maxWeight > 0 ? totalWeight / maxWeight : 0;

  // Count stances
  const supporting = evidence.filter((e) => e.stance === "supports");
  const contradicting = evidence.filter((e) => e.stance === "contradicts");
  const supportRatio =
    evidence.length > 0 ? supporting.length / evidence.length : 0;
  const contradictRatio =
    evidence.length > 0 ? contradicting.length / evidence.length : 0;

  // Check for primary source support/contradiction
  const hasPrimarySupport = evidence.some(
    (e) => (e.grade === "A" || e.grade === "B") && e.stance === "supports",
  );
  const hasPrimaryContradiction = evidence.some(
    (e) => (e.grade === "A" || e.grade === "B") && e.stance === "contradicts",
  );

  // Determine verdict
  let verdictLabel: VerdictLabel;
  let probabilityTrue: number;
  let evidenceStrength: number;

  if (hasPrimaryContradiction && contradictRatio > 0.3) {
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

  // Build grade distribution string for reasoning
  const gradeDistribution = {
    A: evidence.filter((e) => e.grade === "A").length,
    B: evidence.filter((e) => e.grade === "B").length,
    C: evidence.filter((e) => e.grade === "C").length,
    D: evidence.filter((e) => e.grade === "D").length,
  };

  let reasoning = `Analysis of ${evidence.length} evidence items: `;
  reasoning += `${gradeDistribution.A} primary (A), ${gradeDistribution.B} strong secondary (B), `;
  reasoning += `${gradeDistribution.C} weak secondary (C), ${gradeDistribution.D} speculative (D). `;

  if (verdictLabel === "verified") {
    reasoning +=
      "Primary sources directly confirm this claim with consistent supporting evidence.";
  } else if (verdictLabel === "plausible_unverified") {
    reasoning +=
      "Credible indicators suggest the claim may be accurate, but primary confirmation is lacking.";
  } else if (verdictLabel === "misleading") {
    reasoning +=
      "Strong evidence contradicts this claim. Primary sources refute the assertion.";
  } else {
    reasoning +=
      "Insufficient high-quality evidence. Most sources are speculative or unverified.";
  }

  let invalidation: string;
  if (verdictLabel === "verified") {
    invalidation =
      "Official retraction, contradicting on-chain data, or regulatory denial would downgrade this verdict.";
  } else if (verdictLabel === "plausible_unverified") {
    invalidation =
      "Primary source confirmation would upgrade to verified; official denial would downgrade to speculative.";
  } else if (verdictLabel === "misleading") {
    invalidation =
      "New primary evidence supporting the claim, or retraction of contradicting sources.";
  } else {
    invalidation =
      "Any grade A/B evidence directly confirming or refuting the claim.";
  }

  return {
    verdictLabel,
    probabilityTrue,
    evidenceStrength,
    reasoningSummary: reasoning,
    invalidationTriggers: invalidation,
  };
}

// ============================================
// STORY GROUPING
// ============================================

interface ClaimForGrouping {
  claimId: string;
  claimText: string;
  assetSymbols: string[];
  publishedAt: Date | null;
  title: string;
  itemId: string;
}

/**
 * Group claims into stories based on keyword overlap, asset overlap, and time proximity.
 * Returns arrays of claim IDs that should be grouped together.
 */
function groupClaimsIntoStories(
  claims: ClaimForGrouping[],
): { title: string; claimIds: string[] }[] {
  if (claims.length === 0) return [];

  // Build adjacency: two claims are related if they share 3+ significant words,
  // share asset symbols, AND are within 24 hours of each other.
  const groups: Map<number, Set<number>> = new Map();
  for (let i = 0; i < claims.length; i++) {
    groups.set(i, new Set([i]));
  }

  for (let i = 0; i < claims.length; i++) {
    const wordsI = getSignificantWords(
      `${claims[i].title} ${claims[i].claimText}`,
    );
    const assetsI = new Set(claims[i].assetSymbols);
    const timeI = claims[i].publishedAt?.getTime() ?? Date.now();

    for (let j = i + 1; j < claims.length; j++) {
      const wordsJ = getSignificantWords(
        `${claims[j].title} ${claims[j].claimText}`,
      );
      const assetsJ = new Set(claims[j].assetSymbols);
      const timeJ = claims[j].publishedAt?.getTime() ?? Date.now();

      // Time proximity: within 24 hours
      const timeDiffHours =
        Math.abs(timeI - timeJ) / (1000 * 60 * 60);
      if (timeDiffHours > 72) continue;

      // Shared significant words
      const sharedWords = wordsI.filter((w) => wordsJ.includes(w));
      const hasWordOverlap = sharedWords.length >= 2;

      // Shared assets
      const hasAssetOverlap =
        assetsI.size > 0 &&
        assetsJ.size > 0 &&
        [...assetsI].some((a) => assetsJ.has(a));

      if (hasWordOverlap || hasAssetOverlap) {
        // Union-find merge
        mergeGroups(groups, i, j);
      }
    }
  }

  // Collect unique groups
  const uniqueGroups = new Map<number, number[]>();
  for (let i = 0; i < claims.length; i++) {
    const root = findRoot(groups, i);
    if (!uniqueGroups.has(root)) {
      uniqueGroups.set(root, []);
    }
    uniqueGroups.get(root)!.push(i);
  }

  // Build story descriptors
  const stories: { title: string; claimIds: string[] }[] = [];
  for (const [, indices] of uniqueGroups) {
    if (indices.length < 1) continue;

    const claimIds = indices.map((idx) => claims[idx].claimId);

    // Use the most prominent article title from the cluster
    // Pick the longest title as it tends to be the most descriptive
    let title = claims[indices[0]].title;
    for (const idx of indices) {
      if (claims[idx].title && claims[idx].title.length > title.length) {
        title = claims[idx].title;
      }
    }

    stories.push({ title, claimIds });
  }

  return stories;
}

/** Simple union-find helpers for story grouping. */
function findRoot(
  groups: Map<number, Set<number>>,
  node: number,
): number {
  for (const [root, members] of groups) {
    if (members.has(node)) return root;
  }
  return node;
}

function mergeGroups(
  groups: Map<number, Set<number>>,
  a: number,
  b: number,
): void {
  const rootA = findRoot(groups, a);
  const rootB = findRoot(groups, b);
  if (rootA === rootB) return;

  const membersA = groups.get(rootA)!;
  const membersB = groups.get(rootB)!;

  // Merge smaller into larger
  if (membersA.size >= membersB.size) {
    for (const m of membersB) membersA.add(m);
    groups.delete(rootB);
  } else {
    for (const m of membersA) membersB.add(m);
    groups.delete(rootA);
  }
}

// ============================================
// STORAGE HELPERS
// ============================================

/**
 * Ensure a source record exists for a feed domain, creating one if needed.
 * Returns the source ID.
 */
async function ensureSource(feed: {
  name: string;
  domain: string;
}): Promise<string> {
  // Look up existing source by domain
  const existingSources = await storage.getSources();
  const existing = existingSources.find(
    (s) =>
      s.handleOrDomain === feed.domain ||
      s.displayName === feed.name,
  );

  if (existing) return existing.id;

  // Create new source
  const source = await storage.createSource({
    type: "publisher",
    handleOrDomain: feed.domain,
    displayName: feed.name,
    metadata: { rssSource: true },
  });

  return source.id;
}

/**
 * Generate a meaningful summary for a story from its claim texts.
 */
function generateStorySummary(title: string, claimTexts: string[]): string {
  if (claimTexts.length === 0) return title;

  // Use the first claim as the core summary, clean it up
  const primaryClaim = claimTexts[0];

  if (claimTexts.length === 1) {
    return primaryClaim.length > 200 ? primaryClaim.slice(0, 197) + "..." : primaryClaim;
  }

  // Multiple claims: summarize the scope
  const truncated = primaryClaim.length > 150 ? primaryClaim.slice(0, 147) + "..." : primaryClaim;
  return `${truncated} This story includes ${claimTexts.length} related claims from multiple sources.`;
}

// ============================================
// PIPELINE ORCHESTRATOR
// ============================================

export class VerificationPipeline {
  private storage: typeof storage;
  private lastRunAt: Date | null = null;
  private articlesProcessed = 0;
  private claimsExtracted = 0;
  private isRunning = false;
  private schedulerInterval: ReturnType<typeof setInterval> | null = null;

  constructor(storageInstance: typeof storage) {
    this.storage = storageInstance;
  }

  /**
   * Get current pipeline status.
   */
  getStatus(): PipelineStatus {
    return {
      lastRunAt: this.lastRunAt,
      articlesProcessed: this.articlesProcessed,
      claimsExtracted: this.claimsExtracted,
      isRunning: this.isRunning,
    };
  }

  /**
   * Start the scheduler: run once immediately, then at the given interval.
   * Default interval is 24 hours.
   */
  startScheduler(intervalMs: number = DEFAULT_INTERVAL_MS): void {
    console.log(
      `[Pipeline] Starting scheduler (interval: ${(intervalMs / 1000 / 60 / 60).toFixed(1)}h)`,
    );
    console.log(
      `[Pipeline] Anthropic mode: ${anthropic ? "ENABLED (Claude)" : "DISABLED (simulation mode)"}`,
    );

    // Run immediately
    this.runDailyBatch().catch((error) => {
      console.error("[Pipeline] Initial batch run failed:", error);
    });

    // Schedule recurring runs
    this.schedulerInterval = setInterval(() => {
      this.runDailyBatch().catch((error) => {
        console.error("[Pipeline] Scheduled batch run failed:", error);
      });
    }, intervalMs);
  }

  /**
   * Stop the scheduler.
   */
  stopScheduler(): void {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = null;
      console.log("[Pipeline] Scheduler stopped");
    }
  }

  /**
   * Run a full daily batch: fetch all feeds, process articles, extract claims,
   * generate verdicts, and group into stories.
   */
  async runDailyBatch(): Promise<void> {
    if (this.isRunning) {
      console.log("[Pipeline] Batch already running, skipping");
      return;
    }

    this.isRunning = true;
    const batchStart = Date.now();
    let batchArticlesProcessed = 0;
    let batchClaimsExtracted = 0;

    console.log("[Pipeline] === Starting daily batch run ===");

    try {
      // Step 1: Fetch all RSS feeds
      const articles = await fetchAllFeeds();

      // Step 2: Filter out already-processed articles (dedup by URL)
      const newArticles: ParsedArticle[] = [];
      for (const article of articles) {
        try {
          const existing = await this.storage.getItemByUrl(article.link);
          if (!existing) {
            newArticles.push(article);
          }
        } catch {
          // If getItemByUrl throws (e.g., method not implemented), include the article
          newArticles.push(article);
        }
      }

      console.log(
        `[Pipeline] ${newArticles.length} new articles (${articles.length - newArticles.length} already processed)`,
      );

      // Step 3: Limit to MAX_ARTICLES_PER_BATCH
      const toProcess = newArticles.slice(0, MAX_ARTICLES_PER_BATCH);
      console.log(`[Pipeline] Processing ${toProcess.length} articles`);

      // Step 4: Process each article through the full pipeline
      const allClaimsForGrouping: ClaimForGrouping[] = [];

      for (const article of toProcess) {
        try {
          const result = await this.processArticle(article);
          batchArticlesProcessed++;
          batchClaimsExtracted += result.claimIds.length;

          // Collect for story grouping
          for (const claimId of result.claimIds) {
            allClaimsForGrouping.push({
              claimId,
              claimText: result.claimTexts[result.claimIds.indexOf(claimId)] || "",
              assetSymbols: result.assetSymbols[result.claimIds.indexOf(claimId)] || [],
              publishedAt: article.publishedAt,
              title: article.title,
              itemId: result.itemId,
            });
          }
        } catch (error) {
          console.error(
            `[Pipeline] Failed to process article "${article.title}":`,
            error instanceof Error ? error.message : error,
          );
          // Continue with remaining articles
        }
      }

      // Step 5: Group claims into stories
      if (allClaimsForGrouping.length > 0) {
        console.log(
          `[Pipeline] Grouping ${allClaimsForGrouping.length} claims into stories`,
        );
        await this.groupAndPersistStories(allClaimsForGrouping);
      }

      // Update cumulative stats
      this.articlesProcessed += batchArticlesProcessed;
      this.claimsExtracted += batchClaimsExtracted;
      this.lastRunAt = new Date();

      const elapsed = ((Date.now() - batchStart) / 1000).toFixed(1);
      console.log(
        `[Pipeline] === Batch complete: ${batchArticlesProcessed} articles, ${batchClaimsExtracted} claims in ${elapsed}s ===`,
      );
    } catch (error) {
      console.error(
        "[Pipeline] Batch run failed:",
        error instanceof Error ? error.message : error,
      );
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Process a single article through the full verification pipeline:
   * 1. Store the article as an Item
   * 2. Extract claims
   * 3. Gather evidence for each claim
   * 4. Generate verdicts
   */
  async processArticle(
    article: ParsedArticle,
  ): Promise<{
    itemId: string;
    claimIds: string[];
    claimTexts: string[];
    assetSymbols: string[][];
  }> {
    console.log(`[Pipeline] Processing: "${article.title}"`);

    // Step 1: Ensure source exists
    const sourceId = await ensureSource({
      name: article.feedName,
      domain: article.feedDomain,
    });

    // Step 2: Create the Item record
    const contentHash = hashContent(article.link + article.title);
    const item = await this.storage.createItem({
      sourceId,
      url: article.link,
      publishedAt: article.publishedAt,
      rawText: article.content,
      title: article.title,
      contentHash,
      itemType: "article",
      metadata: article.itemMetadata ?? {
        feedName: article.feedName,
        feedDomain: article.feedDomain,
      },
    });

    // Step 3: Extract claims
    const extractedClaims = await extractClaimsWithLLM(article);
    console.log(
      `[Pipeline]   Extracted ${extractedClaims.length} claims from "${article.title}"`,
    );

    const claimIds: string[] = [];
    const claimTexts: string[] = [];
    const assetSymbolsArr: string[][] = [];

    for (const ec of extractedClaims) {
      try {
        // Step 4: Store claim
        const claim = await this.storage.createClaim({
          sourceId,
          itemId: item.id,
          claimText: ec.claimText,
          claimType: ec.claimType,
          assetSymbols: ec.assetSymbols,
          assertedAt: article.publishedAt || new Date(),
          resolveBy: ec.resolveBy ? new Date(ec.resolveBy) : null,
          resolutionType: ec.resolutionType,
          falsifiabilityScore: ec.falsifiabilityScore,
          llmConfidence: ec.llmConfidence,
          status: "unreviewed",
          metadata: {},
        });

        claimIds.push(claim.id);
        claimTexts.push(ec.claimText);
        assetSymbolsArr.push(ec.assetSymbols);

        // Step 5: Gather evidence
        const evidence = await gatherEvidence(ec, article);
        const storedEvidenceIds: string[] = [];

        for (const ev of evidence) {
          try {
            const storedEvidence = await this.storage.createEvidence({
              claimId: claim.id,
              url: ev.url,
              publisher: ev.publisher,
              publishedAt: ev.publishedAt,
              excerpt: ev.excerpt,
              stance: ev.stance,
              evidenceGrade: ev.grade,
              primaryFlag: ev.primaryFlag,
              metadata: ev.metadata || {},
            });
            storedEvidenceIds.push(storedEvidence.id);
          } catch (evError) {
            console.warn(
              "[Pipeline]   Failed to store evidence item:",
              evError instanceof Error ? evError.message : evError,
            );
          }
        }

        // Step 6: Generate verdict
        const verdict = await generateVerdict(ec, evidence);

        try {
          await this.storage.createVerdict({
            claimId: claim.id,
            model: anthropic ? "claude-sonnet-4-5-20250929" : "simulation",
            promptVersion: "v1.0.0",
            verdictLabel: verdict.verdictLabel,
            probabilityTrue: verdict.probabilityTrue,
            evidenceStrength: verdict.evidenceStrength,
            keyEvidenceIds: storedEvidenceIds,
            reasoningSummary: verdict.reasoningSummary,
            invalidationTriggers: verdict.invalidationTriggers,
          });
        } catch (vError) {
          console.warn(
            "[Pipeline]   Failed to store verdict:",
            vError instanceof Error ? vError.message : vError,
          );
        }

        // Update claim status to reviewed (if storage supports it)
        try {
          const storageAny = this.storage as unknown as Record<string, unknown>;
          if (typeof storageAny.updateClaimStatus === "function") {
            await (storageAny.updateClaimStatus as (id: string, status: string) => Promise<void>)(claim.id, "reviewed");
          }
        } catch {
          // Non-critical, continue
        }

        console.log(
          `[Pipeline]   Claim: "${ec.claimText.slice(0, 80)}..." => ${verdict.verdictLabel} (p=${verdict.probabilityTrue.toFixed(2)})`,
        );
      } catch (claimError) {
        console.error(
          `[Pipeline]   Failed to process claim "${ec.claimText.slice(0, 60)}...":`,
          claimError instanceof Error ? claimError.message : claimError,
        );
      }
    }

    return {
      itemId: item.id,
      claimIds,
      claimTexts,
      assetSymbols: assetSymbolsArr,
    };
  }

  /**
   * Group claims into stories and persist to storage.
   */
  private async groupAndPersistStories(
    claims: ClaimForGrouping[],
  ): Promise<void> {
    const storyGroups = groupClaimsIntoStories(claims);
    console.log(
      `[Pipeline] Identified ${storyGroups.length} story groups from ${claims.length} claims`,
    );

    for (const group of storyGroups) {
      try {
        // Check if any of these claims already belong to a story
        let existingStoryId: string | null = null;

        // Check if storage supports looking up stories by claim ID
        const storageAny = this.storage as unknown as Record<string, unknown>;
        if (typeof storageAny.getStoryByClaimId === "function") {
          for (const claimId of group.claimIds) {
            try {
              const storyForClaim = await (
                storageAny.getStoryByClaimId as (id: string) => Promise<Story | null>
              )(claimId);
              if (storyForClaim) {
                existingStoryId = storyForClaim.id;
                break;
              }
            } catch {
              // Skip on error
            }
          }
        }

        // If no existing story found by claim ID, try matching by title similarity
        if (!existingStoryId) {
          try {
            const existingStories = await this.storage.getStories();
            const groupWords = getSignificantWords(group.title);

            let bestMatch: { id: string; score: number } | null = null;

            for (const existing of existingStories) {
              const existingWords = getSignificantWords(existing.title);
              const sharedWords = groupWords.filter(w => existingWords.includes(w));
              const score = sharedWords.length;

              // Also check asset overlap
              const existingAssets = new Set((existing.assetSymbols || []).map(a => a.toUpperCase()));
              const groupAssets = group.claimIds
                .map(cid => claims.find(c => c.claimId === cid))
                .flatMap(c => c?.assetSymbols || [])
                .map(a => a.toUpperCase());
              const hasAssetOverlap = groupAssets.some(a => existingAssets.has(a));

              // Need 2+ shared words OR asset overlap with 1+ shared word
              if (score >= 2 || (hasAssetOverlap && score >= 1)) {
                if (!bestMatch || score > bestMatch.score) {
                  bestMatch = { id: existing.id, score };
                }
              }
            }

            if (bestMatch) {
              existingStoryId = bestMatch.id;
              console.log(`[Pipeline]   Matched to existing story by title similarity (score=${bestMatch.score})`);
            }
          } catch {
            // Non-critical: fall through to create new story
          }
        }

        // Collect unique itemIds for this group from the claims
        const groupItemIds = new Set<string>();
        for (const claimId of group.claimIds) {
          const matchingClaim = claims.find((c) => c.claimId === claimId);
          if (matchingClaim) {
            groupItemIds.add(matchingClaim.itemId);
          }
        }

        // Collect all unique asset symbols from the group
        const groupAssetSymbols = new Set<string>();
        for (const claimId of group.claimIds) {
          const matchingClaim = claims.find((c) => c.claimId === claimId);
          if (matchingClaim) {
            for (const sym of matchingClaim.assetSymbols) {
              groupAssetSymbols.add(sym);
            }
          }
        }

        // Compute sourceCount: count unique sources from the items
        const uniqueSourceIds = new Set<string>();
        for (const itemId of groupItemIds) {
          try {
            const item = await this.storage.getItem(itemId);
            if (item) {
              uniqueSourceIds.add(item.sourceId);
            }
          } catch {
            // Skip on error
          }
        }
        const sourceCount = uniqueSourceIds.size;

        if (existingStoryId) {
          // Add new claims to the existing story
          for (const claimId of group.claimIds) {
            try {
              await this.storage.addClaimToStory(existingStoryId, claimId);
            } catch {
              // May already be linked or method may not exist
            }
          }

          // Link items to the existing story
          for (const itemId of groupItemIds) {
            try {
              await this.storage.addItemToStory(existingStoryId, itemId);
            } catch {
              // May already be linked
            }
          }

          // Update sourceCount, assetSymbols, and backfill imageUrl if missing
          try {
            const existingStory = await this.storage.getStory(existingStoryId);
            const updateData: Partial<Pick<Story, "sourceCount" | "assetSymbols" | "imageUrl">> = {
              sourceCount,
              assetSymbols: [...groupAssetSymbols],
            };
            if (!existingStory?.imageUrl) {
              updateData.imageUrl = getStoryImageUrl(group.title, "crypto");
            }
            await this.storage.updateStory(existingStoryId, updateData);
          } catch {
            // Non-critical
          }

          console.log(
            `[Pipeline]   Updated story "${group.title}" with ${group.claimIds.length} claims, ${groupItemIds.size} items, ${sourceCount} sources`,
          );
        } else {
          // Create new story
          const storyCategory = "crypto";
          const imageUrl = getStoryImageUrl(group.title, storyCategory);

          // Collect claim texts for summary
          const claimTexts = group.claimIds
            .map(cid => claims.find(c => c.claimId === cid)?.claimText)
            .filter((t): t is string => !!t);

          const summary = generateStorySummary(group.title, claimTexts);

          const story = await this.storage.createStory({
            title: group.title,
            summary,
            category: storyCategory,
            imageUrl,
            metadata: {
              claimCount: group.claimIds.length,
              createdByPipeline: true,
            },
          });

          // Link claims to story
          for (const claimId of group.claimIds) {
            try {
              await this.storage.addClaimToStory(story.id, claimId);
            } catch {
              // May fail if claim already linked or method unavailable
            }
          }

          // Link items to story
          for (const itemId of groupItemIds) {
            try {
              await this.storage.addItemToStory(story.id, itemId);
            } catch {
              // May fail if already linked
            }
          }

          // Update sourceCount and assetSymbols on the story
          try {
            await this.storage.updateStory(story.id, {
              sourceCount,
              assetSymbols: [...groupAssetSymbols],
            });
          } catch {
            // Non-critical
          }

          console.log(
            `[Pipeline]   Created story "${group.title}" with ${group.claimIds.length} claims, ${groupItemIds.size} items, ${sourceCount} sources`,
          );
        }
      } catch (storyError) {
        console.error(
          `[Pipeline]   Failed to create/update story "${group.title}":`,
          storyError instanceof Error ? storyError.message : storyError,
        );
      }
    }
  }
}

// ============================================
// COMMUNITY EVIDENCE SUBMISSION
// ============================================

export interface CommunityEvidenceResult {
  accepted: boolean;
  reason?: string;
  evidence?: {
    url: string;
    publisher: string;
    excerpt: string;
    grade: EvidenceGrade;
    stance: EvidenceStance;
    primaryFlag: boolean;
  };
  verdict?: VerdictResult;
}

/**
 * Validate community-submitted evidence for a claim.
 * Fetches the URL, analyzes relevance via AI or heuristics,
 * and returns the evidence data + recalculated verdict if accepted.
 */
export async function validateCommunityEvidence(
  url: string,
  notes: string | undefined,
  claimText: string,
  claimType: string,
  existingEvidence: Array<{
    url: string;
    publisher: string;
    excerpt: string;
    grade: string;
    stance: string;
    primaryFlag: boolean;
  }>,
): Promise<CommunityEvidenceResult> {
  // Step 1: Parse URL and extract domain
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return { accepted: false, reason: "Invalid URL" };
  }
  const domain = extractDomain(url);

  // Step 2: Fetch URL content
  let pageContent: string;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Confirmd/1.0 Evidence Validator" },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return { accepted: false, reason: `Could not retrieve content (HTTP ${response.status})` };
    }
    const html = await response.text();
    pageContent = stripHtml(html).slice(0, 3000);
  } catch (err) {
    return { accepted: false, reason: "Could not retrieve content from the provided URL" };
  }

  if (pageContent.length < 50) {
    return { accepted: false, reason: "Page content too short to analyze" };
  }

  const grade = gradeByDomain(url);
  let excerpt: string;
  let stance: EvidenceStance;

  // Step 3: Validate relevance and extract evidence
  if (anthropic) {
    // AI path
    try {
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 4096,
        temperature: 0.2,
        system: `You are a crypto evidence validator. Given a claim and page content from a submitted URL, determine:
1. Is the content relevant to the claim? (yes/no)
2. What is the most meaningful excerpt (1-3 sentences)?
3. What is the stance? (supports/contradicts/mentions)

Output JSON only: { "relevant": boolean, "reason": "string", "excerpt": "string", "stance": "supports|contradicts|mentions" }`,
        messages: [
          {
            role: "user",
            content: `CLAIM: ${claimText}\nCLAIM TYPE: ${claimType}\nURL: ${url}\nDOMAIN: ${domain}\nPAGE CONTENT: ${pageContent}\nSUBMITTER NOTES: ${notes || "None"}`,
          },
        ],
      });

      const rawContent = response.content[0].type === 'text' ? response.content[0].text : '';
      if (!rawContent) {
        return { accepted: false, reason: "AI validation returned empty response" };
      }

      const cleaned = cleanJsonResponse(rawContent);
      const parsed = JSON.parse(cleaned);

      if (!parsed.relevant) {
        return { accepted: false, reason: parsed.reason || "Content is not relevant to this claim" };
      }

      excerpt = parsed.excerpt || pageContent.slice(0, 200);
      stance = (["supports", "contradicts", "mentions"].includes(parsed.stance)
        ? parsed.stance
        : "mentions") as EvidenceStance;
    } catch (err) {
      // Fall through to heuristic path on AI failure
      console.warn("[Pipeline] AI evidence validation failed, using heuristic:", err);
      const heuristic = validateHeuristic(pageContent, claimText, notes);
      if (!heuristic.accepted) return heuristic;
      excerpt = heuristic.excerpt!;
      stance = heuristic.stance!;
    }
  } else {
    // Heuristic path
    const heuristic = validateHeuristic(pageContent, claimText, notes);
    if (!heuristic.accepted) return heuristic;
    excerpt = heuristic.excerpt!;
    stance = heuristic.stance!;
  }

  // Step 4: Build new evidence and recalculate verdict
  const newEvidence: GatheredEvidence = {
    url,
    publisher: domain,
    excerpt,
    grade,
    stance,
    primaryFlag: grade === "A",
    publishedAt: null,
    metadata: { sourceType: "community_submission" },
  };

  const allEvidence: GatheredEvidence[] = [
    ...existingEvidence.map((e) => ({
      url: e.url,
      publisher: e.publisher,
      excerpt: e.excerpt,
      grade: e.grade as EvidenceGrade,
      stance: e.stance as EvidenceStance,
      primaryFlag: e.primaryFlag,
      publishedAt: null as Date | null,
      metadata: {} as Record<string, unknown>,
    })),
    newEvidence,
  ];

  const simClaim: ExtractedClaim = {
    claimText,
    claimType: claimType as ClaimType,
    assetSymbols: [],
    resolutionType: "indefinite",
    resolveBy: null,
    falsifiabilityScore: 0.5,
    llmConfidence: 0.5,
  };

  const verdict = await generateVerdict(simClaim, allEvidence);

  return {
    accepted: true,
    evidence: {
      url,
      publisher: domain,
      excerpt,
      grade,
      stance,
      primaryFlag: grade === "A",
    },
    verdict,
  };
}

/** Heuristic evidence validation when no Anthropic key is available. */
function validateHeuristic(
  pageContent: string,
  claimText: string,
  notes: string | undefined,
): { accepted: boolean; reason?: string; excerpt?: string; stance?: EvidenceStance } {
  const contentLower = pageContent.toLowerCase();
  const claimKeywords = claimText
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 4);

  const matchCount = claimKeywords.filter((k) => contentLower.includes(k)).length;
  if (matchCount < 2) {
    return { accepted: false, reason: "Content does not appear relevant to this claim" };
  }

  const stance = determineStance(pageContent, claimText);
  if (stance === "irrelevant") {
    return { accepted: false, reason: "Content does not appear relevant to this claim" };
  }

  // Extract first sentence containing a claim keyword
  const sentences = pageContent.split(/[.!?]+/).map((s) => s.trim()).filter((s) => s.length > 20);
  let excerpt = sentences.find((s) =>
    claimKeywords.some((k) => s.toLowerCase().includes(k))
  );
  if (!excerpt) {
    excerpt = pageContent.slice(0, 200);
  }

  return { accepted: true, excerpt: excerpt.slice(0, 500), stance };
}
