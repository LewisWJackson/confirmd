import { describe, it, expect, beforeEach, vi } from "vitest";
import { MemStorage } from "../storage.js";

// Mock analytics
vi.mock("../analytics.js", () => ({
  analytics: {
    recordRequest: vi.fn(),
    recordPipelineStart: vi.fn(),
    recordPipelineEnd: vi.fn(),
    getMetrics: vi.fn().mockReturnValue({}),
  },
}));

// Mock image-generator
vi.mock("../image-generator.js", () => ({
  generateStoryImageAI: vi.fn(),
  generateSvgFallback: () => "<svg></svg>",
  generateVideoThumbnail: vi.fn(),
  getVideoThumbnailUrl: vi.fn(),
  generateTierImages: vi.fn(),
}));

describe("VerificationPipeline", () => {
  let storage: MemStorage;

  beforeEach(() => {
    storage = new MemStorage();
  });

  it("can be instantiated with MemStorage", async () => {
    const { VerificationPipeline } = await import("../pipeline.js");
    const pipeline = new VerificationPipeline(storage as any);
    expect(pipeline).toBeDefined();
  });

  it("getStatus returns initial state", async () => {
    const { VerificationPipeline } = await import("../pipeline.js");
    const pipeline = new VerificationPipeline(storage as any);

    const status = pipeline.getStatus();
    expect(status.isRunning).toBe(false);
    expect(status.articlesProcessed).toBe(0);
    expect(status.claimsExtracted).toBe(0);
    expect(status.lastRunAt).toBeNull();
  });
});

describe("validateCommunityEvidence", () => {
  it("rejects invalid URLs", async () => {
    const { validateCommunityEvidence } = await import("../pipeline.js");

    const result = await validateCommunityEvidence(
      "not-a-url",
      undefined,
      "Some claim text",
      "rumor",
      []
    );

    expect(result.accepted).toBe(false);
    expect(result.reason).toBe("Invalid URL");
  });

  it("rejects URLs that cannot be fetched", async () => {
    const { validateCommunityEvidence } = await import("../pipeline.js");

    // Use a URL that will definitely fail to connect
    const result = await validateCommunityEvidence(
      "https://this-domain-definitely-does-not-exist-abc123xyz.invalid/page",
      undefined,
      "Some claim text about crypto markets",
      "rumor",
      []
    );

    expect(result.accepted).toBe(false);
    expect(result.reason).toContain("Could not retrieve content");
  });
});

describe("MemStorage seeded pipeline data", () => {
  it("seeded data creates sources, items, claims, evidence, verdicts, stories", async () => {
    const { seedInitialData } = await import("../storage.js");
    const storage = new MemStorage();
    await seedInitialData(storage);

    const stats = await storage.getPipelineStats();
    expect(stats.totalSources).toBeGreaterThanOrEqual(13);
    expect(stats.totalItems).toBeGreaterThanOrEqual(6);
    expect(stats.totalClaims).toBeGreaterThanOrEqual(6);
    expect(stats.totalEvidence).toBeGreaterThanOrEqual(20);
    expect(stats.totalVerdicts).toBeGreaterThanOrEqual(6);
    expect(stats.totalStories).toBeGreaterThanOrEqual(5);
    expect(stats.lastRunAt).toBeDefined();
  });

  it("seeded verdicts have correct labels for known claims", async () => {
    const { seedInitialData } = await import("../storage.js");
    const storage = new MemStorage();
    await seedInitialData(storage);

    const claims = await storage.getClaims();

    // Find the Nexus exploit claim (should be verified)
    const nexusClaim = claims.find((c) => c.claimText.includes("Nexus Protocol"));
    expect(nexusClaim).toBeDefined();

    const nexusVerdict = await storage.getVerdictByClaim(nexusClaim!.id);
    expect(nexusVerdict?.verdictLabel).toBe("verified");
    expect(nexusVerdict?.probabilityTrue).toBeGreaterThan(0.9);

    // Find the Arbitrum airdrop claim (should be speculative)
    const arbClaim = claims.find((c) => c.claimText.includes("Arbitrum"));
    expect(arbClaim).toBeDefined();

    const arbVerdict = await storage.getVerdictByClaim(arbClaim!.id);
    expect(arbVerdict?.verdictLabel).toBe("speculative");
    expect(arbVerdict?.probabilityTrue).toBeLessThan(0.2);
  });

  it("seeded data has correct resolutions", async () => {
    const { seedInitialData } = await import("../storage.js");
    const storage = new MemStorage();
    await seedInitialData(storage);

    const claims = await storage.getClaims();

    const resolvedClaims = claims.filter((c) => c.status === "resolved");
    expect(resolvedClaims.length).toBeGreaterThanOrEqual(2);

    for (const claim of resolvedClaims) {
      const resolution = await storage.getResolutionByClaim(claim.id);
      expect(resolution).toBeDefined();
      expect(resolution?.outcome).toBe("true");
    }
  });

  it("seeded stories link to correct claims", async () => {
    const { seedInitialData } = await import("../storage.js");
    const storage = new MemStorage();
    await seedInitialData(storage);

    const stories = await storage.getStories();

    // ETH ETF story should have 2 claims
    const ethStory = stories.find((s) => s.title.includes("Ethereum ETF"));
    expect(ethStory).toBeDefined();

    const ethStoryData = await storage.getStoryWithClaims(ethStory!.id);
    expect(ethStoryData?.claims).toHaveLength(2);

    // Nexus exploit story should have 1 claim
    const nexusStory = stories.find((s) => s.title.includes("Nexus Protocol"));
    expect(nexusStory).toBeDefined();

    const nexusStoryData = await storage.getStoryWithClaims(nexusStory!.id);
    expect(nexusStoryData?.claims).toHaveLength(1);
  });

  it("stories feed returns credibility distribution and top sources", async () => {
    const { seedInitialData } = await import("../storage.js");
    const storage = new MemStorage();
    await seedInitialData(storage);

    const feed = await storage.getStoriesForFeed();
    expect(feed.length).toBeGreaterThan(0);

    for (const item of feed) {
      expect(item.credibilityDistribution).toBeDefined();
      expect(typeof item.credibilityDistribution.high).toBe("number");
      expect(typeof item.credibilityDistribution.medium).toBe("number");
      expect(typeof item.credibilityDistribution.low).toBe("number");
    }
  });
});
