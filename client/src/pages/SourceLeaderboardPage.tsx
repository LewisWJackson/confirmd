import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { fetchSourceLeaderboard } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import UpgradePrompt from "../components/UpgradePrompt";
import SourceTypeBadge from "../components/SourceTypeBadge";

function trackRecordColor(pct: number): string {
  if (pct >= 75) return "text-emerald-600";
  if (pct >= 60) return "text-amber-500";
  if (pct >= 45) return "text-orange-500";
  return "text-red-500";
}

function RankChange({ change }: { change: number }) {
  if (change > 0) {
    return (
      <span className="flex items-center gap-0.5 text-xs font-bold text-emerald-500">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
        {change}
      </span>
    );
  }
  if (change < 0) {
    return (
      <span className="flex items-center gap-0.5 text-xs font-bold text-red-500">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
        {Math.abs(change)}
      </span>
    );
  }
  return <span className="text-xs text-content-muted">—</span>;
}

function SourceLogo({ source, size = "md" }: { source: any; size?: "sm" | "md" | "lg" }) {
  const dim = size === "lg" ? "w-16 h-16" : size === "sm" ? "w-8 h-8" : "w-10 h-10";
  const textSize = size === "lg" ? "text-lg" : size === "sm" ? "text-xs" : "text-sm";
  const rounding = size === "lg" ? "rounded-2xl" : "rounded-full";

  const logoUrl = source?.logoUrl;
  const fallbackUrl = source?.handleOrDomain
    ? `https://www.google.com/s2/favicons?domain=${source.handleOrDomain}&sz=128`
    : null;
  const letter = (source?.displayName || source?.logo || "?").charAt(0).toUpperCase();

  const [imgError, setImgError] = React.useState(false);
  const [fallbackError, setFallbackError] = React.useState(false);

  if (logoUrl && !imgError) {
    return (
      <div className={`${dim} ${rounding} overflow-hidden bg-surface-card-hover flex-shrink-0`}>
        <img src={logoUrl} alt={source.displayName} className="w-full h-full object-cover" onError={() => setImgError(true)} />
      </div>
    );
  }
  if (fallbackUrl && !fallbackError) {
    return (
      <div className={`${dim} ${rounding} overflow-hidden bg-surface-card-hover flex-shrink-0`}>
        <img src={fallbackUrl} alt={source.displayName} className="w-full h-full object-contain p-1" onError={() => setFallbackError(true)} />
      </div>
    );
  }
  return (
    <div className={`${dim} ${rounding} bg-surface-card flex items-center justify-center flex-shrink-0`}>
      <span className={`${textSize} font-black text-content-muted`}>{letter}</span>
    </div>
  );
}

