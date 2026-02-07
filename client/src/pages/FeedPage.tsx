import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { fetchClaims, fetchStories } from "../lib/api";
import { VeracityAnalysis } from "../components/VeracityAnalysis";
import { BlindspotWidget } from "../components/BlindspotWidget";

const SIDEBAR_TOPICS = [
  { id: "1", name: "Ethereum ETF", trend: "up" as const },
  { id: "2", name: "SEC v. Ripple", trend: "neutral" as const },
  { id: "3", name: "Layer 2 Season", trend: "up" as const },
  { id: "4", name: "GameFi Revival", trend: "down" as const },
  { id: "5", name: "Stablecoin Bills", trend: "up" as const },
];

const getVerdictColor = (label: string) => {
  if (label === "verified") return "bg-cyan-500";
  if (label === "speculative") return "bg-orange-500";
  if (label === "misleading") return "bg-red-500";
  return "bg-slate-400";
};

export default function FeedPage() {
  const [, setLocation] = useLocation();
  const [feedFilter, setFeedFilter] = useState<"latest" | "trusted" | "original">("latest");

  const { data: claims = [], isLoading } = useQuery({
    queryKey: ["claims", "feed"],
    queryFn: () => fetchClaims({ sort: "newest", limit: 20 }),
  });

  const { data: stories = [] } = useQuery({
    queryKey: ["stories"],
    queryFn: fetchStories,
  });

  const filteredClaims = useMemo(() => {
    if (feedFilter === "trusted") {
      return claims.filter((c: any) => c.verdict?.verdictLabel === "verified" || c.verdict?.verdictLabel === "plausible_unverified");
    }
    return claims;
  }, [claims, feedFilter]);

  const speculativeClaims = useMemo(() => {
    return claims.filter((c: any) => c.verdict?.verdictLabel === "speculative" || c.verdict?.verdictLabel === "misleading");
  }, [claims]);

  const blindspotClaim = speculativeClaims[0];

  // Build a story-like object for the blindspot widget
  const blindspotStory = blindspotClaim ? {
    id: blindspotClaim.id,
    title: blindspotClaim.claimText,
    summary: blindspotClaim.verdict?.reasoningSummary || "This claim has high speculative content and needs verification.",
    imageUrl: "https://images.unsplash.com/photo-1523475496153-3d6cc0f0bf19?auto=format&fit=crop&q=80&w=800",
    sources: [],
    timeLabel: "Recent",
    category: "Alert",
    veracity: { verified: 5, balanced: 15, speculative: 80 },
    isBlindspot: true,
  } : null;

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-16 w-full animate-in fade-in duration-1000 relative z-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        <div className="lg:col-span-8 space-y-20">
          <section>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-8">
              <div className="flex flex-col">
                <span className="text-[10px] font-black tracking-[0.5em] text-cyan-600 uppercase mb-3">Verified Stream</span>
                <h2 className="text-5xl font-black tracking-tighter text-slate-900 uppercase">Intelligence Feed</h2>
              </div>
              <div className="flex space-x-1 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-sm">
                {(["latest", "trusted", "original"] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setFeedFilter(filter)}
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      feedFilter === filter
                        ? filter === "original" ? "bg-cyan-600 text-white shadow-lg" : "bg-white text-slate-900 shadow-lg"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    {filter === "original" ? "Confirmd Original" : filter}
                  </button>
                ))}
              </div>
            </div>

            {feedFilter === "original" ? (
              <div className="glass rounded-[3rem] p-20 text-center border-dashed border-2 border-slate-200 bg-white/50">
                <div className="w-20 h-20 bg-cyan-100 rounded-3xl flex items-center justify-center text-cyan-600 mx-auto mb-8 shadow-xl">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">Access Confirmd Original</h3>
                <p className="text-slate-500 mt-4 max-w-md mx-auto font-medium">Synthesized, noise-free original reports. Unlock the full data synthesis for members.</p>
                <button onClick={() => setLocation("/plus")} className="mt-10 px-10 py-4 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-2xl hover:bg-cyan-600 transition-all">Start Membership</button>
              </div>
            ) : isLoading ? (
              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="glass rounded-[2rem] p-8 animate-pulse bg-white/50">
                    <div className="h-6 bg-slate-200 rounded-xl w-3/4 mb-4" />
                    <div className="h-4 bg-slate-100 rounded-lg w-full mb-2" />
                    <div className="h-4 bg-slate-100 rounded-lg w-2/3" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                {/* Featured claim */}
                {filteredClaims[0] && (
                  <div
                    onClick={() => setLocation(`/claims/${filteredClaims[0].id}`)}
                    className="group cursor-pointer glass p-8 rounded-[2.5rem] transition-all duration-500 hover:-translate-y-2 border border-slate-100 hover:shadow-[0_10px_50px_rgba(0,0,0,0.05)] bg-white"
                  >
                    <div className="relative rounded-[2rem] overflow-hidden mb-8 aspect-[21/9] shadow-2xl bg-gradient-to-br from-slate-900 to-cyan-900 flex items-center justify-center">
                      {stories[0]?.imageUrl ? (
                        <img src={stories[0].imageUrl} alt={stories[0].title || "Story"} className="w-full h-full object-cover absolute inset-0" />
                      ) : (
                        <span className="text-6xl font-black text-white/10 uppercase tracking-tighter">{filteredClaims[0].assetSymbols?.[0] || "CRYPTO"}</span>
                      )}
                      <div className="absolute top-6 left-6">
                        <span className="bg-cyan-600 text-white text-[10px] font-black px-4 py-2 rounded-xl uppercase tracking-widest shadow-xl">Latest Signal</span>
                      </div>
                      {stories[0]?.imageUrl && (
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                      )}
                    </div>
                    <div className="space-y-6">
                      <div className="flex items-center space-x-3 text-[10px] font-black tracking-[0.3em] text-cyan-600 uppercase">
                        <span>{filteredClaims[0].claimType?.replace(/_/g, " ") || "Claim"}</span>
                        <span className="text-slate-300">&bull;</span>
                        <span>{filteredClaims[0].source?.displayName || "Source"}</span>
                      </div>
                      <h2 className="text-4xl md:text-5xl font-black leading-tight text-slate-900 group-hover:text-cyan-600 transition-colors tracking-tighter">
                        {filteredClaims[0].claimText}
                      </h2>
                      {filteredClaims[0].verdict && (
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${getVerdictColor(filteredClaims[0].verdict.verdictLabel)}`} />
                          <span className="text-sm font-bold text-slate-600 uppercase">{filteredClaims[0].verdict.verdictLabel.replace("_", " ")}</span>
                          <span className="text-sm text-slate-400">|</span>
                          <span className="text-sm text-slate-500">{Math.round(filteredClaims[0].verdict.probabilityTrue * 100)}% probability</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Rest of claims */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-20">
                  {filteredClaims.slice(1).map((claim: any) => (
                    <div
                      key={claim.id}
                      onClick={() => setLocation(`/claims/${claim.id}`)}
                      className="glass p-6 rounded-[2rem] bg-white transition-all duration-500 hover:shadow-[0_10px_40px_rgba(0,0,0,0.04)] cursor-pointer group hover:-translate-y-2 border border-slate-100"
                    >
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-cyan-600 uppercase tracking-[0.3em]">{claim.claimType?.replace(/_/g, " ")}</span>
                          {claim.verdict && (
                            <div className={`w-2 h-2 rounded-full ${getVerdictColor(claim.verdict.verdictLabel)}`} />
                          )}
                        </div>
                        <h3 className="font-black text-xl leading-tight text-slate-900 group-hover:text-cyan-600 transition-colors tracking-tight line-clamp-3">
                          {claim.claimText}
                        </h3>
                        <div className="flex items-center text-[10px] font-bold text-slate-400 space-x-3">
                          <span>{claim.source?.displayName || "Source"}</span>
                          <span className="text-slate-300">&bull;</span>
                          <span>{claim.evidenceCount || 0} evidence</span>
                        </div>
                        {claim.verdict && (
                          <div className="pt-4 border-t border-slate-100">
                            <div className="flex h-2 w-full rounded-full overflow-hidden bg-slate-100">
                              <div className={`h-full ${getVerdictColor(claim.verdict.verdictLabel)} rounded-full`} style={{ width: `${claim.verdict.probabilityTrue * 100}%` }} />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>

          {/* Anomaly Scanner */}
          {speculativeClaims.length > 0 && (
            <section className="glass rounded-[3rem] p-12 relative overflow-hidden group bg-white/50 border-slate-100">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-transparent to-orange-500" />
              <div className="flex items-center justify-between mb-12">
                <h3 className="text-3xl font-black tracking-tighter uppercase text-slate-900">Anomaly Scanner</h3>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-cyan-500 rounded-full animate-ping" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Network Pulse</span>
                </div>
              </div>
              <div className="space-y-8">
                {speculativeClaims.slice(0, 3).map((claim: any) => (
                  <div
                    key={claim.id}
                    onClick={() => setLocation(`/claims/${claim.id}`)}
                    className="glass-light hover:bg-slate-50 p-8 rounded-[2rem] flex items-center justify-between hover:shadow-2xl transition-all duration-500 cursor-pointer border border-transparent hover:border-orange-500/20 group/item"
                  >
                    <div className="flex-1">
                      <span className="text-[10px] font-black text-orange-600 tracking-widest uppercase mb-2 block">High Noise Amplitude</span>
                      <h4 className="font-black text-xl text-slate-800 group-hover/item:text-cyan-600 transition-colors tracking-tight">{claim.claimText}</h4>
                    </div>
                    <div className="ml-8 w-20 h-20 rounded-2xl bg-white flex flex-col items-center justify-center border border-orange-100 shadow-xl">
                      <span className="text-2xl font-black text-orange-600">{Math.round((1 - (claim.verdict?.probabilityTrue || 0.5)) * 100)}%</span>
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">NOISE</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-16">
          {blindspotStory && <BlindspotWidget story={blindspotStory as any} />}

          <section className="glass rounded-[2.5rem] p-10 shadow-xl border border-slate-100 bg-white/50">
            <div className="flex items-center justify-between mb-10">
              <h3 className="font-black text-xs tracking-[0.3em] text-slate-400 uppercase">Protocol Status</h3>
              <div className="px-3 py-1 bg-cyan-500/10 text-cyan-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-cyan-500/20">Active</div>
            </div>
            <div className="space-y-10">
              {SIDEBAR_TOPICS.map((topic) => (
                <div key={topic.id} className="flex items-center justify-between group cursor-pointer">
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-5 ${topic.trend === "up" ? "bg-cyan-500 shadow-[0_0_8px_cyan]" : topic.trend === "down" ? "bg-orange-500" : "bg-slate-400"}`} />
                    <span className="text-sm font-black text-slate-700 group-hover:text-cyan-600 transition-colors uppercase tracking-tight">{topic.name}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] font-black text-slate-400 tracking-[0.2em] uppercase leading-none mb-1">Index</span>
                    <span className="text-xs font-black text-slate-900">82.4</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <VeracityAnalysis />
        </div>
      </div>
    </div>
  );
}
