import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { fetchStory } from "../lib/api";

const getVerdictColor = (label: string) => {
  if (label === "verified") return "bg-cyan-500";
  if (label === "speculative") return "bg-orange-500";
  if (label === "misleading") return "bg-red-500";
  return "bg-slate-400";
};

const getVerdictText = (label: string) => {
  if (label === "verified") return "text-cyan-600";
  if (label === "speculative") return "text-orange-600";
  if (label === "misleading") return "text-red-600";
  return "text-slate-600";
};

export default function StoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();

  const { data: story, isLoading } = useQuery({
    queryKey: ["story", id],
    queryFn: () => fetchStory(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-6 md:px-12 relative z-10">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-slate-200 rounded-xl w-48" />
          <div className="h-64 bg-slate-100 rounded-[2rem]" />
        </div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-6 md:px-12 relative z-10 text-center">
        <h2 className="text-3xl font-black text-slate-900">Story not found</h2>
        <button onClick={() => setLocation("/")} className="mt-6 px-8 py-3 bg-slate-900 text-white rounded-xl font-bold">Back to Feed</button>
      </div>
    );
  }

  const claims = story.claims || [];
  const sources = story.sources || [];
  const verdictCounts = claims.reduce((acc: Record<string, number>, c: any) => {
    const v = c.verdict?.verdictLabel || "unreviewed";
    acc[v] = (acc[v] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="max-w-7xl mx-auto py-12 px-6 md:px-12 relative z-10 animate-in fade-in duration-700">
      <button
        onClick={() => setLocation("/")}
        className="flex items-center text-[10px] font-black tracking-[0.3em] text-slate-500 hover:text-cyan-500 mb-12 group transition-colors uppercase"
      >
        <svg className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
        </svg>
        Return to Feed
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        <div className="lg:col-span-8 space-y-10">
          {/* Story Header */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <span className="px-4 py-2 bg-cyan-600 text-white text-[10px] font-black tracking-widest uppercase rounded-xl">{story.category || "Analysis"}</span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{claims.length} claims &bull; {sources.length} sources</span>
            </div>
            <h1 className="text-5xl font-black leading-tight text-slate-900 tracking-tighter">{story.title}</h1>
            {story.summary && (
              <p className="text-2xl text-slate-600 leading-relaxed font-medium">{story.summary}</p>
            )}
          </div>

          {/* Story Hero Image */}
          {story.imageUrl && (
            <div className="relative rounded-[2rem] overflow-hidden aspect-[21/9] mb-10 shadow-2xl">
              <img src={story.imageUrl} alt={story.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
            </div>
          )}

          {/* Claims in this story */}
          <div className="space-y-6">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Source Coverage</h3>
            {claims.map((claim: any) => (
              <div
                key={claim.id}
                onClick={() => setLocation(`/claims/${claim.id}`)}
                className="glass rounded-[2rem] p-8 border border-slate-100 hover:shadow-xl transition-all cursor-pointer group bg-white/50"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-lg ${
                      claim.source?.logoUrl ? "bg-white p-1.5" :
                      (claim.source?.score?.trackRecord || 0) >= 70 ? "bg-cyan-500 text-white"
                      : (claim.source?.score?.trackRecord || 0) >= 50 ? "bg-slate-400 text-white" : "bg-orange-500 text-white"
                    }`}>
                      {claim.source?.logoUrl ? (
                        <img src={claim.source.logoUrl} alt={claim.source.displayName} className="w-full h-full object-contain rounded-lg" />
                      ) : (
                        <span className="text-white font-black text-sm">{claim.source?.logo || "?"}</span>
                      )}
                    </div>
                    <div>
                      <span className="text-sm font-bold text-slate-800">{claim.source?.displayName || "Source"}</span>
                      <div className="text-[10px] text-slate-400 font-bold">{claim.source?.handleOrDomain}</div>
                    </div>
                  </div>
                  {claim.verdict && (
                    <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${getVerdictText(claim.verdict.verdictLabel)}`}>
                      <div className={`w-2 h-2 rounded-full ${getVerdictColor(claim.verdict.verdictLabel)}`} />
                      <span>{claim.verdict.verdictLabel.replace("_", " ")}</span>
                    </div>
                  )}
                </div>
                <h4 className="text-lg font-black text-slate-900 group-hover:text-cyan-600 transition-colors tracking-tight mb-3">{claim.claimText}</h4>
                {claim.verdict && (
                  <p className="text-sm text-slate-500 line-clamp-2">{claim.verdict.reasoningSummary}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-10">
          <div className="glass rounded-[2.5rem] p-10 border-slate-100 sticky top-28 shadow-2xl bg-white/50">
            <h3 className="font-black text-xs tracking-[0.3em] text-slate-400 uppercase mb-8">Coverage Details</h3>

            <div className="space-y-6 mb-8">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Total Sources</span>
                <span className="text-2xl font-black text-slate-900">{sources.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Total Claims</span>
                <span className="text-2xl font-black text-slate-900">{claims.length}</span>
              </div>
            </div>

            <h4 className="font-black text-[10px] tracking-widest text-slate-400 uppercase mb-4">Verdict Distribution</h4>
            <div className="space-y-3">
              {Object.entries(verdictCounts).map(([verdict, count]) => (
                <div key={verdict} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getVerdictColor(verdict)}`} />
                    <span className="text-sm text-slate-600 capitalize">{verdict.replace("_", " ")}</span>
                  </div>
                  <span className="text-sm font-black text-slate-900">{count as number}</span>
                </div>
              ))}
            </div>

            {/* Veracity bar */}
            <div className="mt-8 pt-6 border-t border-slate-100">
              <div className="flex h-3 w-full rounded-full overflow-hidden bg-slate-100">
                {Object.entries(verdictCounts).map(([verdict, count]) => (
                  <div key={verdict} className={`h-full ${getVerdictColor(verdict)}`} style={{ width: `${((count as number) / claims.length) * 100}%` }} />
                ))}
              </div>
            </div>

            {/* Sources list */}
            <div className="mt-8 pt-6 border-t border-slate-100">
              <h4 className="font-black text-[10px] tracking-widest text-slate-400 uppercase mb-4">Informing Sources</h4>
              <div className="space-y-3">
                {sources.map((source: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black ${
                        source.logoUrl ? "bg-white p-1" : "bg-slate-400 text-white"
                      }`}>
                        {source.logoUrl ? (
                          <img src={source.logoUrl} alt={source.displayName} className="w-full h-full object-contain rounded" />
                        ) : (
                          <span className="text-white font-black text-xs">{source.logo || source.displayName?.charAt(0) || "?"}</span>
                        )}
                      </div>
                      <span className="text-sm font-bold text-slate-700">{source.displayName}</span>
                    </div>
                    {source.score && (
                      <span className="text-xs font-black text-slate-500">{Math.round(source.score.trackRecord)}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
