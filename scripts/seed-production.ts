/**
 * Production seed script for Confirmd sources and source scores.
 *
 * Idempotent: safe to run multiple times.
 *   - Upserts all 13 sources (inserts if missing, updates logoUrl/metadata if existing)
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
  {
    type: "publisher" as const,
    handleOrDomain: "cryptoslate.com",
    displayName: "CryptoSlate",
    logoUrl: "https://logo.clearbit.com/cryptoslate.com",
    metadata: { description: "Crypto news and data" },
  },
  {
    type: "publisher" as const,
    handleOrDomain: "thedefiant.io",
    displayName: "The Defiant",
    logoUrl: "https://logo.clearbit.com/thedefiant.io",
    metadata: { description: "DeFi news and analysis" },
  },
  {
    type: "publisher" as const,
    handleOrDomain: "blockworks.co",
    displayName: "Blockworks",
    logoUrl: "https://logo.clearbit.com/blockworks.co",
    metadata: { description: "Crypto and blockchain news" },
  },
  {
    type: "publisher" as const,
    handleOrDomain: "dlnews.com",
    displayName: "DL News",
    logoUrl: "https://logo.clearbit.com/dlnews.com",
    metadata: { description: "Digital asset news" },
  },
  {
    type: "publisher" as const,
    handleOrDomain: "unchainedcrypto.com",
    displayName: "Unchained",
    logoUrl: "https://logo.clearbit.com/unchainedcrypto.com",
    metadata: { description: "Crypto news and podcasts" },
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
  "cryptoslate.com":    { trackRecord: 68, methodDiscipline: 72, sampleSize: 150, ci: { lower: 64, upper: 72  } },
  "thedefiant.io":      { trackRecord: 75, methodDiscipline: 78, sampleSize: 120, ci: { lower: 71, upper: 79  } },
  "blockworks.co":      { trackRecord: 80, methodDiscipline: 82, sampleSize: 140, ci: { lower: 76, upper: 84  } },
  "dlnews.com":         { trackRecord: 74, methodDiscipline: 76, sampleSize: 100, ci: { lower: 70, upper: 78  } },
  "unchainedcrypto.com": { trackRecord: 78, methodDiscipline: 80, sampleSize: 110, ci: { lower: 74, upper: 82  } },
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
