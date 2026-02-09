import { Router, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import { storage } from "./storage.js";
import { validateCommunityEvidence } from "./pipeline.js";
import { pipeline } from "./pipeline-instance.js";
import { runCreatorPipeline, evaluateDispute } from "./creator-pipeline.js";
import { generateSvgFallback, generateStoryImageAI, generateVideoThumbnail, getVideoThumbnailUrl, generateTierImages } from "./image-generator.js";
import type { Claim, Verdict, EvidenceItem, Resolution, Source, SourceScore, Creator, CreatorVideo, CreatorClaim, CreatorScore, Dispute } from "../shared/schema.js";

declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

const router = Router();

// ─── Tier gating middleware (permissive for now) ────────────────────
const TIER_RANK: Record<string, number> = { free: 0, tribune: 1, oracle: 2 };

function requireTier(minTier: string) {
  return async (req: Request, res: Response, next: Function) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    try {
      const user = await storage.getUserById(userId);
      let userTier = user?.subscriptionTier || "free";
      if (user?.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt) < new Date()) {
        userTier = "free";
      }
      if ((TIER_RANK[userTier] ?? 0) < (TIER_RANK[minTier] ?? 0)) {
        return res.status(403).json({ error: `Requires ${minTier} subscription` });
      }
      next();
    } catch {
      next();
    }
  };
}

// Helper to safely extract a single route param
function param(req: Request, name: string): string {
  const val = req.params[name];
  return Array.isArray(val) ? val[0] : val;
}

// ─── Helper: Build enriched claim response ─────────────────────────

interface EnrichedClaim {
  id: string;
  claimText: string;
  claimType: string;
  assetSymbols: string[] | null;
  assertedAt: Date | string;
  resolveBy: Date | string | null;
  resolutionType: string;
  falsifiabilityScore: number | null;
  llmConfidence: number | null;
  status: string;
  createdAt: Date | null;
  source: {
    id: string;
    displayName: string;
    handleOrDomain: string;
    logo: string;
    logoUrl: string | null;
    type: string;
    score: {
      trackRecord: number;
      methodDiscipline: number;
      sampleSize: number;
      confidenceInterval: { lower: number; upper: number };
    } | null;
  } | null;
  verdict: {
    verdictLabel: string;
    probabilityTrue: number | null;
    evidenceStrength: number | null;
    reasoningSummary: string | null;
    invalidationTriggers: string | null;
  } | null;
  evidenceCount: number;
  resolution: {
    outcome: string;
    resolvedAt: Date | null;
    notes: string | null;
    evidenceUrl: string | null;
  } | null;
}

async function enrichClaim(claim: Claim): Promise<EnrichedClaim> {
  const [source, verdict, evidence, resolution, sourceScore] = await Promise.all([
    storage.getSource(claim.sourceId),
    storage.getVerdictByClaim(claim.id),
    storage.getEvidenceByClaim(claim.id),
    storage.getResolutionByClaim(claim.id),
    storage.getSource(claim.sourceId).then((s) =>
      s ? storage.getSourceScore(s.id) : undefined
    ),
  ]);

  // Derive a logo abbreviation from the source name
  const logoAbbrev = source
    ? source.displayName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 3)
    : "?";

  return {
    id: claim.id,
    claimText: claim.claimText,
    claimType: claim.claimType,
    assetSymbols: claim.assetSymbols,
    assertedAt: claim.assertedAt,
    resolveBy: claim.resolveBy,
    resolutionType: claim.resolutionType,
    falsifiabilityScore: claim.falsifiabilityScore,
    llmConfidence: claim.llmConfidence,
    status: claim.status,
    createdAt: claim.createdAt,
    source: source
      ? {
          id: source.id,
          displayName: source.displayName,
          handleOrDomain: source.handleOrDomain,
          logo: logoAbbrev,
          logoUrl: source.logoUrl || null,
          type: source.type,
          score: sourceScore
            ? {
                trackRecord: sourceScore.trackRecord,
                methodDiscipline: sourceScore.methodDiscipline,
                sampleSize: sourceScore.sampleSize,
                confidenceInterval: sourceScore.confidenceInterval,
              }
            : null,
        }
      : null,
    verdict: verdict
      ? {
          verdictLabel: verdict.verdictLabel,
          probabilityTrue: verdict.probabilityTrue,
          evidenceStrength: verdict.evidenceStrength,
          reasoningSummary: verdict.reasoningSummary,
          invalidationTriggers: verdict.invalidationTriggers,
        }
      : null,
    evidenceCount: evidence.length,
    resolution: resolution
      ? {
          outcome: resolution.outcome,
          resolvedAt: resolution.resolvedAt,
          notes: resolution.notes,
          evidenceUrl: resolution.resolutionEvidenceUrl,
        }
      : null,
  };
}

// ─── GET /claims ────────────────────────────────────────────────────

router.get("/claims", async (req: Request, res: Response) => {
  try {
    const { asset, verdict, status, sort, limit, offset } = req.query;

    const claims = await storage.getClaims({
      asset: asset as string | undefined,
      verdict: verdict as string | undefined,
      status: status as string | undefined,
      sort: (sort as "newest" | "oldest" | "confidence") ?? "newest",
      limit: limit ? parseInt(limit as string, 10) : 50,
      offset: offset ? parseInt(offset as string, 10) : 0,
    });

    const enriched = await Promise.all(claims.map(enrichClaim));

    res.json({
      data: enriched,
      meta: {
        total: enriched.length,
        limit: limit ? parseInt(limit as string, 10) : 50,
        offset: offset ? parseInt(offset as string, 10) : 0,
      },
    });
  } catch (err) {
    console.error("GET /claims error:", err);
    res.status(500).json({ error: "Failed to fetch claims" });
  }
});

// ─── GET /claims/:id ────────────────────────────────────────────────

