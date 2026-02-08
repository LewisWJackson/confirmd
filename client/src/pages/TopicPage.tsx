import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { fetchStories, fetchSources } from "../lib/api";
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

export default function TopicPage() {
  const { slug } = useParams<{ slug: string }>();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"all" | "blindspots" | "timelines">("all");
  const topicName = (slug || "").charAt(0).toUpperCase() + (slug || "").slice(1);

  // Try fetching by category first, then fall back to filtering
  const { data: stories = [], isLoading } = useQuery({
    queryKey: ["stories"],
    queryFn: () => fetchStories(),
  });

  const { data: sources = [] } = useQuery({
    queryKey: ["sources"],
    queryFn: () => fetchSources(),
  });

  // Filter stories relevant to this topic (by category or asset symbol)
  const topicStories = useMemo(() => {
    const q = (slug || "").toLowerCase();
    return stories.filter((s: any) => {
      const category = (s.category || "").toLowerCase();
      const symbols = (s.assetSymbols || []).map((sym: string) => sym.toLowerCase());
      const title = (s.title || "").toLowerCase();
      return category === q || symbols.includes(q) || title.includes(q);
    });
  }, [stories, slug]);

  // Blindspot stories within this topic
  const blindspotStories = useMemo(() => {
    return topicStories.filter((s: any) => {
      const dist = s.credibilityDistribution || { high: 0, medium: 0, low: 0 };
      return dist.high === 0;
    });
  }, [topicStories]);

  // Top sources covering this topic
  const topSources = useMemo(() => {
    const sourceCounts: Record<string, { source: any; count: number }> = {};
    topicStories.forEach((s: any) => {
      (s.topSources || []).forEach((src: any) => {
        if (src.id) {
          if (!sourceCounts[src.id]) {
            sourceCounts[src.id] = { source: src, count: 0 };
          }
          sourceCounts[src.id].count++;
        }
      });
    });
    return Object.values(sourceCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [topicStories]);

  // Related topics
  const relatedTopics = useMemo(() => {
    const counts: Record<string, number> = {};
    const q = (slug || "").toLowerCase();
    topicStories.forEach((s: any) => {
      (s.assetSymbols || []).forEach((sym: string) => {
        if (sym.toLowerCase() !== q) {
          counts[sym] = (counts[sym] || 0) + 1;
        }
      });
      if (s.category && s.category.toLowerCase() !== q) {
        counts[s.category] = (counts[s.category] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [topicStories, slug]);

  const displayStories = activeTab === "blindspots" ? blindspotStories : topicStories;

  return (
    <div className="min-h-screen bg-surface-primary animate-in fade-in duration-700">
      {/* Hero */}
      <section className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 items-start">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-content-primary tracking-tight">
                  News about {topicName}
                </h1>
              </div>
              <p className="text-content-secondary leading-relaxed max-w-2xl">
                Stay up to date on all the latest news about <strong className="text-content-primary">{topicName}</strong>.
                Compare source factuality ratings and coverage across the spectrum.
              </p>
              <div className="mt-4 text-[11px] text-content-muted">
                <span className="font-bold">{topicStories.length}</span> stories found
              </div>
            </div>

            {/* Covered Most By sidebar */}
            {topSources.length > 0 && (
              <div className="bg-surface-card rounded-xl p-4 border border-border">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-content-muted mb-3">
                  Covered Most By
                </h3>
                <div className="space-y-2">
                  {topSources.map(({ source, count }) => (
                    <div
                      key={source.id}
                      onClick={() => setLocation(`/sources/${source.id}`)}
                      className="flex items-center gap-2.5 cursor-pointer hover:bg-surface-card-hover rounded px-1 py-1.5 -mx-1 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-lg bg-surface-card-hover flex items-center justify-center overflow-hidden flex-shrink-0 border border-border">
                        {source.logoUrl ? (
                          <img src={source.logoUrl} alt={source.displayName} className="w-full h-full object-cover rounded-lg" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        ) : (
                          <span className="text-[9px] font-black text-content-muted">{(source.displayName || "?").charAt(0)}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[11px] font-bold text-content-primary truncate block">
                          {source.displayName || "Unknown"}
                        </span>
                      </div>
                      <span className="text-[9px] font-bold text-content-muted">{count} articles</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Tab bar */}
      <section className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-center gap-1">
            {[
              { key: "all" as const, label: "All Articles" },
              { key: "blindspots" as const, label: "Blindspots" },
              { key: "timelines" as const, label: "Timelines" },
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
        </div>
      </section>

      {/* Content */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-8 pb-12">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-4 py-4 animate-pulse">
                <div className="w-28 h-20 bg-surface-card rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-surface-card rounded w-full" />
                  <div className="h-4 bg-surface-card rounded w-3/4" />
                  <div className="h-2 bg-surface-card rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : displayStories.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface-card p-12 text-center">
            <h3 className="text-lg font-black text-content-primary tracking-tight mb-2">
              {activeTab === "blindspots"
                ? "No blindspots found"
                : `No stories about ${topicName}`}
            </h3>
            <p className="text-sm text-content-secondary">
              {activeTab === "blindspots"
                ? `All ${topicName} stories have high-factuality source coverage.`
                : "Try a different topic or check back later."}
            </p>
          </div>
        ) : (
          <div className="space-y-0">
            {displayStories.map((story: any) => {
              const dist = story.credibilityDistribution || { high: 0, medium: 0, low: 0 };

              return (
                <div
                  key={story.id}
                  onClick={() => setLocation(`/stories/${story.id}`)}
                  className="group cursor-pointer flex items-start gap-4 py-4 border-b border-border last:border-b-0 hover:bg-surface-card-hover transition-colors px-3 rounded-lg -mx-3"
                >
                  {/* Thumbnail */}
                  {story.imageUrl && (
                    <div className="w-32 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-surface-card">
                      <img
                        src={story.imageUrl}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] font-bold text-content-primary leading-snug mb-2 group-hover:text-accent transition-colors line-clamp-2">
                      {story.title}
                    </h3>
                    <div className="max-w-sm mb-2">
                      <FactualityBar distribution={dist} size="sm" />
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-content-muted">
                      <span className="font-bold">{story.sourceCount || 0} sources</span>
                      {story.category && (
                        <span className="px-1.5 py-0.5 bg-accent/10 text-accent rounded text-[9px] font-bold uppercase tracking-wider">
                          {story.category}
                        </span>
                      )}
                      {story.latestItemTimestamp && (
                        <span>{timeAgo(story.latestItemTimestamp)}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Breaking News Topics Related to [Topic] */}
      {relatedTopics.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 md:px-8 py-8 pb-20 border-t border-border">
          <h2 className="text-lg font-black text-content-primary tracking-tight mb-6">
            Breaking News Topics Related to {topicName}
          </h2>
          <div className="flex flex-wrap gap-3">
            {relatedTopics.map(([topic, count]) => (
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
      )}
    </div>
  );
}
