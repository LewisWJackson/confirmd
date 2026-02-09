import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { fetchStories, fetchCreatorFeed } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import { FactualityBar } from "../components/FactualityBar";
import TierBadge from "../components/TierBadge";

const CATEGORIES = ["All", "Regulation", "DeFi", "Security", "Markets", "Technology"];

/* --- Helpers -------------------------------------------------- */

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

function getFactualityLabel(trackRecord: number): { label: string; colorClass: string } {
  if (trackRecord >= 70) return { label: "High Factuality", colorClass: "bg-factuality-high text-white" };
  if (trackRecord >= 50) return { label: "Mixed Factuality", colorClass: "bg-factuality-mixed text-white" };
  return { label: "Low Factuality", colorClass: "bg-factuality-low text-white" };
}

/* --- Source Factuality Line ----------------------------------- */

function SourceFactualityLine({ source }: { source: any }) {
  const tr = source?.trackRecord ?? 0;
  const fact = getFactualityLabel(tr);

  return (
    <div className="flex items-center gap-2">
      {source?.logoUrl ? (
        <img
          src={source.logoUrl}
          alt=""
          className="w-4 h-4 rounded object-cover"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      ) : (
        <div className="w-4 h-4 rounded bg-surface-card-hover flex items-center justify-center">
          <span className="text-[7px] font-bold text-content-muted">{(source?.displayName || "?").charAt(0)}</span>
        </div>
      )}
      <span className="text-[11px] font-bold text-content-secondary">
        {source?.displayName || "Unknown"}
      </span>
      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${fact.colorClass}`}>
        {fact.label}
      </span>
    </div>
  );
}

/* --- Confidence Badge ----------------------------------------- */

function ConfidenceBadge({ confidence }: { confidence: string }) {
  const styles: Record<string, string> = {
    strong: "bg-factuality-low/10 text-factuality-low border-factuality-low/30",
    medium: "bg-factuality-mixed/10 text-factuality-mixed border-factuality-mixed/30",
    weak: "bg-surface-card text-content-muted border-border",
  };
  const key = (confidence || "").toLowerCase();
  return (
    <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-md border ${styles[key] || styles.weak}`}>
      {confidence || "Unknown"}
    </span>
  );
}

/* --- Hero Story (center top) ---------------------------------- */

