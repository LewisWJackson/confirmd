/**
 * Lightweight in-memory analytics and monitoring for Confirmd.
 * Tracks API request counts, response times, error rates, and pipeline run stats.
 * No external dependencies — pure Node.js.
 */

// ─── Types ───────────────────────────────────────────────────────────

interface EndpointStats {
  requestCount: number;
  responseTimes: number[];        // sliding window of recent response times (ms)
  statusCodes: Record<number, number>;
}

interface PipelineRunRecord {
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
  articlesProcessed: number;
  claimsExtracted: number;
  success: boolean;
  error: string | null;
}

export interface MetricsSnapshot {
  api: {
    totalRequests: number;
    endpoints: Record<string, {
      requestCount: number;
      avgResponseMs: number;
      p95ResponseMs: number;
      p99ResponseMs: number;
    }>;
    errorRates: Record<string, number>;   // status code group -> count
  };
  pipeline: {
    totalRuns: number;
    lastRun: PipelineRunRecord | null;
    recentRuns: PipelineRunRecord[];
    successRate: number;
  };
  system: {
    uptimeSeconds: number;
    memoryUsageMB: number;
    startedAt: string;
  };
}

// ─── Constants ───────────────────────────────────────────────────────

const MAX_RESPONSE_TIMES = 500;   // keep last N response times per endpoint
const MAX_PIPELINE_RUNS = 20;     // keep last N pipeline run records

// ─── Analytics Singleton ─────────────────────────────────────────────

class Analytics {
  private endpoints: Map<string, EndpointStats> = new Map();
  private pipelineRuns: PipelineRunRecord[] = [];
  private activePipelineRun: { startedAt: string } | null = null;
  private totalRequests = 0;
  private startedAt = new Date().toISOString();

  // ── Request Tracking ────────────────────────────────────────────

  /**
   * Record an API request. Called from Express middleware.
   */
  recordRequest(method: string, path: string, statusCode: number, durationMs: number): void {
    this.totalRequests++;

    // Normalize path: collapse IDs like /api/claims/abc123 -> /api/claims/:id
    const key = `${method} ${normalizePath(path)}`;

    let stats = this.endpoints.get(key);
    if (!stats) {
      stats = { requestCount: 0, responseTimes: [], statusCodes: {} };
      this.endpoints.set(key, stats);
    }

    stats.requestCount++;

    // Sliding window for response times
    stats.responseTimes.push(durationMs);
    if (stats.responseTimes.length > MAX_RESPONSE_TIMES) {
      stats.responseTimes.shift();
    }

    // Status code tracking
    stats.statusCodes[statusCode] = (stats.statusCodes[statusCode] || 0) + 1;
  }

  // ── Pipeline Tracking ───────────────────────────────────────────

  /**
   * Record the start of a pipeline run.
   */
  recordPipelineStart(): void {
    this.activePipelineRun = { startedAt: new Date().toISOString() };
  }

  /**
   * Record the end of a pipeline run.
   */
  recordPipelineEnd(articlesProcessed: number, claimsExtracted: number, error?: string): void {
    const now = new Date().toISOString();
    const startedAt = this.activePipelineRun?.startedAt || now;
    const startMs = new Date(startedAt).getTime();
    const endMs = new Date(now).getTime();

    const record: PipelineRunRecord = {
      startedAt,
      finishedAt: now,
      durationMs: endMs - startMs,
      articlesProcessed,
      claimsExtracted,
      success: !error,
      error: error || null,
    };

    this.pipelineRuns.push(record);
    if (this.pipelineRuns.length > MAX_PIPELINE_RUNS) {
      this.pipelineRuns.shift();
    }

    this.activePipelineRun = null;
  }

  // ── Metrics Snapshot ────────────────────────────────────────────

  /**
   * Build a full metrics snapshot for the /api/admin/metrics endpoint.
   */
  getMetrics(): MetricsSnapshot {
    // Endpoint stats
    const endpointMetrics: MetricsSnapshot["api"]["endpoints"] = {};
    for (const [key, stats] of this.endpoints) {
      endpointMetrics[key] = {
        requestCount: stats.requestCount,
        avgResponseMs: avg(stats.responseTimes),
        p95ResponseMs: percentile(stats.responseTimes, 0.95),
        p99ResponseMs: percentile(stats.responseTimes, 0.99),
      };
    }

    // Error rates grouped by status code class
    const errorRates: Record<string, number> = {};
    for (const [, stats] of this.endpoints) {
      for (const [code, count] of Object.entries(stats.statusCodes)) {
        const codeNum = parseInt(code, 10);
        if (codeNum >= 400) {
          const group = `${Math.floor(codeNum / 100)}xx`;
          errorRates[group] = (errorRates[group] || 0) + count;
        }
      }
    }

    // Pipeline stats
    const successfulRuns = this.pipelineRuns.filter((r) => r.success).length;
    const totalRuns = this.pipelineRuns.length;

    // Memory usage
    const memUsage = process.memoryUsage();

    return {
      api: {
        totalRequests: this.totalRequests,
        endpoints: endpointMetrics,
        errorRates,
      },
      pipeline: {
        totalRuns,
        lastRun: this.pipelineRuns.length > 0
          ? this.pipelineRuns[this.pipelineRuns.length - 1]
          : null,
        recentRuns: this.pipelineRuns.slice(-5),
        successRate: totalRuns > 0 ? successfulRuns / totalRuns : 1,
      },
      system: {
        uptimeSeconds: Math.floor(process.uptime()),
        memoryUsageMB: Math.round(memUsage.heapUsed / 1024 / 1024),
        startedAt: this.startedAt,
      },
    };
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────

/**
 * Normalize a request path by collapsing UUID/ID segments to `:id`.
 * e.g. /api/claims/abc-123-def -> /api/claims/:id
 */
function normalizePath(path: string): string {
  return path.replace(
    /\/[0-9a-f]{8,}(-[0-9a-f]{4,}){0,4}/gi,
    "/:id",
  );
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((s, v) => s + v, 0) / values.length);
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.ceil(p * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

// ─── Export singleton ────────────────────────────────────────────────

export const analytics = new Analytics();
