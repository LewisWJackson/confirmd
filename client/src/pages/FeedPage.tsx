import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { fetchStories } from "../lib/api";

const CATEGORIES = ["All", "Regulation", "DeFi", "Security", "Markets", "Technology"];

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
        {story.category && (
          <span className="text-[9px] font-black tracking-[0.2em] uppercase px-2.5 py-1 rounded-lg bg-cyan-50 text-cyan-600 border border-cyan-100">
            {story.category}
          </span>
        )}
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

  const { data: stories = [], isLoading } = useQuery({
    queryKey: ["stories"],
    queryFn: () => fetchStories(),
  });

  const filteredStories = useMemo(() => {
    if (activeCategory === "All") return stories;
    return stories.filter((s: any) => s.category === activeCategory);
  }, [stories, activeCategory]);

  const featuredStory = filteredStories[0];
  const gridStories = filteredStories.slice(1);

  return (
    <div className="animate-in fade-in duration-1000 relative z-10">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 pt-16 pb-8">
        <div className="max-w-3xl">
          <span className="text-[10px] font-black tracking-[0.5em] text-cyan-600 uppercase">Crypto News Intelligence</span>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-slate-900 mt-2 leading-[0.95]">
            See the full picture<br />of crypto news
          </h1>
          <p className="text-lg text-slate-500 mt-4 font-medium max-w-xl">
            Compare how multiple sources cover the same story. Spot credibility gaps, detect blindspots, and read with clarity.
          </p>
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
        {isLoading ? (
          <LoadingSkeleton />
        ) : filteredStories.length === 0 ? (
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
            {/* Featured Story */}
            {featuredStory && (
              <FeaturedStoryCard
                story={featuredStory}
                onClick={() => setLocation(`/stories/${featuredStory.id}`)}
              />
            )}

            {/* Story Grid */}
            {gridStories.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                {gridStories.map((story: any) => (
                  <StoryCard
                    key={story.id}
                    story={story}
                    onClick={() => setLocation(`/stories/${story.id}`)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
