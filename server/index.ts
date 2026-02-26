import "dotenv/config";
import * as Sentry from "@sentry/node";

// ─── Sentry (must be initialised before any other imports that patch HTTP) ───
// TODO: Set SENTRY_DSN in Railway environment variables
// Railway env vars needed:
//   SENTRY_DSN=https://<key>@o<org>.ingest.sentry.io/<project>
//   VITE_SENTRY_DSN=https://<key>@o<org>.ingest.sentry.io/<project>  (same value, for the browser SDK)
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || "development",
  enabled: !!process.env.SENTRY_DSN,
});

import cron from "node-cron";
import express from "express";
import session from "express-session";
import pgSession from "connect-pg-simple";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import apiRouter from "./routes.js";
import stripeRouter from "./stripe.js";
import {
  storage,
  seedInitialData,
  seedCreators,
  MemStorage,
} from "./storage.js";
import { pool } from "./db.js";
import { pipeline } from "./pipeline-instance.js";
import { startImageRetryLoop } from "./image-generator.js";
import {
  runCreatorPipeline,
  verifyCreatorClaims,
  recalculateCreatorScores,
} from "./creator-pipeline.js";
import { analytics } from "./analytics.js";
import {
  sendDailyBriefingEmail,
  sendWeeklyDigestEmail,
  sendWeeklyScorecardEmail,
} from "./email.js";
import { buildWeeklyScorecard } from "./routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
const THREE_HOURS_MS = 3 * 60 * 60 * 1000;

// ─── Middleware ──────────────────────────────────────────────────────

// Trust first proxy (Railway / render / etc.) so secure cookies work
app.set("trust proxy", 1);

// ─── Security headers ─────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy:
      process.env.NODE_ENV === "production"
        ? undefined
        : {
            directives: {
              ...helmet.contentSecurityPolicy.getDefaultDirectives(),
              "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
              "connect-src": ["'self'", "ws:", "wss:"],
            },
          },
  }),
);

// ─── CORS ─────────────────────────────────────────────────────────
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production" ? "https://confirmd.news" : true,
    credentials: true,
  }),
);

// Stripe webhook needs raw body for signature verification — must come BEFORE express.json()
app.use("/api/stripe/webhook", express.raw({ type: "application/json" }));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session
const sessionConfig: session.SessionOptions = {
  secret: process.env.SESSION_SECRET || "confirmd-dev-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
};

if (pool) {
  const PgStore = pgSession(session);
  sessionConfig.store = new PgStore({ pool, createTableIfMissing: true });
}

app.use(session(sessionConfig));

// Rate limiting
const defaultApiMax = process.env.NODE_ENV === "production" ? 100 : 1000;
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX || String(defaultApiMax), 10),
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts, try again in 15 minutes" },
});

app.post("/api/auth/login", authLimiter);
app.post("/api/auth/signup", authLimiter);
app.use("/api", apiLimiter);

// Request logging + analytics tracking
app.use((req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (req.path.startsWith("/api")) {
      console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
      analytics.recordRequest(req.method, req.path, res.statusCode, duration);
    }
  });

  next();
});

// ─── API Routes ─────────────────────────────────────────────────────

app.use("/api/stripe", stripeRouter);
app.use("/api", apiRouter);

// ─── SEO Routes (root-level, no /api prefix) ─────────────────────────

app.get("/robots.txt", (_req, res) => {
  const SITE = "https://confirmd.xyz";
  res.set("Content-Type", "text/plain");
  res.set("Cache-Control", "public, max-age=3600");
  res.send(
    [
      "User-agent: *",
      "Allow: /",
      "",
      `Sitemap: ${SITE}/sitemap.xml`,
      `Sitemap: ${SITE}/sitemap-creators.xml`,
    ].join("\n"),
  );
});