router.get("/claims/:id", async (req: Request, res: Response) => {
  try {
    const claimId = param(req, "id");
    const claim = await storage.getClaim(claimId);
    if (!claim) {
      res.status(404).json({ error: "Claim not found" });
      return;
    }

    const [source, verdict, evidence, resolution] = await Promise.all([
      storage.getSource(claim.sourceId),
      storage.getVerdictByClaim(claim.id),
      storage.getEvidenceByClaim(claim.id),
      storage.getResolutionByClaim(claim.id),
    ]);

    const sourceScore = source
      ? await storage.getSourceScore(source.id)
      : undefined;

    const logoAbbrev = source
      ? source.displayName
          .split(" ")
          .map((w) => w[0])
          .join("")
          .toUpperCase()
          .slice(0, 3)
      : "?";

    res.json({
      id: claim.id,
      claimText: claim.claimText,
      claimType: claim.claimType,
      assetSymbols: claim.assetSymbols,
      assertedAt: claim.assertedAt,
      resolveBy: claim.resolveBy,
      resolutionType: claim.resolutionType,
      falsifiabilityScore: claim.falsifiabilityScore,
      llmConfidence: claim.llmConfidence,
      status: claim.status,
      createdAt: claim.createdAt,
      metadata: claim.metadata,
      source: source
        ? {
            id: source.id,
            displayName: source.displayName,
            logo: logoAbbrev,
            logoUrl: source.logoUrl || null,
            type: source.type,
            handleOrDomain: source.handleOrDomain,
            score: sourceScore
              ? {
                  trackRecord: sourceScore.trackRecord,
                  methodDiscipline: sourceScore.methodDiscipline,
                  sampleSize: sourceScore.sampleSize,
                  confidenceInterval: sourceScore.confidenceInterval,
                }
              : null,
          }
        : null,
      verdict: verdict
        ? {
            id: verdict.id,
            verdictLabel: verdict.verdictLabel,
            probabilityTrue: verdict.probabilityTrue,
            evidenceStrength: verdict.evidenceStrength,
            reasoningSummary: verdict.reasoningSummary,
            invalidationTriggers: verdict.invalidationTriggers,
            model: verdict.model,
            promptVersion: verdict.promptVersion,
            keyEvidenceIds: verdict.keyEvidenceIds,
            createdAt: verdict.createdAt,
          }
        : null,
      evidence: evidence.map((e) => ({
        id: e.id,
        url: e.url,
        publisher: e.publisher,
        publishedAt: e.publishedAt,
        excerpt: e.excerpt,
        stance: e.stance,
        grade: e.evidenceGrade,
        primaryFlag: e.primaryFlag,
      })),
      resolution: resolution
        ? {
            id: resolution.id,
            outcome: resolution.outcome,
            resolvedAt: resolution.resolvedAt,
            notes: resolution.notes,
            evidenceUrl: resolution.resolutionEvidenceUrl,
          }
        : null,
    });
  } catch (err) {
    console.error("GET /claims/:id error:", err);
    res.status(500).json({ error: "Failed to fetch claim" });
  }
});

// ─── GET /sources ───────────────────────────────────────────────────

router.get("/sources", async (_req: Request, res: Response) => {
  try {
    const sources = await storage.getSources();

    const enrichedSources = await Promise.all(
      sources.map(async (source) => {
        const score = await storage.getSourceScore(source.id);
        const logoAbbrev = source.displayName
          .split(" ")
          .map((w) => w[0])
          .join("")
          .toUpperCase()
          .slice(0, 3);

        return {
          id: source.id,
          type: source.type,
          handleOrDomain: source.handleOrDomain,
          displayName: source.displayName,
          logo: logoAbbrev,
          logoUrl: source.logoUrl,
          score: score
            ? {
                trackRecord: score.trackRecord,
                methodDiscipline: score.methodDiscipline,
                sampleSize: score.sampleSize,
                confidenceInterval: score.confidenceInterval,
              }
            : null,
          createdAt: source.createdAt,
        };
      })
    );

    // Sort by trackRecord descending (highest credibility first)
    enrichedSources.sort((a, b) => {
      const atr = a.score?.trackRecord ?? 0;
      const btr = b.score?.trackRecord ?? 0;
      return btr - atr;
    });

    res.json({ data: enrichedSources });
  } catch (err) {
    console.error("GET /sources error:", err);
    res.status(500).json({ error: "Failed to fetch sources" });
  }
});

// ─── GET /sources/feed ─────────────────────────────────────────────

router.get("/sources/feed", async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const claims = await storage.getClaims({
      sort: "newest",
      limit,
      offset,
    });

    const enriched = await Promise.all(claims.map(enrichClaim));

    res.json({ data: enriched });
  } catch (err) {
    console.error("GET /sources/feed error:", err);
    res.status(500).json({ error: "Failed to fetch source feed" });
  }
});

// ─── GET /sources/leaderboard ──────────────────────────────────────

router.get("/sources/leaderboard", async (req: Request, res: Response) => {
  try {
    const sources = await storage.getSources();

    const ranked = await Promise.all(
      sources.map(async (source) => {
        const score = await storage.getSourceScore(source.id);
        const claims = await storage.getClaimsBySource(source.id);
        const logoAbbrev = source.displayName
          .split(" ")
          .map((w) => w[0])
          .join("")
          .toUpperCase()
          .slice(0, 3);

        return {
          id: source.id,
          displayName: source.displayName,
          handleOrDomain: source.handleOrDomain,
          logoUrl: source.logoUrl,
          logo: logoAbbrev,
          type: source.type,
          trackRecord: score?.trackRecord ?? 0,
          methodDiscipline: score?.methodDiscipline ?? 0,
          sampleSize: score?.sampleSize ?? 0,
          confidenceInterval: score?.confidenceInterval ?? null,
          claimCount: claims.length,
        };
      })
    );

    // Filter to sources with scores and sort by trackRecord desc
    const sorted = ranked
      .filter((s) => s.trackRecord > 0)
      .sort((a, b) => b.trackRecord - a.trackRecord)
      .map((s, i) => ({ ...s, rank: i + 1, rankChange: 0 }));

    res.json({ data: sorted });
  } catch (err) {
    console.error("GET /sources/leaderboard error:", err);
    res.status(500).json({ error: "Failed to fetch source leaderboard" });
  }
});

// ─── GET /sources/:id ───────────────────────────────────────────────

router.get("/sources/:id", async (req: Request, res: Response) => {
  try {
    const sourceId = param(req, "id");
    const source = await storage.getSource(sourceId);
    if (!source) {
      res.status(404).json({ error: "Source not found" });
      return;
    }

    const [score, claims] = await Promise.all([
      storage.getSourceScore(source.id),
      storage.getClaimsBySource(source.id),
    ]);

    // Sort claims by assertedAt descending and take the 10 most recent
    const recentClaims = claims
      .sort(
        (a, b) =>
          new Date(b.assertedAt).getTime() - new Date(a.assertedAt).getTime()
      )
      .slice(0, 10);

    const enrichedClaims = await Promise.all(recentClaims.map(enrichClaim));

    const logoAbbrev = source.displayName
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 3);

    res.json({
      id: source.id,
      type: source.type,
      handleOrDomain: source.handleOrDomain,
      displayName: source.displayName,
      logo: logoAbbrev,
      logoUrl: source.logoUrl,
      metadata: source.metadata,
      createdAt: source.createdAt,
      score: score
        ? {
            trackRecord: score.trackRecord,
            methodDiscipline: score.methodDiscipline,
            sampleSize: score.sampleSize,
            confidenceInterval: score.confidenceInterval,
            computedAt: score.computedAt,
            scoreVersion: score.scoreVersion,
          }
        : null,
      recentClaims: enrichedClaims,
    });
  } catch (err) {
    console.error("GET /sources/:id error:", err);
    res.status(500).json({ error: "Failed to fetch source" });
  }
});

// ─── GET /stories ───────────────────────────────────────────────────

