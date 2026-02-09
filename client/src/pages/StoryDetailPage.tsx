import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { fetchStoryDetail, fetchStories } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import { FactualityBar } from "../components/FactualityBar";
import TierBadge from "../components/TierBadge";

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

function getFactualityTier(trackRecord: number): "high" | "medium" | "low" {
  if (trackRecord >= 70) return "high";
  if (trackRecord >= 50) return "medium";
  return "low";
}

function FactualityBadge({ tier }: { tier: "high" | "medium" | "low" }) {
  const config = {
    high: { label: "High", className: "bg-factuality-high/10 text-factuality-high border-factuality-high/30" },
    medium: { label: "Mixed", className: "bg-factuality-mixed/10 text-factuality-mixed border-factuality-mixed/30" },
    low: { label: "Low", className: "bg-factuality-low/10 text-factuality-low border-factuality-low/30" },
  };
  const c = config[tier];
  return (
    <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg border ${c.className}`}>
      {c.label}
    </span>
  );
}

function formatReasoning(raw: string): string {
  // Clean up raw analysis text that reads like internal debug output
  let text = raw;
  // Remove "Analysis of N evidence items" prefix
  text = text.replace(/^Analysis of \d+ evidence items?[.,:]?\s*/i, "");
  // Remove grading breakdowns like "0 primary A, 0 strong secondary B"
  text = text.replace(/\d+ primary [A-Z],?\s*/g, "");
  text = text.replace(/\d+ strong secondary [A-Z],?\s*/g, "");
  text = text.replace(/\d+ secondary [A-Z],?\s*/g, "");
  text = text.replace(/\d+ tertiary [A-Z],?\s*/g, "");
  // Clean up leftover empty parens/commas
  text = text.replace(/^[,.\s]+/, "").replace(/[,.\s]+$/, "");
  // Capitalize first letter
  if (text.length > 0) text = text.charAt(0).toUpperCase() + text.slice(1);
  return text || raw;
}

function VerdictBadge({ verdict }: { verdict: string }) {
  const styles: Record<string, string> = {
    verified: "bg-factuality-high/10 text-factuality-high border-factuality-high/30",
    speculative: "bg-factuality-mixed/10 text-factuality-mixed border-factuality-mixed/30",
    misleading: "bg-factuality-low/10 text-factuality-low border-factuality-low/30",
  };
  return (
    <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg border ${styles[verdict] || "bg-surface-card text-content-muted border-border"}`}>
      {verdict}
    </span>
  );
}

