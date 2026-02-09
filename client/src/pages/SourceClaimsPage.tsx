import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { fetchSourceFeed, fetchSourceLeaderboard } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import SourceTypeBadge from "../components/SourceTypeBadge";

const FREE_VISIBLE = 8;
const FREE_BLURRED = 8;

const CATEGORIES = ["All", "Markets", "Regulation", "DeFi", "Security", "Technology"];

/* --- Helpers -------------------------------------------------- */

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin} minutes ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hours ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay} days ago`;
  const diffWeek = Math.floor(diffDay / 7);
  if (diffWeek < 4) return `${diffWeek} weeks ago`;
  return `${Math.floor(diffDay / 30)} months ago`;
}

function trackRecordColor(pct: number): string {
  if (pct >= 75) return "text-factuality-high";
  if (pct >= 60) return "text-factuality-mixed";
  return "text-factuality-low";
}

const VERDICT_STYLES: Record<string, string> = {
  verified: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  confirmed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  plausible: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  speculative: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  misleading: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  false: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

/* --- Source Logo ------------------------------------------------ */

function SourceLogo({ source, size = "md" }: { source: any; size?: "sm" | "md" }) {
  const dim = size === "sm" ? "w-8 h-8" : "w-10 h-10";
  const textSize = size === "sm" ? "text-xs" : "text-sm";

  const logoUrl = source?.logoUrl;
  const fallbackUrl = source?.handleOrDomain
    ? `https://www.google.com/s2/favicons?domain=${source.handleOrDomain}&sz=128`
    : null;
  const letter = (source?.displayName || source?.logo || "?").charAt(0).toUpperCase();

  const [imgError, setImgError] = useState(false);
  const [fallbackError, setFallbackError] = useState(false);

  if (logoUrl && !imgError) {
    return (
      <div className={`${dim} rounded-full overflow-hidden bg-surface-card-hover flex-shrink-0`}>
        <img
          src={logoUrl}
          alt={source.displayName}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  if (fallbackUrl && !fallbackError) {
    return (
      <div className={`${dim} rounded-full overflow-hidden bg-surface-card-hover flex-shrink-0`}>
        <img
          src={fallbackUrl}
          alt={source.displayName}
          className="w-full h-full object-contain p-1"
          onError={() => setFallbackError(true)}
        />
      </div>
    );
  }

  return (
    <div className={`${dim} rounded-full bg-surface-card flex items-center justify-center flex-shrink-0`}>
      <span className={`${textSize} font-black text-content-muted`}>{letter}</span>
    </div>
  );
}

/* --- Source Claim Card ------------------------------------------ */

function SourceClaimCard({
  claim,
  onClick,
}: {
  claim: any;
  onClick: () => void;
}) {
  const source = claim.source;
  const verdict = claim.verdict;
  const verdictLabel = verdict?.verdictLabel || "speculative";
  const verdictStyle = VERDICT_STYLES[verdictLabel] || VERDICT_STYLES.speculative;
  const trackRecord = source?.score?.trackRecord ?? 0;

  return (
    <div onClick={onClick} className="group cursor-pointer">
      {/* Source header row */}
      <div className="flex items-center gap-2.5 mb-2.5">
        <SourceLogo source={source} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] font-semibold text-content-primary truncate group-hover:text-accent transition-colors">
              {source?.displayName || "Unknown Source"}
            </span>
          </div>
          <SourceTypeBadge type={source?.type || "publisher"} />
        </div>
      </div>

      {/* Claim text */}
      <h3 className="text-sm font-semibold text-content-primary leading-snug line-clamp-2 mb-2.5 group-hover:text-accent transition-colors">
        {claim.claimText}
      </h3>

      {/* Bottom row: verdict badge + track record + time */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${verdictStyle}`}>
          {verdictLabel}
        </span>
        <span className={`text-[12px] font-bold ${trackRecordColor(trackRecord)}`}>
          {trackRecord}%
        </span>
        {claim.assertedAt && (
          <>
            <span className="text-content-muted text-[11px]">&middot;</span>
            <span className="text-[11px] text-content-muted">{timeAgo(claim.assertedAt)}</span>
          </>
        )}
      </div>
    </div>
  );
}

/* --- Sidebar Leaderboard Entry --------------------------------- */

function LeaderboardSource({
  source,
  rank,
  onClick,
}: {
  source: any;
  rank: number;
  onClick: () => void;
}) {
  return (
    <div onClick={onClick} className="group flex items-center gap-3 py-2 cursor-pointer">
      <span className="text-[12px] font-bold text-content-muted w-5 text-right flex-shrink-0">
        {rank}
      </span>
      <SourceLogo source={source} size="sm" />
      <div className="flex-1 min-w-0">
        <span className="text-[13px] font-semibold text-content-primary group-hover:text-accent transition-colors line-clamp-1">
          {source.displayName}
        </span>
        <span className="text-[11px] text-content-muted block">
          {source.claimCount ?? 0} claims
        </span>
      </div>
      <span className={`text-sm font-bold ${trackRecordColor(source.trackRecord || 0)}`}>
        {source.trackRecord ?? 0}%
      </span>
    </div>
  );
}

/* --- Loading Skeleton ------------------------------------------ */

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div key={i} className="animate-pulse">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 bg-surface-card rounded-full" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 bg-surface-card rounded w-3/4" />
              <div className="h-2.5 bg-surface-card rounded w-1/3" />
            </div>
          </div>
          <div className="h-4 bg-surface-card rounded w-full mb-1.5" />
          <div className="h-4 bg-surface-card rounded w-2/3 mb-2.5" />
          <div className="flex gap-2">
            <div className="h-5 bg-surface-card rounded-full w-16" />
            <div className="h-5 bg-surface-card rounded w-10" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* --- Explainer Banner ------------------------------------------ */

function ExplainerBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="bg-surface-card border border-border rounded-xl p-5 mb-6 relative">
      <button
        onClick={onDismiss}
        className="absolute top-3 right-3 text-content-muted hover:text-content-primary transition-colors"
        aria-label="Dismiss"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="flex items-start gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-bold text-content-primary">How Source Claims work</h3>
          <p className="text-[12px] text-content-muted mt-0.5">Every card shows a claim made by a news outlet, scored for accuracy and credibility.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="flex items-start gap-2.5 bg-surface-primary rounded-lg p-3">
          <div className="w-6 h-6 rounded bg-surface-card-hover flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-3.5 h-3.5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2" />
            </svg>
          </div>
          <div>
            <p className="text-[12px] font-semibold text-content-primary">Browse claims</p>
            <p className="text-[11px] text-content-muted">See what news sources are reporting and our verification verdict</p>
          </div>
        </div>

        <div className="flex items-start gap-2.5 bg-surface-primary rounded-lg p-3">
          <div className="w-6 h-6 rounded bg-surface-card-hover flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-3.5 h-3.5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <p className="text-[12px] font-semibold text-content-primary">Track record</p>
            <p className="text-[11px] text-content-muted">Each source has an accuracy score based on their claim history</p>
          </div>
        </div>

        <div className="flex items-start gap-2.5 bg-surface-primary rounded-lg p-3">
          <div className="w-6 h-6 rounded bg-surface-card-hover flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-3.5 h-3.5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <p className="text-[12px] font-semibold text-content-primary">Click a source</p>
            <p className="text-[11px] text-content-muted">View the full source profile with detailed credibility metrics</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* --- Main Page ------------------------------------------------- */

export default function SourceClaimsPage() {
  const [, setLocation] = useLocation();
  const { tier } = useAuth();
  const isPaid = tier !== "free";
  const [activeCategory, setActiveCategory] = useState("All");
  const [showExplainer, setShowExplainer] = useState(() => {
    try { return localStorage.getItem("confirmd_source_claims_tutorial_dismissed") !== "1"; } catch { return true; }
  });

  const { data: claims = [], isLoading: feedLoading } = useQuery({
    queryKey: ["source-feed"],
    queryFn: () => fetchSourceFeed({ limit: 50 }),
  });

  const { data: leaderboard = [], isLoading: lbLoading } = useQuery({
    queryKey: ["source-leaderboard"],
    queryFn: fetchSourceLeaderboard,
  });

  // Filter by category
  const filteredClaims = useMemo(() => {
    if (activeCategory === "All") return claims;
    const catLower = activeCategory.toLowerCase();
    return claims.filter((c: any) => {
      const type = (c.claimType || "").toLowerCase();
      if (catLower === "markets") return type.includes("price") || type.includes("market");
      if (catLower === "regulation") return type.includes("regulat") || type.includes("filing") || type.includes("legal");
      if (catLower === "defi") return type.includes("defi") || type.includes("protocol") || type.includes("exploit");
      if (catLower === "security") return type.includes("security") || type.includes("hack") || type.includes("exploit");
      if (catLower === "technology") return type.includes("tech") || type.includes("launch") || type.includes("upgrade");
      return true;
    });
  }, [claims, activeCategory]);

  const visibleClaims = isPaid
    ? filteredClaims
    : filteredClaims.slice(0, FREE_VISIBLE);
  const blurredClaims = isPaid
    ? []
    : filteredClaims.slice(FREE_VISIBLE, FREE_VISIBLE + FREE_BLURRED);

  // Sidebar leaderboard: free users see top 5 blurred, 6-10 visible
  const blurredLeaderboard = useMemo(() => {
    if (isPaid || leaderboard.length === 0) return [];
    return leaderboard.slice(0, Math.min(5, leaderboard.length));
  }, [isPaid, leaderboard]);
  const visibleLeaderboard = isPaid ? leaderboard : leaderboard.slice(5, 10);

  return (
    <div className="animate-in fade-in duration-700 min-h-screen bg-surface-primary">
      {/* Category filter chips */}
      <div className="sticky top-0 z-20 bg-surface-primary border-b border-border">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-3">
          <div className="flex gap-2.5 overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: "none" }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-[13px] font-medium whitespace-nowrap transition-all ${
                  activeCategory === cat
                    ? "bg-accent text-accent-text"
                    : "bg-surface-card text-content-primary hover:bg-surface-card-hover"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6">
        <div className="flex gap-6">
          {/* Claim grid */}
          <div className="flex-1 min-w-0">
            {feedLoading ? (
              <LoadingSkeleton />
            ) : filteredClaims.length === 0 ? (
              <div className="rounded-xl bg-surface-card p-16 text-center">
                <svg className="w-16 h-16 text-content-muted mx-auto mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2" />
                </svg>
                <h3 className="text-lg font-bold text-content-primary">No source claims yet</h3>
                <p className="text-sm text-content-muted mt-1">
                  {activeCategory !== "All"
                    ? `No claims in ${activeCategory}. Try a different category.`
                    : "Source claims will appear here once data is available."}
                </p>
              </div>
            ) : (
              <>
                {/* Explainer */}
                {showExplainer && (
                  <ExplainerBanner onDismiss={() => {
                    setShowExplainer(false);
                    try { localStorage.setItem("confirmd_source_claims_tutorial_dismissed", "1"); } catch {}
                  }} />
                )}

                {/* Claim grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
                  {visibleClaims.map((claim: any) => (
                    <SourceClaimCard
                      key={claim.id}
                      claim={claim}
                      onClick={() => setLocation(`/sources/${claim.source?.id || ""}`)}
                    />
                  ))}
                </div>

                {/* Blurred cards + upgrade CTA (free users) */}
                {!isPaid && blurredClaims.length > 0 && (
                  <div className="relative mt-0" style={{ maskImage: "linear-gradient(to bottom, transparent 0%, black 8%, black 100%)", WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 8%, black 100%)" }}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8 pointer-events-none select-none">
                      {blurredClaims.map((claim: any, idx: number) => {
                        const blurPx = 2 + idx * 2;
                        return (
                          <div key={claim.id} style={{ filter: `blur(${blurPx}px)` }}>
                            <SourceClaimCard claim={claim} onClick={() => {}} />
                          </div>
                        );
                      })}
                    </div>
                    <div
                      className="absolute inset-0 flex items-center justify-center"
                      style={{
                        background: "linear-gradient(to bottom, transparent 0%, var(--color-surface-primary, rgb(15,15,15)) 85%)",
                      }}
                    >
                      <div className="text-center">
                        <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                          <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-bold text-content-primary mb-2">Unlock all source claims</h3>
                        <p className="text-sm text-content-secondary max-w-md mx-auto mb-6">Get Confirmd+ to see every claim, track source accuracy, and access the full leaderboard.</p>
                        <button
                          onClick={() => setLocation("/plus")}
                          className="pointer-events-auto px-6 py-3 bg-accent text-accent-text text-sm font-bold rounded-full hover:bg-accent-hover transition-all"
                        >
                          Upgrade to Confirmd+
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right sidebar -- Source Leaderboard */}
          <aside className="hidden lg:block w-[300px] flex-shrink-0">
            <div className="sticky top-16">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-content-primary">Top Sources</h2>
                {isPaid && (
                  <button
                    onClick={() => setLocation("/source-leaderboard")}
                    className="text-[12px] font-semibold text-accent hover:text-accent-hover transition-colors"
                  >
                    View all
                  </button>
                )}
              </div>

              {lbLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-3 animate-pulse">
                      <div className="w-5 h-4 bg-surface-card rounded" />
                      <div className="w-8 h-8 bg-surface-card rounded-full" />
                      <div className="flex-1 h-4 bg-surface-card rounded" />
                    </div>
                  ))}
                </div>
              ) : leaderboard.length === 0 ? (
                <p className="text-sm text-content-muted py-4">No ranked sources yet.</p>
              ) : (
                <div>
                  {/* Blurred top sources (free users) */}
                  {!isPaid && blurredLeaderboard.length > 0 && (
                    <div className="relative mb-0" style={{ maskImage: "linear-gradient(to bottom, black 0%, black 70%, transparent 100%)", WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 70%, transparent 100%)" }}>
                      <div className="divide-y divide-border pointer-events-none select-none">
                        {blurredLeaderboard.map((source: any, i: number) => {
                          const blurPx = 8 - i * 1.5;
                          return (
                            <div key={source.id} style={{ filter: `blur(${Math.max(blurPx, 2)}px)` }}>
                              <LeaderboardSource source={source} rank={i + 1} onClick={() => {}} />
                            </div>
                          );
                        })}
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-transparent to-surface-primary/60" />
                    </div>
                  )}

                  {/* Visible leaderboard entries */}
                  <div className="divide-y divide-border">
                    {visibleLeaderboard.map((source: any, i: number) => (
                      <LeaderboardSource
                        key={source.id}
                        source={source}
                        rank={isPaid ? i + 1 : i + 6}
                        onClick={() => setLocation(`/sources/${source.id}`)}
                      />
                    ))}
                  </div>

                  {!isPaid && (
                    <button
                      onClick={() => setLocation("/plus")}
                      className="w-full mt-4 py-2.5 text-[12px] font-semibold text-accent border border-accent/30 rounded-full hover:bg-accent/5 transition-colors"
                    >
                      Unlock full leaderboard
                    </button>
                  )}
                </div>
              )}

              {/* Confirmd+ promo card */}
              <div className="mt-6 p-4 rounded-xl bg-surface-card border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-bold text-content-primary">Confirmd+</span>
                  <span className="text-[9px] font-bold text-accent bg-accent/10 px-1.5 py-0.5 rounded">PRO</span>
                </div>
                <p className="text-[12px] text-content-muted leading-relaxed mb-3">
                  Access complete source ratings, full leaderboard, and detailed credibility analysis.
                </p>
                <button
                  onClick={() => setLocation("/plus")}
                  className="w-full py-2 text-[12px] font-semibold bg-accent text-accent-text rounded-full hover:bg-accent-hover transition-colors"
                >
                  Get Confirmd+
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
