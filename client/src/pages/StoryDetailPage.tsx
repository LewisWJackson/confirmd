import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { fetchStoryDetail, fetchStories } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import { FactualityBar } from "../components/FactualityBar";
import { VerdictBar } from "../components/VerdictBar";
import TierBadge from "../components/TierBadge";
import { FormattedReasoning } from "../components/FormattedReasoning";

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
    <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded border ${c.className}`}>
      {c.label}
    </span>
  );
}

function formatReasoning(raw: string, verdictLabel?: string): string {
  if (!raw) {
    const fallbacks: Record<string, string> = {
      verified: "Multiple credible sources confirm this claim.",
      speculative: "This claim lacks sufficient verification from primary sources.",
      misleading: "Available evidence contradicts or does not support this claim.",
      plausible_unverified: "This claim appears plausible but remains unconfirmed.",
      unreviewed: "This claim has not yet been reviewed.",
    };
    return fallbacks[verdictLabel || ""] || fallbacks.unreviewed;
  }

  // If reasoning contains structured markdown from LLM, check if it's real
  // analysis or simulation-mode junk (which contains grade counts like "0 primary (A)")
  const isSimulationJunk = /\d+\s+(primary|strong secondary|weak secondary|speculative)\s+\([A-D]\)/i.test(raw)
    || /^\*\*Evidence Summary\*\*:\s*\d+ evidence items analyzed/i.test(raw);
  if (/\*\*[^*]+\*\*\s*:/.test(raw) && !isSimulationJunk) {
    return raw;
  }

  // Simulation mode structured junk — return clean fallback instead
  if (isSimulationJunk) {
    const fallbacks: Record<string, string> = {
      verified: "Multiple credible sources confirm this claim.",
      speculative: "This claim lacks sufficient verification from primary sources.",
      misleading: "Available evidence contradicts or does not support this claim.",
      plausible_unverified: "This claim appears plausible but remains unconfirmed.",
      unreviewed: "This claim has not yet been reviewed.",
    };
    return fallbacks[verdictLabel || ""] || fallbacks.unreviewed;
  }

  let text = raw;

  // Strip "Credibility: X+" prefix (e.g. "Credibility: B+,")
  text = text.replace(/^Credibility:\s*[A-Z][+-]?[.,;:]?\s*/i, "");

  // Strip "Analysis of N evidence items" prefix
  text = text.replace(/^Analysis of \d+ evidence items?[.,:]?\s*/i, "");

  // Strip grade breakdowns like "5 strong secondary B+", "1 weak secondary C-", "0 primary A", "2 tertiary D"
  text = text.replace(/\d+\s+(strong\s+|weak\s+)?(primary|secondary|tertiary)\s+[A-Z][+-]?[.,;:]?\s*/gi, "");

  // Strip boilerplate phrases that appear in simulation mode output
  text = text.replace(/Credible indicators suggest this claim may be accurate,?\s*but primary confirmation is missing\.?\s*/gi, "");
  text = text.replace(/Credible indicators suggest\s*/gi, "");
  text = text.replace(/but primary confirmation is missing\.?\s*/gi, "");
  text = text.replace(/Primary confirmation is missing\.?\s*/gi, "");
  text = text.replace(/No direct evidence (was )?found\.?\s*/gi, "");
  text = text.replace(/Evidence is (largely\s+)?circumstantial\.?\s*/gi, "");
  text = text.replace(/Based on \d+ evidence items?\.?\s*/gi, "");
  text = text.replace(/No contradicting evidence found\.?\s*/gi, "");

  // Clean up leftover commas, periods, whitespace at start/end
  text = text.replace(/^[,.\s;:]+/, "").replace(/[,.\s;:]+$/, "");

  // Collapse multiple spaces
  text = text.replace(/\s{2,}/g, " ");

  // Capitalize first letter
  if (text.length > 0) text = text.charAt(0).toUpperCase() + text.slice(1);

  // If the cleaned text is too short or empty, generate a fallback from the verdict
  if (text.length < 15) {
    const fallbacks: Record<string, string> = {
      verified: "Multiple credible sources confirm this claim.",
      speculative: "This claim lacks sufficient verification from primary sources.",
      misleading: "Available evidence contradicts or does not support this claim.",
      plausible_unverified: "This claim appears plausible but remains unconfirmed.",
      unreviewed: "This claim has not yet been reviewed.",
    };
    return fallbacks[verdictLabel || ""] || fallbacks.unreviewed;
  }

  return text;
}

function VerdictBadge({ verdict }: { verdict: string }) {
  const styles: Record<string, string> = {
    verified: "bg-verdict-verified/10 text-verdict-verified border-verdict-verified/30",
    speculative: "bg-verdict-speculative/10 text-verdict-speculative border-verdict-speculative/30",
    misleading: "bg-verdict-misleading/10 text-verdict-misleading border-verdict-misleading/30",
    plausible_unverified: "bg-verdict-plausible/10 text-verdict-plausible border-verdict-plausible/30",
  };
  const labels: Record<string, string> = {
    verified: "Verified",
    speculative: "Speculative",
    misleading: "Misleading",
    plausible_unverified: "Plausible",
    unreviewed: "Unreviewed",
  };
  return (
    <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg border ${styles[verdict] || "bg-surface-card text-content-muted border-border"}`}>
      {labels[verdict] || verdict}
    </span>
  );
}

