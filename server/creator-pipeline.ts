/**
 * Creator Pipeline
 * YouTube transcript ingestion → claim extraction → verification → scoring → disputes
 *
 * Ported from ClaimVault, adapted to use Confirmd's IStorage interface
 * and Anthropic SDK.
 */

import { execFile } from "child_process";
import { readFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import Anthropic from "@anthropic-ai/sdk";
import type { IStorage } from "./storage.js";
import type {
  Creator,
  CreatorClaim,
  InsertCreatorClaim,
  Dispute,
} from "../shared/schema.js";

// ============================================
// CONFIGURATION
// ============================================

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const DELAY_BETWEEN_CALLS_MS = 15000;
const MAX_TRANSCRIPT_CHARS = 20000;

const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null;

// ============================================
// TYPES
// ============================================

interface TranscriptSegment {
  text: string;
  offset: number;
  duration: number;
}

interface TranscriptResult {
  text: string;
  segments: TranscriptSegment[];
}

interface ExtractedClaim {
  claimText: string;
  claimCategory: string;
  claimStrength: "strong" | "medium" | "weak";
  statedTimeframe: string | null;
  timestampSeconds: number;
}

type CreatorTier = "diamond" | "gold" | "silver" | "bronze" | "unranked";

// ============================================
// HELPERS
// ============================================

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;#39;/g, "'")
    .replace(/\n/g, " ")
    .trim();
}

function parseTranscriptXml(xml: string): TranscriptSegment[] {
  const segmentRegex =
    /<text\s+start="([^"]+)"\s+dur="([^"]+)"[^>]*>([\s\S]*?)<\/text>/g;
  const segments: TranscriptSegment[] = [];
  let match;

  while ((match = segmentRegex.exec(xml)) !== null) {
    const text = decodeHtmlEntities(match[3]);
    if (text) {
      segments.push({
        offset: parseFloat(match[1]),
        duration: parseFloat(match[2]),
        text,
      });
    }
  }

  return segments;
}

// ============================================
// 1. GET RECENT VIDEO IDS
// ============================================

/**
 * Fetch video IDs from a YouTube channel's RSS feed.
 */
export async function getRecentVideoIds(
  channelId: string,
  limit = 5,
): Promise<string[]> {
  const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;

  const res = await fetch(feedUrl, {
    headers: { "User-Agent": USER_AGENT },
  });
  if (!res.ok) {
    throw new Error(
      `Failed to fetch RSS feed for channel ${channelId}: ${res.status}`,
    );
  }

  const xml = await res.text();

  const videoIdRegex = /<yt:videoId>([^<]+)<\/yt:videoId>/g;
  const videoIds: string[] = [];
  let match;

  while ((match = videoIdRegex.exec(xml)) !== null) {
    videoIds.push(match[1]);
    if (videoIds.length >= limit) break;
  }

  return videoIds;
}

// ============================================
// 2. FETCH VIDEO TRANSCRIPT
// ============================================

function runYtDlp(videoId: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = [
      "--write-auto-sub",
      "--sub-lang",
      "en",
      "--skip-download",
      "--sub-format",
      "srv1",
      "--no-warnings",
      "--quiet",
      "-o",
      outputPath,
      `https://www.youtube.com/watch?v=${videoId}`,
    ];

    execFile("yt-dlp", args, { timeout: 60000 }, (error) => {
      if (error) {
        reject(new Error(`yt-dlp failed for ${videoId}: ${error.message}`));
      } else {
        resolve();
      }
    });
  });
}

/**
 * Fetch the transcript for a YouTube video using yt-dlp.
 */
export async function fetchVideoTranscript(
  videoId: string,
): Promise<TranscriptResult> {
  const basePath = join(tmpdir(), `confirmd_${videoId}_${Date.now()}`);
  const subPath = `${basePath}.en.srv1`;

  try {
    await runYtDlp(videoId, basePath);

    const xml = await readFile(subPath, "utf-8");
    const segments = parseTranscriptXml(xml);
    const text = segments.map((s) => s.text).join(" ");

    return { text, segments };
  } finally {
    try {
      await unlink(subPath);
    } catch {}
  }
}

// ============================================
// 3. EXTRACT CLAIMS FROM TRANSCRIPT
// ============================================

