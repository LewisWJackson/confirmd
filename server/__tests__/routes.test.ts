import { describe, it, expect, beforeAll, vi } from "vitest";
import express from "express";
import session from "express-session";
import http from "http";

// Use vi.hoisted so our MemStorage instance is available in the mock factory
const { testStorage, MemStorageClass } = await vi.hoisted(async () => {
  const mod = await import("../storage.js");
  const inst = new mod.MemStorage();
  return { testStorage: inst, MemStorageClass: mod.MemStorage };
});

// Mock the storage module so routes use our test storage
vi.mock("../storage.js", async (importOriginal) => {
  const original = await importOriginal<typeof import("../storage.js")>();
  return {
    ...original,
    storage: testStorage,
  };
});

// Mock pipeline-instance to avoid side effects
vi.mock("../pipeline-instance.js", () => ({
  pipeline: {
    getStatus: () => ({ lastRunAt: null, articlesProcessed: 0, claimsExtracted: 0, isRunning: false }),
    runDailyBatch: vi.fn().mockResolvedValue(undefined),
    startScheduler: vi.fn(),
    stopScheduler: vi.fn(),
  },
}));

// Mock creator-pipeline
vi.mock("../creator-pipeline.js", () => ({
  runCreatorPipeline: vi.fn().mockResolvedValue(undefined),
  evaluateDispute: vi.fn().mockResolvedValue({ accepted: false }),
  verifyCreatorClaims: vi.fn(),
  recalculateCreatorScores: vi.fn(),
}));

// Mock image-generator
vi.mock("../image-generator.js", () => ({
  generateSvgFallback: () => "<svg></svg>",
  generateStoryImageAI: vi.fn(),
  generateVideoThumbnail: vi.fn(),
  getVideoThumbnailUrl: vi.fn(),
  generateTierImages: vi.fn(),
}));

// Mock analytics
vi.mock("../analytics.js", () => ({
  analytics: {
    recordRequest: vi.fn(),
    recordPipelineStart: vi.fn(),
    recordPipelineEnd: vi.fn(),
    getMetrics: vi.fn().mockReturnValue({}),
  },
}));

// Minimal HTTP request helper
function makeRequest(app: express.Application, method: string, path: string, body?: unknown) {
  return new Promise<{ status: number; body: any; headers: Record<string, string> }>((resolve, reject) => {
    const server = app.listen(0, () => {
      const port = (server.address() as any).port;
      const options: http.RequestOptions = {
        hostname: "127.0.0.1",
        port,
        path,
        method: method.toUpperCase(),
        headers: {},
      };

      let bodyStr: string | undefined;
      if (body) {
        bodyStr = JSON.stringify(body);
        options.headers!["Content-Type"] = "application/json";
        options.headers!["Content-Length"] = String(Buffer.byteLength(bodyStr));
      }

      const req = http.request(options, (res) => {
        let data = "";
        res.on("data", (chunk: string) => (data += chunk));
        res.on("end", () => {
          server.close();
          let parsed: any;
          try {
            parsed = JSON.parse(data);
          } catch {
            parsed = data;
          }
          resolve({ status: res.statusCode!, body: parsed, headers: res.headers as Record<string, string> });
        });
      });

      req.on("error", (err: Error) => {
        server.close();
        reject(err);
      });

      if (bodyStr) req.write(bodyStr);
      req.end();
    });
  });
}

let app: express.Application;

beforeAll(async () => {
  // Seed the test storage with demo data
  const { seedInitialData } = await import("../storage.js");
  await seedInitialData(testStorage);

  // Import routes after mocks are set up
  const { default: apiRouter } = await import("../routes.js");

  // Create a minimal Express app for testing
  app = express();
  app.use(express.json());
  app.use(
    session({
      secret: "test-secret",
      resave: false,
      saveUninitialized: false,
    })
  );
  app.use("/api", apiRouter);
});

// ─── GET /api/health ───────────────────────────────────────────────

describe("GET /api/health", () => {
  it("returns status ok with data counts", async () => {
    const res = await makeRequest(app, "GET", "/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.data.sources).toBeGreaterThan(0);
    expect(res.body.data.claims).toBeGreaterThan(0);
    expect(res.body.data.stories).toBeGreaterThan(0);
  });
});

// ─── GET /api/claims ───────────────────────────────────────────────

describe("GET /api/claims", () => {
  it("returns an array of enriched claims", async () => {
    const res = await makeRequest(app, "GET", "/api/claims");
    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.meta).toBeDefined();
  });

  it("enriched claims have source and verdict", async () => {
    const res = await makeRequest(app, "GET", "/api/claims");
    const claim = res.body.data[0];
    expect(claim.id).toBeDefined();
    expect(claim.claimText).toBeDefined();
    expect(claim.source).toBeDefined();
    expect(claim.source.displayName).toBeDefined();
    expect(claim.verdict).toBeDefined();
  });

  it("enriched claims have source score", async () => {
    const res = await makeRequest(app, "GET", "/api/claims");
    const claimWithScore = res.body.data.find((c: any) => c.source?.score);
    expect(claimWithScore).toBeDefined();
    expect(claimWithScore.source.score.trackRecord).toBeGreaterThan(0);
  });

  it("filters claims by asset", async () => {
    const res = await makeRequest(app, "GET", "/api/claims?asset=BTC");
    expect(res.status).toBe(200);
    for (const claim of res.body.data) {
      expect(claim.assetSymbols).toContain("BTC");
    }
  });

  it("filters claims by status", async () => {
    const res = await makeRequest(app, "GET", "/api/claims?status=reviewed");
    expect(res.status).toBe(200);
    for (const claim of res.body.data) {
      expect(claim.status).toBe("reviewed");
    }
  });

  it("supports pagination", async () => {
    const res = await makeRequest(app, "GET", "/api/claims?limit=2&offset=0");
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeLessThanOrEqual(2);
    expect(res.body.meta.limit).toBe(2);
    expect(res.body.meta.offset).toBe(0);
  });
});

