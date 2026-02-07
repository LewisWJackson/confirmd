/**
 * Production seed script for Confirmd sources and source scores.
 *
 * Idempotent: safe to run multiple times.
 *   - Upserts all 14 sources (inserts if missing, updates logoUrl/metadata if existing)
 *   - Upserts source scores for each source (inserts if missing, updates if existing)
 *
 * Usage:
 *   DATABASE_URL="postgresql://..." npx tsx scripts/seed-production.ts
 */

import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, sql } from "drizzle-orm";
import { sources, sourceScores } from "../shared/schema.js";

const { Pool } = pg;

// ---------------------------------------------------------------------------
// Source definitions (mirrors seedInitialData in server/storage.ts)
// ---------------------------------------------------------------------------

const SOURCE_DATA = [
  {
    type: "regulator" as const,
    handleOrDomain: "sec.gov",
    displayName: "SEC",
    logoUrl: "https://logo.clearbit.com/sec.gov",
    metadata: { description: "U.S. Securities and Exchange Commission" },
  },
  {
    type: "publisher" as const,
    handleOrDomain: "reuters.com",
    displayName: "Reuters",
    logoUrl: "https://logo.clearbit.com/reuters.com",
    metadata: { description: "Global news wire service" },
  },
  {
    type: "publisher" as const,
    handleOrDomain: "bloomberg.com",
    displayName: "Bloomberg Crypto",
    logoUrl: "https://logo.clearbit.com/bloomberg.com",
    metadata: { description: "Bloomberg digital asset coverage" },
  },
  {
    type: "publisher" as const,
    handleOrDomain: "theblock.co",
    displayName: "The Block",
    logoUrl: "https://logo.clearbit.com/theblock.co",
    metadata: { description: "Crypto research and journalism" },
  },
  {
    type: "publisher" as const,
    handleOrDomain: "coindesk.com",
    displayName: "CoinDesk",
    logoUrl: "https://logo.clearbit.com/coindesk.com",
    metadata: { description: "Crypto news and media" },
  },
  {
    type: "publisher" as const,
    handleOrDomain: "cointelegraph.com",
    displayName: "Cointelegraph",
    logoUrl: "https://logo.clearbit.com/cointelegraph.com",
    metadata: { description: "Crypto and blockchain media" },
  },
  {
    type: "x_handle" as const,
    handleOrDomain: "@CryptoWhale",
    displayName: "Crypto Whale",
    logoUrl: "https://logo.clearbit.com/x.com",
    metadata: { description: "Anonymous crypto Twitter personality" },
  },
  {
    type: "telegram" as const,
    handleOrDomain: "t.me/defialpha",
    displayName: "DeFi Alpha Leaks",
    logoUrl: "https://logo.clearbit.com/telegram.org",
    metadata: { description: "Anonymous DeFi alpha Telegram channel" },
  },

  // XRP YouTube channels
  {
    type: "youtube" as const,
    handleOrDomain: "youtube.com/@TheBearableBull",
    displayName: "Bearable Bull",
    logoUrl: "https://yt3.googleusercontent.com/ytc/APkrFKZyDQCPm9XD9vTfN2RVKkZ8VpzSMW0G91ZP1r3n=s176-c-k-c0x00ffffff-no-rj",
    metadata: { channelUrl: "https://www.youtube.com/@TheBearableBull", maxVideos: 10, community: "xrp" },
  },
  {
    type: "youtube" as const,
    handleOrDomain: "youtube.com/@DigitalAssetInvestor",
    displayName: "Digital Asset Investor",
    logoUrl: "https://yt3.googleusercontent.com/ytc/APkrFKbyq5x2E2gMEI_3GQbBHBkKj0M0HOLwRnVMwQ=s176-c-k-c0x00ffffff-no-rj",
    metadata: { channelUrl: "https://www.youtube.com/@DigitalAssetInvestor", maxVideos: 10, community: "xrp" },
  },
  {
    type: "youtube" as const,
    handleOrDomain: "youtube.com/@BlockchainBacker",
    displayName: "Blockchain Backer",
    logoUrl: "https://yt3.googleusercontent.com/ytc/APkrFKZwVq4LSylSOUzO_2I__Ob0s_qjS3FD9EmV_w=s176-c-k-c0x00ffffff-no-rj",
    metadata: { channelUrl: "https://www.youtube.com/@BlockchainBacker", maxVideos: 10, community: "xrp" },
  },
  {
    type: "youtube" as const,
    handleOrDomain: "youtube.com/@CryptoEri",
    displayName: "Crypto Eri",
    logoUrl: "https://yt3.googleusercontent.com/ytc/APkrFKZaL_3PWGM-R85k3n8GZ8y5h8gXvuXUy85M=s176-c-k-c0x00ffffff-no-rj",
    metadata: { channelUrl: "https://www.youtube.com/@CryptoEri", maxVideos: 10, community: "xrp" },
  },
  {
    type: "youtube" as const,
    handleOrDomain: "youtube.com/@DigitalPerspectives",
    displayName: "Digital Perspectives",
    logoUrl: "https://yt3.googleusercontent.com/ytc/APkrFKZWK2EqTYHhXPR5LEm0qX5K1xHq3VkLQFaQ=s176-c-k-c0x00ffffff-no-rj",
    metadata: { channelUrl: "https://www.youtube.com/@DigitalPerspectives", maxVideos: 10, community: "xrp" },
  },
  {
    type: "youtube" as const,
    handleOrDomain: "youtube.com/@AlexCobb",
    displayName: "Alex Cobb",
    logoUrl: "https://yt3.googleusercontent.com/ytc/APkrFKY0wX4G3P1q3-0DCR0pVbPHq9LZ5PzQnLc=s176-c-k-c0x00ffffff-no-rj",
    metadata: { channelUrl: "https://www.youtube.com/@AlexCobb", maxVideos: 10, community: "xrp" },
  },
];

