import "dotenv/config";
import express from "express";
import session from "express-session";
import pgSession from "connect-pg-simple";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import apiRouter from "./routes.js";
import stripeRouter from "./stripe.js";
import { storage, seedInitialData, MemStorage } from "./storage.js";
import { pool } from "./db.js";
import { pipeline } from "./pipeline-instance.js";
import { runCreatorPipeline, verifyCreatorClaims, recalculateCreatorScores } from "./creator-pipeline.js";
import { analytics } from "./analytics.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

// ─── Middleware ──────────────────────────────────────────────────────

// Trust first proxy (Railway / render / etc.) so secure cookies work
app.set("trust proxy", 1);

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
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/auth", authLimiter);
app.use("/api", apiLimiter);

// Request logging + analytics tracking
app.use((req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (req.path.startsWith("/api")) {
      console.log(
        `${req.method} ${req.path} ${res.statusCode} ${duration}ms`
      );
      analytics.recordRequest(req.method, req.path, res.statusCode, duration);
    }
  });

  next();
});

// ─── API Routes ─────────────────────────────────────────────────────

app.use("/api/stripe", stripeRouter);
app.use("/api", apiRouter);

// ─── Static / Vite Dev Server ───────────────────────────────────────

async function setupFrontend() {
  if (app.get("env") === "development" || process.env.NODE_ENV !== "production") {
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
        (err as Error).message
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
    app.use("/story-images", express.static(path.join(persistentDir, "story-images")));
    app.use("/video-thumbnails", express.static(path.join(persistentDir, "video-thumbnails")));
    app.use("/tier-images", express.static(path.join(persistentDir, "tier-images")));
    console.log(`Serving persistent images from ${persistentDir}`);
  }

  app.use(express.static(publicDir));
  app.get("*", (_req, res) => {
    res.sendFile(path.resolve(publicDir, "index.html"));
  });
  console.log(`Serving static files from ${publicDir}`);
}

// ─── Error Handling ─────────────────────────────────────────────────

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
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
  }
);

// ─── Start ──────────────────────────────────────────────────────────

async function main() {
  // Seed data only for in-memory storage (DB persists its own data)
  if (storage instanceof MemStorage) {
    await seedInitialData(storage);
    console.log("Seed data loaded (in-memory)");
  } else {
    console.log("Using PostgreSQL — skipping seed data");
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

    // Delay the first pipeline run by 30 seconds so the server is fully ready
    setTimeout(() => {
      console.log("[Pipeline] Starting auto-run scheduler (6h interval)");
      pipeline.startScheduler(SIX_HOURS_MS);
    }, 30_000);

    // Creator pipeline: run once after 5 min delay, then every 6 hours
    const CREATOR_DELAY_MS = 5 * 60 * 1000;
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
      setInterval(runCreatorCycle, SIX_HOURS_MS);
    }, CREATOR_DELAY_MS);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
