import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { fetchStories, fetchCreatorFeed } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import TierBadge from "../components/TierBadge";

const CATEGORIES = ["All", "Regulation", "DeFi", "Security", "Markets", "Technology"];

type FeedItem =
  | { type: "story"; data: any }
  | { type: "creator_prediction"; data: any };

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

function CredibilityBar({ distribution, size = "md" }: { distribution: { high: number; medium: number; low: number }; size?: "sm" | "md" | "lg" }) {
  const total = distribution.high + distribution.medium + distribution.low;
  if (total === 0) return null;
  const highPct = (distribution.high / total) * 100;
  const medPct = (distribution.medium / total) * 100;
  const lowPct = (distribution.low / total) * 100;
  const h = size === "lg" ? "h-3" : size === "md" ? "h-2.5" : "h-2";

  return (
    <div className={`w-full ${h} rounded-full overflow-hidden flex bg-slate-100`}>
      {highPct > 0 && <div className="bg-emerald-500 h-full transition-all duration-700" style={{ width: `${highPct}%` }} />}
      {medPct > 0 && <div className="bg-amber-400 h-full transition-all duration-700" style={{ width: `${medPct}%` }} />}
      {lowPct > 0 && <div className="bg-red-500 h-full transition-all duration-700" style={{ width: `${lowPct}%` }} />}
    </div>
  );
}

function SourceLogoStack({ sources }: { sources: any[] }) {
  const shown = sources.slice(0, 4);
  return (
    <div className="flex items-center -space-x-2">
      {shown.map((s: any, i: number) => (
        <div
          key={s.id || i}
          className="w-7 h-7 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center overflow-hidden shadow-sm"
          style={{ zIndex: shown.length - i }}
          title={s.displayName}
        >
          {s.logoUrl ? (
            <img src={s.logoUrl} alt={s.displayName} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          ) : (
            <span className="text-[9px] font-black text-slate-500">{s.displayName?.charAt(0) || "?"}</span>
          )}
        </div>
      ))}
      {sources.length > 4 && (
        <div className="w-7 h-7 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center shadow-sm" style={{ zIndex: 0 }}>
          <span className="text-[8px] font-black text-slate-500">+{sources.length - 4}</span>
        </div>
      )}
    </div>
  );
}

function SingleSourceBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-lg text-[9px] font-black uppercase tracking-wider"
      title="Only 1 source covering this story"
    >
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18 9 9 0 000-18z" />
      </svg>
      Single Source
    </span>
  );
}