const VALID_CATEGORIES = [
  "price_prediction",
  "regulatory",
  "partnership",
  "technology",
  "market_prediction",
  "technical_analysis",
  "etf_approval",
  "partnership_adoption",
  "market_analysis",
] as const;

const VALID_STRENGTHS = ["strong", "medium", "weak"] as const;

/**
 * Use Claude to extract verifiable claims from a video transcript.
 */
export async function extractClaimsFromTranscript(
  transcript: string,
  creatorId: string,
  videoId: string,
  videoTitle: string,
  videoDate: string,
): Promise<ExtractedClaim[]> {
  if (!anthropic) {
    console.log(
      "[CreatorPipeline] No ANTHROPIC_API_KEY — skipping claim extraction",
    );
    return [];
  }

  const truncated =
    transcript.length > MAX_TRANSCRIPT_CHARS
      ? transcript.substring(0, MAX_TRANSCRIPT_CHARS) +
        "\n[TRANSCRIPT TRUNCATED]"
      : transcript;

  const systemPrompt = `You are a crypto claim extraction analyst for Confirmd, a platform that tracks the accuracy of crypto YouTube creators' predictions and claims.

Analyze the transcript and extract specific, verifiable claims. Focus on:
- Price predictions (specific price targets or ranges)
- Partnership claims (named companies/institutions)
- Regulatory predictions (ETF approvals, SEC actions, legal outcomes)
- Technology claims (specific tech upgrades, adoption metrics)
- Market predictions (market cap targets, altseason timing, dominance shifts)
- Technical analysis claims (specific chart patterns, breakout predictions with timeframes)

Rules:
- Only extract claims that are specific enough to verify later
- Skip vague opinions like "I think crypto is good" or "BTC has potential"
- Each claim should be a self-contained statement that someone could fact-check
- Estimate the timestamp in seconds where the claim was made (approximate is fine)
- Classify claim strength:
  - "strong": Creator states it with high conviction ("will happen", "guaranteed", definite language)
  - "medium": Creator expresses moderate confidence ("likely", "probably", "I believe")
  - "weak": Creator is speculative ("could", "might", "possible")

Respond with ONLY a valid JSON array of claims:
[
  {
    "claimText": "<the specific claim as stated>",
    "claimCategory": "<category>",
    "claimStrength": "strong" | "medium" | "weak",
    "statedTimeframe": "<timeframe if mentioned, e.g. 'by end of 2025', 'within 6 months'>" | null,
    "timestampSeconds": <approximate seconds into video>
  }
]

Valid categories: "price_prediction", "regulatory", "partnership", "technology", "market_prediction", "technical_analysis", "etf_approval", "partnership_adoption", "market_analysis"

If no verifiable claims are found, return an empty array: []`;

  const userMessage = `Extract verifiable claims from this crypto YouTube video transcript.

VIDEO TITLE: ${videoTitle}
CREATOR: ${creatorId}
DATE: ${videoDate}

TRANSCRIPT:
${truncated}

Extract all specific, verifiable claims as a JSON array.`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    let responseText = "";
    for (const block of response.content) {
      if (block.type === "text") responseText += block.text;
    }

    return parseClaimsResponse(responseText);
  } catch (error) {
    console.error(
      "[CreatorPipeline] Claim extraction failed:",
      error instanceof Error ? error.message : error,
    );
    return [];
  }
}

function parseClaimsResponse(text: string): ExtractedClaim[] {
  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((c: any) => c.claimText && typeof c.claimText === "string")
      .map((c: any) => ({
        claimText: String(c.claimText),
        claimCategory: VALID_CATEGORIES.includes(c.claimCategory)
          ? c.claimCategory
          : "market_analysis",
        claimStrength: VALID_STRENGTHS.includes(c.claimStrength)
          ? c.claimStrength
          : "medium",
        statedTimeframe: c.statedTimeframe ? String(c.statedTimeframe) : null,
        timestampSeconds: Math.max(
          0,
          Math.round(Number(c.timestampSeconds) || 0),
        ),
      }));
  } catch {
    console.error("[CreatorPipeline] Failed to parse claims from AI response");
    return [];
  }
}

// ============================================
// 4. PROCESS CREATOR VIDEOS
// ============================================

/**
 * Main per-creator pipeline: discover videos → fetch transcripts → extract claims → save to DB.
 */
