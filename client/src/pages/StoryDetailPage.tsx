import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { fetchStoryDetail } from "../lib/api";
import { useAuth } from "../lib/auth-context";

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

function getTierFromTrackRecord(trackRecord: number): "high" | "medium" | "low" {
  if (trackRecord >= 70) return "high";
  if (trackRecord >= 50) return "medium";
  return "low";
}

function TierBadge({ tier }: { tier: "high" | "medium" | "low" }) {
  const styles = {
    high: "bg-emerald-50 text-emerald-700 border-emerald-200",
    medium: "bg-amber-50 text-amber-700 border-amber-200",
    low: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg border ${styles[tier]}`}>
      {tier}
    </span>
  );
}

function CredibilityBar({ distribution, size = "md" }: { distribution: { high: number; medium: number; low: number }; size?: "sm" | "md" | "lg" }) {
  const total = distribution.high + distribution.medium + distribution.low;
  if (total === 0) return null;
  const highPct = (distribution.high / total) * 100;
  const medPct = (distribution.medium / total) * 100;
  const lowPct = (distribution.low / total) * 100;
  const h = size === "lg" ? "h-4" : size === "md" ? "h-3" : "h-2";

  return (
    <div className={`w-full ${h} rounded-full overflow-hidden flex bg-slate-100`}>
      {highPct > 0 && <div className="bg-emerald-500 h-full transition-all duration-700" style={{ width: `${highPct}%` }} />}
      {medPct > 0 && <div className="bg-amber-400 h-full transition-all duration-700" style={{ width: `${medPct}%` }} />}
      {lowPct > 0 && <div className="bg-red-500 h-full transition-all duration-700" style={{ width: `${lowPct}%` }} />}
    </div>
  );
}

function VerdictBadge({ verdict }: { verdict: string }) {
  const styles: Record<string, string> = {
    verified: "bg-emerald-50 text-emerald-700 border-emerald-200",
    speculative: "bg-amber-50 text-amber-700 border-amber-200",
    misleading: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg border ${styles[verdict] || "bg-slate-50 text-slate-600 border-slate-200"}`}>
      {verdict}
    </span>
  );
}