app.get("/sitemap.xml", (_req, res) => {
  const SITE = "https://confirmd.xyz";
  const today = new Date().toISOString().split("T")[0];
  const staticPages = [
    { path: "/", priority: "1.0", changefreq: "daily" },
    { path: "/leaderboard", priority: "0.9", changefreq: "daily" },
    { path: "/feed", priority: "0.8", changefreq: "hourly" },
    { path: "/signals", priority: "0.7", changefreq: "daily" },
    { path: "/plus", priority: "0.6", changefreq: "weekly" },
  ];
  const urls = staticPages
    .map(
      ({ path, priority, changefreq }) =>
        `  <url>\n    <loc>${SITE}${path}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`,
    )
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
  res.set("Content-Type", "application/xml");
  res.set("Cache-Control", "public, max-age=3600");
  res.send(xml);
});

app.get("/sitemap-creators.xml", async (_req, res) => {
  const SITE = "https://confirmd.xyz";
  try {
    const creators = await storage.getCreators(true);
    const urls = creators
      .map((c) => {
        const lastmod = c.updatedAt
          ? new Date(c.updatedAt).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0];
        return `  <url>\n    <loc>${SITE}/creators/${c.id}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>`;
      })
      .join("\n");
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
    res.set("Content-Type", "application/xml");
    res.set("Cache-Control", "public, max-age=3600");
    res.send(xml);
  } catch (err) {
    console.error("GET /sitemap-creators.xml error:", err);
    res.status(500).send('<?xml version="1.0"?><urlset/>');
  }
});

// ─── AI-generated image static serving (works in all modes) ─────────
const imageStorageRoot =
  process.env.PERSISTENT_STORAGE_DIR || path.resolve("dist", "public");
app.use(
  "/story-images",
  express.static(path.join(imageStorageRoot, "story-images")),
);
app.use(
  "/video-thumbnails",
  express.static(path.join(imageStorageRoot, "video-thumbnails")),
);
app.use(
  "/tier-images",
  express.static(path.join(imageStorageRoot, "tier-images")),
);

// ─── Static / Vite Dev Server ───────────────────────────────────────

async function setupFrontend() {
  if (
    app.get("env") === "development" ||
    process.env.NODE_ENV !== "production"
  ) {
    // Development: use Vite dev server as middleware
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
      console.log("Vite dev server middleware attached");
    } catch (err) {
      console.warn(
        "Could not start Vite dev server. Falling back to static serving.",
        (err as Error).message,
      );
      serveStatic();
    }
  } else {
    // Production: serve built static files
    serveStatic();
  }
}

function serveStatic() {
  const publicDir = path.resolve(__dirname, "..", "dist", "public");

  // Serve AI-generated images from persistent volume (survives redeploys)
  const persistentDir = process.env.PERSISTENT_STORAGE_DIR;
  if (persistentDir) {
    app.use(
      "/story-images",
      express.static(path.join(persistentDir, "story-images")),
    );
    app.use(
      "/video-thumbnails",
      express.static(path.join(persistentDir, "video-thumbnails")),
    );
    app.use(
      "/tier-images",
      express.static(path.join(persistentDir, "tier-images")),
    );
    console.log(`Serving persistent images from ${persistentDir}`);
  }

  // Hashed assets (e.g. /assets/index-abc123.js) — cache 1 year immutable
  app.use(
    "/assets",
    express.static(path.join(publicDir, "assets"), {
      maxAge: "1y",
      immutable: true,
    }),
  );
  app.use(express.static(publicDir));
  app.get("*", (_req, res) => {
    res.sendFile(path.resolve(publicDir, "index.html"));
  });
  console.log(`Serving static files from ${publicDir}`);
}

// ─── Error Handling ─────────────────────────────────────────────────

// Sentry error handler must come before any other error middleware
Sentry.setupExpressErrorHandler(app);

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error("Unhandled error:", err.message);
    console.error(err.stack);
    res.status(500).json({
      error: "Internal server error",
      message:
        process.env.NODE_ENV === "production"
          ? "An unexpected error occurred"
          : err.message,
    });
  },
);

