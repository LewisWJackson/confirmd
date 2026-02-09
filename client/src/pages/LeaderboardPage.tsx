import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { fetchCreatorLeaderboard } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import UpgradePrompt from "../components/UpgradePrompt";
import TierBadge from "../components/TierBadge";

function accuracyColor(pct: number): string {
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

function PodiumCard({ creator, rank }: { creator: any; rank: number }) {
  const config = {
    1: {
      height: "h-40",
      border: "border-amber-300",
      bg: "bg-gradient-to-b from-amber-50 to-white",
      badge: "bg-amber-400 text-white",
      label: "1st",
      glow: "shadow-[0_4px_30px_rgba(245,158,11,0.15)]",
    },
    2: {
      height: "h-32",
      border: "border-slate-300",
      bg: "bg-gradient-to-b from-slate-50 to-white",
      badge: "bg-slate-400 text-white",
      label: "2nd",
      glow: "",
    },
    3: {
      height: "h-28",
      border: "border-orange-300",
      bg: "bg-gradient-to-b from-orange-50 to-white",
      badge: "bg-orange-400 text-white",
      label: "3rd",
      glow: "",
    },
  }[rank] || { height: "h-24", border: "border-border", bg: "bg-surface-card", badge: "bg-slate-300 text-white", label: `${rank}`, glow: "" };

  return (
    <div className={`flex flex-col items-center ${rank === 1 ? "order-2" : rank === 2 ? "order-1" : "order-3"}`}>
      <div className="relative mb-3">
        <div className={`w-16 h-16 rounded-2xl overflow-hidden border-2 ${config.border} ${config.glow}`}>
          {creator.avatarUrl ? (
            <img src={creator.avatarUrl} alt={creator.channelName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-surface-card-hover flex items-center justify-center text-lg font-black text-content-muted">
              {(creator.channelName || "?").charAt(0)}
            </div>
          )}
        </div>
        <div className={`absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-lg ${config.badge} flex items-center justify-center text-[10px] font-black`}>
          {config.label}
        </div>
      </div>
      <h3 className="text-sm font-black text-content-primary tracking-tight text-center truncate max-w-[120px]">
        {creator.channelName}
      </h3>
      <div className={`text-lg font-black ${accuracyColor(creator.overallAccuracy || 0)} mt-1`}>
        {creator.overallAccuracy ?? 0}%
      </div>
      <div className="text-[9px] font-bold text-content-muted uppercase tracking-wider">
        {creator.totalClaims ?? 0} claims
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

export default function LeaderboardPage() {
  const [, setLocation] = useLocation();
  const { tier } = useAuth();

  const { data: creators = [], isLoading } = useQuery({
    queryKey: ["creators-leaderboard"],
    queryFn: fetchCreatorLeaderboard,
  });

  // Gate behind tribune tier
  if (tier === "free") {
    return (
      <div className="animate-in fade-in duration-1000 relative z-10">
        <section className="max-w-7xl mx-auto px-6 md:px-12 pt-16 pb-8 text-center">
          <span className="text-[10px] font-black tracking-[0.5em] text-accent uppercase">Rankings</span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-content-primary mt-2 leading-[0.95]">
            Creator Leaderboard
          </h1>
          <p className="text-lg text-content-secondary mt-4 font-medium max-w-xl mx-auto">
            See which crypto creators are most accurate, ranked by verified claim performance.
          </p>
        </section>
        <section className="max-w-2xl mx-auto px-6 md:px-12 pb-24">
          <UpgradePrompt
            requiredTier="plus"
            featureName="Creator Leaderboard"
            description="Access the full leaderboard with accuracy rankings, podium positions, and rank changes."
          />
        </section>
      </div>
    );
  }

  const top3 = creators.slice(0, 3);
  const rest = creators.slice(3);

  return (
    <div className="animate-in fade-in duration-1000 relative z-10">
      {/* Header */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 pt-16 pb-8 text-center">
        <span className="text-[10px] font-black tracking-[0.5em] text-accent uppercase">Rankings</span>
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-content-primary mt-2 leading-[0.95]">
          Creator Leaderboard
        </h1>
        <p className="text-lg text-content-secondary mt-4 font-medium max-w-xl mx-auto">
          Crypto creators ranked by claim accuracy. Who gets it right?
        </p>
      </section>

      <section className="max-w-7xl mx-auto px-6 md:px-12 pb-24">
        {isLoading ? (
          <LoadingSkeleton />
        ) : creators.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface-card p-16 text-center">
            <h3 className="text-xl font-black text-content-primary tracking-tight">No ranked creators yet</h3>
            <p className="text-sm text-content-secondary mt-2 font-medium">
              Rankings will appear once creators have enough verified claims.
            </p>
          </div>
        ) : (
          <>
            {/* Podium */}
            {top3.length >= 3 && (
              <div className="flex items-end justify-center gap-6 md:gap-10 mb-12 pt-4">
                {top3.map((c: any, i: number) => (
                  <div key={c.id} className="cursor-pointer" onClick={() => setLocation(`/creators/${c.id}`)}>
                    <PodiumCard creator={c} rank={i + 1} />
                  </div>
                ))}
              </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="rounded-2xl border border-border bg-surface-card p-5 text-center">
                <div className="text-2xl font-black text-content-primary">{creators.length}</div>
                <div className="text-[10px] font-black uppercase tracking-widest text-content-muted mt-1">Ranked</div>
              </div>
              <div className="rounded-2xl border border-border bg-surface-card p-5 text-center">
                <div className="text-2xl font-black text-content-primary">
                  {creators.reduce((sum: number, c: any) => sum + (c.totalClaims || 0), 0)}
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest text-content-muted mt-1">Total Claims</div>
              </div>
              <div className="rounded-2xl border border-border bg-surface-card p-5 text-center">
                <div className="text-2xl font-black text-content-primary">
                  {creators.length > 0
                    ? Math.round(creators.reduce((sum: number, c: any) => sum + (c.overallAccuracy || 0), 0) / creators.length)
                    : 0}%
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest text-content-muted mt-1">Avg Accuracy</div>
              </div>
            </div>

            {/* Full Table */}
            <div className="space-y-3">
              {(top3.length < 3 ? creators : rest).map((creator: any, i: number) => {
                const rank = top3.length < 3 ? i + 1 : i + 4;
                return (
                  <div
                    key={creator.id}
                    onClick={() => setLocation(`/creators/${creator.id}`)}
                    className="rounded-2xl border border-border bg-surface-card p-4 md:p-5 hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)] transition-all cursor-pointer group flex items-center gap-4"
                  >
                    {/* Rank */}
                    <div className="w-10 h-10 rounded-xl bg-surface-primary border border-border flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-black text-content-secondary">{rank}</span>
                    </div>

                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-card-hover flex-shrink-0">
                      {creator.avatarUrl ? (
                        <img src={creator.avatarUrl} alt={creator.channelName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm font-black text-content-muted">
                          {(creator.channelName || "?").charAt(0)}
                        </div>
                      )}
                    </div>

                    {/* Name + tier */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-content-primary truncate group-hover:text-accent transition-colors">
                          {creator.channelName}
                        </span>
                        <TierBadge tier={creator.tier || "unranked"} size="sm" />
                      </div>
                      <div className="text-xs text-content-muted font-medium mt-0.5">
                        {creator.subscriberCount ? `${(creator.subscriberCount / 1000).toFixed(0)}K subs` : ""}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="hidden sm:flex items-center gap-6">
                      <div className="text-center w-20">
                        <div className={`text-lg font-black ${accuracyColor(creator.overallAccuracy || 0)}`}>
                          {creator.overallAccuracy ?? 0}%
                        </div>
                        <div className="text-[9px] font-bold text-content-muted uppercase tracking-wider">Accuracy</div>
                      </div>
                      <div className="text-center w-16">
                        <div className="text-sm font-black text-content-secondary">{creator.totalClaims ?? 0}</div>
                        <div className="text-[9px] font-bold text-content-muted uppercase tracking-wider">Claims</div>
                      </div>
                      <div className="w-12">
                        <RankChange change={creator.rankChange ?? 0} />
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
                Rankings based on verified claim accuracy. Minimum 5 scored claims to qualify.
              </p>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
