import { describe, it, expect, beforeEach } from "vitest";
import { MemStorage } from "../storage.js";

describe("MemStorage", () => {
  let storage: MemStorage;

  beforeEach(() => {
    storage = new MemStorage();
  });

  // ── Sources ──────────────────────────────────────────────────────

  describe("Sources", () => {
    it("creates and retrieves a source", async () => {
      const source = await storage.createSource({
        type: "publisher",
        handleOrDomain: "example.com",
        displayName: "Example News",
      });

      expect(source.id).toBeDefined();
      expect(source.displayName).toBe("Example News");
      expect(source.type).toBe("publisher");

      const fetched = await storage.getSource(source.id);
      expect(fetched).toEqual(source);
    });

    it("lists all sources", async () => {
      await storage.createSource({ handleOrDomain: "a.com", displayName: "A" });
      await storage.createSource({ handleOrDomain: "b.com", displayName: "B" });

      const sources = await storage.getSources();
      expect(sources).toHaveLength(2);
    });

    it("finds source by domain", async () => {
      await storage.createSource({ handleOrDomain: "reuters.com", displayName: "Reuters" });

      const found = await storage.getSourceByDomain("reuters.com");
      expect(found?.displayName).toBe("Reuters");

      const notFound = await storage.getSourceByDomain("nonexistent.com");
      expect(notFound).toBeUndefined();
    });

    it("updates a source", async () => {
      const source = await storage.createSource({ handleOrDomain: "x.com", displayName: "Old Name" });

      const updated = await storage.updateSource(source.id, { displayName: "New Name" });
      expect(updated?.displayName).toBe("New Name");
    });

    it("returns undefined when updating non-existent source", async () => {
      const result = await storage.updateSource("fake-id", { displayName: "Test" });
      expect(result).toBeUndefined();
    });
  });

  // ── Items ────────────────────────────────────────────────────────

  describe("Items", () => {
    it("creates and retrieves an item", async () => {
      const source = await storage.createSource({ handleOrDomain: "test.com", displayName: "Test" });
      const item = await storage.createItem({
        sourceId: source.id,
        rawText: "Some article content",
        contentHash: "hash123",
        itemType: "article",
      });

      expect(item.id).toBeDefined();
      expect(item.rawText).toBe("Some article content");

      const fetched = await storage.getItem(item.id);
      expect(fetched).toEqual(item);
    });

    it("finds item by URL", async () => {
      const source = await storage.createSource({ handleOrDomain: "test.com", displayName: "Test" });
      await storage.createItem({
        sourceId: source.id,
        url: "https://test.com/article-1",
        rawText: "Content",
        contentHash: "hash_url_1",
      });

      const found = await storage.getItemByUrl("https://test.com/article-1");
      expect(found).toBeDefined();
      expect(found?.url).toBe("https://test.com/article-1");
    });

    it("lists all items", async () => {
      const source = await storage.createSource({ handleOrDomain: "test.com", displayName: "Test" });
      await storage.createItem({ sourceId: source.id, rawText: "A", contentHash: "h1" });
      await storage.createItem({ sourceId: source.id, rawText: "B", contentHash: "h2" });

      const items = await storage.getItems();
      expect(items).toHaveLength(2);
    });
  });

  // ── Claims ───────────────────────────────────────────────────────

  describe("Claims", () => {
    async function createTestClaim(storage: MemStorage, overrides?: Record<string, any>) {
      const source = await storage.createSource({ handleOrDomain: "src.com", displayName: "Src" });
      const item = await storage.createItem({ sourceId: source.id, rawText: "text", contentHash: `h_${Math.random()}` });
      return storage.createClaim({
        sourceId: source.id,
        itemId: item.id,
        claimText: "Test claim",
        claimType: "rumor",
        assertedAt: new Date().toISOString() as any,
        ...overrides,
      });
    }

    it("creates and retrieves a claim", async () => {
      const claim = await createTestClaim(storage);
      expect(claim.id).toBeDefined();
      expect(claim.claimText).toBe("Test claim");

      const fetched = await storage.getClaim(claim.id);
      expect(fetched).toEqual(claim);
    });

    it("filters claims by asset", async () => {
      await createTestClaim(storage, { assetSymbols: ["BTC"] });
      await createTestClaim(storage, { assetSymbols: ["ETH"] });

      const btcClaims = await storage.getClaims({ asset: "BTC" });
      expect(btcClaims).toHaveLength(1);
      expect(btcClaims[0].assetSymbols).toContain("BTC");
    });

    it("filters claims by status", async () => {
      await createTestClaim(storage, { status: "unreviewed" });
      await createTestClaim(storage, { status: "reviewed" });

      const reviewed = await storage.getClaims({ status: "reviewed" });
      expect(reviewed).toHaveLength(1);
    });

    it("sorts claims by newest/oldest", async () => {
      await createTestClaim(storage, { assertedAt: new Date("2024-01-01").toISOString() as any });
      await createTestClaim(storage, { assertedAt: new Date("2024-06-01").toISOString() as any });

      const newest = await storage.getClaims({ sort: "newest" });
      expect(new Date(newest[0].assertedAt).getTime()).toBeGreaterThan(
        new Date(newest[1].assertedAt).getTime()
      );

      const oldest = await storage.getClaims({ sort: "oldest" });
      expect(new Date(oldest[0].assertedAt).getTime()).toBeLessThan(
        new Date(oldest[1].assertedAt).getTime()
      );
    });

    it("paginates claims", async () => {
      for (let i = 0; i < 5; i++) {
        await createTestClaim(storage);
      }

      const page1 = await storage.getClaims({ limit: 2, offset: 0 });
      expect(page1).toHaveLength(2);

      const page2 = await storage.getClaims({ limit: 2, offset: 2 });
      expect(page2).toHaveLength(2);
    });

    it("updates a claim", async () => {
      const claim = await createTestClaim(storage);
      const updated = await storage.updateClaim(claim.id, { status: "reviewed" });
      expect(updated?.status).toBe("reviewed");
    });

    it("deletes a claim and cascades to evidence/verdicts", async () => {
      const claim = await createTestClaim(storage);

      await storage.createEvidence({
        claimId: claim.id,
        url: "https://example.com/ev",
        excerpt: "evidence text",
        stance: "supports",
        evidenceGrade: "B",
      });

      await storage.createVerdict({
        claimId: claim.id,
        model: "test-model",
        promptVersion: "v1",
        verdictLabel: "verified",
      });

      const deleted = await storage.deleteClaim(claim.id);
      expect(deleted).toBe(true);

      expect(await storage.getClaim(claim.id)).toBeUndefined();
      expect(await storage.getEvidenceByClaim(claim.id)).toHaveLength(0);
      expect(await storage.getVerdictByClaim(claim.id)).toBeUndefined();
    });

    it("returns false when deleting non-existent claim", async () => {
      const deleted = await storage.deleteClaim("fake-id");
      expect(deleted).toBe(false);
    });
  });

  // ── Evidence ─────────────────────────────────────────────────────

  describe("Evidence", () => {
    it("creates evidence and retrieves by claim", async () => {
      const source = await storage.createSource({ handleOrDomain: "src.com", displayName: "Src" });
      const item = await storage.createItem({ sourceId: source.id, rawText: "text", contentHash: "h_ev" });
      const claim = await storage.createClaim({
        sourceId: source.id,
        itemId: item.id,
        claimText: "Test",
        claimType: "rumor",
        assertedAt: new Date().toISOString() as any,
      });

      await storage.createEvidence({
        claimId: claim.id,
        url: "https://example.com/1",
        excerpt: "supports claim",
        stance: "supports",
        evidenceGrade: "A",
        primaryFlag: true,
      });

      await storage.createEvidence({
        claimId: claim.id,
        url: "https://example.com/2",
        excerpt: "contradicts claim",
        stance: "contradicts",
        evidenceGrade: "B",
      });

      const evidence = await storage.getEvidenceByClaim(claim.id);
      expect(evidence).toHaveLength(2);
      expect(evidence.find((e) => e.primaryFlag)).toBeDefined();
    });
  });

  // ── Verdicts ─────────────────────────────────────────────────────

  describe("Verdicts", () => {
    it("creates and retrieves verdict by claim", async () => {
      const source = await storage.createSource({ handleOrDomain: "src.com", displayName: "Src" });
      const item = await storage.createItem({ sourceId: source.id, rawText: "text", contentHash: "h_v" });
      const claim = await storage.createClaim({
        sourceId: source.id,
        itemId: item.id,
        claimText: "Test",
        claimType: "rumor",
        assertedAt: new Date().toISOString() as any,
      });

      await storage.createVerdict({
        claimId: claim.id,
        model: "gpt-4",
        promptVersion: "v2",
        verdictLabel: "verified",
        probabilityTrue: 0.9,
        evidenceStrength: 0.85,
        reasoningSummary: "Strong evidence",
      });

      const verdict = await storage.getVerdictByClaim(claim.id);
      expect(verdict).toBeDefined();
      expect(verdict?.verdictLabel).toBe("verified");
      expect(verdict?.probabilityTrue).toBe(0.9);
    });

    it("deletes verdict by claim", async () => {
      const source = await storage.createSource({ handleOrDomain: "src.com", displayName: "Src" });
      const item = await storage.createItem({ sourceId: source.id, rawText: "text", contentHash: "h_vd" });
      const claim = await storage.createClaim({
        sourceId: source.id,
        itemId: item.id,
        claimText: "Test",
        claimType: "rumor",
        assertedAt: new Date().toISOString() as any,
      });

      await storage.createVerdict({
        claimId: claim.id,
        model: "gpt-4",
        promptVersion: "v1",
        verdictLabel: "speculative",
      });

      await storage.deleteVerdictByClaim(claim.id);
      expect(await storage.getVerdictByClaim(claim.id)).toBeUndefined();
    });
  });

  // ── Stories ──────────────────────────────────────────────────────

  describe("Stories", () => {
    it("creates and retrieves a story", async () => {
      const story = await storage.createStory({
        title: "Test Story",
        summary: "A test story",
        category: "Security",
        assetSymbols: ["ETH"],
      });

      expect(story.id).toBeDefined();
      expect(story.title).toBe("Test Story");

      const fetched = await storage.getStory(story.id);
      expect(fetched).toEqual(story);
    });

    it("adds claims to a story and retrieves them", async () => {
      const source = await storage.createSource({ handleOrDomain: "s.com", displayName: "S" });
      const item = await storage.createItem({ sourceId: source.id, rawText: "t", contentHash: "h_sc" });
      const claim = await storage.createClaim({
        sourceId: source.id,
        itemId: item.id,
        claimText: "Claim in story",
        claimType: "rumor",
        assertedAt: new Date().toISOString() as any,
      });

      const story = await storage.createStory({ title: "Story with claims" });
      await storage.addClaimToStory(story.id, claim.id);

      const result = await storage.getStoryWithClaims(story.id);
      expect(result?.claims).toHaveLength(1);
      expect(result?.claims[0].claimText).toBe("Claim in story");
    });

    it("finds story by claim ID", async () => {
      const source = await storage.createSource({ handleOrDomain: "s.com", displayName: "S" });
      const item = await storage.createItem({ sourceId: source.id, rawText: "t", contentHash: "h_scf" });
      const claim = await storage.createClaim({
        sourceId: source.id,
        itemId: item.id,
        claimText: "linked claim",
        claimType: "rumor",
        assertedAt: new Date().toISOString() as any,
      });

      const story = await storage.createStory({ title: "Linked Story" });
      await storage.addClaimToStory(story.id, claim.id);

      const found = await storage.getStoryByClaimId(claim.id);
      expect(found?.title).toBe("Linked Story");
    });

    it("deletes a story and its joins", async () => {
      const story = await storage.createStory({ title: "To Delete" });
      const deleted = await storage.deleteStory(story.id);
      expect(deleted).toBe(true);
      expect(await storage.getStory(story.id)).toBeUndefined();
    });

    it("gets stories for feed", async () => {
      await storage.createStory({ title: "Feed Story 1", category: "DeFi" });
      await storage.createStory({ title: "Feed Story 2", category: "Security" });

      const feed = await storage.getStoriesForFeed();
      expect(feed).toHaveLength(2);
      expect(feed[0].claimCount).toBe(0);
    });
  });

  // ── Source Scores ────────────────────────────────────────────────

  describe("Source Scores", () => {
    it("creates and retrieves a source score", async () => {
      const source = await storage.createSource({ handleOrDomain: "test.com", displayName: "Test" });
      await storage.createSourceScore({
        sourceId: source.id,
        scoreVersion: "v1",
        trackRecord: 85,
        methodDiscipline: 90,
        sampleSize: 100,
        confidenceInterval: { lower: 80, upper: 90 },
        computedAt: new Date(),
        metadata: {},
      });

      const score = await storage.getSourceScore(source.id);
      expect(score?.trackRecord).toBe(85);
      expect(score?.methodDiscipline).toBe(90);
    });
  });

  // ── Users ────────────────────────────────────────────────────────

  describe("Users", () => {
    it("creates and finds user by email", async () => {
      const user = await storage.createUser({
        email: "test@example.com",
        passwordHash: "hashed",
        displayName: "Test User",
      });

      expect(user.id).toBeDefined();
      expect(user.subscriptionTier).toBe("free");

      const found = await storage.getUserByEmail("test@example.com");
      expect(found?.displayName).toBe("Test User");
    });

    it("email lookup is case-insensitive", async () => {
      await storage.createUser({
        email: "Test@Example.com",
        passwordHash: "hashed",
        displayName: "Test",
      });

      const found = await storage.getUserByEmail("test@example.com");
      expect(found).toBeDefined();
    });

    it("updates user tier", async () => {
      const user = await storage.createUser({
        email: "tier@test.com",
        passwordHash: "hashed",
        displayName: "Tier User",
      });

      await storage.updateUserTier(user.id, "oracle");
      const updated = await storage.getUserById(user.id);
      expect(updated?.subscriptionTier).toBe("oracle");
    });
  });

  // ── Creators ─────────────────────────────────────────────────────

  describe("Creators", () => {
    it("creates and retrieves a creator", async () => {
      const creator = await storage.createCreator({
        youtubeChannelId: "UCtest123",
        channelName: "Test Creator",
        channelUrl: "https://youtube.com/@testcreator",
      });

      expect(creator.id).toBeDefined();
      expect(creator.channelName).toBe("Test Creator");
      expect(creator.tier).toBe("unranked");

      const fetched = await storage.getCreator(creator.id);
      expect(fetched?.channelName).toBe("Test Creator");
    });

    it("finds creator by channel ID", async () => {
      await storage.createCreator({
        youtubeChannelId: "UCfind",
        channelName: "Findable",
        channelUrl: "https://youtube.com/@findable",
      });

      const found = await storage.getCreatorByChannelId("UCfind");
      expect(found?.channelName).toBe("Findable");
    });

    it("filters active creators", async () => {
      await storage.createCreator({
        youtubeChannelId: "UC1",
        channelName: "Active",
        channelUrl: "https://youtube.com/@active",
        isActive: true,
      });
      await storage.createCreator({
        youtubeChannelId: "UC2",
        channelName: "Inactive",
        channelUrl: "https://youtube.com/@inactive",
        isActive: false,
      });

      const active = await storage.getCreators(true);
      expect(active).toHaveLength(1);
      expect(active[0].channelName).toBe("Active");

      const all = await storage.getCreators();
      expect(all).toHaveLength(2);
    });
  });

  // ── Pipeline Stats ───────────────────────────────────────────────

  describe("Pipeline Stats", () => {
    it("returns correct counts", async () => {
      const source = await storage.createSource({ handleOrDomain: "s.com", displayName: "S" });
      const item = await storage.createItem({ sourceId: source.id, rawText: "t", contentHash: "h_ps" });
      await storage.createClaim({
        sourceId: source.id,
        itemId: item.id,
        claimText: "c",
        claimType: "rumor",
        assertedAt: new Date().toISOString() as any,
      });

      const stats = await storage.getPipelineStats();
      expect(stats.totalSources).toBe(1);
      expect(stats.totalItems).toBe(1);
      expect(stats.totalClaims).toBe(1);
      expect(stats.lastRunAt).toBeNull();
    });

    it("tracks last pipeline run", async () => {
      const ts = new Date().toISOString();
      storage.setLastPipelineRun(ts);

      const stats = await storage.getPipelineStats();
      expect(stats.lastRunAt).toBe(ts);
    });
  });

  // ── Gifts ────────────────────────────────────────────────────────

  describe("Gifts", () => {
    it("creates and redeems a gift", async () => {
      const gift = await storage.createGift({
        code: "GIFT-123",
        purchaserEmail: "buyer@test.com",
        stripeSessionId: "sess_123",
        durationMonths: 3,
        amountCents: 2999,
        status: "pending",
      });

      expect(gift.id).toBeDefined();
      expect(gift.code).toBe("GIFT-123");

      const found = await storage.getGiftByCode("GIFT-123");
      expect(found).toBeDefined();

      const user = await storage.createUser({
        email: "redeemer@test.com",
        passwordHash: "hashed",
        displayName: "Redeemer",
      });

      await storage.redeemGift(gift.id, user.id);
      const redeemed = await storage.getGiftByCode("GIFT-123");
      expect(redeemed?.status).toBe("redeemed");
      expect(redeemed?.redeemedByUserId).toBe(user.id);
    });

    it("activates gift subscription", async () => {
      const user = await storage.createUser({
        email: "giftuser@test.com",
        passwordHash: "hashed",
        displayName: "Gift User",
      });

      await storage.activateGiftSubscription(user.id, 6);
      const updated = await storage.getUserById(user.id);
      expect(updated?.subscriptionTier).toBe("premium");
      expect(updated?.subscriptionExpiresAt).toBeDefined();
    });
  });
});
