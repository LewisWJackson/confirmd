import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { fetchStories } from "../lib/api";

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

function CredibilityBar({ distribution }: { distribution: { high: number; medium: number; low: number } }) {
  const total = distribution.high + distribution.medium + distribution.low;
  if (total === 0) return null;
  const highPct = (distribution.high / total) * 100;
  const medPct = (distribution.medium / total) * 100;
  const lowPct = (distribution.low / total) * 100;

  return (
    <div className="w-full h-2 rounded-full overflow-hidden flex bg-slate-100">
      {highPct > 0 && <div className="bg-emerald-500 h-full" style={{ width: `${highPct}%` }} />}
      {medPct > 0 && <div className="bg-amber-400 h-full" style={{ width: `${medPct}%` }} />}
      {lowPct > 0 && <div className="bg-red-500 h-full" style={{ width: `${lowPct}%` }} />}
    </div>
  );
}

const BlindspotPage: React.FC = () => {
  const [, setLocation] = useLocation();

  const { data: stories = [], isLoading } = useQuery({
    queryKey: ["stories"],
    queryFn: () => fetchStories(),
  });

  // Filter for blindspot stories: no high-credibility sources
  const blindspotStories = useMemo(() => {
    return stories.filter((s: any) => {
      const dist = s.credibilityDistribution || { high: 0, medium: 0, low: 0 };
      return dist.high === 0;
    });
  }, [stories]);

  // Blindspot score: percentage of total stories that lack high-credibility coverage
  const blindspotScore = stories.length > 0
    ? Math.round((blindspotStories.length / stories.length) * 100)
    : 0;

  return (
    <div className="relative z-10 animate-in fade-in duration-1000">
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 pt-20 pb-12">
        <div className="max-w-4xl">
          <div className="inline-block px-5 py-2 bg-orange-50 border border-orange-100 rounded-full mb-8">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-600">
              Credibility Gap Detector
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter uppercase leading-[0.9] mb-6">
            BLINDSP
            <span className="inline-block w-[0.65em] h-[0.65em] bg-orange-500 rounded-full relative -top-[0.05em] mx-[0.02em] shadow-[0_0_20px_rgba(249,115,22,0.4)]" />
            T
          </h1>
          <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-2xl">
            Stories only covered by low-credibility sources. These narratives have no
            high-credibility source backing -- approach with extra scrutiny and look
            for independent verification before sharing.
          </p>
        </div>
      </section>

      {/* Blindspot Score */}
      {!isLoading && stories.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 md:px-12 pb-12">
          <div className="rounded-2xl p-8 md:p-10 border border-orange-100 bg-white shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <div className="text-[10px] font-black text-orange-600 uppercase tracking-[0.3em] mb-2">
                  Blindspot Score
                </div>
                <div className="flex items-baseline space-x-3">
                  <span className="text-5xl font-black text-slate-900 tracking-tighter">
                    {blindspotScore}%
                  </span>
                </div>
                <p className="text-sm text-slate-500 font-medium mt-2">
                  {blindspotStories.length} of {stories.length} stories lack high-credibility coverage.{" "}
                  {blindspotScore > 50
                    ? "High blindspot ratio -- many stories need better sourcing."
                    : blindspotScore > 20
                    ? "Moderate blindspot levels in the ecosystem."
                    : "Most stories have credible source coverage."}
                </p>
              </div>
              <div className="w-full md:w-64">
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${blindspotScore}%`,
                      background: "linear-gradient(90deg, #f59e0b, #ef4444)",
                    }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  <span>Low</span>
                  <span>High</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Blindspot Stories */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 pb-32">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-2xl border border-slate-200 bg-white p-6 animate-pulse">
                <div className="h-5 bg-slate-200 rounded-lg w-20 mb-4" />
                <div className="h-6 bg-slate-200 rounded-lg w-full mb-2" />
                <div className="h-6 bg-slate-200 rounded-lg w-3/4 mb-4" />
                <div className="h-2 bg-slate-100 rounded-full w-full mb-4" />
                <div className="flex gap-2">
                  <div className="w-7 h-7 bg-slate-200 rounded-full" />
                  <div className="w-7 h-7 bg-slate-200 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : blindspotStories.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">No blindspots detected</h3>
            <p className="text-sm font-medium text-slate-500 mt-2">
              All current stories have at least one high-credibility source covering them. The signal is clear.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {blindspotStories.map((story: any) => {
              const dist = story.credibilityDistribution || { high: 0, medium: 0, low: 0 };
              const topSources = story.topSources || [];

              return (
                <div
                  key={story.id}
                  onClick={() => setLocation(`/stories/${story.id}`)}
                  className="group cursor-pointer rounded-2xl border border-orange-100 bg-white p-6 hover:shadow-[0_6px_30px_rgba(249,115,22,0.08)] transition-all duration-500 hover:-translate-y-1"
                >
                  {/* Warning badge */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[9px] font-black tracking-[0.2em] uppercase px-2.5 py-1 rounded-lg bg-orange-50 text-orange-600 border border-orange-100">
                      No high-credibility sources
                    </span>
                    <span className="text-[10px] font-medium text-slate-400">
                      {story.latestItemTimestamp ? timeAgo(story.latestItemTimestamp) : ""}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-black text-slate-900 tracking-tight leading-snug mb-4 group-hover:text-orange-600 transition-colors line-clamp-3">
                    {story.title}
                  </h3>

                  {/* Source count */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-[10px] font-bold text-slate-500">
                      {story.sourceCount || 0} sources
                    </span>
                    {story.category && (
                      <>
                        <span className="text-slate-300">|</span>
                        <span className="text-[10px] font-bold text-slate-500">{story.category}</span>
                      </>
                    )}
                  </div>

                  {/* Credibility bar */}
                  <div className="mb-4">
                    <CredibilityBar distribution={dist} />
                    <div className="flex items-center gap-3 mt-1.5 text-[9px] font-bold text-slate-400">
                      {dist.medium > 0 && <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" />Med {dist.medium}</span>}
                      {dist.low > 0 && <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500" />Low {dist.low}</span>}
                    </div>
                  </div>

                  {/* Source logos + assets */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div className="flex items-center -space-x-2">
                      {topSources.slice(0, 3).map((s: any, i: number) => (
                        <div
                          key={s.id || i}
                          className="w-7 h-7 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center overflow-hidden shadow-sm"
                          style={{ zIndex: 3 - i }}
                        >
                          {s.logoUrl ? (
                            <img src={s.logoUrl} alt={s.displayName} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[9px] font-black text-slate-500">{s.displayName?.charAt(0) || "?"}</span>
                          )}
                        </div>
                      ))}
                    </div>
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
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default BlindspotPage;
