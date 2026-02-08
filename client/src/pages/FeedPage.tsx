import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { fetchStories, fetchCreatorFeed } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import TierBadge from "../components/TierBadge";

const CATEGORIES = ["All", "Regulation", "DeFi", "Security", "Markets", "Technology"];

/* ─── Helpers ─────────────────────────────────────────── */

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

/* ─── Labeled Credibility Bar (Ground-News style) ────── */

function LabeledCredibilityBar({
  distribution,
  size = "md",
}: {
  distribution: { high: number; medium: number; low: number };
  size?: "sm" | "md" | "lg";
}) {
  const total = distribution.high + distribution.medium + distribution.low;
  if (total === 0) return null;
  const highPct = Math.round((distribution.high / total) * 100);
  const medPct = Math.round((distribution.medium / total) * 100);
  const lowPct = 100 - highPct - medPct; // ensure they sum to 100

  const h = size === "lg" ? "h-6" : size === "md" ? "h-5" : "h-4";
  const textSize = size === "lg" ? "text-[10px]" : "text-[8px]";

  return (
    <div className={`w-full ${h} rounded-full overflow-hidden flex`}>
      {highPct > 0 && (
        <div
          className="bg-emerald-500 h-full flex items-center justify-center transition-all duration-700"
          style={{ width: `${highPct}%` }}
        >
          {highPct >= 15 && (
            <span className={`${textSize} font-bold text-white leading-none`}>
              High {highPct}%
            </span>
          )}
        </div>
      )}
      {medPct > 0 && (
        <div
          className="bg-amber-400 h-full flex items-center justify-center transition-all duration-700"
          style={{ width: `${medPct}%` }}
        >
          {medPct >= 15 && (
            <span className={`${textSize} font-bold text-white leading-none`}>
              Med {medPct}%
            </span>
          )}
        </div>
      )}
      {lowPct > 0 && (
        <div
          className="bg-red-500 h-full flex items-center justify-center transition-all duration-700"
          style={{ width: `${lowPct}%` }}
        >
          {lowPct >= 15 && (
            <span className={`${textSize} font-bold text-white leading-none`}>
              Low {lowPct}%
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Confidence Badge ────────────────────────────────── */

function ConfidenceBadge({ confidence }: { confidence: string }) {
  const styles: Record<string, string> = {
    strong: "bg-red-50 text-red-600 border-red-200",
    medium: "bg-amber-50 text-amber-600 border-amber-200",
    weak: "bg-slate-50 text-slate-500 border-slate-200",
  };
  const key = (confidence || "").toLowerCase();
  return (
    <span
      className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-md border ${styles[key] || styles.weak}`}
    >
      {confidence || "Unknown"}
    </span>
  );
}

/* ─── Hero Story (center top) ─────────────────────────── */

function HeroStory({ story, onClick }: { story: any; onClick: () => void }) {
  const dist = story.credibilityDistribution || { high: 0, medium: 0, low: 0 };

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-xl overflow-hidden relative bg-slate-900 mb-6"
    >
      <div className="relative aspect-[16/8] overflow-hidden">
        {story.imageUrl ? (
          <img
            src={story.imageUrl}
            alt={story.title}
            loading="eager"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-800 to-cyan-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* Category badge top-left */}
        <div className="absolute top-4 left-4 flex items-center gap-2">
          {story.category && (
            <span className="text-[9px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-md bg-cyan-500/90 text-white backdrop-blur-sm">
              {story.category}
            </span>
          )}
          <span className="text-[9px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-md bg-white/20 text-white backdrop-blur-sm">
            {story.sourceCount || 0} sources
          </span>
        </div>

        {/* Headline overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-5 pb-3">
          <h2 className="text-xl md:text-2xl font-black text-white tracking-tight leading-tight mb-3 group-hover:text-cyan-200 transition-colors">
            {story.title}
          </h2>
          {/* Credibility bar inside image area */}
          <LabeledCredibilityBar distribution={dist} size="md" />
        </div>
      </div>
    </div>
  );
}

/* ─── Story List Row (center feed) ────────────────────── */

function StoryListRow({ story, onClick }: { story: any; onClick: () => void }) {
  const dist = story.credibilityDistribution || { high: 0, medium: 0, low: 0 };

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer py-4 border-b border-[#e5ddd0] last:border-b-0 hover:bg-[#efe9df] transition-colors px-3 rounded-lg -mx-3"
    >
      {/* Category + time */}
      <div className="flex items-center gap-2 mb-1.5">
        {story.category && (
          <span className="text-[9px] font-bold uppercase tracking-widest text-cyan-600">
            {story.category}
          </span>
        )}
        <span className="text-[9px] text-stone-400">
          {story.latestItemTimestamp ? timeAgo(story.latestItemTimestamp) : ""}
        </span>
      </div>

      {/* Headline + thumbnail row */}
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] font-bold text-stone-900 leading-snug mb-2 group-hover:text-cyan-700 transition-colors line-clamp-2">
            {story.title}
          </h3>
          {/* Credibility bar */}
          <LabeledCredibilityBar distribution={dist} size="sm" />
          <div className="mt-1.5 text-[10px] font-medium text-stone-400">
            {story.sourceCount || 0} sources
          </div>
        </div>
        {story.imageUrl && (
          <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-stone-200">
            <img
              src={story.imageUrl}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Left Sidebar: Top News Compact ──────────────────── */

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
      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 mb-3 px-1">
        Top News
      </h3>
      <div className="space-y-0">
        {items.map((story: any, idx: number) => {
          const dist = story.credibilityDistribution || { high: 0, medium: 0, low: 0 };
          return (
            <div
              key={story.id || idx}
              onClick={() => onStoryClick(story.id)}
              className="group cursor-pointer flex items-start gap-2.5 py-2.5 border-b border-[#e5ddd0] last:border-b-0 hover:bg-[#efe9df] transition-colors rounded px-1 -mx-1"
            >
              {story.imageUrl && (
                <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0 bg-stone-200">
                  <img
                    src={story.imageUrl}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold text-stone-800 leading-tight line-clamp-2 group-hover:text-cyan-700 transition-colors">
                  {story.title}
                </p>
                <div className="mt-1">
                  <LabeledCredibilityBar distribution={dist} size="sm" />
                </div>
                <span className="text-[9px] text-stone-400 mt-0.5 block">
                  {story.sourceCount || 0} sources
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Right Sidebar: Blindspot ────────────────────────── */

function BlindspotSection({
  stories,
  onStoryClick,
}: {
  stories: any[];
  onStoryClick: (id: string) => void;
}) {
  // Blindspot = stories where low credibility dominates (>50% of sources are low)
  const blindspotStories = useMemo(() => {
    return stories
      .filter((s: any) => {
        const dist = s.credibilityDistribution || { high: 0, medium: 0, low: 0 };
        const total = dist.high + dist.medium + dist.low;
        if (total === 0) return false;
        return dist.low / total > 0.5;
      })
      .slice(0, 4);
  }, [stories]);

  if (blindspotStories.length === 0) return null;

  return (
    <div className="bg-red-50/60 rounded-xl p-4 border border-red-100">
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9.27-3.11-11-7.5a11.72 11.72 0 013.168-4.477M6.343 6.343A9.97 9.97 0 0112 5c5 0 9.27 3.11 11 7.5a11.7 11.7 0 01-4.373 5.157M6.343 6.343L17.657 17.657M6.343 6.343l11.314 11.314"
          />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M1 1l22 22" />
        </svg>
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-red-600">
          Blindspot
        </h3>
      </div>
      <p className="text-[10px] text-red-400 mb-3 leading-relaxed">
        Stories covered mostly by low-credibility sources. Read with caution.
      </p>
      <div className="space-y-0">
        {blindspotStories.map((story: any) => {
          const dist = story.credibilityDistribution || { high: 0, medium: 0, low: 0 };
          return (
            <div
              key={story.id}
              onClick={() => onStoryClick(story.id)}
              className="cursor-pointer py-2 border-b border-red-100 last:border-b-0 hover:bg-red-50 transition-colors rounded px-1 -mx-1"
            >
              <p className="text-[12px] font-bold text-stone-800 leading-tight line-clamp-2 mb-1">
                {story.title}
              </p>
              <LabeledCredibilityBar distribution={dist} size="sm" />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Right Sidebar: Creator Predictions (fully visible) ─ */

function CreatorPredictionsSection({
  predictions,
  isFree,
  onPredictionClick,
}: {
  predictions: any[];
  isFree: boolean;
  onPredictionClick: (prediction: any) => void;
}) {
  const items = predictions.slice(0, 5);
  if (items.length === 0) return null;

  return (
    <div className="bg-violet-50/60 rounded-xl p-4 border border-violet-100">
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-4 h-4 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.663 17h4.674M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-600">
          Creator Predictions
        </h3>
      </div>
      <div className="space-y-0">
        {items.map((prediction: any, idx: number) => {
          const creatorName = prediction.creator?.channelName || "Unknown";
          const avatarUrl = prediction.creator?.avatarUrl;
          const creatorTier = prediction.creator?.tier;
          const creatorId = prediction.creator?.id;
          const claimText = prediction.claimText || "";
          const confidence = prediction.confidenceLanguage || "";
          const accuracy = prediction.creator?.overallAccuracy;
          const totalClaims = prediction.creator?.totalClaims;

          return (
            <div
              key={prediction.id || idx}
              onClick={() => onPredictionClick(prediction)}
              className="cursor-pointer py-3 border-b border-violet-100 last:border-b-0 hover:bg-violet-50 transition-colors rounded px-1 -mx-1"
            >
              {/* Avatar + name row */}
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-6 h-6 rounded-full bg-violet-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={creatorName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <span className="text-[9px] font-bold text-violet-500">
                      {creatorName.charAt(0)}
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-bold text-stone-800 truncate">
                  {creatorName}
                </span>
                {creatorTier && <TierBadge tier={creatorTier} size="sm" />}
              </div>
              {/* Claim text */}
              <p className="text-[11px] text-stone-600 leading-snug line-clamp-2 mb-1.5">
                {claimText}
              </p>
              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-1.5">
                {confidence && <ConfidenceBadge confidence={confidence} />}
                {prediction.category && (
                  <span className="px-1.5 py-0.5 bg-violet-100 text-violet-600 rounded text-[8px] font-bold uppercase tracking-wider">
                    {prediction.category}
                  </span>
                )}
                {accuracy != null && (
                  <span className="text-[8px] font-bold text-violet-400">
                    {Math.round(accuracy)}% acc / {totalClaims || 0} claims
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Right Sidebar: Trending Assets ──────────────────── */

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
    <div className="bg-white/60 rounded-xl p-4 border border-[#e5ddd0]">
      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 mb-3">
        Trending Assets
      </h3>
      <div className="flex flex-wrap gap-2">
        {trendingAssets.map(([symbol, count]) => (
          <span
            key={symbol}
            className="px-2.5 py-1.5 bg-[#efe9df] text-stone-700 rounded-lg text-[11px] font-bold"
          >
            {symbol}{" "}
            <span className="text-stone-400 font-normal text-[9px]">({count})</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── Loading Skeleton ────────────────────────────────── */

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_260px] gap-6">
      {/* Left sidebar skeleton */}
      <div className="hidden lg:block space-y-3">
        <div className="h-3 bg-stone-200/50 rounded w-16 mb-4 animate-pulse" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-start gap-2 animate-pulse">
            <div className="w-12 h-12 bg-stone-200/50 rounded flex-shrink-0" />
            <div className="flex-1 space-y-1.5 pt-1">
              <div className="h-3 bg-stone-200/50 rounded w-full" />
              <div className="h-3 bg-stone-200/50 rounded w-3/4" />
              <div className="h-2 bg-stone-200/50 rounded w-full" />
            </div>
          </div>
        ))}
      </div>
      {/* Center skeleton */}
      <div className="space-y-4">
        <div className="rounded-xl overflow-hidden animate-pulse">
          <div className="aspect-[16/8] bg-stone-200/50" />
        </div>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="py-4 border-b border-stone-200/30 animate-pulse">
            <div className="h-2 bg-stone-200/50 rounded w-24 mb-2" />
            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-stone-200/50 rounded w-full" />
                <div className="h-4 bg-stone-200/50 rounded w-3/4" />
                <div className="h-3 bg-stone-200/50 rounded w-full" />
              </div>
              <div className="w-20 h-20 bg-stone-200/50 rounded-lg flex-shrink-0" />
            </div>
          </div>
        ))}
      </div>
      {/* Right sidebar skeleton */}
      <div className="hidden lg:block space-y-4">
        <div className="bg-red-50/30 rounded-xl p-4 animate-pulse space-y-3">
          <div className="h-3 bg-red-100 rounded w-20" />
          <div className="h-8 bg-red-50 rounded" />
          <div className="h-8 bg-red-50 rounded" />
        </div>
        <div className="bg-violet-50/30 rounded-xl p-4 animate-pulse space-y-3">
          <div className="h-3 bg-violet-100 rounded w-28" />
          <div className="h-12 bg-violet-50 rounded" />
          <div className="h-12 bg-violet-50 rounded" />
        </div>
      </div>
    </div>
  );
}

/* ─── Main FeedPage ───────────────────────────────────── */

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
  const sidebarStories = stories; // Use all stories for sidebar, unfiltered

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
    <div className="animate-in fade-in duration-1000 min-h-screen bg-[#f5f0e8]">
      {/* Category pills */}
      <section className="max-w-[1280px] mx-auto px-4 md:px-8 pt-6 pb-4">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all ${
                activeCategory === cat
                  ? "bg-stone-800 text-white shadow-md"
                  : "bg-white/70 text-stone-500 hover:bg-white hover:text-stone-700 border border-[#e5ddd0]"
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
          <div className="rounded-xl border border-[#e5ddd0] bg-white/60 p-16 text-center">
            <div className="w-14 h-14 bg-stone-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-7 h-7 text-stone-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-black text-stone-900 tracking-tight">No stories yet</h3>
            <p className="text-sm text-stone-500 mt-2 font-medium">
              {activeCategory !== "All"
                ? `No stories in the ${activeCategory} category right now. Try a different filter.`
                : "Stories will appear here once the pipeline processes incoming news."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_260px] gap-6">
            {/* ─── LEFT SIDEBAR ─── */}
            <aside className="hidden lg:block">
              <div className="sticky top-24">
                <TopNewsSidebar stories={sidebarStories} onStoryClick={handleStoryClick} />
              </div>
            </aside>

            {/* ─── CENTER COLUMN ─── */}
            <main className="min-w-0">
              {/* Hero story */}
              {heroStory && (
                <HeroStory
                  story={heroStory}
                  onClick={() => handleStoryClick(heroStory.id)}
                />
              )}

              {/* Story list rows */}
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

            {/* ─── RIGHT SIDEBAR ─── */}
            <aside className="hidden lg:block">
              <div className="sticky top-24 space-y-5">
                <BlindspotSection
                  stories={sidebarStories}
                  onStoryClick={handleStoryClick}
                />
                <CreatorPredictionsSection
                  predictions={creatorPredictions}
                  isFree={isFree}
                  onPredictionClick={handlePredictionClick}
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