export default function StoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [showClaims, setShowClaims] = useState(false);

  const { data: story, isLoading } = useQuery({
    queryKey: ["story", id],
    queryFn: () => fetchStoryDetail(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto py-12 px-6 md:px-12 relative z-10 animate-in fade-in">
        <div className="animate-pulse space-y-8">
          <div className="h-6 bg-slate-200 rounded-xl w-32" />
          <div className="h-12 bg-slate-200 rounded-2xl w-3/4" />
          <div className="h-6 bg-slate-100 rounded-xl w-full" />
          <div className="h-4 bg-slate-200 rounded-full w-full" />
          <div className="space-y-4 mt-12">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-slate-200 p-6 animate-pulse">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-slate-200 rounded-xl" />
                  <div className="flex-1">
                    <div className="h-5 bg-slate-200 rounded w-40 mb-2" />
                    <div className="h-4 bg-slate-100 rounded w-24" />
                  </div>
                </div>
                <div className="h-5 bg-slate-100 rounded w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="max-w-5xl mx-auto py-12 px-6 md:px-12 relative z-10 text-center">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Story not found</h2>
        <button onClick={() => setLocation("/")} className="mt-6 px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-cyan-600 transition-colors">
          Back to Stories
        </button>
      </div>
    );
  }

  const { tier } = useAuth();
  const dist = story.credibilityDistribution || { high: 0, medium: 0, low: 0 };
  const coverage = story.coverage || [];
  const claims = story.claims || [];
  const verdictDist = story.verdictDistribution || {};

  // Sort coverage by tier: high first, then medium, then low
  const tierOrder = { high: 0, medium: 1, low: 2 };
  const sortedCoverage = [...coverage].sort((a: any, b: any) => {
    const aTier = a.source?.tier || getTierFromTrackRecord(a.source?.trackRecord || 0);
    const bTier = b.source?.tier || getTierFromTrackRecord(b.source?.trackRecord || 0);
    return (tierOrder[aTier as keyof typeof tierOrder] ?? 2) - (tierOrder[bTier as keyof typeof tierOrder] ?? 2);
  });

  return (
    <div className="max-w-5xl mx-auto py-12 px-6 md:px-12 relative z-10 animate-in fade-in duration-700">
      {/* Back button */}
      <button
        onClick={() => setLocation("/")}
        className="flex items-center text-[10px] font-black tracking-[0.3em] text-slate-500 hover:text-cyan-600 mb-10 group transition-colors uppercase"
      >
        <svg className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Stories
      </button>

      {/* Story Header */}
      <div className="space-y-6 mb-10">
        <div className="flex flex-wrap items-center gap-3">
          {story.category && (
            <span className="px-4 py-2 bg-cyan-600 text-white text-[10px] font-black tracking-widest uppercase rounded-xl">
              {story.category}
            </span>
          )}
          {(story.assetSymbols || []).map((s: string) => (
            <span key={s} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest">
              {s}
            </span>
          ))}
        </div>

        <h1 className="text-4xl md:text-5xl font-black leading-tight text-slate-900 tracking-tighter">
          {story.title}
        </h1>

        {story.summary && (
          <p className="text-xl text-slate-500 leading-relaxed font-medium max-w-3xl">
            {story.summary}
          </p>
        )}
      </div>

      {/* Story image */}
      {story.imageUrl && (
        <div className="relative rounded-2xl overflow-hidden aspect-[21/9] mb-10 shadow-lg">
          <img src={story.imageUrl} alt={story.title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent" />
        </div>
      )}

      {/* Upgrade banner for free users */}
      {tier === "free" && (
        <div className="rounded-2xl border border-cyan-100 bg-cyan-50/30 p-5 mb-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-sm text-slate-600 font-medium">
              Get real-time alerts and full source history with <strong className="text-cyan-600">Confirmd Tribune</strong>
            </span>
          </div>
          <button
            onClick={() => setLocation("/plus")}
            className="text-[10px] font-black uppercase tracking-widest text-cyan-600 hover:text-cyan-700 px-5 py-2.5 rounded-xl border border-cyan-200 hover:bg-cyan-50 transition-all whitespace-nowrap"
          >
            Upgrade
          </button>
        </div>
      )}

      {/* Credibility Distribution Bar (large) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-8 mb-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Source Credibility Distribution</h3>
          <span className="text-[10px] font-bold text-slate-400">
            {(dist.high || 0) + (dist.medium || 0) + (dist.low || 0)} total sources
          </span>
        </div>
        <CredibilityBar distribution={dist} size="lg" />
        <div className="flex items-center gap-8 mt-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-sm font-bold text-slate-700">High: {dist.high || 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-400" />
            <span className="text-sm font-bold text-slate-700">Medium: {dist.medium || 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-sm font-bold text-slate-700">Low: {dist.low || 0}</span>
          </div>
        </div>
      </div>

      {/* Coverage by Source */}
      <div className="mb-10">
        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 mb-6">Coverage by Source</h3>
        <div className="space-y-4">
          {sortedCoverage.map((entry: any, idx: number) => {
            const source = entry.source || {};
            const tier = source.tier || getTierFromTrackRecord(source.trackRecord || 0);
            const items = entry.items || [];

            return (
              <div
                key={source.id || idx}
                className="rounded-2xl border border-slate-200 bg-white p-6 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm shadow-md flex-shrink-0 ${
                      source.logoUrl ? "bg-white p-1.5 border border-slate-100" :
                      tier === "high" ? "bg-emerald-500 text-white" :
                      tier === "medium" ? "bg-amber-400 text-white" : "bg-red-500 text-white"
                    }`}>
                      {source.logoUrl ? (
                        <img src={source.logoUrl} alt={source.displayName} className="w-full h-full object-contain rounded-lg" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      ) : (
                        <span>{source.displayName?.charAt(0) || "?"}</span>
                      )}
                    </div>
                    <div>
                      <div className="font-black text-lg text-slate-900 tracking-tight">{source.displayName || "Unknown Source"}</div>
                      <div className="flex items-center gap-3 mt-1">
                        <TierBadge tier={tier} />
                        <span className="text-xs font-bold text-slate-400">
                          Track Record: {Math.round(source.trackRecord || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Articles from this source */}
                <div className="space-y-3 pl-16">
                  {items.map((item: any, itemIdx: number) => (
                    <div key={item.id || itemIdx} className="flex items-start justify-between gap-4 py-3 border-t border-slate-100 first:border-t-0 first:pt-0">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-slate-800 leading-snug line-clamp-2">
                          {item.title || "Untitled article"}
                        </h4>
                        {item.publishedAt && (
                          <span className="text-[10px] font-medium text-slate-400 mt-1 block">
                            {timeAgo(item.publishedAt)}
                          </span>
                        )}
                      </div>
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex-shrink-0 text-[10px] font-black uppercase tracking-widest text-cyan-600 hover:text-cyan-700 px-4 py-2 rounded-xl border border-cyan-200 hover:bg-cyan-50 transition-all"
                        >
                          Read original
                        </a>
                      )}
                    </div>
                  ))}
                  {items.length === 0 && (
                    <p className="text-sm text-slate-400 italic">No articles available</p>
                  )}
                </div>
              </div>
            );
          })}
          {sortedCoverage.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
              <p className="text-sm text-slate-400 font-medium">No source coverage data available yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Verification Details (collapsible) */}
      {claims.length > 0 && (
        <div className="mb-10">
          <button
            onClick={() => setShowClaims(!showClaims)}
            className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.3em] text-slate-400 hover:text-slate-600 transition-colors mb-6 group"
          >
            <svg
              className={`w-4 h-4 transition-transform duration-300 ${showClaims ? "rotate-90" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
            </svg>
            Verification Details ({claims.length} claims)
            {Object.keys(verdictDist).length > 0 && (
              <span className="text-[10px] font-bold text-slate-300 normal-case tracking-normal ml-2">
                {Object.entries(verdictDist).map(([k, v]) => `${v} ${k}`).join(", ")}
              </span>
            )}
          </button>

          {showClaims && (
            <div className="space-y-4 animate-in fade-in duration-300">
              {claims.map((claim: any) => (
                <div
                  key={claim.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-base font-bold text-slate-800 leading-relaxed flex-1">
                      {claim.claimText}
                    </p>
                    {claim.verdict && (
                      <VerdictBadge verdict={typeof claim.verdict === "string" ? claim.verdict : claim.verdict.verdictLabel || "unreviewed"} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