export async function processCreatorVideos(
  storage: IStorage,
  creatorId: string,
): Promise<{ videosProcessed: number; claimsExtracted: number }> {
  const creator = await storage.getCreator(creatorId);
  if (!creator) {
    console.error(`[CreatorPipeline] Creator ${creatorId} not found`);
    return { videosProcessed: 0, claimsExtracted: 0 };
  }

  const channelName = creator.channelName;
  console.log(
    `[CreatorPipeline] Processing creator: ${channelName} (${creator.youtubeChannelId})`,
  );

  let videoIds: string[];
  try {
    videoIds = await getRecentVideoIds(creator.youtubeChannelId, 3);
  } catch (err) {
    console.error(
      `[CreatorPipeline] Failed to fetch video IDs for ${channelName}:`,
      err,
    );
    return { videosProcessed: 0, claimsExtracted: 0 };
  }

  if (videoIds.length === 0) {
    console.log(`[CreatorPipeline] No videos found for ${channelName}`);
    return { videosProcessed: 0, claimsExtracted: 0 };
  }

  console.log(
    `[CreatorPipeline] Found ${videoIds.length} videos for ${channelName}`,
  );

  let videosProcessed = 0;
  let totalClaims = 0;

  for (let i = 0; i < videoIds.length; i++) {
    const ytVideoId = videoIds[i];

    // Skip if already processed
    const existing = await storage.getCreatorVideoByYoutubeId(ytVideoId);
    if (existing?.claimsExtracted) {
      console.log(
        `[CreatorPipeline]   Skipping ${ytVideoId} — already processed`,
      );
      continue;
    }

    console.log(
      `[CreatorPipeline]   Processing video ${i + 1}/${videoIds.length}: ${ytVideoId}`,
    );

    try {
      // Create or get video record
      let video = existing;
      if (!video) {
        video = await storage.createCreatorVideo({
          creatorId,
          youtubeVideoId: ytVideoId,
          title: `Video ${ytVideoId}`,
          transcriptStatus: "pending",
        });
      }

      // Fetch transcript
      const transcript = await fetchVideoTranscript(ytVideoId);

      if (!transcript.text || transcript.text.trim().length < 100) {
        console.log(
          `[CreatorPipeline]   Skipping ${ytVideoId} — transcript too short`,
        );
        await storage.updateCreatorVideo(video.id, {
          transcriptStatus: "failed",
        });
        continue;
      }

      await storage.updateCreatorVideo(video.id, {
        transcriptStatus: "complete",
        transcriptText: transcript.text,
        transcriptSource: "yt-dlp",
      });

      // Extract claims
      const videoDate = new Date().toISOString().split("T")[0];
      const claims = await extractClaimsFromTranscript(
        transcript.text,
        creatorId,
        ytVideoId,
        video.title,
        videoDate,
      );

      // Save claims to DB
      for (const claim of claims) {
        await storage.createCreatorClaim({
          creatorId,
          videoId: video.id,
          claimText: claim.claimText,
          category:
            claim.claimCategory as InsertCreatorClaim["category"],
          confidenceLanguage:
            claim.claimStrength as InsertCreatorClaim["confidenceLanguage"],
          statedTimeframe: claim.statedTimeframe,
          videoTimestampSeconds: claim.timestampSeconds,
          status: "pending",
        });
      }

      await storage.updateCreatorVideo(video.id, {
        claimsExtracted: true,
      });

      totalClaims += claims.length;
      videosProcessed++;

      console.log(
        `[CreatorPipeline]   Extracted ${claims.length} claims from ${ytVideoId}`,
      );
    } catch (err) {
      console.error(
        `[CreatorPipeline]   Error processing ${ytVideoId}:`,
        err instanceof Error ? err.message : err,
      );
    }

    // Rate limit between videos
    if (i < videoIds.length - 1) {
      await delay(DELAY_BETWEEN_CALLS_MS);
    }
  }

  console.log(
    `[CreatorPipeline] Finished ${channelName}: ${totalClaims} claims from ${videosProcessed} videos`,
  );

  return { videosProcessed, claimsExtracted: totalClaims };
}

// ============================================
// 5. RUN CREATOR PIPELINE
// ============================================

/**
 * Run the creator pipeline for all active creators.
 */
