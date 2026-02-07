import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { fetchClaim } from "../lib/api";

const getVerdictStyle = (label: string) => {
  const styles: Record<string, { bg: string; text: string; light: string; border: string; glow: string }> = {
    verified: { bg: "bg-cyan-500", text: "text-cyan-600", light: "bg-cyan-50", border: "border-cyan-200", glow: "shadow-[0_0_20px_rgba(6,182,212,0.3)]" },
    plausible_unverified: { bg: "bg-slate-500", text: "text-slate-600", light: "bg-slate-50", border: "border-slate-200", glow: "" },
    speculative: { bg: "bg-orange-500", text: "text-orange-600", light: "bg-orange-50", border: "border-orange-200", glow: "shadow-[0_0_20px_rgba(249,115,22,0.3)]" },
    misleading: { bg: "bg-red-500", text: "text-red-600", light: "bg-red-50", border: "border-red-200", glow: "shadow-[0_0_20px_rgba(239,68,68,0.3)]" },
  };
  return styles[label] || styles.speculative;
};

const getGradeStyle = (grade: string) => {
  const styles: Record<string, { bg: string; text: string; light: string; label: string }> = {
    A: { bg: "bg-cyan-500", text: "text-cyan-700", light: "bg-cyan-50", label: "Primary" },
    B: { bg: "bg-slate-500", text: "text-slate-700", light: "bg-slate-50", label: "Strong Secondary" },
    C: { bg: "bg-orange-400", text: "text-orange-700", light: "bg-orange-50", label: "Weak Secondary" },
    D: { bg: "bg-red-400", text: "text-red-700", light: "bg-red-50", label: "Speculative" },
  };
  return styles[grade] || styles.C;
};

const getStanceStyle = (stance: string) => {
  const styles: Record<string, { bg: string; text: string; icon: string }> = {
    supports: { bg: "bg-cyan-100", text: "text-cyan-700", icon: "\u2713" },
    contradicts: { bg: "bg-red-100", text: "text-red-700", icon: "\u2717" },
    mentions: { bg: "bg-slate-100", text: "text-slate-600", icon: "\u25CB" },
  };
  return styles[stance] || { bg: "bg-slate-100", text: "text-slate-600", icon: "?" };
};

const getClaimTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    filing_submitted: "Filing Submitted", filing_approved_or_denied: "Filing Decision",
    regulatory_action: "Regulatory Action", listing_announced: "Listing Announced",
    exploit_or_hack: "Security Incident", mainnet_launch: "Mainnet Launch",
    partnership_announced: "Partnership", price_prediction: "Price Prediction",
    rumor: "Rumor", misc_claim: "Miscellaneous",
  };
  return labels[type] || "Claim";
};