function HeroStory({ story, onClick }: { story: any; onClick: () => void }) {
  const dist = story.credibilityDistribution || { high: 0, medium: 0, low: 0 };
  const topSources = story.topSources || [];
  const isSingleSource = (story.sourceCount || 0) <= 1;

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-xl overflow-hidden relative bg-surface-card mb-6"
    >
      <div className="relative aspect-[16/8] overflow-hidden">
        {story.imageUrl ? (
          <img
            src={story.imageUrl}
            alt={story.title}
            loading="eager"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-surface-secondary to-surface-card" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* Category badge top-left */}
        <div className="absolute top-4 left-4 flex items-center gap-2">
          {story.category && (
            <span className="text-[9px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-md bg-accent text-accent-text backdrop-blur-sm">
              {story.category}
            </span>
          )}
          <span className="text-[9px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-md bg-white/20 text-white backdrop-blur-sm">
            {story.sourceCount || 0} {(story.sourceCount || 0) === 1 ? "source" : "sources"}
          </span>
        </div>

        {/* Headline overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-5 pb-4">
          <h2 className="text-xl md:text-2xl font-black text-white tracking-tight leading-tight mb-3 group-hover:text-accent transition-colors">
            {story.title}
          </h2>
          {isSingleSource && topSources[0] ? (
            <SourceFactualityLine source={topSources[0]} />
          ) : (
            <FactualityBar distribution={dist} size="md" />
          )}
        </div>
      </div>
    </div>
  );
}

/* --- Story List Row (center feed) ----------------------------- */

function StoryListRow({ story, onClick }: { story: any; onClick: () => void }) {
  const dist = story.credibilityDistribution || { high: 0, medium: 0, low: 0 };
  const topSources = story.topSources || [];
  const isSingleSource = (story.sourceCount || 0) <= 1;

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer py-4 border-b border-border last:border-b-0 hover:bg-surface-card-hover transition-colors px-3 rounded-lg -mx-3"
    >
      {/* Category + time */}
      <div className="flex items-center gap-2 mb-1.5">
        {story.category && (
          <span className="text-[9px] font-bold uppercase tracking-widest text-accent">
            {story.category}
          </span>
        )}
        <span className="text-[9px] text-content-muted">
          {story.latestItemTimestamp ? timeAgo(story.latestItemTimestamp) : ""}
        </span>
      </div>

      {/* Headline + thumbnail row */}
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] font-bold text-content-primary leading-snug mb-2 group-hover:text-accent transition-colors line-clamp-2">
            {story.title}
          </h3>
          {isSingleSource && topSources[0] ? (
            <SourceFactualityLine source={topSources[0]} />
          ) : (
            <>
              <FactualityBar distribution={dist} size="sm" />
              <div className="mt-1.5 text-[10px] font-medium text-content-muted">
                {story.sourceCount || 0} sources
              </div>
            </>
          )}
        </div>
        {story.imageUrl && (
          <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-surface-card">
            <img
              src={story.imageUrl}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/* --- Left Sidebar: Top News ----------------------------------- */

function TopNewsSidebar({
  stories,
  onStoryClick,
}: {
  stories: any[];
  onStoryClick: (id: string) => void;
}) {
  const items = stories.slice(0, 8);

  return (
    <div>
      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-content-muted mb-3 px-1">
        Top News
      </h3>
      <div className="space-y-0">
        {items.map((story: any, idx: number) => {
          const dist = story.credibilityDistribution || { high: 0, medium: 0, low: 0 };
          return (
            <div
              key={story.id || idx}
              onClick={() => onStoryClick(story.id)}
              className="group cursor-pointer flex items-start gap-2.5 py-2.5 border-b border-border last:border-b-0 hover:bg-surface-card-hover transition-colors rounded px-1 -mx-1"
            >
              {story.imageUrl && (
                <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0 bg-surface-card">
                  <img
                    src={story.imageUrl}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold text-content-primary leading-tight line-clamp-2 group-hover:text-accent transition-colors">
                  {story.title}
                </p>
                <div className="mt-1">
                  {(story.sourceCount || 0) <= 1 && (story.topSources || [])[0] ? (
                    <SourceFactualityLine source={story.topSources[0]} />
                  ) : (
                    <>
                      <FactualityBar distribution={dist} size="sm" />
                      <span className="text-[9px] text-content-muted mt-0.5 block">
                        {story.sourceCount || 0} sources
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* --- Creator Predictions (prominent center section) ---------- */

function CreatorPredictionsSection({
  predictions,
  isFree,
  onPredictionClick,
  onViewAll,
}: {
  predictions: any[];
  isFree: boolean;
  onPredictionClick: (prediction: any) => void;
  onViewAll: () => void;
}) {
  // Deduplicate: one prediction per creator (pick the first/latest for each)
  const seen = new Set<string>();
  const unique: any[] = [];
  for (const p of predictions) {
    const cid = p.creator?.id || p.creator?.channelName || "";
    if (seen.has(cid)) continue;
    seen.add(cid);
    unique.push(p);
    if (unique.length >= 6) break;
  }
  const items = unique;
  if (items.length === 0) return null;

  return (
    <div className="my-8">
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.674M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
          <h2 className="text-sm font-black uppercase tracking-[0.15em] text-accent">
            Creator Predictions
          </h2>
          <span className="text-[9px] font-bold text-accent/60 bg-accent/10 px-1.5 py-0.5 rounded">
            Confirmd+
          </span>
        </div>
        <button
          onClick={onViewAll}
          className="text-[11px] font-bold text-accent hover:text-accent-hover transition-colors"
        >
          View All &rarr;
        </button>
      </div>

      {/* Horizontal scrolling cards */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory scrollbar-hide" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        {items.map((prediction: any, idx: number) => {
          const creatorName = prediction.creator?.channelName || "Unknown";
          const avatarUrl = prediction.creator?.avatarUrl;
          const creatorTier = prediction.creator?.tier;
          const claimText = prediction.claimText || "";
          const confidence = prediction.confidenceLanguage || "";
          const accuracy = prediction.creator?.overallAccuracy;

          return (
            <div
              key={prediction.id || idx}
              onClick={() => onPredictionClick(prediction)}
              className="cursor-pointer flex-shrink-0 w-[240px] snap-start bg-surface-card rounded-xl border border-border p-3.5 hover:bg-surface-card-hover transition-all group"
            >
              {/* Creator row */}
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center overflow-hidden flex-shrink-0 ring-1 ring-border">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={creatorName}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  ) : (
                    <span className="text-[11px] font-bold text-accent">
                      {creatorName.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[12px] font-bold text-content-primary">
                    {creatorName}
                  </span>
                  {accuracy != null && (
                    <span className="text-[9px] text-content-muted block">
                      {Math.round(accuracy)}% accuracy
                    </span>
                  )}
                </div>
              </div>

              {/* Claim text */}
              <p className="text-[12px] text-content-secondary leading-snug line-clamp-3 mb-2">
                {claimText}
              </p>

              {/* Category pill */}
              {prediction.category && (
                <span className="px-2 py-0.5 bg-accent/10 text-accent rounded text-[9px] font-bold uppercase tracking-wider">
                  {prediction.category}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* --- Right Sidebar: My News Files / Trending Assets ----------- */

function TrendingAssetsSection({ stories }: { stories: any[] }) {
  const trendingAssets = useMemo(() => {
    const counts: Record<string, number> = {};
    stories.forEach((s: any) => {
      (s.assetSymbols || []).forEach((sym: string) => {
        counts[sym] = (counts[sym] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [stories]);

  if (trendingAssets.length === 0) return null;

  return (
    <div className="bg-surface-card rounded-xl p-4 border border-border">
      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-content-muted mb-3">
        Trending Assets
      </h3>
      <div className="flex flex-wrap gap-2">
        {trendingAssets.map(([symbol, count]) => (
          <span
            key={symbol}
            className="px-2.5 py-1.5 bg-surface-card-hover text-content-primary rounded-lg text-[11px] font-bold"
          >
            {symbol}{" "}
            <span className="text-content-muted font-normal text-[9px]">({count})</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* --- Daily Local News (right sidebar) ------------------------- */

function DailyLocalNews({ stories, onStoryClick }: { stories: any[]; onStoryClick: (id: string) => void }) {
  const recentStories = stories.slice(0, 4);
  if (recentStories.length === 0) return null;

  return (
    <div className="bg-surface-card rounded-xl p-4 border border-border">
      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-content-muted mb-3">
        Daily Local News
      </h3>
      <div className="space-y-0">
        {recentStories.map((story: any, idx: number) => (
          <div
            key={story.id || idx}
            onClick={() => onStoryClick(story.id)}
            className="cursor-pointer py-2 border-b border-border last:border-b-0 hover:bg-surface-card-hover transition-colors rounded px-1 -mx-1"
          >
            <p className="text-[11px] font-bold text-content-primary leading-tight line-clamp-2">
              {story.title}
            </p>
            <span className="text-[9px] text-content-muted mt-0.5 block">
              {story.latestItemTimestamp ? timeAgo(story.latestItemTimestamp) : ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* --- Loading Skeleton ----------------------------------------- */

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_260px] gap-6">
      {/* Left sidebar skeleton */}
      <div className="hidden lg:block space-y-3">
        <div className="h-3 bg-surface-card rounded w-16 mb-4 animate-pulse" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-start gap-2 animate-pulse">
            <div className="w-12 h-12 bg-surface-card rounded flex-shrink-0" />
            <div className="flex-1 space-y-1.5 pt-1">
              <div className="h-3 bg-surface-card rounded w-full" />
              <div className="h-3 bg-surface-card rounded w-3/4" />
              <div className="h-2 bg-surface-card rounded w-full" />
            </div>
          </div>
        ))}
      </div>
      {/* Center skeleton */}
      <div className="space-y-4">
        <div className="rounded-xl overflow-hidden animate-pulse">
          <div className="aspect-[16/8] bg-surface-card" />
        </div>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="py-4 border-b border-border animate-pulse">
            <div className="h-2 bg-surface-card rounded w-24 mb-2" />
            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-surface-card rounded w-full" />
                <div className="h-4 bg-surface-card rounded w-3/4" />
                <div className="h-3 bg-surface-card rounded w-full" />
              </div>
              <div className="w-20 h-20 bg-surface-card rounded-lg flex-shrink-0" />
            </div>
          </div>
        ))}
      </div>
      {/* Right sidebar skeleton */}
      <div className="hidden lg:block space-y-4">
        <div className="bg-surface-card rounded-xl p-4 animate-pulse space-y-3">
          <div className="h-3 bg-surface-card-hover rounded w-20" />
          <div className="h-8 bg-surface-card-hover rounded" />
          <div className="h-8 bg-surface-card-hover rounded" />
        </div>
        <div className="bg-surface-card rounded-xl p-4 animate-pulse space-y-3">
          <div className="h-3 bg-surface-card-hover rounded w-28" />
          <div className="h-12 bg-surface-card-hover rounded" />
          <div className="h-12 bg-surface-card-hover rounded" />
        </div>
      </div>
    </div>
  );
}

/* --- Main FeedPage -------------------------------------------- */

export default function FeedPage() {
  const [, setLocation] = useLocation();
  const [activeCategory, setActiveCategory] = useState("All");
  const { tier } = useAuth();
  const isFree = tier === "free";

  const { data: stories = [], isLoading: storiesLoading } = useQuery({
    queryKey: ["stories"],
    queryFn: () => fetchStories(),
  });

  const { data: creatorPredictions = [] } = useQuery({
    queryKey: ["creator-feed"],
    queryFn: () => fetchCreatorFeed({ limit: 10 }),
  });

  // Filter stories by category
  const filteredStories = useMemo(() => {
    if (activeCategory === "All") return stories;
    return stories.filter((s: any) => s.category === activeCategory);
  }, [stories, activeCategory]);

  // Split stories for layout
  const heroStory = filteredStories.length > 0 ? filteredStories[0] : null;
  const centerStories = filteredStories.slice(1);
  const sidebarStories = stories;

  const handleStoryClick = (id: string) => setLocation(`/stories/${id}`);

  const handlePredictionClick = (prediction: any) => {
    if (isFree) {
      setLocation("/plus");
    } else {
      const creatorId = prediction.creator?.id;
      if (creatorId) {
        setLocation(`/creators/${creatorId}`);
      }
    }
  };

  return (
    <div className="animate-in fade-in duration-1000 min-h-screen bg-surface-primary">
      {/* Promo banner */}
      <div className="bg-accent text-accent-text text-center py-2 px-4">
        <span className="text-[12px] font-bold">
          See every side of every crypto story.{" "}
          <button onClick={() => setLocation("/plus")} className="underline font-black hover:opacity-80 transition-opacity">
            Get Started
          </button>
        </span>
      </div>

      {/* Category pills */}
      <section className="max-w-[1280px] mx-auto px-4 md:px-8 pt-6 pb-4">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all ${
                activeCategory === cat
                  ? "bg-accent text-accent-text shadow-md"
                  : "bg-surface-card text-content-secondary hover:bg-surface-card-hover hover:text-content-primary border border-border"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* 3-Column Layout */}
      <section className="max-w-[1280px] mx-auto px-4 md:px-8 pb-20">
        {storiesLoading ? (
          <LoadingSkeleton />
        ) : filteredStories.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface-card p-16 text-center">
            <div className="w-14 h-14 bg-surface-card-hover rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-content-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <h3 className="text-lg font-black text-content-primary tracking-tight">No stories yet</h3>
            <p className="text-sm text-content-secondary mt-2 font-medium">
              {activeCategory !== "All"
                ? `No stories in the ${activeCategory} category right now. Try a different filter.`
                : "Stories will appear here once the pipeline processes incoming news."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_260px] gap-6">
            {/* LEFT SIDEBAR */}
            <aside className="hidden lg:block">
              <div className="sticky top-24">
                <TopNewsSidebar stories={sidebarStories} onStoryClick={handleStoryClick} />
              </div>
            </aside>

            {/* CENTER COLUMN */}
            <main className="min-w-0">
              {heroStory && (
                <HeroStory
                  story={heroStory}
                  onClick={() => handleStoryClick(heroStory.id)}
                />
              )}

              {/* Creator Predictions - prominent placement */}
              <CreatorPredictionsSection
                predictions={creatorPredictions}
                isFree={isFree}
                onPredictionClick={handlePredictionClick}
                onViewAll={() => setLocation("/creators")}
              />

              <div>
                {centerStories.map((story: any) => (
                  <StoryListRow
                    key={story.id}
                    story={story}
                    onClick={() => handleStoryClick(story.id)}
                  />
                ))}
              </div>
            </main>

            {/* RIGHT SIDEBAR */}
            <aside className="hidden lg:block">
              <div className="sticky top-24 space-y-5">
                <DailyLocalNews
                  stories={sidebarStories}
                  onStoryClick={handleStoryClick}
                />
                <TrendingAssetsSection stories={sidebarStories} />
              </div>
            </aside>
          </div>
        )}
      </section>
    </div>
  );
}