export async function runCreatorPipeline(
  storage: IStorage,
): Promise<{ creatorsProcessed: number; totalClaims: number }> {
  const creators = await storage.getCreators(true); // active only
  let creatorsProcessed = 0;
  let totalClaims = 0;

  console.log(
    `[CreatorPipeline] Starting pipeline for ${creators.length} active creators`,
  );

  for (const creator of creators) {
    const result = await processCreatorVideos(storage, creator.id);
    creatorsProcessed++;
    totalClaims += result.claimsExtracted;

    // Delay between creators
    await delay(DELAY_BETWEEN_CALLS_MS);
  }

  console.log(
    `[CreatorPipeline] Pipeline complete: ${totalClaims} claims from ${creatorsProcessed} creators`,
  );

  return { creatorsProcessed, totalClaims };
}

// ============================================
// 6. VERIFY CREATOR CLAIMS
// ============================================

/**
 * Basic verification: check claim deadlines, mark expired, web search for verification.
 */
export async function verifyCreatorClaims(storage: IStorage): Promise<void> {
  const pendingClaims = await storage.getCreatorClaims({
    status: "pending",
    limit: 50,
  });

  console.log(
    `[CreatorPipeline] Verifying ${pendingClaims.length} pending claims`,
  );

  const now = new Date();

  for (const claim of pendingClaims) {
    // Check if deadline has passed → mark expired
    if (claim.timeframeDeadline && new Date(claim.timeframeDeadline) < now) {
      await storage.updateCreatorClaim(claim.id, {
        status: "expired",
        verificationDate: now,
        verificationNotes: "Timeframe deadline passed without verification.",
      });
      console.log(
        `[CreatorPipeline]   Expired: "${claim.claimText.slice(0, 60)}..."`,
      );
      continue;
    }

    // Attempt web search verification if Anthropic is available
    if (!anthropic) continue;

    try {
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 2048,
        tools: [
          {
            type: "web_search_20250305" as any,
            name: "web_search",
            max_uses: 3,
          },
        ],
        messages: [
          {
            role: "user",
            content: `Verify this crypto claim: "${claim.claimText}"

Category: ${claim.category}
Stated timeframe: ${claim.statedTimeframe || "none"}

Search the web for evidence and determine:
1. Is the claim verified true, verified false, partially true, or still unverifiable?
2. What evidence supports or contradicts it?

Respond with JSON only:
{
  "status": "verified_true" | "verified_false" | "partially_true" | "unverifiable",
  "evidence": "brief summary of evidence found",
  "notes": "reasoning"
}`,
          },
        ],
      });

      let responseText = "";
      for (const block of response.content) {
        if (block.type === "text") responseText += block.text;
      }

      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        const validStatuses = [
          "verified_true",
          "verified_false",
          "partially_true",
          "unverifiable",
        ];
        const status = validStatuses.includes(result.status)
          ? result.status
          : "pending";

        if (status !== "pending") {
          await storage.updateCreatorClaim(claim.id, {
            status: status as CreatorClaim["status"],
            verificationDate: now,
            verificationEvidence: result.evidence || null,
            verificationNotes: result.notes || null,
          });
          console.log(
            `[CreatorPipeline]   ${status}: "${claim.claimText.slice(0, 60)}..."`,
          );
        }
      }
    } catch (err) {
      console.warn(
        `[CreatorPipeline]   Verification failed for claim ${claim.id}:`,
        err instanceof Error ? err.message : err,
      );
    }

    // Rate limit
    await delay(2000);
  }
}

// ============================================
// 7. RECALCULATE CREATOR SCORES
// ============================================

const CATEGORY_GROUPS: Record<string, string[]> = {
  price: ["price_prediction"],
  technical: ["technical_analysis"],
  regulatory: ["regulatory", "etf_approval"],
  partnership: ["partnership", "partnership_adoption"],
  technology: ["technology"],
  market: ["market_analysis", "market_prediction"],
};

function calculateAccuracy(
  verifiedTrue: number,
  verifiedFalse: number,
  partiallyTrue: number,
): number {
  const total = verifiedTrue + verifiedFalse + partiallyTrue;
  if (total === 0) return 0;
  return (
    Math.round(((verifiedTrue + partiallyTrue * 0.5) / total) * 1000) / 10
  );
}

function calculateTier(accuracy: number, totalScored: number): CreatorTier {
  if (totalScored < 5) return "unranked";
  if (accuracy >= 90) return "diamond";
  if (accuracy >= 75) return "gold";
  if (accuracy >= 60) return "silver";
  if (accuracy >= 50) return "bronze";
  return "unranked";
}

