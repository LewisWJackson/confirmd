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

/* --- Story Card ----------------------------------------------- */

function StoryCard({ story, onClick }: { story: any; onClick: () => void }) {
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
          <div className="absolute top-2 left-2">
            <span className="text-[9px] font-bold px-2 py-1 rounded bg-black/60 text-white backdrop-blur-sm">
              {story.sourceCount || 0} sources
            </span>
          </div>
        </div>
      )}
      <div className="p-4">
        <h3 className="text-sm font-bold text-content-primary leading-snug mb-3 group-hover:text-accent transition-colors line-clamp-3">
          {story.title}
        </h3>
        <FactualityBar distribution={dist} size="sm" showLabels={false} />
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[9px] text-content-muted font-medium">
            {story.sourceCount || 0} sources
          </span>
          {story.category && (
            <>
              <span className="text-content-muted">|</span>
              <span className="text-[9px] text-content-muted font-medium">{story.category}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* --- Main BlindspotPage --------------------------------------- */

const BlindspotPage: React.FC = () => {
  const [, setLocation] = useLocation();

  const { data: stories = [], isLoading } = useQuery({
    queryKey: ["stories"],
    queryFn: () => fetchStories(),
  });

  // High factuality stories: predominantly high-credibility sources
  const highFactualityStories = useMemo(() => {
    return stories.filter((s: any) => {
      const dist = s.credibilityDistribution || { high: 0, medium: 0, low: 0 };
      const total = dist.high + dist.medium + dist.low;
      if (total === 0) return false;
      return dist.high / total > 0.5;
    });
  }, [stories]);

  // Low factuality stories: predominantly low-credibility sources
  const lowFactualityStories = useMemo(() => {
    return stories.filter((s: any) => {
      const dist = s.credibilityDistribution || { high: 0, medium: 0, low: 0 };
      const total = dist.high + dist.medium + dist.low;
      if (total === 0) return false;
      return dist.low / total > 0.4;
    });
  }, [stories]);

  // Trending topics from assets
  const trendingTopics = useMemo(() => {
    const counts: Record<string, number> = {};
    stories.forEach((s: any) => {
      (s.assetSymbols || []).forEach((sym: string) => {
        counts[sym] = (counts[sym] || 0) + 1;
      });
      if (s.category) {
        counts[s.category] = (counts[s.category] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12);
  }, [stories]);

  return (
    <div className="min-h-screen bg-surface-primary animate-in fade-in duration-1000">
      {/* Promo banner */}
      <div className="bg-accent text-accent-text text-center py-2 px-4">
        <span className="text-[12px] font-bold">
          See every side of every crypto story.{" "}
          <button onClick={() => setLocation("/plus")} className="underline font-black hover:opacity-80 transition-opacity">
            Get Started
          </button>
        </span>
      </div>

      {/* Hero section */}
      <section className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-16">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9.27-3.11-11-7.5a11.72 11.72 0 013.168-4.477M6.343 6.343A9.97 9.97 0 0112 5c5 0 9.27 3.11 11 7.5a11.7 11.7 0 01-4.373 5.157M6.343 6.343L17.657 17.657M6.343 6.343l11.314 11.314" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M1 1l22 22" />
              </svg>
              <h1 className="text-4xl md:text-5xl font-black text-content-primary tracking-tight">
                Blindspot
              </h1>
            </div>
            <p className="text-lg text-content-secondary leading-relaxed mb-6">
              Similar stories reported differently. Stories covered only by one end of the
              factuality spectrum may represent credibility blindspots. Compare how high
              and low factuality sources cover the same topics.
            </p>
            <button
              onClick={() => setLocation("/plus")}
              className="px-5 py-2.5 bg-accent text-accent-text rounded-lg text-[11px] font-black uppercase tracking-widest hover:bg-accent-hover transition-colors"
            >
              Sign up for the Blindspot Report
            </button>
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        <div className="rounded-xl bg-surface-card border border-border p-5 flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-content-primary">Sign up for the Blindspot Report newsletter</p>
              <p className="text-[11px] text-content-muted">Get daily blindspot analysis delivered to your inbox.</p>
            </div>
          </div>
          <button
            onClick={() => setLocation("/plus")}
            className="px-5 py-2.5 bg-accent text-accent-text rounded-lg text-[11px] font-black uppercase tracking-widest hover:bg-accent-hover transition-colors whitespace-nowrap"
          >
            Subscribe
          </button>
        </div>
      </section>

      {/* Two-column: High vs Low Factuality */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[0, 1].map((col) => (
              <div key={col} className="space-y-4">
                <div className="h-6 bg-surface-card rounded w-40 animate-pulse" />
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-xl border border-border bg-surface-card p-4 animate-pulse">
                    <div className="aspect-[16/9] bg-surface-card-hover rounded mb-3" />
                    <div className="h-4 bg-surface-card-hover rounded w-full mb-2" />
                    <div className="h-4 bg-surface-card-hover rounded w-3/4 mb-3" />
                    <div className="h-2 bg-surface-card-hover rounded w-full" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* High Factuality Column */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <span className="w-3 h-3 rounded-full bg-factuality-high" />
                <h2 className="text-lg font-black text-content-primary tracking-tight">High Factuality</h2>
              </div>
              <p className="text-[11px] text-content-muted mb-4">
                Stories predominantly covered by high-factuality sources.
              </p>
              {highFactualityStories.length === 0 ? (
                <div className="rounded-xl border border-border bg-surface-card p-8 text-center">
                  <p className="text-sm text-content-muted">No stories currently dominated by high-factuality sources.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {highFactualityStories.slice(0, 6).map((story: any) => (
                    <StoryCard
                      key={story.id}
                      story={story}
                      onClick={() => setLocation(`/stories/${story.id}`)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Low Factuality Column */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <span className="w-3 h-3 rounded-full bg-factuality-low" />
                <h2 className="text-lg font-black text-content-primary tracking-tight">Low Factuality</h2>
              </div>
              <p className="text-[11px] text-content-muted mb-4">
                Stories predominantly covered by low-factuality sources.
              </p>
              {lowFactualityStories.length === 0 ? (
                <div className="rounded-xl border border-border bg-surface-card p-8 text-center">
                  <p className="text-sm text-content-muted">No stories currently dominated by low-factuality sources.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {lowFactualityStories.slice(0, 6).map((story: any) => (
                    <StoryCard
                      key={story.id}
                      story={story}
                      onClick={() => setLocation(`/stories/${story.id}`)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Upgrade CTA */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        <div className="rounded-xl bg-surface-card border border-accent/30 p-6 text-center">
          <p className="text-sm text-content-secondary mb-3">
            You have reached your limit of free news Blindspots. Subscribe to unlock access to the Blindspot feed and much more.
          </p>
          <button
            onClick={() => setLocation("/plus")}
            className="px-6 py-3 bg-accent text-accent-text rounded-lg text-[11px] font-black uppercase tracking-widest hover:bg-accent-hover transition-colors"
          >
            Subscribe Now
          </button>
        </div>
      </section>

      {/* Trending Topics */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-12 pb-20">
        <h2 className="text-lg font-black text-content-primary tracking-tight mb-6">Trending Topics</h2>
        <div className="flex flex-wrap gap-3">
          {trendingTopics.map(([topic, count]) => (
            <button
              key={topic}
              onClick={() => setLocation(`/topic/${topic.toLowerCase()}`)}
              className="px-4 py-2 bg-surface-card text-content-primary rounded-lg text-[12px] font-bold border border-border hover:bg-accent hover:text-accent-text hover:border-accent transition-colors"
            >
              {topic}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

export default BlindspotPage;