router.get("/stories", async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const category = req.query.category as string | undefined;
    const asset = req.query.asset as string | undefined;

    let feedItems = await storage.getStoriesForFeed(limit, offset);

    // Filter by category if provided
    if (category) {
      feedItems = feedItems.filter(s => s.category?.toLowerCase() === category.toLowerCase());
    }

    // Filter by asset if provided
    if (asset) {
      const assetUpper = asset.toUpperCase();
      feedItems = feedItems.filter(s => s.assetSymbols.some(a => a.toUpperCase() === assetUpper));
    }

    // Add singleSource flag and ensure every story has an imageUrl
    const data = feedItems.map(s => ({
      ...s,
      imageUrl: s.imageUrl || `/api/stories/${s.id}/image`,
      singleSource: s.sourceCount <= 1,
    }));

    res.json({ data });
  } catch (err) {
    console.error("Error fetching stories for feed:", (err as Error).message);
    res.status(500).json({ error: "Failed to fetch stories" });
  }
});

// ─── GET /stories/:id/image — SVG fallback image ──────────────────

router.get("/stories/:id/image", async (req: Request, res: Response) => {
  try {
    const storyId = param(req, "id");
    const story = await storage.getStory(storyId);

    const params = {
      id: storyId,
      title: story?.title || "Crypto News",
      category: story?.category,
      assetSymbols: story?.assetSymbols ?? [],
    };

    const svg = generateSvgFallback(params);

    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send(svg);
  } catch {
    res.status(500).send("");
  }
});

// ─── GET /stories/:id ──────────────────────────────────────────────

router.get("/stories/:id", async (req: Request, res: Response) => {
  try {
    const storyId = param(req, "id");
    const storyWithClaims = await storage.getStoryWithClaims(storyId);
    if (!storyWithClaims) {
      res.status(404).json({ error: "Story not found" });
      return;
    }

    const { story, claims } = storyWithClaims;

    const enrichedClaims = await Promise.all(claims.map(enrichClaim));

    // ── Build source-grouped coverage view ──────────────────────────
    // For each claim, look up its originating item and source, then
    // group items by source so the frontend can show a "coverage" list.
    const sourceMap = new Map<
      string,
      {
        source: {
          id: string;
          displayName: string;
          logoUrl: string | null;
          trackRecord: number | null;
          tier: "high" | "medium" | "low";
        };
        items: Array<{
          id: string;
          title: string | null;
          url: string | null;
          publishedAt: Date | null;
        }>;
      }
    >();

    const credibilityDistribution = { high: 0, medium: 0, low: 0 };
    const seenItemIds = new Set<string>();

    for (const claim of claims) {
      const item = await storage.getItem(claim.itemId);
      if (!item) continue;
      // Deduplicate items across claims
      if (seenItemIds.has(item.id)) continue;
      seenItemIds.add(item.id);

      if (!sourceMap.has(item.sourceId)) {
        const source = await storage.getSource(item.sourceId);
        if (!source) continue;

        const score = await storage.getSourceScore(source.id);
        const trackRecord = score?.trackRecord ?? null;
        const tier: "high" | "medium" | "low" =
          trackRecord !== null && trackRecord >= 70
            ? "high"
            : trackRecord !== null && trackRecord >= 50
              ? "medium"
              : "low";

        sourceMap.set(item.sourceId, {
          source: {
            id: source.id,
            displayName: source.displayName,
            logoUrl: source.logoUrl ?? null,
            trackRecord,
            tier,
          },
          items: [],
        });
      }

      sourceMap.get(item.sourceId)!.items.push({
        id: item.id,
        title: item.title ?? null,
        url: item.url ?? null,
        publishedAt: item.publishedAt ?? null,
      });
    }

    // Tally credibility distribution from unique sources
    for (const entry of sourceMap.values()) {
      credibilityDistribution[entry.source.tier] += 1;
    }

    const coverage = Array.from(sourceMap.values());

    // ── Verdict distribution ────────────────────────────────────────
    const verdictDistribution: Record<string, number> = {};
    for (const claim of claims) {
      const verdict = await storage.getVerdictByClaim(claim.id);
      if (verdict) {
        const label = verdict.verdictLabel;
        verdictDistribution[label] = (verdictDistribution[label] || 0) + 1;
      }
    }

    // ── Related creator predictions ─────────────────────────────────
    const storyAssets = (story.assetSymbols ?? []).map(a => a.toUpperCase());
    let creatorPredictions: Array<{ claim: CreatorClaim; creator: Creator }> = [];

    if (storyAssets.length > 0) {
      const allCreatorClaims = await storage.getCreatorClaims({ limit: 100 });
      const matching = allCreatorClaims.filter(cc =>
        (cc.assetSymbols ?? []).some(a => storyAssets.includes(a.toUpperCase()))
      );

      // Enrich with creator data, limit to 5
      const results: Array<{ claim: CreatorClaim; creator: Creator }> = [];
      for (const cc of matching.slice(0, 5)) {
        const creator = await storage.getCreator(cc.creatorId);
        if (creator) {
          results.push({ claim: cc, creator });
        }
      }
      creatorPredictions = results;
    }

    res.json({
      id: story.id,
      title: story.title,
      summary: story.summary,
      imageUrl: story.imageUrl || `/api/stories/${story.id}/image`,
      category: story.category,
      assetSymbols: story.assetSymbols ?? [],
      credibilityDistribution,
      coverage,
      claims: enrichedClaims,
      verdictDistribution,
      creatorPredictions,
    });
  } catch (err) {
    console.error("GET /stories/:id error:", err);
    res.status(500).json({ error: "Failed to fetch story" });
  }
});

// ─── GET /evidence/:claimId ─────────────────────────────────────────

router.get("/evidence/:claimId", async (req: Request, res: Response) => {
  try {
    const claimId = param(req, "claimId");
    const claim = await storage.getClaim(claimId);
    if (!claim) {
      res.status(404).json({ error: "Claim not found" });
      return;
    }

    const evidence = await storage.getEvidenceByClaim(claimId);

    res.json({
      claimId,
      data: evidence.map((e) => ({
        id: e.id,
        url: e.url,
        publisher: e.publisher,
        publishedAt: e.publishedAt,
        excerpt: e.excerpt,
        stance: e.stance,
        grade: e.evidenceGrade,
        primaryFlag: e.primaryFlag,
        retrievedAt: e.retrievedAt,
      })),
    });
  } catch (err) {
    console.error("GET /evidence/:claimId error:", err);
    res.status(500).json({ error: "Failed to fetch evidence" });
  }
});

// ─── POST /evidence/:claimId/submit ─────────────────────────────────