function calculateCategoryAccuracy(
  claims: Array<{ category: string; status: string }>,
): Record<string, number> {
  const result: Record<string, number> = {};

  for (const [displayCat, seedCats] of Object.entries(CATEGORY_GROUPS)) {
    const catClaims = claims.filter((c) => seedCats.includes(c.category));
    const scored = catClaims.filter((c) =>
      ["verified_true", "verified_false", "partially_true"].includes(c.status),
    );

    if (scored.length === 0) {
      result[displayCat] = 0;
      continue;
    }

    const trueCount = scored.filter(
      (c) => c.status === "verified_true",
    ).length;
    const partialCount = scored.filter(
      (c) => c.status === "partially_true",
    ).length;
    result[displayCat] = Math.round(
      ((trueCount + partialCount * 0.5) / scored.length) * 100,
    );
  }

  return result;
}

/**
 * Recalculate scores for all active creators based on their claims.
 */
export async function recalculateCreatorScores(
  storage: IStorage,
): Promise<void> {
  const creators = await storage.getCreators(true);

  console.log(
    `[CreatorPipeline] Recalculating scores for ${creators.length} creators`,
  );

  // Collect data for ranking
  const creatorData: Array<{
    creator: Creator;
    accuracy: number;
    totalScored: number;
    totalClaims: number;
    verifiedTrue: number;
    verifiedFalse: number;
    pending: number;
    categoryAccuracy: Record<string, number>;
  }> = [];

  for (const creator of creators) {
    const claims = await storage.getCreatorClaims({ creatorId: creator.id });

    const verifiedTrue = claims.filter(
      (c) => c.status === "verified_true",
    ).length;
    const verifiedFalse = claims.filter(
      (c) => c.status === "verified_false",
    ).length;
    const partiallyTrue = claims.filter(
      (c) => c.status === "partially_true",
    ).length;
    const pending = claims.filter((c) => c.status === "pending").length;
    const totalScored = verifiedTrue + verifiedFalse + partiallyTrue;

    const accuracy = calculateAccuracy(
      verifiedTrue,
      verifiedFalse,
      partiallyTrue,
    );
    const categoryAccuracy = calculateCategoryAccuracy(claims);

    creatorData.push({
      creator,
      accuracy,
      totalScored,
      totalClaims: claims.length,
      verifiedTrue,
      verifiedFalse,
      pending,
      categoryAccuracy,
    });
  }

  // Rank creators (only those with 5+ scored claims)
  const ranked = creatorData
    .filter((d) => d.totalScored >= 5)
    .sort((a, b) => {
      if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
      return b.totalClaims - a.totalClaims;
    });

  for (const d of creatorData) {
    const rankIndex = ranked.findIndex(
      (r) => r.creator.id === d.creator.id,
    );
    const newRank = rankIndex >= 0 ? rankIndex + 1 : null;
    const tier = calculateTier(d.accuracy, d.totalScored);
    const rankChange = d.creator.rankOverall
      ? d.creator.rankOverall - (newRank ?? d.creator.rankOverall)
      : 0;

    // Update creator record
    await storage.updateCreator(d.creator.id, {
      overallAccuracy: d.accuracy,
      totalClaims: d.totalClaims,
      verifiedTrue: d.verifiedTrue,
      verifiedFalse: d.verifiedFalse,
      pendingClaims: d.pending,
      tier,
      rankOverall: newRank,
      rankChange,
      priceAccuracy: d.categoryAccuracy.price ?? 0,
      timelineAccuracy: d.categoryAccuracy.technical ?? 0,
      regulatoryAccuracy: d.categoryAccuracy.regulatory ?? 0,
      partnershipAccuracy: d.categoryAccuracy.partnership ?? 0,
      technologyAccuracy: d.categoryAccuracy.technology ?? 0,
      marketAccuracy: d.categoryAccuracy.market ?? 0,
    });

    // Save score snapshot
    await storage.createCreatorScore({
      creatorId: d.creator.id,
      overallAccuracy: d.accuracy,
      priceAccuracy: d.categoryAccuracy.price ?? 0,
      timelineAccuracy: d.categoryAccuracy.technical ?? 0,
      regulatoryAccuracy: d.categoryAccuracy.regulatory ?? 0,
      partnershipAccuracy: d.categoryAccuracy.partnership ?? 0,
      technologyAccuracy: d.categoryAccuracy.technology ?? 0,
      marketAccuracy: d.categoryAccuracy.market ?? 0,
      totalClaimsScored: d.totalScored,
      claimsPending: d.pending,
      rankOverall: newRank ?? 0,
      rankChange,
    });

    console.log(
      `[CreatorPipeline]   ${d.creator.channelName}: accuracy=${d.accuracy}%, tier=${tier}, rank=${newRank ?? "unranked"}`,
    );
  }
}