// ─── GET /api/claims/:id ───────────────────────────────────────────

describe("GET /api/claims/:id", () => {
  it("returns a single claim with full detail", async () => {
    const listRes = await makeRequest(app, "GET", "/api/claims");
    const claimId = listRes.body.data[0].id;

    const res = await makeRequest(app, "GET", `/api/claims/${claimId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(claimId);
    expect(res.body.evidence).toBeDefined();
    expect(Array.isArray(res.body.evidence)).toBe(true);
  });

  it("returns 404 for non-existent claim", async () => {
    const res = await makeRequest(app, "GET", "/api/claims/nonexistent-id");
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });
});

// ─── GET /api/sources ──────────────────────────────────────────────

describe("GET /api/sources", () => {
  it("returns enriched sources sorted by track record", async () => {
    const res = await makeRequest(app, "GET", "/api/sources");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);

    const source = res.body.data[0];
    expect(source.id).toBeDefined();
    expect(source.displayName).toBeDefined();
    expect(source.logo).toBeDefined();
    expect(source.score).toBeDefined();

    // Check sorted by trackRecord desc
    for (let i = 1; i < res.body.data.length; i++) {
      const prev = res.body.data[i - 1].score?.trackRecord ?? 0;
      const curr = res.body.data[i].score?.trackRecord ?? 0;
      expect(prev).toBeGreaterThanOrEqual(curr);
    }
  });
});

// ─── GET /api/stories ──────────────────────────────────────────────

describe("GET /api/stories", () => {
  it("returns story feed items", async () => {
    const res = await makeRequest(app, "GET", "/api/stories");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);

    const story = res.body.data[0];
    expect(story.id).toBeDefined();
    expect(story.title).toBeDefined();
    expect(story.imageUrl).toBeDefined();
  });

  it("filters stories by category", async () => {
    const res = await makeRequest(app, "GET", "/api/stories?category=Regulation");
    expect(res.status).toBe(200);
    for (const story of res.body.data) {
      expect(story.category?.toLowerCase()).toBe("regulation");
    }
  });

  it("filters stories by asset", async () => {
    const res = await makeRequest(app, "GET", "/api/stories?asset=ETH");
    expect(res.status).toBe(200);
    for (const story of res.body.data) {
      expect(story.assetSymbols.map((s: string) => s.toUpperCase())).toContain("ETH");
    }
  });
});

// ─── GET /api/stories/:id ──────────────────────────────────────────

describe("GET /api/stories/:id", () => {
  it("returns full story with claims, coverage, and verdict distribution", async () => {
    const listRes = await makeRequest(app, "GET", "/api/stories");
    const storyId = listRes.body.data[0].id;

    const res = await makeRequest(app, "GET", `/api/stories/${storyId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(storyId);
    expect(res.body.title).toBeDefined();
    expect(res.body.claims).toBeDefined();
    expect(res.body.coverage).toBeDefined();
    expect(res.body.verdictDistribution).toBeDefined();
    expect(res.body.credibilityDistribution).toBeDefined();
  });

  it("returns 404 for non-existent story", async () => {
    const res = await makeRequest(app, "GET", "/api/stories/nonexistent-id");
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });
});

// ─── GET /api/pipeline/status ──────────────────────────────────────

describe("GET /api/pipeline/status", () => {
  it("returns pipeline stats", async () => {
    const res = await makeRequest(app, "GET", "/api/pipeline/status");
    expect(res.status).toBe(200);
    expect(typeof res.body.totalSources).toBe("number");
    expect(typeof res.body.totalClaims).toBe("number");
    expect(typeof res.body.totalStories).toBe("number");
  });
});

// ─── GET /api/evidence/:claimId ────────────────────────────────────

describe("GET /api/evidence/:claimId", () => {
  it("returns evidence items for a claim", async () => {
    const claimsRes = await makeRequest(app, "GET", "/api/claims");
    const claimId = claimsRes.body.data[0].id;

    const res = await makeRequest(app, "GET", `/api/evidence/${claimId}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

// ─── POST /api/pipeline/run ────────────────────────────────────────

describe("POST /api/pipeline/run", () => {
  it("accepts a pipeline run", async () => {
    const res = await makeRequest(app, "POST", "/api/pipeline/run");
    expect(res.status).toBe(202);
    expect(res.body.message).toBe("Pipeline run accepted");
  });
});

// ─── GET /api/stories/:id/image ────────────────────────────────────

describe("GET /api/stories/:id/image", () => {
  it("returns SVG image", async () => {
    const listRes = await makeRequest(app, "GET", "/api/stories");
    const storyId = listRes.body.data[0].id;

    const res = await makeRequest(app, "GET", `/api/stories/${storyId}/image`);
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("image/svg+xml");
  });
});