/** Flatten all items from coverage entries into a single list for the articles view */
function flattenArticles(coverage: any[]): Array<{ source: any; item: any }> {
  const articles: Array<{ source: any; item: any }> = [];
  for (const entry of coverage) {
    const source = entry.source || {};
    const items = entry.items || [];
    for (const item of items) {
      articles.push({ source, item });
    }
  }
  // Sort by publishedAt descending
  articles.sort((a, b) => {
    const aTime = a.item.publishedAt ? new Date(a.item.publishedAt).getTime() : 0;
    const bTime = b.item.publishedAt ? new Date(b.item.publishedAt).getTime() : 0;
    return bTime - aTime;
  });
  return articles;
}

export default function StoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"articles" | "predictions" | "claims">("articles");
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

  const allArticles = flattenArticles(sortedCoverage);
  const totalArticleCount = allArticles.length;

  // Similar stories (same category, excluding this one)
  const similarStories = allStories
    .filter((s: any) => s.id !== id && s.category === story.category)
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-surface-primary animate-in fade-in duration-700">
      {/* Promo banner - Ground News style */}
      {tier === "free" && (
        <div className="bg-surface-card border-b border-border">
          <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex w-10 h-10 rounded-xl bg-accent/10 items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-black text-content-primary">See every side of every story</p>
                <p className="text-[11px] text-content-muted font-medium">
                  Join our community of exact, well-informed news readers
                </p>
              </div>
            </div>
            <button
              onClick={() => setLocation("/plus")}
              className="px-5 py-2 bg-accent text-accent-text text-[11px] font-black uppercase tracking-wider rounded-lg hover:bg-accent-hover transition-colors flex-shrink-0"
            >
              Subscribe
            </button>
          </div>
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
            <div className="space-y-4 mb-6">
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
              </div>

              <h1 className="text-3xl md:text-4xl font-black leading-tight text-content-primary tracking-tight">
                {story.title}
              </h1>

              {story.summary && !story.summary.startsWith("Story covering") && (
                <p className="text-base text-content-secondary leading-relaxed font-medium max-w-3xl">
                  {story.summary}
                </p>
              )}
            </div>

            {/* Story image */}
            {story.imageUrl && (
              <div className="relative rounded-xl overflow-hidden aspect-[21/9] mb-6">
                <img
                  src={story.imageUrl}
                  alt={story.title}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              </div>
            )}

            {/* Factuality summary bar - compact Ground News style */}
            <div className="rounded-xl border border-border bg-surface-card p-4 mb-6">
              <div className="flex items-center gap-4 mb-3">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-content-muted">
                  Source Factuality Distribution
                </h3>
                <span className="text-[10px] font-bold text-content-muted ml-auto">
                  {(dist.high || 0) + (dist.medium || 0) + (dist.low || 0)} sources
                </span>
              </div>
              <FactualityBar distribution={dist} size="lg" showLabels={true} />
              <div className="flex items-center gap-5 mt-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-factuality-high" />
                  <span className="text-[11px] font-bold text-content-primary">High {dist.high || 0}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-factuality-mixed" />
                  <span className="text-[11px] font-bold text-content-primary">Mixed {dist.medium || 0}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-factuality-low" />
                  <span className="text-[11px] font-bold text-content-primary">Low {dist.low || 0}</span>
                </div>
              </div>
            </div>

            {/* Claims & Verdicts */}
            {claims.length > 0 && (
              <div className="mb-6">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-content-muted mb-3">
                  Claims & Verification
                </h3>
                <div className="space-y-2.5">
                  {claims.map((claim: any) => {
                    const verdictLabel = claim.verdict?.verdictLabel || "unreviewed";
                    const probability = claim.verdict?.probabilityTrue;
                    const reasoning = claim.verdict?.reasoningSummary;
                    const factStatus = claim.factualityStatus || "unreviewed";
                    const factualityColors: Record<string, string> = {
                      factual: "border-l-factuality-high",
                      not_factual: "border-l-factuality-low",
                      undetermined: "border-l-factuality-mixed",
                      unreviewed: "border-l-border",
                    };
                    const factualityBadgeStyles: Record<string, string> = {
                      factual: "bg-factuality-high text-white",
                      not_factual: "bg-factuality-low text-white",
                      undetermined: "bg-factuality-mixed text-white",
                      unreviewed: "bg-surface-card-hover text-content-muted",
                    };
                    const factualityBadgeLabels: Record<string, string> = {
                      factual: "Factual",
                      not_factual: "Not Factual",
                      undetermined: "Undetermined",
                      unreviewed: "Unreviewed",
                    };
                    return (
                      <div
                        key={claim.id}
                        className={`rounded-lg border border-border bg-surface-card border-l-[3px] ${factualityColors[factStatus] || factualityColors.unreviewed}`}
                      >
                        <div className="p-4">
                          {/* Factuality badge + claim text row */}
                          <div className="flex items-start gap-3">
                            <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded flex-shrink-0 mt-0.5 ${factualityBadgeStyles[factStatus] || factualityBadgeStyles.unreviewed}`}>
                              {factualityBadgeLabels[factStatus] || factStatus}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-[14px] font-bold text-content-primary leading-snug">
                                {claim.claimText}
                              </p>
                              {claim.factualityDescription && (
                                <p className="text-[12px] text-content-muted leading-relaxed mt-1.5 italic">
                                  {claim.factualityDescription}
                                </p>
                              )}
                              {/* Probability bar */}
                              {probability != null && (
                                <div className="flex items-center gap-2 mt-2.5">
                                  <div className="flex-1 h-1.5 bg-surface-secondary rounded-full overflow-hidden max-w-[200px]">
                                    <div
                                      className={`h-full rounded-full ${
                                        probability >= 0.7 ? "bg-verdict-verified" :
                                        probability >= 0.4 ? "bg-verdict-speculative" : "bg-verdict-misleading"
                                      }`}
                                      style={{ width: `${Math.round(probability * 100)}%` }}
                                    />
                                  </div>
                                  <span className="text-[10px] font-bold text-content-muted">
                                    {Math.round(probability * 100)}% likely
                                  </span>
                                </div>
                              )}
                              {/* Reasoning */}
                              {reasoning && (
                                <div className="mt-2 text-[12px]">
                                  <FormattedReasoning text={formatReasoning(reasoning, verdictLabel)} verdictLabel={verdictLabel} />
                                </div>
                              )}
                              {/* Source + type */}
                              <div className="flex items-center gap-2 mt-2">
                                {claim.source && (
                                  <span className="text-[10px] text-content-muted font-medium">
                                    via {claim.source.displayName}
                                  </span>
                                )}
                                {claim.source && claim.claimType && (
                                  <span className="text-content-muted text-[8px]">|</span>
                                )}
                                {claim.claimType && (
                                  <span className="text-[10px] text-content-muted font-medium">
                                    {claim.claimType.replace(/_/g, " ")}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tab bar - Ground News style */}
            <div className="flex items-center gap-0 border-b border-border mb-6">
              {[
                { key: "articles" as const, label: `${totalArticleCount} Articles` },
                ...(claims.length ? [{ key: "claims" as const, label: `${claims.length} Claims` }] : []),
                ...(story.creatorPredictions?.length ? [{ key: "predictions" as const, label: "Predictions" }] : []),
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-5 py-3 text-[11px] font-bold uppercase tracking-wider transition-colors border-b-2 -mb-[1px] ${
                    activeTab === tab.key
                      ? "border-accent text-accent"
                      : "border-transparent text-content-muted hover:text-content-primary"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Articles tab - Ground News article list style */}
            {activeTab === "articles" && (
              <div>
                {allArticles.map(({ source, item }, idx) => {
                  const sourceTier = source.tier || getFactualityTier(source.trackRecord || 0);
                  return (
                    <a
                      key={item.id || idx}
                      href={item.url || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-4 py-4 border-b border-border last:border-b-0 hover:bg-surface-card-hover/50 transition-colors group"
                    >
                      {/* Source logo */}
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-black text-xs flex-shrink-0 ${
                        source.logoUrl ? "bg-surface-card border border-border p-1" :
                        sourceTier === "high" ? "bg-factuality-high/15 text-factuality-high" :
                        sourceTier === "medium" ? "bg-factuality-mixed/15 text-factuality-mixed" : "bg-factuality-low/15 text-factuality-low"
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
                          <span className="text-[11px] font-black text-content-secondary uppercase tracking-wide">
                            {source.displayName || "Unknown Source"}
                          </span>
                          <FactualityBadge tier={sourceTier} />
                          {item.publishedAt && (
                            <span className="text-[10px] text-content-muted font-medium ml-auto flex-shrink-0">
                              {timeAgo(item.publishedAt)}
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-content-primary leading-snug line-clamp-2 group-hover:text-accent transition-colors">
                          {item.title || "Untitled article"}
                        </h4>
                      </div>

                      {/* Arrow icon */}
                      <svg className="w-4 h-4 text-content-muted flex-shrink-0 mt-2 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  );
                })}
                {allArticles.length === 0 && (
                  <div className="rounded-xl border border-border bg-surface-card p-12 text-center">
                    <p className="text-sm text-content-muted font-medium">No source articles available yet.</p>
                  </div>
                )}
              </div>
            )}

            {/* Claims tab */}
            {activeTab === "claims" && claims.length > 0 && (
              <div className="space-y-3">
                {claims.map((claim: any) => {
                  const verdictLabel = typeof claim.verdict === "string" ? claim.verdict : claim.verdict?.verdictLabel || "unreviewed";
                  return (
                    <div key={claim.id} className="rounded-lg border border-border bg-surface-card p-4">
                      <div className="flex items-start gap-3">
                        <VerdictBadge verdict={verdictLabel} />
                        <p className="text-sm font-bold text-content-primary leading-relaxed flex-1">
                          {claim.claimText}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Predictions tab */}
            {activeTab === "predictions" && story.creatorPredictions?.length > 0 && (
              <div className="space-y-3">
                {story.creatorPredictions.map((pred: any, idx: number) => (
                  <div
                    key={pred.claim?.id || idx}
                    className="rounded-lg border border-border bg-surface-card p-4 hover:bg-surface-card-hover transition-all cursor-pointer"
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
                        <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center overflow-hidden flex-shrink-0 border-2 border-accent/30">
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
                    <p className="text-sm font-bold text-content-primary leading-relaxed">
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
          </div>

          {/* Right sidebar: Similar News Topics - Ground News style */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-4">
              {/* Similar News Topics */}
              <div className="bg-surface-card rounded-xl border border-border overflow-hidden">
                <div className="px-4 py-3 border-b border-border">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-content-muted">
                    Similar News Topics
                  </h3>
                </div>
                {similarStories.length > 0 ? (
                  <div>
                    {similarStories.map((s: any) => {
                      const sDist = s.credibilityDistribution || { high: 0, medium: 0, low: 0 };
                      return (
                        <div
                          key={s.id}
                          onClick={() => setLocation(`/stories/${s.id}`)}
                          className="cursor-pointer flex gap-3 px-4 py-3 border-b border-border last:border-b-0 hover:bg-surface-card-hover transition-colors"
                        >
                          {/* Thumbnail */}
                          {s.imageUrl ? (
                            <div className="w-16 h-16 rounded-lg overflow-hidden bg-surface-card-hover flex-shrink-0">
                              <img
                                src={s.imageUrl}
                                alt=""
                                className="w-full h-full object-cover"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                              />
                            </div>
                          ) : (
                            <div className="w-16 h-16 rounded-lg bg-surface-card-hover flex-shrink-0" />
                          )}
                          {/* Text */}
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-bold text-content-primary leading-tight line-clamp-2 mb-1.5">
                              {s.title}
                            </p>
                            <div className="flex items-center gap-2">
                              <FactualityBar distribution={sDist} size="sm" />
                            </div>
                            <span className="text-[9px] text-content-muted mt-1 block font-medium">
                              {s.sourceCount || 0} sources
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="px-4 py-6 text-center">
                    <p className="text-[11px] text-content-muted">No similar stories found.</p>
                  </div>
                )}
              </div>

              {/* Related Topics */}
              {story.assetSymbols?.length > 0 && (
                <div className="bg-surface-card rounded-xl border border-border overflow-hidden">
                  <div className="px-4 py-3 border-b border-border">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-content-muted">
                      Related Topics
                    </h3>
                  </div>
                  <div className="px-4 py-3 flex flex-wrap gap-2">
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

              {/* Verdict summary */}
              {Object.keys(verdictDist).length > 0 && (
                <div className="bg-surface-card rounded-xl border border-border overflow-hidden">
                  <div className="px-4 py-3 border-b border-border">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-content-muted">
                      Verdict Summary
                    </h3>
                  </div>
                  <div className="px-4 py-3">
                    <VerdictBar distribution={verdictDist} size="md" showLabels />
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
