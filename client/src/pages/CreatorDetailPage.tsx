import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { fetchCreatorDetail, fetchCreatorClaims } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import UpgradePrompt from "../components/UpgradePrompt";
import TierBadge from "../components/TierBadge";
import RadarChart from "../components/RadarChart";

function accuracyColor(pct: number): string {
  if (pct >= 75) return "text-emerald-600";
  if (pct >= 60) return "text-amber-500";
  if (pct >= 45) return "text-orange-500";
  return "text-red-500";
}

function statusBadge(status: string) {
  const map: Record<string, { label: string; classes: string }> = {
    verified_true: { label: "Verified True", classes: "bg-emerald-50 text-emerald-600 border-emerald-100" },
    verified_false: { label: "Verified False", classes: "bg-red-50 text-red-500 border-red-100" },
    partially_true: { label: "Partially True", classes: "bg-amber-50 text-amber-600 border-amber-100" },
    pending: { label: "Pending", classes: "bg-blue-50 text-blue-500 border-blue-100" },
    expired: { label: "Expired", classes: "bg-surface-primary text-content-muted border-border" },
    unverifiable: { label: "Unverifiable", classes: "bg-purple-50 text-purple-500 border-purple-100" },
  };
  const cfg = map[status] || { label: status, classes: "bg-surface-primary text-content-muted border-border" };
  return (
    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border ${cfg.classes}`}>
      {cfg.label}
    </span>
  );
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return `${Math.floor(diffDay / 7)}w ago`;
}

export default function CreatorDetailPage() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const { tier } = useAuth();
  const [claimFilter, setClaimFilter] = useState("all");

  const { data: creator, isLoading: creatorLoading } = useQuery({
    queryKey: ["creator", params.id],
    queryFn: () => fetchCreatorDetail(params.id!),
    enabled: !!params.id,
  });

  const { data: claims = [] } = useQuery({
    queryKey: ["creator-claims", params.id],
    queryFn: () => fetchCreatorClaims(params.id!),
    enabled: !!params.id,
  });

  // Gate behind tribune tier
  if (tier === "free") {
    return (
      <div className="animate-in fade-in duration-1000 relative z-10">
        <section className="max-w-7xl mx-auto px-6 md:px-12 pt-16 pb-8">
          <button
            onClick={() => setLocation("/creators")}
            className="text-sm font-bold text-content-muted hover:text-accent transition-colors mb-6 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Creators
          </button>
          <h1 className="text-4xl font-black tracking-tighter text-content-primary mt-2">Creator Profile</h1>
        </section>
        <section className="max-w-2xl mx-auto px-6 md:px-12 pb-24">
          <UpgradePrompt
            requiredTier="plus"
            featureName="Creator Profiles"
            description="View detailed creator profiles with accuracy breakdowns, radar charts, claim histories, and more."
          />
        </section>
      </div>
    );
  }

  if (creatorLoading) {
    return (
      <div className="animate-in fade-in duration-1000 relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-16">
        <div className="animate-pulse space-y-8">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 bg-surface-card-hover rounded-2xl" />
            <div className="flex-1 space-y-3">
              <div className="h-8 bg-surface-card-hover rounded-lg w-1/3" />
              <div className="h-4 bg-surface-card-hover rounded-lg w-1/4" />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 bg-surface-card-hover rounded-2xl" />)}
          </div>
          <div className="h-64 bg-surface-card-hover rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-32 text-center">
        <h1 className="text-3xl font-black text-content-primary tracking-tight">Creator not found</h1>
        <button onClick={() => setLocation("/creators")} className="text-accent text-sm font-bold mt-4 hover:text-accent-hover">
          Back to Creators
        </button>
      </div>
    );
  }

  const profile = creator.profile || {};
  const radarScores = {
    price: profile.priceAccuracy || 0,
    timeline: profile.timelineAccuracy || 0,
    regulatory: profile.regulatoryAccuracy || 0,
    partnership: profile.partnershipAccuracy || 0,
    technology: profile.technologyAccuracy || 0,
    market: profile.marketAccuracy || 0,
  };

  const filteredClaims = claimFilter === "all"
    ? claims
    : claims.filter((c: any) => c.status === claimFilter);

  const videos = creator.videos || [];

  return (
    <div className="animate-in fade-in duration-1000 relative z-10">
      <section className="max-w-7xl mx-auto px-6 md:px-12 pt-16 pb-8">
        {/* Back nav */}
        <button
          onClick={() => setLocation("/creators")}
          className="text-sm font-bold text-content-muted hover:text-accent transition-colors mb-8 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Creators
        </button>

        {/* Creator Header */}
        <div className="flex flex-col md:flex-row items-start gap-6 mb-10">
          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-surface-card-hover flex-shrink-0 border border-border">
            {creator.avatarUrl ? (
              <img src={creator.avatarUrl} alt={creator.channelName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl font-black text-content-muted">
                {(creator.channelName || "?").charAt(0)}
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-content-primary">
                {creator.channelName}
              </h1>
              <TierBadge tier={creator.tier || "unranked"} />
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-content-muted font-medium">
              {creator.channelHandle && <span>{creator.channelHandle}</span>}
              {creator.subscriberCount && (
                <span>{(creator.subscriberCount / 1000).toFixed(0)}K subscribers</span>
              )}
              {creator.niche && <span className="text-accent">{creator.niche}</span>}
            </div>
            {profile.currentStance && (
              <div className="mt-3">
                <span className={`text-xs font-bold px-3 py-1 rounded-lg border ${
                  profile.currentSentiment === "bullish"
                    ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                    : profile.currentSentiment === "bearish"
                    ? "bg-red-50 text-red-500 border-red-100"
                    : "bg-surface-primary text-content-muted border-border"
                }`}>
                  {profile.currentSentiment === "bullish" ? "↗" : profile.currentSentiment === "bearish" ? "↘" : "→"}{" "}
                  {profile.currentStance}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid + Radar */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 mb-10">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-border bg-surface-card p-5 text-center">
              <div className={`text-3xl font-black ${accuracyColor(creator.overallAccuracy || 0)}`}>
                {creator.overallAccuracy ?? "—"}%
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-content-muted mt-1">Accuracy</div>
            </div>
            <div className="rounded-2xl border border-border bg-surface-card p-5 text-center">
              <div className="text-3xl font-black text-emerald-600">
                {profile.verifiedTrue ?? 0}
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-content-muted mt-1">Verified True</div>
            </div>
            <div className="rounded-2xl border border-border bg-surface-card p-5 text-center">
              <div className="text-3xl font-black text-red-500">
                {profile.verifiedFalse ?? 0}
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-content-muted mt-1">Verified False</div>
            </div>
            <div className="rounded-2xl border border-border bg-surface-card p-5 text-center">
              <div className="text-3xl font-black text-blue-500">
                {profile.pending ?? creator.totalClaims ?? 0}
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-content-muted mt-1">Total Claims</div>
            </div>
            <div className="rounded-2xl border border-border bg-surface-card p-5 text-center col-span-2">
              <div className="text-3xl font-black text-accent">
                {creator.reliabilityScore ?? "—"}
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-content-muted mt-1">Reliability Score</div>
            </div>
            <div className="rounded-2xl border border-border bg-surface-card p-5 text-center col-span-2">
              <div className="text-3xl font-black text-purple-600">
                #{creator.rankOverall ?? "—"}
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-content-muted mt-1">Leaderboard Rank</div>
            </div>
          </div>

          {/* Radar Chart */}
          <div className="rounded-2xl border border-border bg-surface-card p-6">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-content-muted mb-4">Accuracy by Category</h3>
            <RadarChart scores={radarScores} />
          </div>
        </div>

        {/* Recent Videos */}
        {videos.length > 0 && (
          <div className="mb-10">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-content-muted mb-4">Recent Videos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {videos.slice(0, 6).map((video: any) => (
                <div key={video.id} className="rounded-2xl border border-border bg-surface-card p-5 hover:shadow-sm transition-all">
                  <h4 className="text-sm font-bold text-content-primary line-clamp-2 mb-2">{video.title}</h4>
                  <div className="flex items-center justify-between text-xs text-content-muted">
                    <span>{video.publishedAt ? new Date(video.publishedAt).toLocaleDateString() : ""}</span>
                    <span className="text-[10px] font-black text-accent">
                      {video.claimCount ?? 0} claims
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Claims */}
        <div className="mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-content-muted">
              Claims ({claims.length})
            </h2>
            <div className="flex flex-wrap gap-2">
              {["all", "verified_true", "verified_false", "partially_true", "pending"].map((f) => (
                <button
                  key={f}
                  onClick={() => setClaimFilter(f)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    claimFilter === f
                      ? "bg-accent text-white shadow-lg"
                      : "bg-surface-card-hover text-content-secondary hover:bg-surface-card-hover"
                  }`}
                >
                  {f === "all" ? "All" : f.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </div>

          {filteredClaims.length === 0 ? (
            <div className="rounded-2xl border border-border bg-surface-card p-12 text-center">
              <p className="text-sm text-content-muted font-medium">No claims found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredClaims.map((claim: any) => (
                <div
                  key={claim.id}
                  onClick={() => claim.id && setLocation(`/claims/${claim.id}`)}
                  className="rounded-2xl border border-border bg-surface-card p-5 hover:shadow-sm transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-content-primary group-hover:text-accent transition-colors">
                        {claim.claimText || claim.text}
                      </p>
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        {statusBadge(claim.status)}
                        {claim.category && (
                          <span className="text-[9px] font-bold text-content-muted uppercase tracking-wider">
                            {claim.category}
                          </span>
                        )}
                        {claim.videoTimestamp && (
                          <span className="text-[9px] font-medium text-content-muted">
                            @{claim.videoTimestamp}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-content-muted whitespace-nowrap">
                      {claim.createdAt ? timeAgo(claim.createdAt) : ""}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