export default function ClaimDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();

  const { data: claim, isLoading, error } = useQuery({
    queryKey: ["claim", id],
    queryFn: () => fetchClaim(id!),
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

  if (error || !claim) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-6 md:px-12 relative z-10 text-center">
        <h2 className="text-3xl font-black text-slate-900">Claim not found</h2>
        <button onClick={() => setLocation("/claims")} className="mt-6 px-8 py-3 bg-slate-900 text-white rounded-xl font-bold">Back to Claims</button>
      </div>
    );
  }

  const verdict = claim.verdict;
  const style = verdict ? getVerdictStyle(verdict.verdictLabel) : null;
  const evidence = claim.evidence || [];
  const source = claim.source;

  return (
    <div className="max-w-7xl mx-auto py-12 px-6 md:px-12 relative z-10 animate-in fade-in duration-700">
      <button
        onClick={() => setLocation("/claims")}
        className="flex items-center text-[10px] font-black tracking-[0.3em] text-slate-500 hover:text-cyan-500 mb-12 group transition-colors uppercase"
      >
        <svg className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
        </svg>
        Return to Claims Feed
      </button>

      {/* Account CTA Banner */}
      <div className="glass rounded-2xl p-6 mb-10 border border-cyan-100 bg-cyan-50/30 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black text-cyan-600 uppercase tracking-widest">Confirmd Plus</span>
          <p className="text-sm text-slate-600 mt-1 font-medium">Get full evidence ladders, real-time alerts, and source history with a Plus membership.</p>
        </div>
        <button onClick={() => setLocation("/plus")} className="px-6 py-3 bg-cyan-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-cyan-700 transition-all shadow-lg whitespace-nowrap">
          Learn More
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        <div className="lg:col-span-8 space-y-10">
          {/* TL;DR Summary */}
          {verdict && (
            <div className="glass rounded-[2rem] p-8 border border-cyan-100 bg-cyan-50/20">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-cyan-600 mb-4">TL;DR</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${style?.bg}`} />
                  <span className="text-sm text-slate-700 font-medium">Verdict: <strong className="uppercase">{verdict.verdictLabel.replace("_", " ")}</strong> with {Math.round(verdict.probabilityTrue * 100)}% probability</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full mt-2 bg-slate-400" />
                  <span className="text-sm text-slate-700 font-medium">{evidence.length} evidence source{evidence.length !== 1 ? "s" : ""} analyzed, evidence strength {Math.round(verdict.evidenceStrength * 100)}%</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full mt-2 bg-slate-400" />
                  <span className="text-sm text-slate-700 font-medium">{verdict.reasoningSummary}</span>
                </li>
              </ul>
            </div>
          )}

          {/* Verdict Badge */}
          {verdict && (
            <div className={`${style?.light} ${style?.border} border rounded-[2rem] p-8 ${style?.glow}`}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full ${style?.bg} ${verdict.verdictLabel === "verified" ? "shadow-[0_0_12px_cyan]" : ""}`} />
                  <span className={`text-2xl font-black uppercase tracking-tight ${style?.text}`}>{verdict.verdictLabel.replace("_", " ")}</span>
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{getClaimTypeLabel(claim.claimType)}</span>
              </div>
              <h1 className="text-4xl font-black leading-tight text-slate-900 tracking-tighter mb-8">{claim.claimText}</h1>
              <div className="flex flex-wrap gap-3">
                {(claim.assetSymbols || []).map((s: string) => (
                  <span key={s} className="px-4 py-2 bg-white/80 text-cyan-700 rounded-xl text-xs font-black uppercase tracking-widest border border-cyan-100">${s}</span>
                ))}
                {claim.resolution && (
                  <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${
                    claim.resolution.outcome === "true" ? "bg-cyan-500 text-white"
                    : claim.resolution.outcome === "false" ? "bg-red-500 text-white"
                    : "bg-slate-400 text-white"
                  }`}>
                    Ground Truth: {claim.resolution.outcome}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Verdict Analysis */}
          {verdict && (
            <div className="glass rounded-[2rem] p-10 border border-slate-100 bg-white/50">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 mb-8">Due Diligence Verdict</h3>
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div className="p-6 bg-slate-50 rounded-2xl">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Probability True</div>
                  <div className={`text-4xl font-black ${style?.text}`}>{Math.round(verdict.probabilityTrue * 100)}%</div>
                </div>
                <div className="p-6 bg-slate-50 rounded-2xl">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Evidence Strength</div>
                  <div className="text-4xl font-black text-slate-900">{Math.round(verdict.evidenceStrength * 100)}%</div>
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Analysis Summary</div>
                  <p className="text-lg text-slate-700 leading-relaxed">{verdict.reasoningSummary}</p>
                </div>
                <div className="p-6 bg-orange-50 rounded-2xl border border-orange-100">
                  <div className="text-[10px] font-black uppercase tracking-widest text-orange-600 mb-3">What Would Change This Verdict?</div>
                  <p className="text-sm text-orange-800">{verdict.invalidationTriggers}</p>
                </div>
              </div>
            </div>
          )}

          {/* Evidence Ladder */}
          <div className="glass rounded-[2rem] p-10 border border-slate-100 bg-white/50">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Evidence Ladder</h3>
              <span className="text-xs font-black text-cyan-600">{evidence.length} Sources</span>
            </div>
            <div className="space-y-4">
              {evidence.map((ev: any) => {
                const gradeStyle = getGradeStyle(ev.evidenceGrade || ev.grade);
                const stanceStyle = getStanceStyle(ev.stance);
                return (
                  <div key={ev.id} className="p-6 bg-slate-50 rounded-2xl border border-transparent hover:border-slate-200 transition-all">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl ${gradeStyle.bg} flex items-center justify-center text-white font-black text-lg shadow-lg flex-shrink-0`}>
                        {ev.evidenceGrade || ev.grade}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-bold text-slate-800">{ev.publisher}</span>
                          <span className={`px-2 py-1 ${stanceStyle.bg} ${stanceStyle.text} rounded-lg text-[10px] font-black uppercase tracking-widest`}>
                            {stanceStyle.icon} {ev.stance}
                          </span>
                          <span className={`px-2 py-1 ${gradeStyle.light} ${gradeStyle.text} rounded-lg text-[10px] font-black uppercase tracking-widest`}>
                            {gradeStyle.label}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed">{ev.excerpt}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              {evidence.length === 0 && (
                <p className="text-slate-400 text-center py-8">No evidence items available</p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-10">
          {/* Coverage Details */}
          {verdict && (
            <div className="glass rounded-[2.5rem] p-10 border-slate-100 sticky top-28 shadow-2xl bg-white/50">
              <h3 className="font-black text-xs tracking-[0.3em] text-slate-400 uppercase mb-8">Coverage Details</h3>
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Total Sources</span>
                  <span className="text-lg font-black text-slate-900">{evidence.length}</span>
                </div>
                {["verified", "plausible_unverified", "speculative", "misleading"].map((v) => {
                  const count = v === verdict.verdictLabel ? 1 : 0;
                  const vStyle = getVerdictStyle(v);
                  return (
                    <div key={v} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${vStyle.bg}`} />
                        <span className="text-sm text-slate-500 capitalize">{v.replace("_", " ")}</span>
                      </div>
                      <span className="text-sm font-bold text-slate-700">{count}</span>
                    </div>
                  );
                })}
                {/* Verification bar */}
                <div className="pt-4 border-t border-slate-100">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Verification Distribution</div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${style?.bg} rounded-full`} style={{ width: `${verdict.probabilityTrue * 100}%` }} />
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className={`text-xs font-black ${style?.text}`}>{Math.round(verdict.probabilityTrue * 100)}% verified</span>
                    <span className="text-xs text-slate-400">{Math.round((1 - verdict.probabilityTrue) * 100)}% unverified</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Source Profile */}
          {source && (
            <div className="glass rounded-[2.5rem] p-10 border-slate-100 shadow-2xl bg-white/50">
              <h3 className="font-black text-xs tracking-[0.3em] text-slate-400 uppercase mb-8">Asserting Source</h3>
              <div className="flex items-center space-x-4 mb-8">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-xl shadow-xl ${
                  source.logoUrl ? "bg-white p-1.5" :
                  (source.score?.trackRecord || 0) >= 70 ? "bg-cyan-500 text-white"
                  : (source.score?.trackRecord || 0) >= 50 ? "bg-slate-400 text-white" : "bg-orange-500 text-white"
                }`}>
                  {source.logoUrl ? (
                    <img src={source.logoUrl} alt={source.displayName} className="w-full h-full object-contain rounded-lg" />
                  ) : (
                    <span className="text-white font-black text-xl">{source.logo || source.displayName?.charAt(0) || "?"}</span>
                  )}
                </div>
                <div>
                  <div className="font-black text-xl text-slate-900">{source.displayName}</div>
                  <div className="text-sm text-slate-500">{source.handleOrDomain}</div>
                </div>
              </div>
              {source.score && (
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Track Record</span>
                      <span className="text-lg font-black text-cyan-600">{source.score.trackRecord}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${source.score.trackRecord}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Method Discipline</span>
                      <span className="text-lg font-black text-slate-700">{source.score.methodDiscipline}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-slate-500 rounded-full" style={{ width: `${source.score.methodDiscipline}%` }} />
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-100 text-xs text-slate-500">
                    Based on {source.score.sampleSize} resolved claims
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Claim Metadata */}
          <div className="glass rounded-[2.5rem] p-10 border-slate-100 bg-white/50">
            <h3 className="font-black text-xs tracking-[0.3em] text-slate-400 uppercase mb-8">Claim Metadata</h3>
            <div className="space-y-4">
              {[
                { label: "Falsifiability", value: `${Math.round((claim.falsifiabilityScore || 0) * 100)}%` },
                { label: "Initial Confidence", value: `${Math.round((claim.llmConfidence || 0) * 100)}%` },
                { label: "Resolution Type", value: claim.resolutionType },
                { label: "Status", value: claim.status },
              ].map((item) => (
                <div key={item.label} className="flex justify-between py-3 border-b border-slate-100">
                  <span className="text-sm text-slate-500">{item.label}</span>
                  <span className="text-sm font-bold text-slate-900 capitalize">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
