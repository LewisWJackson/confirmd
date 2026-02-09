import { Router, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import { storage } from "./storage.js";
import { validateCommunityEvidence } from "./pipeline.js";
import { pipeline } from "./pipeline-instance.js";
import { runCreatorPipeline, evaluateDispute } from "./creator-pipeline.js";
import { generateSvgFallback, generateStoryImageAI } from "./image-generator.js";
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
      const userTier = user?.subscriptionTier || "free";
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

    res.json({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      subscriptionTier: user.subscriptionTier,
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
                thumbnailUrl: video.thumbnailUrl ?? null,
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

router.get("/creators/leaderboard", requireTier("tribune"), async (_req: Request, res: Response) => {
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

    const [videos, claims, scoreHistory] = await Promise.all([
      storage.getCreatorVideos(creatorId, 10),
      storage.getCreatorClaims({ creatorId, limit: 20 }),
      storage.getCreatorScoreHistory(creatorId),
    ]);

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
// Clears old external image URLs and triggers AI generation for all stories.

router.post("/admin/regenerate-images", async (_req: Request, res: Response) => {
  try {
    const stories = await storage.getStories();
    let queued = 0;

    for (const story of stories) {
      // Skip stories that already have a local AI-generated image
      if (story.imageUrl?.startsWith("/story-images/")) continue;

      // Clear old external URL so SVG fallback shows immediately
      await storage.updateStory(story.id, { imageUrl: null as any });

      // Fire off AI generation in background
      generateStoryImageAI(story.id, story.title, story.category)
        .then(async (aiUrl) => {
          if (aiUrl) {
            await storage.updateStory(story.id, { imageUrl: aiUrl });
            console.log(`[RegenImages] AI image saved for "${story.title.slice(0, 40)}"`);
          } else {
            await storage.updateStory(story.id, { imageUrl: `/api/stories/${story.id}/image` });
          }
        })
        .catch(() => {});

      queued++;
    }

    res.json({
      message: `Queued ${queued} stories for image regeneration`,
      total: stories.length,
      skipped: stories.length - queued,
    });
  } catch (err) {
    console.error("POST /admin/regenerate-images error:", err);
    res.status(500).json({ error: "Failed to regenerate images" });
  }
});

export default router;