router.post("/evidence/:claimId/submit", async (req: Request, res: Response) => {
  try {
    const claimId = param(req, "claimId");
    const { url, notes } = req.body || {};

    if (!url || typeof url !== "string") {
      res.status(400).json({ error: "URL is required" });
      return;
    }

    try {
      new URL(url);
    } catch {
      res.status(400).json({ error: "Invalid URL format" });
      return;
    }

    const claim = await storage.getClaim(claimId);
    if (!claim) {
      res.status(404).json({ error: "Claim not found" });
      return;
    }

    const existingEvidence = await storage.getEvidenceByClaim(claimId);
    if (existingEvidence.some((e) => e.url === url)) {
      res.status(409).json({ error: "This URL has already been submitted as evidence for this claim" });
      return;
    }

    const result = await validateCommunityEvidence(
      url,
      notes,
      claim.claimText,
      claim.claimType,
      existingEvidence.map((e) => ({
        url: e.url,
        publisher: e.publisher || "",
        excerpt: e.excerpt,
        grade: e.evidenceGrade,
        stance: e.stance,
        primaryFlag: e.primaryFlag || false,
      })),
    );

    if (!result.accepted || !result.evidence) {
      res.status(422).json({
        error: "Evidence rejected",
        reason: result.reason || "Content was not relevant to the claim",
      });
      return;
    }

    const storedEvidence = await storage.createEvidence({
      claimId,
      url: result.evidence.url,
      publisher: result.evidence.publisher,
      excerpt: result.evidence.excerpt,
      stance: result.evidence.stance as any,
      evidenceGrade: result.evidence.grade as any,
      primaryFlag: result.evidence.primaryFlag,
      metadata: {
        communitySubmitted: true,
        submittedAt: new Date().toISOString(),
        submitterNotes: notes || null,
      },
    });

    if (result.verdict) {
      await storage.deleteVerdictByClaim(claimId);
      const allEvidence = await storage.getEvidenceByClaim(claimId);
      await storage.createVerdict({
        claimId,
        model: "community-recalc",
        promptVersion: "v1.0.0",
        verdictLabel: result.verdict.verdictLabel as any,
        probabilityTrue: result.verdict.probabilityTrue,
        evidenceStrength: result.verdict.evidenceStrength,
        keyEvidenceIds: allEvidence.map((e) => e.id),
        reasoningSummary: result.verdict.reasoningSummary,
        invalidationTriggers: result.verdict.invalidationTriggers,
      });
    }

    res.status(201).json({
      message: "Evidence accepted",
      evidence: {
        id: storedEvidence.id,
        url: storedEvidence.url,
        publisher: storedEvidence.publisher,
        excerpt: storedEvidence.excerpt,
        stance: storedEvidence.stance,
        grade: storedEvidence.evidenceGrade,
        primaryFlag: storedEvidence.primaryFlag,
      },
      verdictUpdated: !!result.verdict,
    });
  } catch (err) {
    console.error("POST /evidence/:claimId/submit error:", err);
    res.status(500).json({ error: "Failed to process evidence submission" });
  }
});

// ─── GET /claims/:id/verdict-history ─────────────────────────────────

router.get("/claims/:id/verdict-history", async (req: Request, res: Response) => {
  try {
    const verdicts = await storage.getVerdictHistoryByClaim(param(req, "id"));
    res.json({ data: verdicts });
  } catch (err) {
    console.error("Error fetching verdict history:", (err as Error).message);
    res.status(500).json({ error: "Failed to fetch verdict history" });
  }
});

// ─── GET /pipeline/status ───────────────────────────────────────────

router.get("/pipeline/status", async (_req: Request, res: Response) => {
  try {
    const stats = await storage.getPipelineStats();
    res.json(stats);
  } catch (err) {
    console.error("GET /pipeline/status error:", err);
    res.status(500).json({ error: "Failed to fetch pipeline status" });
  }
});

// ─── POST /pipeline/run ─────────────────────────────────────────────

router.post("/pipeline/run", async (_req: Request, res: Response) => {
  try {
    const status = pipeline.getStatus();
    if (status.isRunning) {
      res.status(409).json({
        error: "Pipeline is already running",
        startedAt: status.lastRunAt?.toISOString() ?? null,
      });
      return;
    }

    storage.setLastPipelineRun(new Date().toISOString());

    // Trigger the pipeline asynchronously — don't await so we return 202 immediately
    pipeline.runDailyBatch().catch((err) => {
      console.error("[Pipeline] Manual run failed:", err);
    });

    res.status(202).json({
      message: "Pipeline run accepted",
      startedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("POST /pipeline/run error:", err);
    res.status(500).json({ error: "Failed to trigger pipeline run" });
  }
});

// ─── GET /health ────────────────────────────────────────────────────

router.get("/health", async (_req: Request, res: Response) => {
  const stats = await storage.getPipelineStats();
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    data: {
      sources: stats.totalSources,
      claims: stats.totalClaims,
      stories: stats.totalStories,
    },
  });
});

// ─── Auth Routes ────────────────────────────────────────────────────

router.post("/auth/signup", async (req: Request, res: Response) => {
  try {
    const { email, password, displayName } = req.body || {};

    if (!email || !password || !displayName) {
      res.status(400).json({ error: "Email, password, and display name are required" });
      return;
    }

    if (typeof email !== "string" || typeof password !== "string" || typeof displayName !== "string") {
      res.status(400).json({ error: "Invalid input types" });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ error: "Password must be at least 8 characters" });
      return;
    }

    const existing = await storage.getUserByEmail(email);
    if (existing) {
      res.status(409).json({ error: "An account with this email already exists" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await storage.createUser({ email, passwordHash, displayName });

    req.session.userId = user.id;
    res.status(201).json({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      subscriptionTier: user.subscriptionTier,
      createdAt: user.createdAt,
    });
  } catch (err) {
    console.error("POST /auth/signup error:", err);
    res.status(500).json({ error: "Failed to create account" });
  }
});

router.post("/auth/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const user = await storage.getUserByEmail(email);
    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    req.session.userId = user.id;
    res.json({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      subscriptionTier: user.subscriptionTier,
      createdAt: user.createdAt,
    });
  } catch (err) {
    console.error("POST /auth/login error:", err);
    res.status(500).json({ error: "Failed to log in" });
  }
});

router.post("/auth/logout", (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("POST /auth/logout error:", err);
      res.status(500).json({ error: "Failed to log out" });
      return;
    }
    res.json({ ok: true });
  });
});