export default function StoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [showClaims, setShowClaims] = useState(false);
  const [activeTab, setActiveTab] = useState<"articles" | "predictions" | "timelines">("timelines");
  const { tier } = useAuth();

  const { data: story, isLoading } = useQuery({
    queryKey: ["story", id],
    queryFn: () => fetchStoryDetail(id!),
    enabled: !!id,
  });

  const { data: allStories = [] } = useQuery({
    queryKey: ["stories"],
    queryFn: () => fetchStories(),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-primary">
        <div className="max-w-5xl mx-auto py-12 px-6 md:px-12 animate-in fade-in">
          <div className="animate-pulse space-y-8">
            <div className="h-6 bg-surface-card rounded-xl w-32" />
            <div className="h-12 bg-surface-card rounded-2xl w-3/4" />
            <div className="h-6 bg-surface-card-hover rounded-xl w-full" />
            <div className="h-4 bg-surface-card rounded-full w-full" />
            <div className="space-y-4 mt-12">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl border border-border bg-surface-card p-6 animate-pulse">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-surface-card-hover rounded-xl" />
                    <div className="flex-1">
                      <div className="h-5 bg-surface-card-hover rounded w-40 mb-2" />
                      <div className="h-4 bg-surface-card-hover rounded w-24" />
                    </div>
                  </div>
                  <div className="h-5 bg-surface-card-hover rounded w-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen bg-surface-primary">
        <div className="max-w-5xl mx-auto py-12 px-6 md:px-12 text-center">
          <h2 className="text-3xl font-black text-content-primary tracking-tight">Story not found</h2>
          <button
            onClick={() => setLocation("/")}
            className="mt-6 px-8 py-3 bg-accent text-accent-text rounded-xl font-bold hover:bg-accent-hover transition-colors"
          >
            Back to Stories
          </button>
        </div>
      </div>
    );
  }

  const dist = story.credibilityDistribution || { high: 0, medium: 0, low: 0 };
  const coverage = story.coverage || [];
  const claims = story.claims || [];
  const verdictDist = story.verdictDistribution || {};

  const tierOrder = { high: 0, medium: 1, low: 2 };
  const sortedCoverage = [...coverage].sort((a: any, b: any) => {
    const aTier = a.source?.tier || getFactualityTier(a.source?.trackRecord || 0);
    const bTier = b.source?.tier || getFactualityTier(b.source?.trackRecord || 0);
    return (tierOrder[aTier as keyof typeof tierOrder] ?? 2) - (tierOrder[bTier as keyof typeof tierOrder] ?? 2);
  });

  // Similar stories (same category, excluding this one)
  const similarStories = allStories
    .filter((s: any) => s.id !== id && s.category === story.category)
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-surface-primary animate-in fade-in duration-700">
      {/* Promo banner */}
      {tier === "free" && (
        <div className="bg-accent text-accent-text text-center py-2.5 px-4">
          <span className="text-[12px] font-bold">
            Get Confirmd Vantage -- Factuality ratings, full source history, and real-time alerts.{" "}
            <button onClick={() => setLocation("/plus")} className="underline font-black hover:opacity-80 transition-opacity">
              Subscribe
            </button>
          </span>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        {/* Back button */}
        <button
          onClick={() => setLocation("/")}
          className="flex items-center text-[10px] font-black tracking-[0.3em] text-content-muted hover:text-accent mb-8 group transition-colors uppercase"
        >
          <svg className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Stories
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
          {/* Main content */}
          <div>
            {/* Story Header */}
            <div className="space-y-4 mb-8">
              <div className="flex flex-wrap items-center gap-3">
                {story.category && (
                  <span className="px-3 py-1.5 bg-accent text-accent-text text-[10px] font-black tracking-widest uppercase rounded-lg">
                    {story.category}
                  </span>
                )}
                {(story.assetSymbols || []).map((s: string) => (
                  <span key={s} className="px-3 py-1.5 bg-surface-card text-content-secondary rounded-lg text-[10px] font-black uppercase tracking-widest border border-border">
                    {s}
                  </span>
                ))}
                <span className="text-[10px] text-content-muted font-medium">
                  {story.latestItemTimestamp ? timeAgo(story.latestItemTimestamp) : ""}
                </span>
              </div>

              <h1 className="text-3xl md:text-4xl font-black leading-tight text-content-primary tracking-tight">
                {story.title}
              </h1>

              {story.summary && !story.summary.startsWith("Story covering") && (
                <p className="text-lg text-content-secondary leading-relaxed font-medium max-w-3xl">
                  {story.summary}
                </p>
              )}
            </div>

            {/* Story image */}
            {story.imageUrl && (
              <div className="relative rounded-xl overflow-hidden aspect-[21/9] mb-8">
                <img
                  src={story.imageUrl}
                  alt={story.title}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              </div>
            )}

            {/* Claims & Verdicts - Always visible */}
            {claims.length > 0 && (
              <div className="mb-8">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-content-muted mb-4">
                  Claims & Verification
                </h3>
                <div className="space-y-3">
                  {claims.map((claim: any) => {
                    const verdictLabel = claim.verdict?.verdictLabel || "unreviewed";
                    const probability = claim.verdict?.probabilityTrue;
                    const reasoning = claim.verdict?.reasoningSummary;
                    const verdictStyles: Record<string, string> = {
                      verified: "border-l-factuality-high bg-factuality-high/5",
                      speculative: "border-l-factuality-mixed bg-factuality-mixed/5",
                      misleading: "border-l-factuality-low bg-factuality-low/5",
                      unreviewed: "border-l-border bg-surface-card",
                    };
                    const badgeStyles: Record<string, string> = {
                      verified: "bg-factuality-high/10 text-factuality-high border-factuality-high/30",
                      speculative: "bg-factuality-mixed/10 text-factuality-mixed border-factuality-mixed/30",
                      misleading: "bg-factuality-low/10 text-factuality-low border-factuality-low/30",
                      unreviewed: "bg-surface-card-hover text-content-muted border-border",
                    };
                    return (
                      <div
                        key={claim.id}
                        className={`rounded-xl border border-border p-5 border-l-4 ${verdictStyles[verdictLabel] || verdictStyles.unreviewed}`}
                      >
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <p className="text-[15px] font-bold text-content-primary leading-relaxed flex-1">
                            {claim.claimText}
                          </p>
                          <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg border flex-shrink-0 ${badgeStyles[verdictLabel] || badgeStyles.unreviewed}`}>
                            {verdictLabel}
                          </span>
                        </div>
                        {/* Probability + reasoning */}
                        <div className="space-y-2 mt-3">
                          {probability != null && (
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-surface-secondary rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    probability >= 0.7 ? "bg-factuality-high" :
                                    probability >= 0.4 ? "bg-factuality-mixed" : "bg-factuality-low"
                                  }`}
                                  style={{ width: `${Math.round(probability * 100)}%` }}
                                />
                              </div>
                              <span className="text-[11px] font-bold text-content-secondary">
                                {Math.round(probability * 100)}% likely true
                              </span>
                            </div>
                          )}
                          {reasoning && (
                            <p className="text-[12px] text-content-secondary leading-relaxed">
                              {formatReasoning(reasoning)}
                            </p>
                          )}
                        </div>
                        {/* Source + meta */}
                        <div className="flex items-center gap-3 mt-3">
                          {claim.source && (
                            <span className="text-[10px] font-bold text-content-muted">
                              Source: {claim.source.displayName}
                            </span>
                          )}
                          {claim.claimType && (
                            <span className="px-2 py-0.5 bg-surface-card-hover text-content-muted rounded text-[9px] font-bold uppercase tracking-wider border border-border">
                              {claim.claimType}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Factuality Distribution */}
            <div className="rounded-xl border border-border bg-surface-card p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-content-muted">
                  Source Factuality Distribution
                </h3>
                <span className="text-[10px] font-bold text-content-muted">
                  {(dist.high || 0) + (dist.medium || 0) + (dist.low || 0)} total sources
                </span>
              </div>
              <FactualityBar distribution={dist} size="lg" showLabels={true} />
              <div className="flex items-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-factuality-high" />
                  <span className="text-sm font-bold text-content-primary">High: {dist.high || 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-factuality-mixed" />
                  <span className="text-sm font-bold text-content-primary">Mixed: {dist.medium || 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-factuality-low" />
                  <span className="text-sm font-bold text-content-primary">Low: {dist.low || 0}</span>
                </div>
              </div>
            </div>

            {/* Tab bar */}
            <div className="flex items-center gap-1 border-b border-border mb-6">
              {[
                { key: "articles" as const, label: `${sortedCoverage.length} Articles` },
                ...(story.creatorPredictions?.length ? [{ key: "predictions" as const, label: "Predictions" }] : []),
                ...(claims.length ? [{ key: "timelines" as const, label: "Claims" }] : []),
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-3 text-[11px] font-bold uppercase tracking-wider transition-colors border-b-2 -mb-[1px] ${
                    activeTab === tab.key
                      ? "border-accent text-accent"
                      : "border-transparent text-content-muted hover:text-content-primary"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Articles tab */}
            {activeTab === "articles" && (
              <div className="space-y-0">
                {sortedCoverage.map((entry: any, idx: number) => {
                  const source = entry.source || {};
                  const sourceTier = source.tier || getFactualityTier(source.trackRecord || 0);
                  const items = entry.items || [];

                  return (
                    <div key={source.id || idx} className="border-b border-border last:border-b-0">
                      {items.map((item: any, itemIdx: number) => (
                        <div
                          key={item.id || itemIdx}
                          className="flex items-start gap-4 py-4 hover:bg-surface-card-hover transition-colors px-3 rounded-lg -mx-3"
                        >
                          {/* Source logo */}
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-black text-sm flex-shrink-0 ${
                            source.logoUrl ? "bg-surface-card p-1 border border-border" :
                            sourceTier === "high" ? "bg-factuality-high text-white" :
                            sourceTier === "medium" ? "bg-factuality-mixed text-white" : "bg-factuality-low text-white"
                          }`}>
                            {source.logoUrl ? (
                              <img src={source.logoUrl} alt={source.displayName} className="w-full h-full object-contain rounded" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                            ) : (
                              <span>{source.displayName?.charAt(0) || "?"}</span>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[12px] font-black text-content-primary">{source.displayName || "Unknown Source"}</span>
                              <FactualityBadge tier={sourceTier} />
                            </div>
                            <h4 className="text-sm font-bold text-content-primary leading-snug line-clamp-2 mb-1">
                              {item.title || "Untitled article"}
                            </h4>
                            <div className="flex items-center gap-3">
                              {item.publishedAt && (
                                <span className="text-[10px] font-medium text-content-muted">
                                  {timeAgo(item.publishedAt)}
                                </span>
                              )}
                              {item.url && (
                                <a
                                  href={item.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-[10px] font-black uppercase tracking-widest text-accent hover:text-accent-hover transition-colors"
                                >
                                  Read original
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
                {sortedCoverage.length === 0 && (
                  <div className="rounded-xl border border-border bg-surface-card p-12 text-center">
                    <p className="text-sm text-content-muted font-medium">No source coverage data available yet.</p>
                  </div>
                )}
              </div>
            )}

            {/* Predictions tab */}
            {activeTab === "predictions" && story.creatorPredictions && (
              <div className="space-y-4">
                {story.creatorPredictions.map((pred: any, idx: number) => (
                  <div
                    key={pred.claim?.id || idx}
                    className="rounded-xl border border-border bg-surface-card p-5 hover:bg-surface-card-hover transition-all cursor-pointer"
                    onClick={() => {
                      if (tier === "free") {
                        setLocation("/plus");
                      } else {
                        setLocation(`/creators/${pred.creator?.id}`);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center overflow-hidden flex-shrink-0 border-2 border-accent/30">
                          {pred.creator?.avatarUrl ? (
                            <img src={pred.creator.avatarUrl} alt={pred.creator?.channelName} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                          ) : (
                            <span className="text-sm font-black text-accent">{(pred.creator?.channelName || "?").charAt(0)}</span>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-content-primary">{pred.creator?.channelName || "Unknown Creator"}</span>
                            {pred.creator?.tier && <TierBadge tier={pred.creator.tier} size="sm" />}
                          </div>
                          {pred.creator?.overallAccuracy != null && (
                            <span className="text-[10px] font-bold text-content-muted">
                              {Math.round(pred.creator.overallAccuracy)}% accuracy from {pred.creator?.totalClaims || 0} claims
                            </span>
                          )}
                        </div>
                      </div>
                      {pred.claim?.confidenceLanguage && (
                        <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-lg border ${
                          pred.claim.confidenceLanguage.toLowerCase() === "strong" ? "bg-factuality-low/10 text-factuality-low border-factuality-low/30" :
                          pred.claim.confidenceLanguage.toLowerCase() === "medium" ? "bg-factuality-mixed/10 text-factuality-mixed border-factuality-mixed/30" :
                          "bg-surface-card-hover text-content-muted border-border"
                        }`}>
                          {pred.claim.confidenceLanguage}
                        </span>
                      )}
                    </div>
                    <p className="text-base font-bold text-content-primary leading-relaxed">
                      {pred.claim?.claimText || ""}
                    </p>
                    {pred.claim?.statedTimeframe && (
                      <div className="text-[10px] font-bold text-content-muted mt-2">
                        Timeframe: {pred.claim.statedTimeframe}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Timelines tab (claims) */}
            {activeTab === "timelines" && claims.length > 0 && (
              <div className="space-y-4">
                {claims.map((claim: any) => (
                  <div key={claim.id} className="rounded-xl border border-border bg-surface-card p-5">
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-base font-bold text-content-primary leading-relaxed flex-1">
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

          {/* Right sidebar: Similar News Topics */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <div className="bg-surface-card rounded-xl p-5 border border-border">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-content-muted mb-4">
                  Similar News Topics
                </h3>
                {similarStories.length > 0 ? (
                  <div className="space-y-0">
                    {similarStories.map((s: any) => {
                      const sDist = s.credibilityDistribution || { high: 0, medium: 0, low: 0 };
                      return (
                        <div
                          key={s.id}
                          onClick={() => setLocation(`/stories/${s.id}`)}
                          className="cursor-pointer py-3 border-b border-border last:border-b-0 hover:bg-surface-card-hover transition-colors rounded px-1 -mx-1"
                        >
                          {s.imageUrl && (
                            <div className="w-full h-24 rounded-lg overflow-hidden mb-2 bg-surface-card-hover">
                              <img
                                src={s.imageUrl}
                                alt=""
                                className="w-full h-full object-cover"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                              />
                            </div>
                          )}
                          <p className="text-[12px] font-bold text-content-primary leading-tight line-clamp-2 mb-1.5">
                            {s.title}
                          </p>
                          <FactualityBar distribution={sDist} size="sm" />
                          <span className="text-[9px] text-content-muted mt-1 block">
                            {s.sourceCount || 0} sources
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[11px] text-content-muted">No similar stories found.</p>
                )}
              </div>

              {/* Trending topics */}
              {story.assetSymbols?.length > 0 && (
                <div className="bg-surface-card rounded-xl p-5 border border-border mt-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-content-muted mb-3">
                    Related Topics
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {story.assetSymbols.map((sym: string) => (
                      <button
                        key={sym}
                        onClick={() => setLocation(`/topic/${sym.toLowerCase()}`)}
                        className="px-3 py-1.5 bg-surface-card-hover text-content-primary rounded-lg text-[11px] font-bold hover:bg-accent hover:text-accent-text transition-colors border border-border"
                      >
                        {sym}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