// Score data keyed by handleOrDomain (mirrors seedInitialData)
const SCORE_DATA: Record<
  string,
  { trackRecord: number; methodDiscipline: number; sampleSize: number; ci: { lower: number; upper: number } }
> = {
  "sec.gov":            { trackRecord: 98, methodDiscipline: 99, sampleSize: 45,  ci: { lower: 95, upper: 100 } },
  "reuters.com":        { trackRecord: 91, methodDiscipline: 94, sampleSize: 203, ci: { lower: 88, upper: 94  } },
  "bloomberg.com":      { trackRecord: 89, methodDiscipline: 92, sampleSize: 156, ci: { lower: 85, upper: 93  } },
  "theblock.co":        { trackRecord: 82, methodDiscipline: 85, sampleSize: 189, ci: { lower: 78, upper: 86  } },
  "coindesk.com":       { trackRecord: 76, methodDiscipline: 78, sampleSize: 234, ci: { lower: 72, upper: 80  } },
  "cointelegraph.com":  { trackRecord: 58, methodDiscipline: 52, sampleSize: 312, ci: { lower: 54, upper: 62  } },
  "@CryptoWhale":       { trackRecord: 34, methodDiscipline: 22, sampleSize: 89,  ci: { lower: 28, upper: 40  } },
  "t.me/defialpha":     { trackRecord: 28, methodDiscipline: 18, sampleSize: 67,  ci: { lower: 20, upper: 36  } },

  // XRP YouTube channels
  "youtube.com/@TheBearableBull":       { trackRecord: 58, methodDiscipline: 45, sampleSize: 50, ci: { lower: 45, upper: 70 } },
  "youtube.com/@DigitalAssetInvestor":  { trackRecord: 62, methodDiscipline: 50, sampleSize: 50, ci: { lower: 45, upper: 70 } },
  "youtube.com/@BlockchainBacker":      { trackRecord: 65, methodDiscipline: 55, sampleSize: 50, ci: { lower: 45, upper: 70 } },
  "youtube.com/@CryptoEri":            { trackRecord: 60, methodDiscipline: 52, sampleSize: 50, ci: { lower: 45, upper: 70 } },
  "youtube.com/@DigitalPerspectives":   { trackRecord: 57, methodDiscipline: 48, sampleSize: 50, ci: { lower: 45, upper: 70 } },
  "youtube.com/@AlexCobb":             { trackRecord: 55, methodDiscipline: 40, sampleSize: 50, ci: { lower: 45, upper: 70 } },
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("ERROR: DATABASE_URL environment variable is required");
    process.exit(1);
  }

  console.log("Connecting to database...");
  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle(pool);

  try {
    // ------------------------------------------------------------------
    // Step 1: Upsert sources
    // ------------------------------------------------------------------
    console.log("\n--- Upserting sources ---");

    for (const src of SOURCE_DATA) {
      const [upserted] = await db
        .insert(sources)
        .values({
          type: src.type,
          handleOrDomain: src.handleOrDomain,
          displayName: src.displayName,
          logoUrl: src.logoUrl,
          metadata: src.metadata,
        })
        .onConflictDoUpdate({
          target: sources.handleOrDomain,
          set: {
            displayName: src.displayName,
            type: src.type,
            logoUrl: src.logoUrl,
            metadata: src.metadata,
            updatedAt: new Date(),
          },
        })
        .returning();

      console.log(`  [OK] ${upserted.displayName} (${upserted.handleOrDomain}) -> id=${upserted.id}, logoUrl=${upserted.logoUrl}`);
    }

    // ------------------------------------------------------------------
    // Step 2: Upsert source scores
    // ------------------------------------------------------------------
    console.log("\n--- Upserting source scores ---");

    // Fetch all sources to get their IDs
    const allSources = await db.select().from(sources);

    for (const source of allSources) {
      const scoreInfo = SCORE_DATA[source.handleOrDomain];
      if (!scoreInfo) {
        console.log(`  [SKIP] No score data for ${source.handleOrDomain}`);
        continue;
      }

      // Check if a score already exists for this source
      const existing = await db
        .select()
        .from(sourceScores)
        .where(eq(sourceScores.sourceId, source.id))
        .limit(1);

      if (existing.length > 0) {
        // Update existing score
        await db
          .update(sourceScores)
          .set({
            scoreVersion: "v1.0",
            trackRecord: scoreInfo.trackRecord,
            methodDiscipline: scoreInfo.methodDiscipline,
            confidenceInterval: scoreInfo.ci,
            sampleSize: scoreInfo.sampleSize,
            computedAt: new Date(),
            metadata: {},
          })
          .where(eq(sourceScores.id, existing[0].id));

        console.log(`  [UPDATED] Score for ${source.displayName}: trackRecord=${scoreInfo.trackRecord}, methodDiscipline=${scoreInfo.methodDiscipline}`);
      } else {
        // Insert new score
        await db.insert(sourceScores).values({
          sourceId: source.id,
          scoreVersion: "v1.0",
          trackRecord: scoreInfo.trackRecord,
          methodDiscipline: scoreInfo.methodDiscipline,
          confidenceInterval: scoreInfo.ci,
          sampleSize: scoreInfo.sampleSize,
          computedAt: new Date(),
          metadata: {},
        });

        console.log(`  [CREATED] Score for ${source.displayName}: trackRecord=${scoreInfo.trackRecord}, methodDiscipline=${scoreInfo.methodDiscipline}`);
      }
    }

    // ------------------------------------------------------------------
    // Summary
    // ------------------------------------------------------------------
    const finalSources = await db.select().from(sources);
    const finalScores = await db.select().from(sourceScores);
    console.log(`\n--- Done ---`);
    console.log(`Total sources: ${finalSources.length}`);
    console.log(`Total source scores: ${finalScores.length}`);
    console.log(`Sources with logos: ${finalSources.filter((s) => s.logoUrl).length}`);

  } catch (err) {
    console.error("Seed failed:", err);
    process.exit(1);
  } finally {
    await pool.end();
    console.log("\nDatabase connection closed.");
  }
}

main();