router.get("/auth/me", async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      res.json(null);
      return;
    }

    const user = await storage.getUserById(userId);
    if (!user) {
      res.json(null);
      return;
    }

    const effectiveTier = (user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt) < new Date())
      ? "free" : user.subscriptionTier;

    res.json({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      subscriptionTier: effectiveTier,
      subscriptionExpiresAt: user.subscriptionExpiresAt,
      createdAt: user.createdAt,
    });
  } catch (err) {
    console.error("GET /auth/me error:", err);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// ─── GET /creators/feed (mixed feed — NOT tier-gated) ───────────────

router.get("/creators/feed", async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const claims = await storage.getCreatorClaims({ limit, offset });

    // Fetch recent stories for relatedStoryId matching
    const recentStories = await storage.getStoriesForFeed(100, 0);

    const data = await Promise.all(
      claims.map(async (cc) => {
        const [creator, video] = await Promise.all([
          storage.getCreator(cc.creatorId),
          storage.getCreatorVideo(cc.videoId),
        ]);

        // Find a related story by overlapping asset symbols
        let relatedStoryId: string | null = null;
        const claimAssets = (cc.assetSymbols ?? []).map(a => a.toUpperCase());
        if (claimAssets.length > 0) {
          const match = recentStories.find(s =>
            s.assetSymbols.some(a => claimAssets.includes(a.toUpperCase()))
          );
          if (match) relatedStoryId = match.id;
        }

        // Prefer AI-generated thumbnail over the one stored in the DB
        const aiThumbnail = video ? getVideoThumbnailUrl(video.id) : null;

        return {
          id: cc.id,
          type: "creator_prediction" as const,
          claimText: cc.claimText,
          category: cc.category,
          confidenceLanguage: cc.confidenceLanguage,
          statedTimeframe: cc.statedTimeframe ?? null,
          status: cc.status,
          assetSymbols: cc.assetSymbols ?? [],
          createdAt: cc.createdAt?.toISOString() ?? new Date().toISOString(),
          creator: creator
            ? {
                id: creator.id,
                channelName: creator.channelName,
                avatarUrl: creator.avatarUrl ?? null,
                tier: creator.tier,
                overallAccuracy: creator.overallAccuracy ?? 0,
                totalClaims: creator.totalClaims ?? 0,
              }
            : null,
          video: video
            ? {
                id: video.id,
                title: video.title,
                youtubeVideoId: video.youtubeVideoId,
                thumbnailUrl: aiThumbnail ?? video.thumbnailUrl ?? null,
              }
            : null,
          relatedStoryId,
        };
      })
    );

    // Filter out entries with missing creator or video
    res.json({ data: data.filter(d => d.creator && d.video) });
  } catch (err) {
    console.error("GET /creators/feed error:", err);
    res.status(500).json({ error: "Failed to fetch creator feed" });
  }
});

// ─── GET /creators ──────────────────────────────────────────────────

router.get("/creators", requireTier("tribune"), async (req: Request, res: Response) => {
  try {
    const activeOnly = req.query.active === "true";
    const niche = req.query.niche as string | undefined;
    const sort = req.query.sort as string | undefined;

    let creators = await storage.getCreators(activeOnly || undefined);

    if (niche) {
      creators = creators.filter((c) => c.primaryNiche === niche);
    }

    if (sort === "accuracy") {
      creators.sort((a, b) => (b.overallAccuracy ?? 0) - (a.overallAccuracy ?? 0));
    } else if (sort === "claims") {
      creators.sort((a, b) => (b.totalClaims ?? 0) - (a.totalClaims ?? 0));
    } else if (sort === "newest") {
      creators.sort(
        (a, b) =>
          new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
      );
    }

    res.json({ data: creators });
  } catch (err) {
    console.error("GET /creators error:", err);
    res.status(500).json({ error: "Failed to fetch creators" });
  }
});

// ─── GET /creators/leaderboard ──────────────────────────────────────

