import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { fetchCreators } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import UpgradePrompt from "../components/UpgradePrompt";
import TierBadge from "../components/TierBadge";

function accuracyColor(pct: number): string {
  if (pct >= 75) return "text-emerald-600";
  if (pct >= 60) return "text-amber-500";
  if (pct >= 45) return "text-orange-500";
  return "text-red-500";
}

function sentimentBadge(sentiment: string) {
  if (sentiment === "bullish") {
    return (
      <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
        Bullish
      </span>
    );
  }
  if (sentiment === "bearish") {
    return (
      <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg bg-red-50 text-red-500 border border-red-100">
        Bearish
      </span>
    );
  }
  return (
    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg bg-surface-primary text-content-muted border border-border">
      Neutral
    </span>
  );
}

function CreatorCard({ creator, onClick }: { creator: any; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-2xl border border-border bg-surface-card p-6 hover:shadow-[0_6px_30px_rgba(0,0,0,0.06)] transition-all duration-500 hover:-translate-y-1"
    >
      <div className="flex items-start gap-4 mb-4">
        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-surface-card-hover flex-shrink-0 border border-border">
          {creator.avatarUrl ? (
            <img src={creator.avatarUrl} alt={creator.channelName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-lg font-black text-content-muted">
              {(creator.channelName || "?").charAt(0)}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-black text-content-primary tracking-tight truncate group-hover:text-accent transition-colors">
            {creator.channelName}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <TierBadge tier={creator.tier || "unranked"} size="sm" />
            {creator.currentSentiment && sentimentBadge(creator.currentSentiment)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-2 bg-surface-primary rounded-xl">
          <div className={`text-lg font-black ${accuracyColor(creator.overallAccuracy || 0)}`}>
            {creator.overallAccuracy ?? "—"}%
          </div>
          <div className="text-[9px] font-bold text-content-muted uppercase tracking-wider">Accuracy</div>
        </div>
        <div className="text-center p-2 bg-surface-primary rounded-xl">
          <div className="text-lg font-black text-content-primary">{creator.totalClaims ?? 0}</div>
          <div className="text-[9px] font-bold text-content-muted uppercase tracking-wider">Claims</div>
        </div>
        <div className="text-center p-2 bg-surface-primary rounded-xl">
          <div className="text-lg font-black text-content-primary">{creator.reliabilityScore ?? "—"}</div>
          <div className="text-[9px] font-bold text-content-muted uppercase tracking-wider">Trust</div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-border">
        <span className="text-[10px] font-medium text-content-muted">
          {creator.subscriberCount ? `${(creator.subscriberCount / 1000).toFixed(0)}K subs` : ""}
        </span>
        <span className="text-[10px] font-black text-accent uppercase tracking-widest group-hover:text-accent transition-colors">
          View Profile →
        </span>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="rounded-2xl border border-border bg-surface-card p-6 animate-pulse">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-14 h-14 bg-surface-card-hover rounded-2xl" />
            <div className="flex-1">
              <div className="h-5 bg-surface-card-hover rounded-lg w-3/4 mb-2" />
              <div className="h-4 bg-surface-card-hover rounded-lg w-1/2" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[1, 2, 3].map((j) => (
              <div key={j} className="h-14 bg-surface-card-hover rounded-xl" />
            ))}
          </div>
          <div className="h-px bg-border" />
        </div>
      ))}
    </div>
  );
}

const TIER_FILTERS = ["All", "Diamond", "Gold", "Silver", "Bronze"];

export default function CreatorsPage() {
  const [, setLocation] = useLocation();
  const { tier } = useAuth();
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("All");

  const { data: creators = [], isLoading } = useQuery({
    queryKey: ["creators"],
    queryFn: () => fetchCreators(),
  });

  const filtered = useMemo(() => {
    let result = creators;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((c: any) =>
        (c.channelName || "").toLowerCase().includes(q)
      );
    }
    if (tierFilter !== "All") {
      result = result.filter((c: any) => c.tier === tierFilter.toLowerCase());
    }
    return result;
  }, [creators, search, tierFilter]);

  // Gate behind tribune tier
  if (tier === "free") {
    return (
      <div className="animate-in fade-in duration-1000 relative z-10">
        <section className="max-w-7xl mx-auto px-6 md:px-12 pt-16 pb-8">
          <span className="text-[10px] font-black tracking-[0.5em] text-accent uppercase">Creator Intelligence</span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-content-primary mt-2 leading-[0.95]">
            Track creator accuracy
          </h1>
          <p className="text-lg text-content-secondary mt-4 font-medium max-w-xl">
            See which crypto YouTubers actually get it right. Accuracy scores, claim verification, and trust rankings.
          </p>
        </section>
        <section className="max-w-2xl mx-auto px-6 md:px-12 pb-24">
          <UpgradePrompt
            requiredTier="tribune"
            featureName="Creator Intelligence"
            description="Track creator accuracy, view detailed claim histories, and see who you can actually trust. Available for Tribune members."
          />
        </section>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-1000 relative z-10">
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 pt-16 pb-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <span className="text-[10px] font-black tracking-[0.5em] text-accent uppercase">Creator Intelligence</span>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-content-primary mt-2 leading-[0.95]">
              Creator directory
            </h1>
            <p className="text-lg text-content-secondary mt-4 font-medium max-w-xl">
              Accuracy scores, claim histories, and trust rankings for crypto content creators.
            </p>
          </div>
          <button
            onClick={() => setLocation("/leaderboard")}
            className="self-start md:self-auto px-6 py-3 bg-surface-card text-content-primary text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-accent hover:text-white transition-all shadow-lg"
          >
            View Leaderboard
          </button>
        </div>
      </section>

      {/* Filters */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 pb-8">
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Search creators..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-surface-primary border border-border rounded-xl px-5 py-2.5 text-xs font-medium focus:ring-1 focus:ring-accent/50 outline-none w-full sm:w-64 transition-all text-content-primary placeholder:text-content-muted"
          />
          <div className="flex flex-wrap gap-2">
            {TIER_FILTERS.map((t) => (
              <button
                key={t}
                onClick={() => setTierFilter(t)}
                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  tierFilter === t
                    ? "bg-accent text-white shadow-lg"
                    : "bg-surface-card-hover text-content-secondary hover:bg-surface-card-hover hover:text-content-primary"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 pb-24">
        {isLoading ? (
          <LoadingSkeleton />
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface-card p-16 text-center">
            <div className="w-16 h-16 bg-surface-card-hover rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-content-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-black text-content-primary tracking-tight">No creators found</h3>
            <p className="text-sm text-content-secondary mt-2 font-medium">
              {search ? "Try a different search term." : "Creator profiles will appear here once data is available."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((creator: any) => (
              <CreatorCard
                key={creator.id}
                creator={creator}
                onClick={() => setLocation(`/creators/${creator.id}`)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
