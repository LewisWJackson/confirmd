import React, { useState, useMemo } from "react";
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

export default function SearchPage() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: stories = [], isLoading } = useQuery({
    queryKey: ["stories"],
    queryFn: () => fetchStories(),
  });

  // Filter stories by search query (client-side title/category match)
  const filteredStories = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return stories.filter((s: any) => {
      const title = (s.title || "").toLowerCase();
      const category = (s.category || "").toLowerCase();
      const symbols = (s.assetSymbols || []).join(" ").toLowerCase();
      return title.includes(q) || category.includes(q) || symbols.includes(q);
    });
  }, [stories, searchQuery]);

  const hasSearched = searchQuery.trim().length > 0;

  return (
    <div className="min-h-screen bg-surface-primary animate-in fade-in duration-700">
      {/* Search header */}
      <section className="border-b border-border">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-10">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-content-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter an article's title, URL, or topic to see..."
              className="w-full pl-12 pr-4 py-4 bg-surface-card border border-border rounded-xl text-content-primary text-base placeholder:text-content-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-content-muted hover:text-content-primary transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="max-w-4xl mx-auto px-4 md:px-8 py-8 pb-20">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4 py-4 animate-pulse">
                <div className="w-24 h-24 bg-surface-card rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-surface-card rounded w-full" />
                  <div className="h-4 bg-surface-card rounded w-3/4" />
                  <div className="h-2 bg-surface-card rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : hasSearched ? (
          <>
            {/* Result count */}
            <div className="mb-6">
              <p className="text-sm font-bold text-content-primary">
                {filteredStories.length} {filteredStories.length === 1 ? "story" : "stories"}
              </p>
              <p className="text-[11px] text-content-muted">
                {filteredStories.length} articles - {filteredStories.length > 0 ? "I've read" : "No results"}
              </p>
            </div>

            {filteredStories.length === 0 ? (
              <div className="rounded-xl border border-border bg-surface-card p-12 text-center">
                <svg className="w-12 h-12 text-content-muted mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h3 className="text-lg font-black text-content-primary tracking-tight mb-2">No stories found</h3>
                <p className="text-sm text-content-secondary">Try a different search term or browse our categories.</p>
              </div>
            ) : (
              <div className="space-y-0">
                {filteredStories.map((story: any) => {
                  const dist = story.credibilityDistribution || { high: 0, medium: 0, low: 0 };

                  return (
                    <div
                      key={story.id}
                      onClick={() => setLocation(`/stories/${story.id}`)}
                      className="group cursor-pointer flex items-start gap-4 py-4 border-b border-border last:border-b-0 hover:bg-surface-card-hover transition-colors px-3 rounded-lg -mx-3"
                    >
                      {/* Thumbnail */}
                      {story.imageUrl && (
                        <div className="w-28 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-surface-card">
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
          </>
        ) : (
          /* Default state: show suggestions */
          <div className="text-center py-16">
            <svg className="w-16 h-16 text-content-muted mx-auto mb-6 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="text-lg font-black text-content-primary tracking-tight mb-2">Search stories</h3>
            <p className="text-sm text-content-secondary max-w-md mx-auto">
              Enter an article title, topic, or asset symbol to find related stories and their factuality ratings.
            </p>

            {/* Quick search suggestions */}
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {["Bitcoin", "DeFi", "Regulation", "Security", "Markets"].map((term) => (
                <button
                  key={term}
                  onClick={() => setSearchQuery(term)}
                  className="px-4 py-2 bg-surface-card text-content-secondary rounded-lg text-[12px] font-bold border border-border hover:bg-accent hover:text-accent-text hover:border-accent transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