// ─── Auto-migration (adds missing columns to PostgreSQL) ─────────

async function runStartupMigrations() {
  if (!pool) return;
  console.log("[Migration] Checking for pending schema changes...");
  const client = await pool.connect();
  try {
    // Add story_status enum if it doesn't exist
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE story_status AS ENUM ('processing', 'complete', 'failed');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    // Add status column to story table if missing
    await client.query(`
      ALTER TABLE story ADD COLUMN IF NOT EXISTS status story_status NOT NULL DEFAULT 'complete';
    `);

    // Add newsletter_subscriber table if missing
    await client.query(`
      CREATE TABLE IF NOT EXISTS newsletter_subscriber (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT NOT NULL UNIQUE,
        preferences JSONB DEFAULT '{"dailyBriefing":true,"blindspotReport":true,"weeklyDigest":true}',
        is_active BOOLEAN DEFAULT true,
        subscribed_at TIMESTAMP DEFAULT NOW(),
        unsubscribed_at TIMESTAMP
      );
    `);

    // Add missing user columns
    await client.query(
      `ALTER TABLE "user" ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP`,
    );
    await client.query(
      `ALTER TABLE "user" ADD COLUMN IF NOT EXISTS display_name TEXT NOT NULL DEFAULT ''`,
    );
    await client.query(
      `ALTER TABLE "user" ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT`,
    );
    await client.query(
      `ALTER TABLE "user" ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT`,
    );
    await client.query(
      `ALTER TABLE "user" ADD COLUMN IF NOT EXISTS watchlist TEXT[] DEFAULT '{}'`,
    );

    // Promote admin account to tribune tier
    await client.query(`
      UPDATE "user" SET subscription_tier = 'tribune', subscription_expires_at = '2030-01-01'
      WHERE email = 'lewis@jackson.ventures' AND subscription_tier = 'free';
    `);

    // ── Creator Leaderboard v2 migrations ──────────────────────────

    // New enums for claim consistency and poll system
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE creator_claim_consistency AS ENUM ('first_occurrence', 'repeated', 'evolved', 'reversed');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE poll_status AS ENUM ('active', 'completed');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE suggestion_status AS ENUM ('pending', 'in_poll', 'added', 'rejected');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    // Add claim reflection columns to creator_claim
    await client.query(`
      ALTER TABLE creator_claim
        ADD COLUMN IF NOT EXISTS prior_claim_id UUID,
        ADD COLUMN IF NOT EXISTS consistency creator_claim_consistency DEFAULT 'first_occurrence',
        ADD COLUMN IF NOT EXISTS consistency_note TEXT;
    `);

    // Creator suggestion table (community-submitted channels to track)
    await client.query(`
      CREATE TABLE IF NOT EXISTS creator_suggestion (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        channel_name TEXT NOT NULL,
        channel_handle TEXT NOT NULL,
        youtube_channel_id TEXT,
        suggested_by TEXT,
        vote_count INTEGER DEFAULT 0,
        status suggestion_status NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Creator poll table
    await client.query(`
      CREATE TABLE IF NOT EXISTS creator_poll (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        status poll_status NOT NULL DEFAULT 'active',
        starts_at TIMESTAMP DEFAULT NOW(),
        ends_at TIMESTAMP,
        winner_suggestion_id UUID,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Poll options (links poll → suggestion)
    await client.query(`
      CREATE TABLE IF NOT EXISTS creator_poll_option (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        poll_id UUID NOT NULL REFERENCES creator_poll(id),
        suggestion_id UUID NOT NULL REFERENCES creator_suggestion(id),
        vote_count INTEGER DEFAULT 0
      );
    `);

    // Poll votes (IP-deduplicated)
    await client.query(`
      CREATE TABLE IF NOT EXISTS creator_poll_vote (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        poll_id UUID NOT NULL REFERENCES creator_poll(id),
        option_id UUID NOT NULL REFERENCES creator_poll_option(id),
        voter_fingerprint TEXT NOT NULL,
        voted_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Deactivate any creator not in the verified channel ID list
    // (removes stale/wrong channel IDs from old seeds)
    const VERIFIED_CHANNEL_IDS = [
      "UCqK_GSMbpiV8spgD3ZGloSw", // Coin Bureau
      "UCRvqjQPSeaWn-uEx-w0XOIg", // Benjamin Cowen
      "UCbLhGKVY-bJPcawebgtNfbw", // Altcoin Daily
      "UCCatR7nWbYrkVXdxXb4cGXw", // DataDash (corrected)
      "UCN9Nj4tjXbVTLYWN0EKly_Q", // Crypto Banter
      "UCl2oCaw8hdR_kbqyqd2klIA", // Lark Davis
      "UCviqt5aaucA1jP3qFmorZLQ", // Crypto Jebb
      "UClgJyzwGs-GyaNxUHcLZrkg", // InvestAnswers
      "UCrYmtJBtLdtm2ov84ulV-yg", // Ivan on Tech
      "UCZ3fejCy_P5xhv9QF-V6-YA", // Sheldon Evans
      "UCQglaVhGOBI0BR5S6IJnQPg", // Brian Jung
      "UCsYYksPHiGqXHPoHI-fm5sg", // Whiteboard Crypto
      "UCI7M65p3A-D3P4v5qW8POxQ", // CryptosRUs
      "UCQQ_fGcMDxlKre3SEqEWrLA", // 99Bitcoins
      "UCc4Rz_T9Sb1w5rqqo9pL1Og", // The Moon
      "UCJWCJCWOxBYSi5DhCieLOLQ", // aantonop
      "UCh1ob28ceGdqohUnR7vBACA", // Finematics
      "UCnJjRjmthxPCoQaAL44tR6g", // Alessio Rastani
      "UClWUQqWTL6xSK2Bx1bRlKPw", // Michael Wrubel
      "UCxIU1RFIdDpvA8VOITswQ1A", // Wolf of All Streets
      "UCAl9Ld79qaZxp9JzEOwd3aA", // Bankless
      "UCHop-jpf-huVT1IYw79ymPw", // Chico Crypto
      "UCjemQfjaXAzA-95RKoy9n_g", // Discover Crypto
    ];
    const placeholders = VERIFIED_CHANNEL_IDS.map((_, i) => `$${i + 1}`).join(
      ", ",
    );
    const deactivated = await client.query(
      `UPDATE creator SET is_active = false WHERE youtube_channel_id NOT IN (${placeholders}) AND is_active = true RETURNING channel_name`,
      VERIFIED_CHANNEL_IDS,
    );
    if (deactivated.rowCount && deactivated.rowCount > 0) {
      const names = deactivated.rows
        .map((r: { channel_name: string }) => r.channel_name)
        .join(", ");
      console.log(
        `[Migration] Deactivated ${deactivated.rowCount} stale creators: ${names}`,
      );
    }

    // Purge YouTube Shorts: delete claims first (FK), then videos
    // Detects Shorts by title containing #shorts or duration under 90s
    const deletedClaims = await client.query(`
      DELETE FROM creator_claim
      WHERE video_id IN (
        SELECT id FROM creator_video
        WHERE title ILIKE '%#short%'
           OR (duration_seconds > 0 AND duration_seconds < 90)
      )
      RETURNING id
    `);
    const deletedVideos = await client.query(`
      DELETE FROM creator_video
      WHERE title ILIKE '%#short%'
         OR (duration_seconds > 0 AND duration_seconds < 90)
      RETURNING youtube_video_id, title
    `);
    if (deletedVideos.rowCount && deletedVideos.rowCount > 0) {
      console.log(
        `[Migration] Purged ${deletedVideos.rowCount} Shorts videos and ${deletedClaims.rowCount} associated claims`,
      );
      deletedVideos.rows
        .slice(0, 5)
        .forEach((r: { youtube_video_id: string; title: string }) =>
          console.log(`  - ${r.title} (${r.youtube_video_id})`),
        );
    }

    // Add user_followed_creator table if missing
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_followed_creator (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES "user"(id),
        creator_id UUID NOT NULL REFERENCES creator(id),
        followed_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT user_followed_creator_user_creator_idx UNIQUE (user_id, creator_id)
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS user_followed_creator_user_id_idx
        ON user_followed_creator (user_id);
    `);

    // Email verification and password reset columns
    await client.query(
      `ALTER TABLE "user" ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false`,
    );
    await client.query(
      `ALTER TABLE "user" ADD COLUMN IF NOT EXISTS email_verify_token TEXT`,
    );
    await client.query(
      `ALTER TABLE "user" ADD COLUMN IF NOT EXISTS password_reset_token TEXT`,
    );
    await client.query(
      `ALTER TABLE "user" ADD COLUMN IF NOT EXISTS password_reset_expiry TIMESTAMP`,
    );

    console.log("[Migration] Schema up to date");
  } catch (err) {
    console.error("[Migration] Failed:", (err as Error).message);
  } finally {
    client.release();
  }
}

// ─── Start ──────────────────────────────────────────────────────────

async function main() {
  // Run migrations before anything else
  await runStartupMigrations();

  // Seed data only for in-memory storage (DB persists its own data)
  if (storage instanceof MemStorage) {
    await seedInitialData(storage);
    console.log("Seed data loaded (in-memory)");
  } else {
    console.log("Using PostgreSQL — skipping seed data");
  }

  // Seed creators if none exist (works for both MemStorage and Drizzle)
  try {
    await seedCreators(storage);
  } catch (err) {
    console.warn(
      "[Startup] seedCreators failed (will retry on first creator pipeline run):",
      (err as Error).message,
    );
  }

  // Set up frontend serving
  await setupFrontend();

  // Start listening
  app.listen(PORT, "0.0.0.0", () => {
    console.log("");
    console.log("=========================================");
    console.log(`  Confirmd server running on port ${PORT}`);
    console.log(`  Environment: ${app.get("env")}`);
    console.log(`  http://localhost:${PORT}`);
    console.log("=========================================");
    console.log("");

    // Start background image retry queue
    startImageRetryLoop(storage);

    // Delay the first pipeline run by 30 seconds so the server is fully ready
    setTimeout(() => {
      console.log("[Pipeline] Starting auto-run scheduler (6h interval)");
      pipeline.startScheduler(SIX_HOURS_MS);
    }, 30_000);

    // Creator pipeline: run once after 2 min delay, then every 3 hours
    const CREATOR_DELAY_MS = 2 * 60 * 1000;
    const runCreatorCycle = async () => {
      console.log("[CreatorPipeline] Starting scheduled run");
      try {
        await runCreatorPipeline(storage);
        await verifyCreatorClaims(storage);
        await recalculateCreatorScores(storage);
        console.log("[CreatorPipeline] Scheduled run complete");
      } catch (err) {
        console.error("[CreatorPipeline] Scheduled run failed:", err);
      }
    };

    setTimeout(() => {
      runCreatorCycle();
      setInterval(runCreatorCycle, THREE_HOURS_MS);
    }, CREATOR_DELAY_MS);

    // Note: verification runs only as part of the 3h full pipeline cycle above
    // (removed standalone hourly verification to reduce API costs)

    // ─── Email Schedulers (node-cron, UTC) ───────────────────────────

    // Build briefing payload directly from storage (same logic as GET /api/briefing/daily)
    async function buildBriefingData() {
      const stories = await storage.getStoriesForFeed(10, 0);
      const allClaims = await storage.getClaims({ sort: "newest", limit: 20 });
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentClaims = allClaims.filter(
        (c) => new Date(c.assertedAt).getTime() >= oneDayAgo.getTime(),
      );
      const verdictCounts = {
        verified: 0,
        plausible_unverified: 0,
        speculative: 0,
        misleading: 0,
      };
      for (const c of recentClaims) {
        const verdict = await storage.getVerdictByClaim(c.id);
        if (verdict) {
          const label = verdict.verdictLabel as keyof typeof verdictCounts;
          if (label in verdictCounts) verdictCounts[label]++;
        }
      }
      return {
        date: new Date().toISOString().split("T")[0],
        summary: {
          totalStories: stories.length,
          totalClaims: recentClaims.length,
          verdictBreakdown: verdictCounts,
        },
        topStories: stories.slice(0, 5).map((s) => ({
          id: s.id,
          title: s.title,
          summary: s.summary,
          category: s.category,
          sourceCount: s.sourceCount,
        })),
        recentClaims: [],
      };
    }

    // Daily briefing → Oracle subscribers at 08:00 UTC every day
    cron.schedule(
      "0 8 * * *",
      async () => {
        console.log("[Email] Running daily briefing job");
        try {
          const [oracleUsers, briefing] = await Promise.all([
            storage.getUsersByTier("oracle"),
            buildBriefingData(),
          ]);
          console.log(
            `[Email] Sending daily briefing to ${oracleUsers.length} Oracle subscriber(s)`,
          );
          for (const user of oracleUsers) {
            await sendDailyBriefingEmail(
              user.email,
              user.displayName,
              briefing,
            );
          }
        } catch (err) {
          console.error(
            "[Email] Daily briefing job failed:",
            (err as Error).message,
          );
        }
      },
      { timezone: "UTC" },
    );

    // Weekly digest → Tribune subscribers at 09:00 UTC every Monday
    cron.schedule(
      "0 9 * * 1",
      async () => {
        console.log("[Email] Running weekly digest job");
        try {
          const weekLabel = new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
            timeZone: "UTC",
          });
          const [tribuneUsers, briefing] = await Promise.all([
            storage.getUsersByTier("tribune"),
            buildBriefingData(),
          ]);
          console.log(
            `[Email] Sending weekly digest to ${tribuneUsers.length} Tribune subscriber(s)`,
          );
          for (const user of tribuneUsers) {
            await sendWeeklyDigestEmail(
              user.email,
              user.displayName,
              briefing,
              weekLabel,
            );
          }
        } catch (err) {
          console.error(
            "[Email] Weekly digest job failed:",
            (err as Error).message,
          );
        }
      },
      { timezone: "UTC" },
    );

    // Weekly Prediction Scorecard → Oracle subscribers at 09:00 UTC every Monday
    cron.schedule(
      "0 9 * * 1",
      async () => {
        console.log("[Email] Running weekly scorecard job");
        try {
          const [oracleUsers, scorecard] = await Promise.all([
            storage.getUsersByTier("oracle"),
            buildWeeklyScorecard(),
          ]);
          console.log(
            `[Email] Sending weekly scorecard to ${oracleUsers.length} Oracle subscriber(s)`,
          );
          for (const user of oracleUsers) {
            await sendWeeklyScorecardEmail(user.email, user.displayName, {
              weekLabel: scorecard.weekLabel,
              summary: scorecard.summary,
              resolvedCount: scorecard.resolvedCount,
              accuracyRate: scorecard.accuracyRate,
              biggestCorrectCall: scorecard.biggestCorrectCall,
              biggestMiss: scorecard.biggestMiss,
              topCreators: scorecard.topCreators ?? [],
            });
          }
        } catch (err) {
          console.error(
            "[Email] Weekly scorecard job failed:",
            (err as Error).message,
          );
        }
      },
      { timezone: "UTC" },
    );

    console.log(
      "[Email] Schedulers registered — daily briefing 08:00 UTC, weekly digest Mon 09:00 UTC, scorecard Mon 09:00 UTC",
    );
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
