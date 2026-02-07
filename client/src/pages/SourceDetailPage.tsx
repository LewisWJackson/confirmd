import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { fetchSource } from "../lib/api";

const getVerdictStyle = (label: string) => {
  const styles: Record<string, { bg: string; text: string; light: string }> = {
    verified: { bg: "bg-cyan-500", text: "text-cyan-600", light: "bg-cyan-50" },
    plausible_unverified: { bg: "bg-slate-500", text: "text-slate-600", light: "bg-slate-50" },
    speculative: { bg: "bg-orange-500", text: "text-orange-600", light: "bg-orange-50" },
    misleading: { bg: "bg-red-500", text: "text-red-600", light: "bg-red-50" },
  };
  return styles[label] || styles.speculative;
};

export default function SourceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();

  const { data: source, isLoading, error } = useQuery({
    queryKey: ["source", id],
    queryFn: () => fetchSource(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-6 md:px-12 relative z-10">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-slate-200 rounded-xl w-48" />
          <div className="h-48 bg-slate-100 rounded-[2rem]" />
          <div className="h-96 bg-slate-100 rounded-[2rem]" />
        </div>
      </div>
    );
  }

  if (error || !source) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-6 md:px-12 relative z-10 text-center">
        <h2 className="text-3xl font-black text-slate-900">Source not found</h2>
        <button
          onClick={() => setLocation("/sources")}
          className="mt-6 px-8 py-3 bg-slate-900 text-white rounded-xl font-bold"
        >
          Back to Sources
        </button>
      </div>
    );
  }

  const score = source.score || {
    trackRecord: 50,
    methodDiscipline: 50,
    sampleSize: 0,
    confidenceInterval: { lower: 0, upper: 100 },
  };
  const trackColor =
    score.trackRecord >= 70
      ? "text-cyan-600"
      : score.trackRecord >= 50
      ? "text-slate-600"
      : "text-orange-600";
  const trackBg =
    score.trackRecord >= 70
      ? "bg-cyan-500"
      : score.trackRecord >= 50
      ? "bg-slate-500"
      : "bg-orange-500";
  const trackGlow =
    score.trackRecord >= 70 ? "shadow-[0_0_10px_rgba(6,182,212,0.5)]" : "";
  const recentClaims = source.recentClaims || [];

  return (
    <div className="max-w-7xl mx-auto py-12 px-6 md:px-12 relative z-10 animate-in fade-in duration-700">
      {/* Back button */}
      <button
        onClick={() => setLocation("/sources")}
        className="flex items-center text-[10px] font-black tracking-[0.3em] text-slate-500 hover:text-cyan-500 mb-12 group transition-colors uppercase"
      >
        <svg
          className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={3}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Return to Sources
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        {/* Main content */}
        <div className="lg:col-span-8 space-y-10">
          {/* Source header */}
          <div className="glass rounded-[2rem] p-10 border border-slate-100 bg-white/50">
            <div className="flex items-center space-x-6 mb-8">
              <div
                className={`w-24 h-24 rounded-3xl flex items-center justify-center font-black text-3xl shadow-2xl ${
                  source.logoUrl
                    ? "bg-white p-2"
                    : score.trackRecord >= 70
                    ? "bg-cyan-500 text-white"
                    : score.trackRecord >= 50
                    ? "bg-slate-400 text-white"
                    : "bg-orange-500 text-white"
                }`}
              >
                {source.logoUrl ? (
                  <img
                    src={source.logoUrl}
                    alt={source.displayName}
                    className="w-full h-full object-contain rounded-2xl"
                  />
                ) : (
                  <span className="text-white font-black text-3xl">
                    {source.logo || source.displayName?.charAt(0) || "?"}
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
                  {source.displayName}
                </h1>
                <div className="text-sm text-slate-500 mt-1">
                  {source.handleOrDomain}
                </div>
                <span
                  className={`inline-block mt-3 text-[10px] font-black uppercase tracking-[0.3em] px-4 py-1.5 rounded-full ${
                    source.type === "regulator"
                      ? "bg-cyan-100 text-cyan-700"
                      : source.type === "publisher"
                      ? "bg-slate-100 text-slate-600"
                      : source.type === "x_handle"
                      ? "bg-orange-100 text-orange-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {(source.type || "unknown").replace(/_/g, " ")}
                </span>
              </div>
            </div>
          </div>

          {/* Recent Claims */}
          <div className="glass rounded-[2rem] p-10 border border-slate-100 bg-white/50">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">
                Recent Claims
              </h3>
              <span className="text-xs font-black text-cyan-600">
                {recentClaims.length} Claims
              </span>
            </div>
            <div className="space-y-4">
              {recentClaims.map((claim: any) => {
                const verdictLabel =
                  claim.verdict?.verdictLabel || "speculative";
                const vStyle = getVerdictStyle(verdictLabel);
                return (
                  <div
                    key={claim.id}
                    onClick={() => setLocation(`/claims/${claim.id}`)}
                    className="p-6 bg-slate-50 rounded-2xl border border-transparent hover:border-slate-200 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-3 h-3 rounded-full mt-2 flex-shrink-0 ${vStyle.bg}`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <span
                            className={`px-3 py-1 ${vStyle.light} ${vStyle.text} rounded-lg text-[10px] font-black uppercase tracking-widest`}
                          >
                            {verdictLabel.replace(/_/g, " ")}
                          </span>
                          {(claim.assetSymbols || [])
                            .slice(0, 3)
                            .map((s: string) => (
                              <span
                                key={s}
                                className="text-[10px] font-black text-cyan-600 uppercase tracking-widest"
                              >
                                ${s}
                              </span>
                            ))}
                        </div>
                        <p className="text-sm text-slate-700 font-medium leading-relaxed group-hover:text-slate-900 transition-colors">
                          {claim.claimText}
                        </p>
                      </div>
                      <svg
                        className="w-5 h-5 text-slate-300 group-hover:text-cyan-500 transition-colors flex-shrink-0 mt-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                );
              })}
              {recentClaims.length === 0 && (
                <p className="text-slate-400 text-center py-8">
                  No recent claims from this source
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-10">
          {/* Score Card */}
          <div className="glass rounded-[2.5rem] p-10 border-slate-100 sticky top-28 shadow-2xl bg-white/50">
            <h3 className="font-black text-xs tracking-[0.3em] text-slate-400 uppercase mb-8">
              Source Score
            </h3>
            {score.computedAt && (
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">
                Version {score.scoreVersion || "v1"} &middot;{" "}
                {new Date(score.computedAt).toLocaleDateString()}
              </div>
            )}
            <div className="space-y-8">
              {/* Track Record */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Track Record
                  </span>
                  <span className={`text-3xl font-black ${trackColor}`}>
                    {Math.round(score.trackRecord)}
                    <span className="text-sm text-slate-400 font-normal ml-1">
                      &plusmn;
                      {Math.round(
                        ((score.confidenceInterval?.upper || 100) -
                          (score.confidenceInterval?.lower || 0)) /
                          2
                      )}
                    </span>
                  </span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${trackBg} rounded-full ${trackGlow} transition-all duration-1000`}
                    style={{ width: `${score.trackRecord}%` }}
                  />
                </div>
                {score.confidenceInterval && (
                  <div className="flex justify-between mt-2">
                    <span className="text-[10px] text-slate-400">
                      Low: {Math.round(score.confidenceInterval.lower)}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      High: {Math.round(score.confidenceInterval.upper)}
                    </span>
                  </div>
                )}
              </div>

              {/* Method Discipline */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Method Discipline
                  </span>
                  <span className="text-3xl font-black text-slate-700">
                    {Math.round(score.methodDiscipline)}
                  </span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-500 rounded-full transition-all duration-1000"
                    style={{ width: `${score.methodDiscipline}%` }}
                  />
                </div>
              </div>

              {/* Sample Size */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Sample Size
                  </span>
                  <span className="text-3xl font-black text-slate-700">
                    {score.sampleSize}
                  </span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 rounded-full transition-all duration-1000"
                    style={{
                      width: `${Math.min(
                        100,
                        (score.sampleSize / 500) * 100
                      )}%`,
                    }}
                  />
                </div>
                <div className="text-[10px] text-slate-400 mt-2">
                  Resolved claims analyzed
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                Overall Assessment
              </div>
              <div
                className={`text-sm font-bold ${
                  score.trackRecord >= 70
                    ? "text-cyan-600"
                    : score.trackRecord >= 50
                    ? "text-slate-600"
                    : "text-orange-600"
                }`}
              >
                {score.trackRecord >= 70
                  ? "High credibility source with strong track record"
                  : score.trackRecord >= 50
                  ? "Moderate credibility, mixed verification history"
                  : "Low credibility, exercise caution with claims"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
