import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { fetchSources } from "../lib/api";

type SortField = "trackRecord" | "methodDiscipline" | "sampleSize";

export default function SourcesPage() {
  const [, setLocation] = useLocation();
  const [sortBy, setSortBy] = useState<SortField>("trackRecord");
  const [search, setSearch] = useState("");

  const { data: sources = [], isLoading } = useQuery({
    queryKey: ["sources"],
    queryFn: fetchSources,
  });

  const filtered = useMemo(() => {
    let result = sources;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((s: any) =>
        s.displayName?.toLowerCase().includes(q) || s.handleOrDomain?.toLowerCase().includes(q)
      );
    }
    return result.sort((a: any, b: any) => {
      const aVal = a.score?.[sortBy] || 0;
      const bVal = b.score?.[sortBy] || 0;
      return bVal - aVal;
    });
  }, [sources, search, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-16 w-full animate-in fade-in duration-1000 relative z-10">
      <div className="flex flex-col mb-12">
        <span className="text-[10px] font-black tracking-[0.5em] text-cyan-600 uppercase mb-3">Source Intelligence</span>
        <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-slate-900 uppercase">Credibility Directory</h2>
        <p className="text-slate-500 mt-4 max-w-2xl font-medium">
          Source scores derived from historical claim accuracy using Bayesian shrinkage methodology. Track record represents verified claim ratio; method discipline measures evidence quality standards.
        </p>
      </div>

      {/* Search & Sort */}
      <div className="flex flex-col md:flex-row gap-4 mb-10">
        <input
          type="text"
          placeholder="Search sources..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm font-medium focus:ring-1 focus:ring-cyan-500/50 outline-none flex-1 text-slate-900 placeholder:text-slate-400"
        />
        <div className="flex space-x-1 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          {([
            { key: "trackRecord", label: "Track Record" },
            { key: "methodDiscipline", label: "Method Score" },
            { key: "sampleSize", label: "Volume" },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                sortBy === key ? "bg-white text-slate-900 shadow-lg" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="glass rounded-[2rem] p-8 animate-pulse bg-white/50">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-14 h-14 bg-slate-200 rounded-2xl" />
                <div className="flex-1"><div className="h-5 bg-slate-200 rounded-lg w-2/3" /></div>
              </div>
              <div className="h-8 bg-slate-200 rounded-xl w-1/3 mb-4" />
              <div className="h-2 bg-slate-100 rounded-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((source: any) => {
            const score = source.score || { trackRecord: 50, methodDiscipline: 50, sampleSize: 0, confidenceInterval: { lower: 0, upper: 100 } };
            const trackColor = score.trackRecord >= 70 ? "text-cyan-600" : score.trackRecord >= 50 ? "text-slate-600" : "text-orange-600";
            const trackBg = score.trackRecord >= 70 ? "bg-cyan-500" : score.trackRecord >= 50 ? "bg-slate-500" : "bg-orange-500";
            const trackGlow = score.trackRecord >= 70 ? "shadow-[0_0_10px_rgba(6,182,212,0.5)]" : "";

            return (
              <div key={source.id} onClick={() => setLocation(`/sources/${source.id}`)} className={`glass rounded-[2rem] p-8 border hover:shadow-2xl transition-all duration-500 cursor-pointer group bg-white/50 ${source.type === "youtube" ? "border-red-200/60 hover:border-red-300" : "border-slate-200"}`}>
                <div className="flex items-center space-x-4 mb-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg shadow-xl group-hover:scale-110 transition-transform ${
                    source.logoUrl ? "bg-white p-1.5" :
                    score.trackRecord >= 70 ? "bg-cyan-500 text-white"
                    : score.trackRecord >= 50 ? "bg-slate-400 text-white" : "bg-orange-500 text-white"
                  }`}>
                    {source.logoUrl ? (
                      <img src={source.logoUrl} alt={source.displayName} className="w-full h-full object-contain rounded-lg" />
                    ) : (
                      <span className="text-white font-black text-sm">{source.logo || source.displayName?.charAt(0) || "?"}</span>
                    )}
                  </div>
                  <div>
                    <div className="font-black text-lg text-slate-900 group-hover:text-cyan-600 transition-colors tracking-tight">{source.displayName}</div>
                    <div className="text-xs text-slate-400">{source.handleOrDomain}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Track Record</div>
                    <div className={`text-3xl font-black ${trackColor}`}>
                      {Math.round(score.trackRecord)}
                      <span className="text-sm text-slate-400 font-normal ml-1">
                        &plusmn;{Math.round(((score.confidenceInterval?.upper || 100) - (score.confidenceInterval?.lower || 0)) / 2)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Method Discipline</div>
                    <div className="text-3xl font-black text-slate-700">{Math.round(score.methodDiscipline)}</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${trackBg} rounded-full ${trackGlow}`} style={{ width: `${score.trackRecord}%` }} />
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-slate-500 rounded-full" style={{ width: `${score.methodDiscipline}%` }} />
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{score.sampleSize} resolved claims</span>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1.5 ${
                    source.type === "regulator" ? "bg-cyan-100 text-cyan-700"
                    : source.type === "publisher" ? "bg-slate-100 text-slate-600"
                    : source.type === "x_handle" ? "bg-orange-100 text-orange-700"
                    : source.type === "youtube" ? "bg-red-50 text-red-600 border border-red-200/50"
                    : "bg-slate-100 text-slate-500"
                  }`}>
                    {source.type === "youtube" && (
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                    )}
                    {(source.type || "unknown").replace(/_/g, " ")}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
