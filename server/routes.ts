import { Router, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import { storage } from "./storage.js";
import { validateCommunityEvidence } from "./pipeline.js";
import { pipeline } from "./pipeline-instance.js";
import type { Claim, Verdict, EvidenceItem, Resolution, Source, SourceScore } from "../shared/schema.js";

declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

const router = Router();

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
    name: string;
    logo: string;
    type: string;
    trackRecord: number | null;
  } | null;
  verdict: {
    label: string;
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

    res.json({ data: feedItems });
  } catch (err) {
    console.error("Error fetching stories for feed:", (err as Error).message);
    res.status(500).json({ error: "Failed to fetch stories" });
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

    res.json({
      id: story.id,
      title: story.title,
      summary: story.summary,
      imageUrl: story.imageUrl,
      category: story.category,
      assetSymbols: story.assetSymbols ?? [],
      credibilityDistribution,
      coverage,
      claims: enrichedClaims,
      verdictDistribution,
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

export default router;
