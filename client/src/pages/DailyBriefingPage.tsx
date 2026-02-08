import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { fetchStories } from "../lib/api";
import { FactualityBar } from "../components/FactualityBar";

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

function formatDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/* --- Hero Story Card ------------------------------------------ */

function HeroStoryCard({ story, onClick }: { story: any; onClick: () => void }) {
  const dist = story.credibilityDistribution || { high: 0, medium: 0, low: 0 };

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-xl overflow-hidden bg-surface-card border border-border relative"
    >
      <div className="relative aspect-[21/9] overflow-hidden">
        {story.imageUrl ? (
          <img
            src={story.imageUrl}
            alt={story.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-surface-secondary to-surface-card" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* Badges */}
        <div className="absolute top-4 left-4 flex items-center gap-2">
          {story.category && (
            <span className="text-[9px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-md bg-accent text-accent-text">
              {story.category}
            </span>
          )}
        </div>

        {/* Headline overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-tight mb-3 group-hover:text-accent transition-colors">
            {story.title}
          </h2>
          <div className="max-w-lg">
            <FactualityBar distribution={dist} size="md" showLabels={true} />
          </div>
          <div className="flex items-center gap-3 mt-3 text-[10px] text-white/70">
            <span className="font-bold">{story.sourceCount || 0} sources</span>
            {story.latestItemTimestamp && <span>{timeAgo(story.latestItemTimestamp)}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* --- Story Grid Card ------------------------------------------ */

function StoryGridCard({ story, onClick }: { story: any; onClick: () => void }) {
  const dist = story.credibilityDistribution || { high: 0, medium: 0, low: 0 };

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-xl overflow-hidden bg-surface-card border border-border hover:bg-surface-card-hover transition-all duration-300"
    >
      {story.imageUrl && (
        <div className="relative aspect-[16/9] overflow-hidden">
          <img
            src={story.imageUrl}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        </div>
      )}
      <div className="p-4">
        {story.category && (
          <span className="text-[9px] font-bold uppercase tracking-widest text-accent mb-1.5 block">
            {story.category}
          </span>
        )}
        <h3 className="text-sm font-bold text-content-primary leading-snug mb-3 group-hover:text-accent transition-colors line-clamp-3">
          {story.title}
        </h3>
        <FactualityBar distribution={dist} size="sm" />
        <div className="flex items-center gap-2 mt-2 text-[9px] text-content-muted">
          <span className="font-bold">{story.sourceCount || 0} sources</span>
          {story.latestItemTimestamp && (
            <>
              <span className="text-content-muted">|</span>
              <span>{timeAgo(story.latestItemTimestamp)}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* --- Sidebar Story Row ---------------------------------------- */

function SidebarStoryRow({ story, onClick }: { story: any; onClick: () => void }) {
  const dist = story.credibilityDistribution || { high: 0, medium: 0, low: 0 };

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer py-3 border-b border-border last:border-b-0 hover:bg-surface-card-hover transition-colors rounded px-2 -mx-2"
    >
      <div className="flex items-start gap-3">
        {story.imageUrl && (
          <div className="w-16 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-surface-card-hover">
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
          <div className="mt-1.5">
            <FactualityBar distribution={dist} size="sm" />
          </div>
          <span className="text-[9px] text-content-muted mt-1 block">
            {story.sourceCount || 0} sources
          </span>
        </div>
      </div>
    </div>
  );
}

/* --- Main DailyBriefingPage ----------------------------------- */

export default function DailyBriefingPage() {
  const [, setLocation] = useLocation();

  const { data: stories = [], isLoading } = useQuery({
    queryKey: ["stories"],
    queryFn: () => fetchStories(),
  });

  // Sort by most recent and try to limit to today's stories (fallback to all if none from today)
  const sortedStories = useMemo(() => {
    const sorted = [...stories].sort((a: any, b: any) => {
      const aTime = new Date(a.latestItemTimestamp || 0).getTime();
      const bTime = new Date(b.latestItemTimestamp || 0).getTime();
      return bTime - aTime;
    });

    // Try to filter to today's stories
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMs = today.getTime();

    const todayStories = sorted.filter((s: any) => {
      const ts = new Date(s.latestItemTimestamp || 0).getTime();
      return ts >= todayMs;
    });

    // If we have enough stories from today, use those; otherwise use all sorted
    return todayStories.length >= 3 ? todayStories : sorted;
  }, [stories]);

  const heroStory = sortedStories[0] || null;
  const gridStories = sortedStories.slice(1, 10);
  const sidebarStories = sortedStories.slice(10, 18);

  return (
    <div className="min-h-screen bg-surface-primary animate-in fade-in duration-1000">
      {/* Header */}
      <section className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
          <h1 className="text-3xl md:text-4xl font-black text-content-primary tracking-tight mb-2">
            Daily Briefing
          </h1>
          <p className="text-sm text-content-secondary">
            {formatDate()} -- Today's most important crypto stories, sorted by recency and impact.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-8 pb-20">
        {isLoading ? (
          <div className="space-y-6">
            <div className="rounded-xl overflow-hidden animate-pulse">
              <div className="aspect-[21/9] bg-surface-card" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="rounded-xl border border-border bg-surface-card p-4 animate-pulse">
                  <div className="aspect-[16/9] bg-surface-card-hover rounded mb-3" />
                  <div className="h-4 bg-surface-card-hover rounded w-full mb-2" />
                  <div className="h-4 bg-surface-card-hover rounded w-3/4 mb-3" />
                  <div className="h-2 bg-surface-card-hover rounded w-full" />
                </div>
              ))}
            </div>
          </div>
        ) : sortedStories.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface-card p-16 text-center">
            <h3 className="text-lg font-black text-content-primary tracking-tight">No stories today</h3>
            <p className="text-sm text-content-secondary mt-2">
              Check back soon for today's briefing.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
            {/* Main content area */}
            <div>
              {/* Hero story */}
              {heroStory && (
                <div className="mb-8">
                  <HeroStoryCard
                    story={heroStory}
                    onClick={() => setLocation(`/stories/${heroStory.id}`)}
                  />
                </div>
              )}

              {/* Story grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {gridStories.map((story: any) => (
                  <StoryGridCard
                    key={story.id}
                    story={story}
                    onClick={() => setLocation(`/stories/${story.id}`)}
                  />
                ))}
              </div>
            </div>

            {/* Right sidebar */}
            <aside className="hidden lg:block">
              <div className="sticky top-24">
                <div className="bg-surface-card rounded-xl p-4 border border-border">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-content-muted mb-3">
                    More Stories
                  </h3>
                  {sidebarStories.length > 0 ? (
                    <div className="space-y-0">
                      {sidebarStories.map((story: any) => (
                        <SidebarStoryRow
                          key={story.id}
                          story={story}
                          onClick={() => setLocation(`/stories/${story.id}`)}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-content-muted">No additional stories available.</p>
                  )}
                </div>

                {/* Quick links */}
                <div className="bg-surface-card rounded-xl p-4 border border-border mt-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-content-muted mb-3">
                    Quick Links
                  </h3>
                  <div className="space-y-2">
                    {[
                      { label: "Blindspot Feed", path: "/blindspot" },
                      { label: "All Sources", path: "/sources" },
                      { label: "Leaderboard", path: "/leaderboard" },
                    ].map((link) => (
                      <button
                        key={link.path}
                        onClick={() => setLocation(link.path)}
                        className="block w-full text-left text-[12px] font-bold text-content-secondary hover:text-accent transition-colors py-1"
                      >
                        {link.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}
      </section>
    </div>
  );
}