router.get("/creators/leaderboard", async (_req: Request, res: Response) => {
  try {
    const creators = await storage.getCreators();

    const ranked = creators
      .filter((c) => (c.totalClaims ?? 0) >= 5)
      .sort((a, b) => (b.overallAccuracy ?? 0) - (a.overallAccuracy ?? 0))
      .map((c, i) => ({
        ...c,
        rank: i + 1,
        rankChange: c.rankChange ?? 0,
      }));

    res.json({ data: ranked });
  } catch (err) {
    console.error("GET /creators/leaderboard error:", err);
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

// ─── GET /creators/:id ──────────────────────────────────────────────

router.get("/creators/:id", requireTier("tribune"), async (req: Request, res: Response) => {
  try {
    const creatorId = param(req, "id");
    const creator = await storage.getCreator(creatorId);
    if (!creator) {
      res.status(404).json({ error: "Creator not found" });
      return;
    }

    const [rawVideos, claims, scoreHistory] = await Promise.all([
      storage.getCreatorVideos(creatorId, 10),
      storage.getCreatorClaims({ creatorId, limit: 20 }),
      storage.getCreatorScoreHistory(creatorId),
    ]);

    // Enrich videos with AI-generated thumbnails when available
    const videos = rawVideos.map(v => ({
      ...v,
      thumbnailUrl: getVideoThumbnailUrl(v.id) ?? v.thumbnailUrl,
    }));

    res.json({ creator, videos, claims, scoreHistory });
  } catch (err) {
    console.error("GET /creators/:id error:", err);
    res.status(500).json({ error: "Failed to fetch creator" });
  }
});

// ─── GET /creators/:id/claims ───────────────────────────────────────

router.get("/creators/:id/claims", requireTier("tribune"), async (req: Request, res: Response) => {
  try {
    const creatorId = param(req, "id");
    const status = req.query.status as string | undefined;
    const category = req.query.category as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

    const claims = await storage.getCreatorClaims({ creatorId, status, category, limit, offset });

    res.json({ data: claims });
  } catch (err) {
    console.error("GET /creators/:id/claims error:", err);
    res.status(500).json({ error: "Failed to fetch creator claims" });
  }
});

// ─── POST /creators/pipeline/run ────────────────────────────────────

router.post("/creators/pipeline/run", async (_req: Request, res: Response) => {
  try {
    // Fire and forget
    runCreatorPipeline(storage).catch((err) => {
      console.error("[CreatorPipeline] Run failed:", err);
    });

    res.status(202).json({ message: "Creator pipeline started" });
  } catch (err) {
    console.error("POST /creators/pipeline/run error:", err);
    res.status(500).json({ error: "Failed to trigger creator pipeline" });
  }
});

// ─── POST /disputes ─────────────────────────────────────────────────

router.post("/disputes", requireTier("tribune"), async (req: Request, res: Response) => {
  try {
    const { claimId, disputeType, evidence, submitterNote } = req.body || {};

    if (!claimId || !disputeType) {
      res.status(400).json({ error: "claimId and disputeType are required" });
      return;
    }

    const claim = await storage.getCreatorClaim(claimId);
    if (!claim) {
      res.status(404).json({ error: "Creator claim not found" });
      return;
    }

    const dispute = await storage.createDispute({
      claimId,
      disputeType,
      evidence: evidence ?? null,
      submitterNote: submitterNote ?? null,
    });

    // Trigger AI evaluation in background
    evaluateDispute(storage, dispute.id).catch((err) => {
      console.error("[CreatorPipeline] Dispute evaluation failed:", err);
    });

    res.status(201).json({ data: dispute });
  } catch (err) {
    console.error("POST /disputes error:", err);
    res.status(500).json({ error: "Failed to create dispute" });
  }
});

// ─── GET /disputes/:claimId ─────────────────────────────────────────

router.get("/disputes/:claimId", requireTier("tribune"), async (req: Request, res: Response) => {
  try {
    const claimId = param(req, "claimId");
    const disputes = await storage.getDisputesByClaimId(claimId);

    res.json({ data: disputes });
  } catch (err) {
    console.error("GET /disputes/:claimId error:", err);
    res.status(500).json({ error: "Failed to fetch disputes" });
  }
});

// ─── POST /admin/regenerate-images ─────────────────────────────────
// Clears old external image URLs and sequentially generates AI images
// with a delay between each to avoid rate limits.

let regenRunning = false;

router.post("/admin/regenerate-images", async (req: Request, res: Response) => {
  try {
    if (regenRunning) {
      res.status(409).json({ error: "Regeneration already in progress" });
      return;
    }

    const force = req.query.force === "true";
    const stories = await storage.getStories();
    const toProcess = force ? stories : stories.filter(s => !s.imageUrl?.startsWith("/story-images/"));

    // Clear all old URLs immediately so SVG fallbacks show
    for (const story of toProcess) {
      await storage.updateStory(story.id, { imageUrl: null as any });
    }

    // Respond immediately, process in background
    res.json({
      message: `Processing ${toProcess.length} stories sequentially in background`,
      total: stories.length,
      skipped: stories.length - toProcess.length,
    });

    // Sequential background processing with delay
    regenRunning = true;
    (async () => {
      let success = 0;
      let failed = 0;
      for (const story of toProcess) {
        try {
          const aiUrl = await generateStoryImageAI(story.id, story.title, story.category, force);
          if (aiUrl) {
            await storage.updateStory(story.id, { imageUrl: aiUrl });
            success++;
          } else {
            await storage.updateStory(story.id, { imageUrl: `/api/stories/${story.id}/image` });
            failed++;
          }
        } catch {
          await storage.updateStory(story.id, { imageUrl: `/api/stories/${story.id}/image` });
          failed++;
        }
        // 3 second delay between requests to respect rate limits
        await new Promise(r => setTimeout(r, 3000));
      }
      console.log(`[RegenImages] Done: ${success} generated, ${failed} fell back to SVG`);
      regenRunning = false;
    })().catch(() => { regenRunning = false; });
  } catch (err) {
    console.error("POST /admin/regenerate-images error:", err);
    res.status(500).json({ error: "Failed to regenerate images" });
  }
});

// ─── POST /admin/regenerate-video-thumbnails ─────────────────────────
// Generates AI thumbnails for creator videos sequentially with delays.

let videoThumbRegenRunning = false;

router.post("/admin/regenerate-video-thumbnails", async (req: Request, res: Response) => {
  try {
    if (videoThumbRegenRunning) {
      res.status(409).json({ error: "Video thumbnail regeneration already in progress" });
      return;
    }

    const force = req.query.force === "true";
    const videos = await storage.getAllCreatorVideos();

    // Respond immediately, process in background
    res.json({
      message: `Processing ${videos.length} video thumbnails sequentially in background`,
      total: videos.length,
    });

    // Sequential background processing with delay
    videoThumbRegenRunning = true;
    (async () => {
      let success = 0;
      let failed = 0;
      for (const video of videos) {
        try {
          const creator = await storage.getCreator(video.creatorId);
          const channelName = creator?.channelName ?? "Unknown";
          const url = await generateVideoThumbnail(video.id, video.title, channelName, force);
          if (url) {
            await storage.updateCreatorVideo(video.id, { thumbnailUrl: url });
            success++;
          } else {
            failed++;
          }
        } catch {
          failed++;
        }
        // 3 second delay between requests to respect rate limits
        await new Promise(r => setTimeout(r, 3000));
      }
      console.log(`[RegenVideoThumbs] Done: ${success} generated, ${failed} failed`);
      videoThumbRegenRunning = false;
    })().catch(() => { videoThumbRegenRunning = false; });
  } catch (err) {
    console.error("POST /admin/regenerate-video-thumbnails error:", err);
    res.status(500).json({ error: "Failed to regenerate video thumbnails" });
  }
});

// ─── POST /admin/generate-tier-images ────────────────────────────────
// Generates AI images for subscription tier cards (Vantage, Premium, Pro).

router.post("/admin/generate-tier-images", async (_req: Request, res: Response) => {
  try {
    const results = await generateTierImages();
    res.json({
      message: "Tier image generation complete",
      results,
    });
  } catch (err) {
    console.error("POST /admin/generate-tier-images error:", err);
    res.status(500).json({ error: "Failed to generate tier images" });
  }
});

// ─── Gift Redemption & Validation ────────────────────────────────────

router.post("/gifts/redeem", async (req: Request, res: Response) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const { code } = req.body || {};
    if (!code || typeof code !== "string") {
      res.status(400).json({ error: "Gift code is required" });
      return;
    }

    const normalizedCode = code.trim().toUpperCase();
    const gift = await storage.getGiftByCode(normalizedCode);
    if (!gift) {
      res.status(404).json({ error: "Gift code not found" });
      return;
    }

    if (gift.status === "redeemed") {
      res.status(409).json({ error: "This gift code has already been redeemed" });
      return;
    }

    await storage.redeemGift(gift.id, userId);
    await storage.activateGiftSubscription(userId, gift.durationMonths);

    const user = await storage.getUserById(userId);

    res.json({
      success: true,
      durationMonths: gift.durationMonths,
      subscriptionTier: user?.subscriptionTier ?? "plus",
      subscriptionExpiresAt: user?.subscriptionExpiresAt ?? null,
    });
  } catch (err) {
    console.error("POST /gifts/redeem error:", err);
    res.status(500).json({ error: "Failed to redeem gift" });
  }
});

router.get("/gifts/validate/:code", async (req: Request, res: Response) => {
  try {
    const normalizedCode = param(req, "code").trim().toUpperCase();
    const gift = await storage.getGiftByCode(normalizedCode);

    if (!gift) {
      res.json({ valid: false, durationMonths: null, status: null });
      return;
    }

    res.json({
      valid: gift.status === "pending",
      durationMonths: gift.durationMonths,
      status: gift.status,
    });
  } catch (err) {
    console.error("GET /gifts/validate/:code error:", err);
    res.status(500).json({ error: "Failed to validate gift code" });
  }
});

// ─── Admin Routes ───────────────────────────────────────────────────

function requireAuth(req: Request, res: Response, next: Function) {
  if (!req.session?.userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  next();
}

// Stories
router.put("/admin/stories/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const storyId = param(req, "id");
    const story = await storage.getStory(storyId);
    if (!story) {
      res.status(404).json({ error: "Story not found" });
      return;
    }
    const { title, summary, category, imageUrl, assetSymbols } = req.body || {};
    const update: Record<string, any> = {};
    if (title !== undefined) update.title = title;
    if (summary !== undefined) update.summary = summary;
    if (category !== undefined) update.category = category;
    if (imageUrl !== undefined) update.imageUrl = imageUrl;
    if (assetSymbols !== undefined) update.assetSymbols = assetSymbols;
    await storage.updateStory(storyId, update);
    const updated = await storage.getStory(storyId);
    res.json(updated);
  } catch (err) {
    console.error("PUT /admin/stories/:id error:", err);
    res.status(500).json({ error: "Failed to update story" });
  }
});