// ============================================
// 8. EVALUATE DISPUTE
// ============================================

/**
 * Evaluate a dispute using Claude to analyze the evidence and claim context.
 */
export async function evaluateDispute(
  storage: IStorage,
  disputeId: string,
): Promise<void> {
  // Find the dispute by searching through claims
  let dispute: Dispute | undefined;

  const creators = await storage.getCreators();
  outer: for (const creator of creators) {
    const claims = await storage.getCreatorClaims({ creatorId: creator.id });
    for (const claim of claims) {
      const claimDisputes = await storage.getDisputesByClaimId(claim.id);
      dispute = claimDisputes.find((d) => d.id === disputeId);
      if (dispute) break outer;
    }
  }

  if (!dispute) {
    console.error(`[CreatorPipeline] Dispute ${disputeId} not found`);
    return;
  }

  if (!anthropic) {
    console.log(
      "[CreatorPipeline] No ANTHROPIC_API_KEY — cannot evaluate dispute",
    );
    return;
  }

  // Get the claim being disputed
  const claim = await storage.getCreatorClaim(dispute.claimId);
  if (!claim) {
    console.error(
      `[CreatorPipeline] Claim ${dispute.claimId} not found for dispute`,
    );
    return;
  }

  // Get the video for context
  const video = await storage.getCreatorVideo(claim.videoId);

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 2048,
      system: `You are a dispute analyst for Confirmd, a creator claim tracking platform. Evaluate whether a dispute against an extracted claim is valid.

Dispute types:
- never_said: Creator never made this claim in the video
- misquoted: The claim text doesn't accurately represent what was said
- out_of_context: The claim was taken out of context
- wrong_creator: The claim was attributed to the wrong creator

Analyze the evidence and respond with JSON:
{
  "recommendation": "upheld" | "rejected" | "under_investigation",
  "confidence": 0.0-1.0,
  "analysis": "Detailed reasoning for the decision"
}`,
      messages: [
        {
          role: "user",
          content: `DISPUTE TYPE: ${dispute.disputeType}
SUBMITTER NOTE: ${dispute.submitterNote || "None"}
EVIDENCE PROVIDED: ${dispute.evidence || "None"}

CLAIM TEXT: ${claim.claimText}
CLAIM CATEGORY: ${claim.category}
VIDEO: ${video?.title || "Unknown"} (${video?.youtubeVideoId || "Unknown"})
TRANSCRIPT EXCERPT: ${video?.transcriptText?.slice(0, 2000) || "Not available"}

Evaluate this dispute and provide your recommendation.`,
        },
      ],
    });

    let responseText = "";
    for (const block of response.content) {
      if (block.type === "text") responseText += block.text;
    }

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      const validStatuses = ["upheld", "rejected", "under_investigation"];
      const status = validStatuses.includes(result.recommendation)
        ? result.recommendation
        : "under_investigation";

      await storage.updateDispute(disputeId, {
        status: status as Dispute["status"],
        aiAnalysis: result.analysis || null,
        aiConfidence:
          typeof result.confidence === "number"
            ? Math.max(0, Math.min(1, result.confidence))
            : null,
        resolvedAt: status !== "under_investigation" ? new Date() : null,
      });

      // If dispute is upheld, update the claim status
      if (status === "upheld") {
        await storage.updateCreatorClaim(claim.id, {
          status: "unverifiable",
          verificationNotes: `Dispute upheld: ${dispute.disputeType}. ${result.analysis || ""}`,
        });
      }

      console.log(
        `[CreatorPipeline] Dispute ${disputeId} evaluated: ${status} (confidence: ${result.confidence})`,
      );
    }
  } catch (err) {
    console.error(
      `[CreatorPipeline] Dispute evaluation failed:`,
      err instanceof Error ? err.message : err,
    );
  }
}
