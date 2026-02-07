import { Router, type Request, type Response } from "express";
import { storage } from "./storage.js";
import type { Claim, Verdict, EvidenceItem, Resolution, Source, SourceScore } from "../shared/schema.js";

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

router.get("/stories", async (_req: Request, res: Response) => {
  try {
    const stories = await storage.getStories();

    const enrichedStories = await Promise.all(
      stories.map(async (story) => {
        const storyWithClaims = await storage.getStoryWithClaims(story.id);
        const claims = storyWithClaims?.claims ?? [];

        // Gather unique source IDs
        const sourceIds = new Set(claims.map((c) => c.sourceId));

        // Compute verdict distribution
        const verdictDistribution: Record<string, number> = {};
        let latestClaimTimestamp: Date | null = null;

        for (const claim of claims) {
          const verdict = await storage.getVerdictByClaim(claim.id);
          if (verdict) {
            const label = verdict.verdictLabel;
            verdictDistribution[label] = (verdictDistribution[label] || 0) + 1;
          }

          const claimTime = new Date(claim.assertedAt);
          if (!latestClaimTimestamp || claimTime > latestClaimTimestamp) {
            latestClaimTimestamp = claimTime;
          }
        }

        return {
          id: story.id,
          title: story.title,
          summary: story.summary,
          imageUrl: story.imageUrl,
          category: story.category,
          createdAt: story.createdAt,
          updatedAt: story.updatedAt,
          claimCount: claims.length,
          sourceCount: sourceIds.size,
          verdictDistribution,
          latestClaimTimestamp,
        };
      })
    );

    res.json({ data: enrichedStories });
  } catch (err) {
    console.error("GET /stories error:", err);
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

    // Unique sources
    const sourceIds = new Set(claims.map((c) => c.sourceId));
    const sources: Array<{
      id: string;
      displayName: string;
      logo: string;
      logoUrl: string | null;
      type: string;
      score: { trackRecord: number | null } | null;
    }> = [];

    for (const sid of sourceIds) {
      const source = await storage.getSource(sid);
      if (source) {
        const score = await storage.getSourceScore(source.id);
        const logoAbbrev = source.displayName
          .split(" ")
          .map((w) => w[0])
          .join("")
          .toUpperCase()
          .slice(0, 3);
        sources.push({
          id: source.id,
          displayName: source.displayName,
          logo: logoAbbrev,
          logoUrl: source.logoUrl,
          type: source.type,
          score: score ? { trackRecord: score.trackRecord } : null,
        });
      }
    }

    // Verdict distribution
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
      createdAt: story.createdAt,
      updatedAt: story.updatedAt,
      metadata: story.metadata,
      claims: enrichedClaims,
      sources,
      verdictDistribution,
      claimCount: claims.length,
      sourceCount: sourceIds.size,
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
    // In a real system this would trigger the ingestion/analysis pipeline.
    // For now we just mark the run time and return 202 Accepted.
    storage.setLastPipelineRun(new Date().toISOString());

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

export default router;