function PodiumCard({ source, rank }: { source: any; rank: number }) {
  const config = {
    1: {
      height: "h-40",
      border: "border-amber-300",
      bg: "bg-gradient-to-b from-amber-50 to-white dark:from-amber-900/20 dark:to-surface-card",
      badge: "bg-amber-400 text-white",
      label: "1st",
      glow: "shadow-[0_4px_30px_rgba(245,158,11,0.15)]",
    },
    2: {
      height: "h-32",
      border: "border-slate-300 dark:border-slate-600",
      bg: "bg-gradient-to-b from-slate-50 to-white dark:from-slate-800/30 dark:to-surface-card",
      badge: "bg-slate-400 text-white",
      label: "2nd",
      glow: "",
    },
    3: {
      height: "h-28",
      border: "border-orange-300 dark:border-orange-600",
      bg: "bg-gradient-to-b from-orange-50 to-white dark:from-orange-900/20 dark:to-surface-card",
      badge: "bg-orange-400 text-white",
      label: "3rd",
      glow: "",
    },
  }[rank] || { height: "h-24", border: "border-border", bg: "bg-surface-card", badge: "bg-slate-300 text-white", label: `${rank}`, glow: "" };

  return (
    <div className={`flex flex-col items-center ${rank === 1 ? "order-2" : rank === 2 ? "order-1" : "order-3"}`}>
      <div className="relative mb-3">
        <SourceLogo source={source} size="lg" />
        <div className={`absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-lg ${config.badge} flex items-center justify-center text-[10px] font-black`}>
          {config.label}
        </div>
      </div>
      <h3 className="text-sm font-black text-content-primary tracking-tight text-center truncate max-w-[120px]">
        {source.displayName}
      </h3>
      <div className={`text-lg font-black ${trackRecordColor(source.trackRecord || 0)} mt-1`}>
        {source.trackRecord ?? 0}%
      </div>
      <div className="text-[9px] font-bold text-content-muted uppercase tracking-wider">
        {source.claimCount ?? 0} claims
      </div>
      <div className={`rounded-xl ${config.bg} border ${config.border} ${config.height} w-24 mt-3`} />
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-end justify-center gap-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col items-center animate-pulse">
            <div className="w-16 h-16 bg-surface-card-hover rounded-2xl mb-3" />
            <div className="h-4 bg-surface-card-hover rounded w-20 mb-2" />
            <div className="h-6 bg-surface-card-hover rounded w-12" />
          </div>
        ))}
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="rounded-2xl border border-border bg-surface-card p-5 animate-pulse flex items-center gap-4">
            <div className="w-10 h-10 bg-surface-card-hover rounded-xl" />
            <div className="w-10 h-10 bg-surface-card-hover rounded-full" />
            <div className="flex-1 h-5 bg-surface-card-hover rounded-lg w-1/3" />
            <div className="h-5 bg-surface-card-hover rounded-lg w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SourceLeaderboardPage() {
  const [, setLocation] = useLocation();
  const { tier } = useAuth();

  const { data: sources = [], isLoading } = useQuery({
    queryKey: ["source-leaderboard"],
    queryFn: fetchSourceLeaderboard,
  });

  // Gate behind plus tier
  if (tier === "free") {
    return (
      <div className="animate-in fade-in duration-1000 relative z-10">
        <section className="max-w-7xl mx-auto px-6 md:px-12 pt-16 pb-8 text-center">
          <span className="text-[10px] font-black tracking-[0.5em] text-accent uppercase">Rankings</span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-content-primary mt-2 leading-[0.95]">
            Source Leaderboard
          </h1>
          <p className="text-lg text-content-secondary mt-4 font-medium max-w-xl mx-auto">
            See which news sources are most credible, ranked by verified claim accuracy.
          </p>
        </section>
        <section className="max-w-2xl mx-auto px-6 md:px-12 pb-24">
          <UpgradePrompt
            requiredTier="plus"
            featureName="Source Leaderboard"
            description="Access the full source leaderboard with credibility rankings, methodology scores, and confidence intervals."
          />
        </section>
      </div>
    );
  }

  const top3 = sources.slice(0, 3);
  const rest = sources.slice(3);

  return (
    <div className="animate-in fade-in duration-1000 relative z-10">
      {/* Header */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 pt-16 pb-8 text-center">
        <span className="text-[10px] font-black tracking-[0.5em] text-accent uppercase">Rankings</span>
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-content-primary mt-2 leading-[0.95]">
          Source Leaderboard
        </h1>
        <p className="text-lg text-content-secondary mt-4 font-medium max-w-xl mx-auto">
          News sources ranked by factual accuracy. Who reports it right?
        </p>
      </section>

      <section className="max-w-7xl mx-auto px-6 md:px-12 pb-24">
        {isLoading ? (
          <LoadingSkeleton />
        ) : sources.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface-card p-16 text-center">
            <h3 className="text-xl font-black text-content-primary tracking-tight">No ranked sources yet</h3>
            <p className="text-sm text-content-secondary mt-2 font-medium">
              Rankings will appear once sources have enough verified claims.
            </p>
          </div>
        ) : (
          <>
            {/* Podium */}
            {top3.length >= 3 && (
              <div className="flex items-end justify-center gap-6 md:gap-10 mb-12 pt-4">
                {top3.map((s: any, i: number) => (
                  <div key={s.id} className="cursor-pointer" onClick={() => setLocation(`/sources/${s.id}`)}>
                    <PodiumCard source={s} rank={i + 1} />
                  </div>
                ))}
              </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="rounded-2xl border border-border bg-surface-card p-5 text-center">
                <div className="text-2xl font-black text-content-primary">{sources.length}</div>
                <div className="text-[10px] font-black uppercase tracking-widest text-content-muted mt-1">Sources Ranked</div>
              </div>
              <div className="rounded-2xl border border-border bg-surface-card p-5 text-center">
                <div className="text-2xl font-black text-content-primary">
                  {sources.reduce((sum: number, s: any) => sum + (s.claimCount || 0), 0)}
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest text-content-muted mt-1">Total Claims</div>
              </div>
              <div className="rounded-2xl border border-border bg-surface-card p-5 text-center">
                <div className="text-2xl font-black text-content-primary">
                  {sources.length > 0
                    ? Math.round(sources.reduce((sum: number, s: any) => sum + (s.trackRecord || 0), 0) / sources.length)
                    : 0}%
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest text-content-muted mt-1">Avg Track Record</div>
              </div>
            </div>

            {/* Full Table */}
            <div className="space-y-3">
              {(top3.length < 3 ? sources : rest).map((source: any, i: number) => {
                const rank = top3.length < 3 ? i + 1 : i + 4;
                return (
                  <div
                    key={source.id}
                    onClick={() => setLocation(`/sources/${source.id}`)}
                    className="rounded-2xl border border-border bg-surface-card p-4 md:p-5 hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)] transition-all cursor-pointer group flex items-center gap-4"
                  >
                    {/* Rank */}
                    <div className="w-10 h-10 rounded-xl bg-surface-primary border border-border flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-black text-content-secondary">{rank}</span>
                    </div>

                    {/* Logo */}
                    <SourceLogo source={source} size="md" />

                    {/* Name + type */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-content-primary truncate group-hover:text-accent transition-colors">
                          {source.displayName}
                        </span>
                        <SourceTypeBadge type={source.type} />
                      </div>
                      <div className="text-xs text-content-muted font-medium mt-0.5">
                        {source.handleOrDomain}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="hidden sm:flex items-center gap-6">
                      <div className="text-center w-20">
                        <div className={`text-lg font-black ${trackRecordColor(source.trackRecord || 0)}`}>
                          {source.trackRecord ?? 0}%
                        </div>
                        <div className="text-[9px] font-bold text-content-muted uppercase tracking-wider">Track Record</div>
                      </div>
                      <div className="text-center w-20">
                        <div className="text-sm font-black text-content-secondary">{source.methodDiscipline ?? 0}%</div>
                        <div className="text-[9px] font-bold text-content-muted uppercase tracking-wider">Method</div>
                      </div>
                      <div className="text-center w-16">
                        <div className="text-sm font-black text-content-secondary">{source.claimCount ?? 0}</div>
                        <div className="text-[9px] font-bold text-content-muted uppercase tracking-wider">Claims</div>
                      </div>
                      <div className="w-12">
                        <RankChange change={source.rankChange ?? 0} />
                      </div>
                    </div>

                    {/* Arrow */}
                    <svg className="w-5 h-5 text-content-muted group-hover:text-accent transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="text-center py-8">
              <p className="text-xs text-content-muted font-medium">
                Rankings based on verified claim accuracy. Sources must have tracked claims to qualify.
              </p>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