function ConfidenceBadge({ confidence }: { confidence: string }) {
  const styles: Record<string, string> = {
    strong: "bg-red-50 text-red-600 border-red-200",
    medium: "bg-amber-50 text-amber-600 border-amber-200",
    weak: "bg-slate-50 text-slate-500 border-slate-200",
  };
  const key = (confidence || "").toLowerCase();
  return (
    <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-lg border ${styles[key] || styles.weak}`}>
      {confidence || "Unknown"}
    </span>
  );
}

function CreatorPredictionCard({ prediction, isFree, onClick }: { prediction: any; isFree: boolean; onClick: () => void }) {
  const claimText = prediction.claimText || prediction.claim || "";
  const teaser = claimText.slice(0, 20);

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-2xl border border-violet-200 bg-white p-6 hover:shadow-[0_6px_30px_rgba(139,92,246,0.1)] transition-all duration-500 hover:-translate-y-1 flex flex-col relative overflow-hidden"
    >
      {/* Purple accent top border */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 to-purple-500" />

      {/* Header: avatar + name + tier */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center overflow-hidden flex-shrink-0 border-2 border-violet-200">
          {prediction.creatorAvatarUrl ? (
            <img src={prediction.creatorAvatarUrl} alt={prediction.creatorName} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          ) : (
            <span className="text-sm font-black text-violet-500">{(prediction.creatorName || "?").charAt(0)}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-slate-900 truncate">{prediction.creatorName || "Unknown Creator"}</span>
            {prediction.creatorTier && <TierBadge tier={prediction.creatorTier} size="sm" />}
          </div>
          <span className="text-[10px] font-medium text-slate-400">
            {prediction.createdAt ? timeAgo(prediction.createdAt) : ""}
          </span>
        </div>
        <span className="text-[9px] font-black tracking-[0.2em] uppercase px-2.5 py-1 rounded-lg bg-violet-50 text-violet-600 border border-violet-100 flex-shrink-0">
          Prediction
        </span>
      </div>

      {/* Gated content area */}
      <div className="relative flex-1">
        {isFree && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/60 backdrop-blur-[2px] rounded-xl">
            <svg className="w-8 h-8 text-violet-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="text-sm font-bold text-slate-700 mb-1">Unlock creator predictions</span>
            <span className="text-[10px] text-slate-500 mb-3">with Confirmd Tribune</span>
            <a
              href="/plus"
              onClick={(e) => e.stopPropagation()}
              className="px-5 py-2 bg-violet-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-violet-700 transition-all shadow-lg shadow-violet-500/20"
            >
              View Plans
            </a>
          </div>
        )}

        <div className={isFree ? "blur-sm select-none pointer-events-none" : ""}>
          {/* Claim text */}
          {isFree ? (
            <p className="text-base font-bold text-slate-800 leading-snug mb-3 line-clamp-3">
              <span className="blur-none">{teaser}</span>{claimText.slice(20)}
            </p>
          ) : (
            <p className="text-base font-bold text-slate-800 leading-snug mb-3 line-clamp-3">
              {claimText}
            </p>
          )}

          {/* Video thumbnail */}
          {prediction.videoThumbnailUrl && (
            <div className="rounded-xl overflow-hidden aspect-video mb-3 bg-slate-100">
              <img src={prediction.videoThumbnailUrl} alt="Video" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            </div>
          )}

          {/* Confidence + category + assets */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {prediction.confidence && <ConfidenceBadge confidence={prediction.confidence} />}
            {prediction.category && (
              <span className="px-2 py-0.5 bg-violet-50 text-violet-600 rounded-lg text-[9px] font-black uppercase tracking-wider border border-violet-100">
                {prediction.category}
              </span>
            )}
            {(prediction.assetSymbols || []).map((s: string) => (
              <span key={s} className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[9px] font-black uppercase tracking-wider">
                {s}
              </span>
            ))}
          </div>

          {/* Timeframe */}
          {prediction.timeframe && (
            <div className="text-[10px] font-bold text-slate-400 mb-3">
              Timeframe: {prediction.timeframe}
            </div>
          )}

          {/* Accuracy */}
          {prediction.accuracy != null && (
            <div className="text-[10px] font-bold text-violet-500">
              {Math.round(prediction.accuracy)}% accuracy from {prediction.totalClaims || 0} claims
            </div>
          )}

          {/* Related story */}
          {prediction.relatedStoryId && prediction.relatedStoryTitle && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <span className="text-[10px] font-bold text-slate-400">Related to: </span>
              <a
                href={`/stories/${prediction.relatedStoryId}`}
                onClick={(e) => e.stopPropagation()}
                className="text-[10px] font-bold text-cyan-600 hover:text-cyan-700"
              >
                {prediction.relatedStoryTitle}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FeaturedStoryCard({ story, onClick }: { story: any; onClick: () => void }) {
  const dist = story.credibilityDistribution || { high: 0, medium: 0, low: 0 };
  const topSources = story.topSources || [];

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-2xl overflow-hidden border border-slate-200 bg-white hover:shadow-[0_8px_40px_rgba(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-1"
    >
      <div className="relative aspect-[21/9] overflow-hidden bg-gradient-to-br from-slate-900 to-cyan-900">
        {story.imageUrl ? (
          <img
            src={story.imageUrl}
            alt={story.title}
            loading="eager"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute top-5 left-6 flex items-center gap-2">
          {story.category && (
            <span className="text-[9px] font-black tracking-[0.2em] uppercase px-3 py-1.5 rounded-lg bg-cyan-500/90 text-white backdrop-blur-sm">
              {story.category}
            </span>
          )}
          <span className="text-[9px] font-black tracking-[0.2em] uppercase px-3 py-1.5 rounded-lg bg-white/20 text-white backdrop-blur-sm">
            {story.sourceCount || 0} sources
          </span>
          {story.singleSource && <SingleSourceBadge />}
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight leading-tight mb-4 group-hover:text-cyan-200 transition-colors">
            {story.title}
          </h2>
          {story.summary && (
            <p className="text-sm md:text-base text-white/70 line-clamp-2 max-w-3xl font-medium">{story.summary}</p>
          )}
        </div>
      </div>

      <div className="p-6 md:p-8 space-y-5">
        {/* Credibility distribution bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Source Credibility</span>
            <div className="flex items-center gap-4 text-[10px] font-bold">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> High {dist.high}</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400" /> Med {dist.medium}</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" /> Low {dist.low}</span>
            </div>
          </div>
          <CredibilityBar distribution={dist} size="lg" />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <SourceLogoStack sources={topSources} />
            <div className="flex flex-wrap gap-1.5">
              {(story.assetSymbols || []).map((s: string) => (
                <span key={s} className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-wider">
                  {s}
                </span>
              ))}
            </div>
          </div>
          <span className="text-xs font-medium text-slate-400">
            {story.latestItemTimestamp ? timeAgo(story.latestItemTimestamp) : ""}
          </span>
        </div>
      </div>
    </div>
  );
}

function StoryCard({ story, onClick }: { story: any; onClick: () => void }) {
  const dist = story.credibilityDistribution || { high: 0, medium: 0, low: 0 };
  const topSources = story.topSources || [];

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-6 hover:shadow-[0_6px_30px_rgba(0,0,0,0.06)] transition-all duration-500 hover:-translate-y-1 flex flex-col"
    >
      {/* Category + time */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {story.category && (
            <span className="text-[9px] font-black tracking-[0.2em] uppercase px-2.5 py-1 rounded-lg bg-cyan-50 text-cyan-600 border border-cyan-100">
              {story.category}
            </span>
          )}
          {story.singleSource && <SingleSourceBadge />}
        </div>
        <span className="text-[10px] font-medium text-slate-400">
          {story.latestItemTimestamp ? timeAgo(story.latestItemTimestamp) : ""}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-lg font-black text-slate-900 tracking-tight leading-snug mb-4 group-hover:text-cyan-600 transition-colors line-clamp-3 flex-1">
        {story.title}
      </h3>

      {/* Source count badge */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[10px] font-bold text-slate-500">
          {story.sourceCount || 0} sources covering this story
        </span>
      </div>

      {/* Credibility bar */}
      <div className="mb-4">
        <CredibilityBar distribution={dist} size="sm" />
        <div className="flex items-center gap-3 mt-1.5 text-[9px] font-bold text-slate-400">
          {dist.high > 0 && <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />{dist.high}</span>}
          {dist.medium > 0 && <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" />{dist.medium}</span>}
          {dist.low > 0 && <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500" />{dist.low}</span>}
        </div>
      </div>

      {/* Bottom row */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <SourceLogoStack sources={topSources} />
        <div className="flex flex-wrap gap-1">
          {(story.assetSymbols || []).slice(0, 3).map((s: string) => (
            <span key={s} className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[9px] font-black uppercase tracking-wider">
              {s}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <>
      {/* Featured skeleton */}
      <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white animate-pulse">
        <div className="aspect-[21/9] bg-slate-200" />
        <div className="p-8 space-y-4">
          <div className="h-3 bg-slate-200 rounded-full w-full" />
          <div className="flex gap-4">
            <div className="h-4 bg-slate-100 rounded w-20" />
            <div className="h-4 bg-slate-100 rounded w-16" />
            <div className="h-4 bg-slate-100 rounded w-16" />
          </div>
        </div>
      </div>
      {/* Grid skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-6 animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="h-5 bg-slate-200 rounded-lg w-20" />
              <div className="h-4 bg-slate-100 rounded w-12" />
            </div>
            <div className="h-5 bg-slate-200 rounded-lg w-full mb-2" />
            <div className="h-5 bg-slate-200 rounded-lg w-3/4 mb-4" />
            <div className="h-2 bg-slate-100 rounded-full w-full mb-4" />
            <div className="flex gap-2">
              <div className="w-7 h-7 bg-slate-200 rounded-full" />
              <div className="w-7 h-7 bg-slate-200 rounded-full" />
              <div className="w-7 h-7 bg-slate-200 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

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

  // Build mixed feed: interleave stories and predictions by date, featured story always first
  const feedItems = useMemo<FeedItem[]>(() => {
    const storyItems: FeedItem[] = filteredStories.map((s: any) => ({
      type: "story" as const,
      data: s,
    }));
    const predictionItems: FeedItem[] = creatorPredictions.map((p: any) => ({
      type: "creator_prediction" as const,
      data: p,
    }));

    // Ensure first item is always a story (the featured card)
    const firstStory = storyItems.length > 0 ? storyItems[0] : null;
    const restItems = [...storyItems.slice(1), ...predictionItems];

    // Sort rest by date, newest first
    restItems.sort((a, b) => {
      const dateA = new Date(a.type === "story" ? (a.data.latestItemTimestamp || a.data.createdAt) : a.data.createdAt).getTime();
      const dateB = new Date(b.type === "story" ? (b.data.latestItemTimestamp || b.data.createdAt) : b.data.createdAt).getTime();
      return dateB - dateA;
    });

    if (firstStory) return [firstStory, ...restItems];
    return restItems;
  }, [filteredStories, creatorPredictions]);

  const featuredItem = feedItems[0];
  const gridItems = feedItems.slice(1);

  return (
    <div className="animate-in fade-in duration-1000 relative z-10">
      {/* Hero Section */}
      <section className="hero-statue-bg">
        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 pt-16 pb-8">
          <div className="max-w-3xl">
            <span className="text-[10px] font-black tracking-[0.5em] text-cyan-600 uppercase">Crypto News Intelligence</span>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-slate-900 mt-2 leading-[0.95]">
              See the full picture<br />of crypto news
            </h1>
            <p className="text-lg text-slate-500 mt-4 font-medium max-w-xl">
              Compare how multiple sources cover the same story. Spot credibility gaps, detect blindspots, and read with clarity.
            </p>
          </div>
        </div>
      </section>

      {/* Filter Bar */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 pb-8">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeCategory === cat
                  ? "bg-slate-900 text-white shadow-lg"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Content */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 pb-24">
        {storiesLoading ? (
          <LoadingSkeleton />
        ) : feedItems.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">No stories yet</h3>
            <p className="text-sm text-slate-500 mt-2 font-medium">
              {activeCategory !== "All"
                ? `No stories in the ${activeCategory} category right now. Try a different filter.`
                : "Stories will appear here once the pipeline processes incoming news."}
            </p>
          </div>
        ) : (
          <>
            {/* Featured Story (always a story type) */}
            {featuredItem && featuredItem.type === "story" && (
              <FeaturedStoryCard
                story={featuredItem.data}
                onClick={() => setLocation(`/stories/${featuredItem.data.id}`)}
              />
            )}

            {/* Mixed Grid */}
            {gridItems.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                {gridItems.map((item, idx) =>
                  item.type === "story" ? (
                    <StoryCard
                      key={`story-${item.data.id}`}
                      story={item.data}
                      onClick={() => setLocation(`/stories/${item.data.id}`)}
                    />
                  ) : (
                    <CreatorPredictionCard
                      key={`pred-${item.data.id || idx}`}
                      prediction={item.data}
                      isFree={isFree}
                      onClick={() => !isFree && item.data.id && setLocation(`/creators/${item.data.creatorId || item.data.id}`)}
                    />
                  )
                )}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