router.delete("/admin/stories/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const storyId = param(req, "id");
    const deleted = await storage.deleteStory(storyId);
    if (!deleted) {
      res.status(404).json({ error: "Story not found" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    console.error("DELETE /admin/stories/:id error:", err);
    res.status(500).json({ error: "Failed to delete story" });
  }
});

// Claims
router.put("/admin/claims/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const claimId = param(req, "id");
    const claim = await storage.getClaim(claimId);
    if (!claim) {
      res.status(404).json({ error: "Claim not found" });
      return;
    }
    const { claimText, claimType, status, assetSymbols } = req.body || {};
    const update: Record<string, any> = {};
    if (claimText !== undefined) update.claimText = claimText;
    if (claimType !== undefined) update.claimType = claimType;
    if (status !== undefined) update.status = status;
    if (assetSymbols !== undefined) update.assetSymbols = assetSymbols;
    const updated = await storage.updateClaim(claimId, update);
    res.json(updated);
  } catch (err) {
    console.error("PUT /admin/claims/:id error:", err);
    res.status(500).json({ error: "Failed to update claim" });
  }
});

router.delete("/admin/claims/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const claimId = param(req, "id");
    const deleted = await storage.deleteClaim(claimId);
    if (!deleted) {
      res.status(404).json({ error: "Claim not found" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    console.error("DELETE /admin/claims/:id error:", err);
    res.status(500).json({ error: "Failed to delete claim" });
  }
});

// Verdicts (manual override — creates new record for audit trail)
router.put("/admin/verdicts/:claimId", requireAuth, async (req: Request, res: Response) => {
  try {
    const claimId = param(req, "claimId");
    const claim = await storage.getClaim(claimId);
    if (!claim) {
      res.status(404).json({ error: "Claim not found" });
      return;
    }
    const { verdictLabel, reasoningSummary, probabilityTrue } = req.body || {};
    if (!verdictLabel) {
      res.status(400).json({ error: "verdictLabel is required" });
      return;
    }
    const verdict = await storage.createVerdict({
      claimId,
      model: "manual_override",
      promptVersion: "admin",
      verdictLabel,
      reasoningSummary: reasoningSummary ?? null,
      probabilityTrue: probabilityTrue ?? null,
    });
    res.json(verdict);
  } catch (err) {
    console.error("PUT /admin/verdicts/:claimId error:", err);
    res.status(500).json({ error: "Failed to update verdict" });
  }
});

// Sources
router.put("/admin/sources/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const sourceId = param(req, "id");
    const source = await storage.getSource(sourceId);
    if (!source) {
      res.status(404).json({ error: "Source not found" });
      return;
    }
    const { displayName, logoUrl, metadata } = req.body || {};
    const update: Record<string, any> = {};
    if (displayName !== undefined) update.displayName = displayName;
    if (logoUrl !== undefined) update.logoUrl = logoUrl;
    if (metadata !== undefined) update.metadata = metadata;
    const updated = await storage.updateSource(sourceId, update);
    res.json(updated);
  } catch (err) {
    console.error("PUT /admin/sources/:id error:", err);
    res.status(500).json({ error: "Failed to update source" });
  }
});

// Pipeline trigger
router.post("/admin/pipeline/run", requireAuth, async (_req: Request, res: Response) => {
  try {
    const status = pipeline.getStatus();
    if (status.isRunning) {
      res.status(409).json({ error: "Pipeline is already running" });
      return;
    }
    storage.setLastPipelineRun(new Date().toISOString());
    pipeline.runDailyBatch().catch((err) => {
      console.error("[Pipeline] Admin-triggered run failed:", err);
    });
    res.json({ status: "started" });
  } catch (err) {
    console.error("POST /admin/pipeline/run error:", err);
    res.status(500).json({ error: "Failed to trigger pipeline" });
  }
});

// ─── Firmy AI Support Agent ─────────────────────────────────────────

