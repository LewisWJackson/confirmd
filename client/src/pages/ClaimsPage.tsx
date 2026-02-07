import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { fetchClaims } from "../lib/api";

const getVerdictStyle = (label: string) => {
  const styles: Record<string, { bg: string; text: string; light: string; border: string }> = {
    verified: { bg: "bg-cyan-500", text: "text-cyan-600", light: "bg-cyan-50", border: "border-cyan-200" },
    plausible_unverified: { bg: "bg-slate-500", text: "text-slate-600", light: "bg-slate-50", border: "border-slate-200" },
    speculative: { bg: "bg-orange-500", text: "text-orange-600", light: "bg-orange-50", border: "border-orange-200" },
    misleading: { bg: "bg-red-500", text: "text-red-600", light: "bg-red-50", border: "border-red-200" },
  };
  return styles[label] || styles.speculative;
};

const getClaimTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    filing_submitted: "Filing Submitted",
    filing_approved_or_denied: "Filing Decision",
    regulatory_action: "Regulatory",
    listing_announced: "Listing",
    exploit_or_hack: "Security Incident",
    mainnet_launch: "Launch",
    partnership_announced: "Partnership",
    price_prediction: "Prediction",
    rumor: "Rumor",
    misc_claim: "Claim",
  };
  return labels[type] || "Claim";
};

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

export default function ClaimsPage() {
  const [, setLocation] = useLocation();
  const [claimFilter, setClaimFilter] = useState<"all" | "verified" | "speculative" | "resolved">("all");

  const { data: allClaims = [], isLoading } = useQuery({
    queryKey: ["claims", "all"],
    queryFn: () => fetchClaims({ limit: 50 }),
  });

  const filteredClaims = useMemo(() => {
    if (claimFilter === "verified") return allClaims.filter((c: any) => c.verdict?.verdictLabel === "verified");
    if (claimFilter === "speculative") return allClaims.filter((c: any) => c.verdict?.verdictLabel === "speculative" || c.verdict?.verdictLabel === "misleading");
    if (claimFilter === "resolved") return allClaims.filter((c: any) => c.status === "resolved");
    return allClaims;
  }, [allClaims, claimFilter]);

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-16 w-full animate-in fade-in duration-1000 relative z-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-8">
        <div className="flex flex-col">
          <span className="text-[10px] font-black tracking-[0.5em] text-cyan-600 uppercase mb-3">Verified Claims</span>
          <h2 className="text-5xl font-black tracking-tighter text-slate-900 uppercase">Claim Tracker</h2>
        </div>
        <div className="flex space-x-1 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-sm">
          {(["all", "verified", "speculative", "resolved"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setClaimFilter(filter)}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                claimFilter === filter
                  ? filter === "verified" ? "bg-cyan-500 text-white shadow-lg"
                  : filter === "speculative" ? "bg-orange-500 text-white shadow-lg"
                  : "bg-white text-slate-900 shadow-lg"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass rounded-[2rem] p-8 animate-pulse bg-white/50">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-slate-200 rounded-xl" />
                <div className="flex-1"><div className="h-4 bg-slate-200 rounded-lg w-1/2" /></div>
              </div>
              <div className="h-6 bg-slate-200 rounded-xl w-3/4 mb-4" />
              <div className="h-4 bg-slate-100 rounded-lg w-full" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {filteredClaims.map((claim: any) => {
              const style = claim.verdict ? getVerdictStyle(claim.verdict.verdictLabel) : null;
              return (
                <div
                  key={claim.id}
                  onClick={() => setLocation(`/claims/${claim.id}`)}
                  className={`glass rounded-[2rem] p-8 border ${style?.border || "border-slate-200"} hover:shadow-2xl transition-all duration-500 cursor-pointer group bg-white/50`}
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm shadow-lg ${
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
                        <span className="text-sm font-bold text-slate-800">{claim.source?.displayName || "Unknown"}</span>
                        <div className="text-[10px] font-black text-slate-400 tracking-widest uppercase">{formatTime(claim.assertedAt || claim.createdAt)}</div>
                      </div>
                    </div>
                    {claim.verdict && (
                      <div className={`px-4 py-2 ${style?.light} ${style?.text} rounded-xl text-[10px] font-black uppercase tracking-widest border ${style?.border}`}>
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${style?.bg}`} />
                          <span>{claim.verdict.verdictLabel.replace("_", " ")}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight mb-4 group-hover:text-cyan-600 transition-colors leading-tight">
                    {claim.claimText}
                  </h3>
                  <div className="flex flex-wrap gap-2 mb-6">
                    <span className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest">{getClaimTypeLabel(claim.claimType)}</span>
                    {(claim.assetSymbols || []).map((s: string) => (
                      <span key={s} className="px-3 py-1.5 bg-cyan-50 text-cyan-700 rounded-xl text-[10px] font-black uppercase tracking-widest border border-cyan-100">${s}</span>
                    ))}
                  </div>
                  {claim.verdict && (
                    <div className="border-t border-slate-100 pt-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                            <span className="text-slate-400">Probability</span>
                            <span className={style?.text}>{Math.round(claim.verdict.probabilityTrue * 100)}%</span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full ${style?.bg} rounded-full`} style={{ width: `${claim.verdict.probabilityTrue * 100}%` }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                            <span className="text-slate-400">Evidence</span>
                            <span className="text-slate-700">{Math.round(claim.verdict.evidenceStrength * 100)}%</span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-slate-600 rounded-full" style={{ width: `${claim.verdict.evidenceStrength * 100}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{claim.evidenceCount || 0} evidence items</span>
                    <span className="text-[10px] font-black text-cyan-600 uppercase tracking-widest group-hover:translate-x-1 transition-transform">View Analysis &rarr;</span>
                  </div>
                </div>
              );
            })}
          </div>
          {filteredClaims.length === 0 && (
            <div className="glass rounded-[3rem] p-20 text-center border-dashed border-2 border-slate-200 bg-white/50">
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">No Claims Found</h3>
              <p className="text-slate-500 mt-4 max-w-md mx-auto font-medium">No claims match the current filter criteria.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
