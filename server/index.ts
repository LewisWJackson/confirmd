import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import apiRouter from "./routes.js";
import { storage, seedInitialData } from "./storage.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);

// ─── Middleware ──────────────────────────────────────────────────────

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  const originalSend = res.json.bind(res);

  // Intercept json responses to log timing
  res.json = (body: any) => {
    const duration = Date.now() - start;
    if (req.path.startsWith("/api")) {
      console.log(
        `${req.method} ${req.path} ${res.statusCode} ${duration}ms`
      );
    }
    return originalSend(body);
  };

  next();
});

// ─── API Routes ─────────────────────────────────────────────────────

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
  // Seed in-memory data
  await seedInitialData(storage);
  console.log("Seed data loaded");

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
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