const FIRMY_KNOWLEDGE: Record<string, { keywords: string[]; response: string; action?: string }> = {
  how_it_works: {
    keywords: ["how does", "how do", "what is confirmd", "what does confirmd", "how confirmd", "how works", "explain confirmd", "tell me about confirmd", "what is this"],
    response: "Confirmd is a crypto news verification platform. We track claims made by news sources and crypto influencers, then evaluate them using a rigorous evidence-based methodology.\n\nHere is how it works:\n\n1. **Claim Extraction** — We identify specific, falsifiable claims from crypto news articles, tweets, and YouTube videos.\n2. **Evidence Gathering** — Our pipeline collects supporting and contradicting evidence from multiple sources.\n3. **Verdict Generation** — Each claim receives a verdict (Confirmed, Likely True, Unverified, Likely False, or False) based on the weight of evidence.\n4. **Source Scoring** — We track each source's historical accuracy, building a credibility track record over time.\n5. **Creator Tracking** — We monitor crypto YouTubers and influencers, scoring their prediction accuracy.\n\nThe community can also submit evidence to help refine verdicts. Think of us as a fact-checking layer for the crypto information ecosystem.",
  },
  factuality_scoring: {
    keywords: ["factuality", "scoring", "how are scores", "methodology", "how do you score", "accuracy score", "track record", "credibility", "how is accuracy", "verdict system"],
    response: "Our factuality scoring system evaluates claims and sources on multiple dimensions:\n\n**Claim Verdicts:**\nEach claim receives a probability score (0-100%) representing the likelihood it is true, plus an evidence strength rating. Verdicts range from \"Confirmed\" to \"False\" based on available evidence.\n\n**Source Scores:**\n- **Track Record** — Historical accuracy across all tracked claims\n- **Method Discipline** — How well-sourced and rigorous the outlet's reporting is\n- **Sample Size** — Number of claims tracked (more data = more reliable score)\n- **Confidence Interval** — Statistical range showing how certain we are of the score\n\n**Creator Accuracy:**\nFor crypto YouTubers and influencers, we track specific predictions and grade them as they resolve. Overall accuracy is calculated as correct predictions divided by resolved predictions.\n\nYou can explore our full methodology at [/methodology](/methodology).",
  },
  billing: {
    keywords: ["billing", "subscription", "payment", "invoice", "charge", "price", "cost", "plan", "upgrade", "downgrade", "cancel", "refund"],
    response: "Here is what I can help you with regarding your subscription:\n\n- **View plans & upgrade** — Visit our [Plus page](/plus) to see available tiers and upgrade your account\n- **Manage subscription** — You can manage your current subscription, update payment methods, and view invoices from your account settings\n- **Cancel** — You can cancel anytime from your account settings. Your access continues until the end of your billing period\n\nIf you need help with a specific billing issue such as a failed payment or refund request, I would recommend submitting a support ticket so our team can assist you directly.",
    action: "show_billing_links",
  },
  subscription_manage: {
    keywords: ["manage my subscription", "change plan", "account settings", "my account", "my plan", "current plan"],
    response: "To manage your subscription:\n\n1. Click your profile icon in the top-right corner\n2. Select **Manage Subscription**\n3. From there you can upgrade, downgrade, or cancel your plan\n\nAlternatively, visit the [Plus page](/plus) to compare plans and make changes.\n\nIf you are not currently logged in, you will need to [sign in](/login) first.",
    action: "show_billing_links",
  },
  report_issue: {
    keywords: ["report", "issue", "bug", "problem", "broken", "error", "not working", "something wrong", "help me with"],
    response: "I am sorry to hear you are experiencing an issue. To make sure our team can investigate and resolve it properly, please fill out the form below with details about what you are experiencing.\n\nOur support team typically responds within 24 hours.",
    action: "show_escalation_form",
  },
  creators: {
    keywords: ["creator", "youtuber", "influencer", "youtube", "prediction", "leaderboard"],
    response: "Confirmd tracks crypto content creators — YouTubers, influencers, and analysts — by extracting specific predictions from their videos and scoring them as they resolve.\n\n- **Creator Claims** — Browse all tracked predictions at [/creator-claims](/creator-claims)\n- **Leaderboard** — See which creators have the best track records at [/leaderboard](/leaderboard)\n- **Individual Profiles** — Click on any creator to see their full prediction history and accuracy breakdown\n\nThis helps you make informed decisions about which crypto voices to trust.",
  },
  sources: {
    keywords: ["source", "news source", "outlet", "publisher", "media", "who do you track"],
    response: "We track a wide range of crypto news sources including major outlets, independent journalists, Twitter/X accounts, and research firms.\n\nEach source receives a credibility score based on their historical accuracy. You can browse all tracked sources and their scores at [/sources](/sources).\n\nOur scoring system rewards consistent accuracy and penalizes sources that frequently publish unverified or false claims.",
  },
  stories: {
    keywords: ["story", "stories", "news", "feed", "latest", "headlines", "recent"],
    response: "Our news feed aggregates crypto stories from multiple sources, showing you how different outlets cover the same events.\n\nEach story includes:\n- **Multi-source coverage** — See which outlets reported on it and their credibility tiers\n- **Associated claims** — Specific verifiable claims extracted from the story\n- **Verdicts** — Evidence-based assessments of each claim\n\nVisit the [home page](/) to browse the latest stories, or use [topic pages](/topics/bitcoin) to filter by specific areas of interest.",
  },
  greeting: {
    keywords: ["hello", "hi", "hey", "greetings", "good morning", "good evening", "good afternoon", "sup", "yo"],
    response: "Greetings! I am Firmy, your guide to Confirmd. Like the great philosophers of antiquity, I seek truth above all else — though in my case, it is the truth about crypto news.\n\nHow may I assist you today? You can ask me about how Confirmd works, our factuality scoring methodology, your subscription, or anything else related to the platform.",
  },
  thanks: {
    keywords: ["thank", "thanks", "appreciate", "helpful", "great help"],
    response: "You are most welcome! As Socrates might have said (had he been into crypto): the pursuit of knowledge is its own reward. Do not hesitate to return if you have more questions. I am always here.",
  },
  plus_features: {
    keywords: ["plus", "premium", "features", "what do i get", "benefits", "worth it", "tribune", "oracle"],
    response: "Confirmd Plus unlocks the full power of the platform:\n\n- **Full Evidence Access** — See all evidence items for every claim, not just summaries\n- **Creator Profiles & Claims** — Deep-dive into any crypto influencer's prediction history\n- **Leaderboard Access** — See the full creator accuracy rankings\n- **Real-time Alerts** — Get notified when claims you follow are updated\n- **Blindspot Reports** — Discover stories and perspectives you might be missing\n- **Data Export & API Access** — For power users and researchers\n\nVisit [/plus](/plus) to explore plans and start your subscription.",
    action: "show_billing_links",
  },
};

function generateFirmyResponse(message: string, history: Array<{ role: string; content: string }>): { reply: string; action?: string } {
  const lower = message.toLowerCase().trim();

  // Check each knowledge category for keyword matches
  let bestMatch: { response: string; action?: string; score: number } | null = null;

  for (const [_category, data] of Object.entries(FIRMY_KNOWLEDGE)) {
    let matchScore = 0;
    for (const keyword of data.keywords) {
      if (lower.includes(keyword)) {
        // Longer keyword matches are more specific, so weight them higher
        matchScore += keyword.length;
      }
    }
    if (matchScore > 0 && (!bestMatch || matchScore > bestMatch.score)) {
      bestMatch = { response: data.response, action: data.action, score: matchScore };
    }
  }

  if (bestMatch) {
    return { reply: bestMatch.response, action: bestMatch.action };
  }

  // Fallback — suggest escalation for anything we can't handle
  return {
    reply: "That is an excellent question, though it ventures beyond my current knowledge. I want to make sure you get the help you need.\n\nWould you like to submit a support ticket? Our team can provide a more detailed response. Alternatively, you might find answers in our [FAQ](/faq) or [About](/about) pages.",
    action: "suggest_escalation",
  };
}

router.post("/support/chat", (req: Request, res: Response) => {
  try {
    const { message, history } = req.body || {};

    if (!message || typeof message !== "string") {
      res.status(400).json({ error: "Message is required" });
      return;
    }

    const chatHistory = Array.isArray(history) ? history : [];
    const result = generateFirmyResponse(message, chatHistory);

    res.json(result);
  } catch (err) {
    console.error("POST /support/chat error:", err);
    res.status(500).json({ error: "Failed to process chat message" });
  }
});

router.post("/support/escalate", (req: Request, res: Response) => {
  try {
    const { email, description, userId } = req.body || {};

    if (!email || typeof email !== "string") {
      res.status(400).json({ error: "Email is required" });
      return;
    }

    if (!description || typeof description !== "string") {
      res.status(400).json({ error: "Description is required" });
      return;
    }

    console.log(`[ESCALATION] New support escalation:`);
    console.log(`[ESCALATION]   Email: ${email}`);
    console.log(`[ESCALATION]   User ID: ${userId || "anonymous"}`);
    console.log(`[ESCALATION]   Description: ${description}`);
    console.log(`[ESCALATION]   Timestamp: ${new Date().toISOString()}`);

    res.json({
      success: true,
      message: "Your issue has been forwarded to our team. We'll respond via email.",
    });
  } catch (err) {
    console.error("POST /support/escalate error:", err);
    res.status(500).json({ error: "Failed to submit escalation" });
  }
});

export default router;
