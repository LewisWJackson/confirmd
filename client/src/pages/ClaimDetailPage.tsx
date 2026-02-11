import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { fetchClaim, submitEvidence, fetchVerdictHistory } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import UpgradePrompt from "../components/UpgradePrompt";
import { FormattedReasoning } from "../components/FormattedReasoning";

const getVerdictStyle = (label: string) => {
  const styles: Record<string, { bg: string; text: string; light: string; border: string; glow: string }> = {
    verified: { bg: "bg-accent", text: "text-accent", light: "bg-accent/10", border: "border-accent", glow: "shadow-accent/20" },
    plausible_unverified: { bg: "bg-slate-500", text: "text-slate-600", light: "bg-slate-50", border: "border-border", glow: "" },
    speculative: { bg: "bg-orange-500", text: "text-orange-600", light: "bg-orange-50", border: "border-orange-200", glow: "shadow-[0_0_20px_rgba(249,115,22,0.3)]" },
    misleading: { bg: "bg-red-500", text: "text-red-600", light: "bg-red-50", border: "border-red-200", glow: "shadow-[0_0_20px_rgba(239,68,68,0.3)]" },
  };
  return styles[label] || styles.speculative;
};

const getGradeStyle = (grade: string) => {
  const styles: Record<string, { bg: string; text: string; light: string; label: string }> = {
    A: { bg: "bg-accent", text: "text-accent", light: "bg-accent/10", label: "Primary" },
    B: { bg: "bg-slate-500", text: "text-slate-700", light: "bg-slate-50", label: "Strong Secondary" },
    C: { bg: "bg-orange-400", text: "text-orange-700", light: "bg-orange-50", label: "Weak Secondary" },
    D: { bg: "bg-red-400", text: "text-red-700", light: "bg-red-50", label: "Speculative" },
  };
  return styles[grade] || styles.C;
};

const getStanceStyle = (stance: string) => {
  const styles: Record<string, { bg: string; text: string; icon: string }> = {
    supports: { bg: "bg-accent/10", text: "text-accent", icon: "\u2713" },
    contradicts: { bg: "bg-red-100", text: "text-red-700", icon: "\u2717" },
    mentions: { bg: "bg-surface-card-hover", text: "text-content-secondary", icon: "\u25CB" },
  };
  return styles[stance] || { bg: "bg-surface-card-hover", text: "text-content-secondary", icon: "?" };
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

const getVerificationTierBadge = (tier?: string) => {
  if (tier === "deep_verified") {
    return (
      <span className="px-2 py-0.5 text-[10px] rounded-full uppercase tracking-wider font-semibold bg-emerald-900/50 text-emerald-400 border border-emerald-700/50">
        Deep Verified
      </span>
    );
  }
  if (tier === "reverified") {
    return (
      <span className="px-2 py-0.5 text-[10px] rounded-full uppercase tracking-wider font-semibold bg-blue-900/50 text-blue-400 border border-blue-700/50">
        Re-verified
      </span>
    );
  }
  return null;
};

const getTimelineVerdictColor = (label: string) => {
  if (label === "verified") return "bg-accent";
  if (label === "plausible_unverified") return "bg-slate-500";
  if (label === "speculative") return "bg-orange-500";
  if (label === "misleading") return "bg-red-500";
  return "bg-slate-400";
};

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export default function ClaimDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [submitUrl, setSubmitUrl] = useState("");
  const [submitNotes, setSubmitNotes] = useState("");
  const [showForm, setShowForm] = useState(false);

  const { data: claim, isLoading, error } = useQuery({
    queryKey: ["claim", id],
    queryFn: () => fetchClaim(id!),
    enabled: !!id,
  });

  const { data: verdictHistory = [] } = useQuery({
    queryKey: ["verdictHistory", id],
    queryFn: () => fetchVerdictHistory(id!),
    enabled: !!id,
  });

  const submitMutation = useMutation({
    mutationFn: () => submitEvidence(id!, { url: submitUrl, notes: submitNotes || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["claim", id] });
      setSubmitUrl("");
      setSubmitNotes("");
      setShowForm(false);
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-6 md:px-12 relative z-10">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-surface-card-hover rounded-xl w-48" />
          <div className="h-48 bg-surface-card-hover rounded-[2rem]" />
          <div className="h-96 bg-surface-card-hover rounded-[2rem]" />
        </div>
      </div>
    );
  }

  if (error || !claim) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-6 md:px-12 relative z-10 text-center">
        <h2 className="text-3xl font-black text-content-primary">Claim not found</h2>
        <button onClick={() => setLocation("/claims")} className="mt-6 px-8 py-3 bg-surface-card text-content-primary rounded-xl font-bold">Back to Claims</button>
      </div>
    );
  }

  const { canAccess, tier } = useAuth();
  const verdict = claim.verdict;
  const style = verdict ? getVerdictStyle(verdict.verdictLabel) : null;
  const evidence = claim.evidence || [];
  const source = claim.source;
  const canSeeFullEvidence = canAccess("full_evidence");
  const visibleEvidence = canSeeFullEvidence ? evidence : evidence.slice(0, 2);
  const hiddenCount = evidence.length - visibleEvidence.length;

  return (
    <div className="max-w-7xl mx-auto py-12 px-6 md:px-12 relative z-10 animate-in fade-in duration-700">
      <button
        onClick={() => setLocation("/claims")}
        className="flex items-center text-[10px] font-black tracking-[0.3em] text-content-secondary hover:text-accent mb-12 group transition-colors uppercase"
      >
        <svg className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
        </svg>
        Return to Claims Feed
      </button>

      {/* Account CTA Banner - only for free tier */}
      {tier === "free" && (
        <div className="rounded-2xl p-6 mb-10 border border-accent bg-accent/10 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-accent uppercase tracking-widest">Confirmd+</span>
            <p className="text-sm text-content-secondary mt-1 font-medium">Get full evidence ladders, real-time alerts, and source history with a Plus membership.</p>
          </div>
          <button onClick={() => setLocation("/plus")} className="px-6 py-3 bg-accent text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-accent-hover transition-all shadow-lg whitespace-nowrap">
            Learn More
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        <div className="lg:col-span-8 space-y-10">
          {/* TL;DR Summary */}
          {verdict && (
            <div className="rounded-[2rem] p-8 border border-accent bg-accent/10">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-accent mb-4">TL;DR</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${style?.bg}`} />
                  <span className="text-sm text-content-primary font-medium">Verdict: <strong className="uppercase">{verdict.verdictLabel.replace(/_/g, " ")}</strong> with {Math.round((verdict.probabilityTrue ?? 0) * 100)}% probability</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full mt-2 bg-slate-400" />
                  <span className="text-sm text-content-primary font-medium">{evidence.length} evidence source{evidence.length !== 1 ? "s" : ""} analyzed, evidence strength {Math.round((verdict.evidenceStrength ?? 0) * 100)}%</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full mt-2 bg-slate-400 flex-shrink-0" />
                  <div className="text-sm text-content-primary font-medium">
                    <FormattedReasoning text={verdict.reasoningSummary} verdictLabel={verdict.verdictLabel} />
                  </div>
                </li>
              </ul>
            </div>
          )}

          {/* Verdict Badge */}
          {verdict && (
            <div className={`${style?.light} ${style?.border} border rounded-[2rem] p-8 ${style?.glow}`}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full ${style?.bg}`} />
                  <span className={`text-2xl font-black uppercase tracking-tight ${style?.text}`}>{verdict.verdictLabel.replace(/_/g, " ")}</span>
                  {getVerificationTierBadge(claim.metadata?.verificationTier)}
                </div>
                <span className="text-[10px] font-black text-content-muted uppercase tracking-widest">{getClaimTypeLabel(claim.claimType)}</span>
              </div>
              <h1 className="text-4xl font-black leading-tight text-content-primary tracking-tighter mb-8">{claim.claimText}</h1>
              <div className="flex flex-wrap gap-3">
                {(claim.assetSymbols || []).map((s: string) => (
                  <span key={s} className="px-4 py-2 bg-surface-secondary text-accent rounded-xl text-xs font-black uppercase tracking-widest border border-accent">${s}</span>
                ))}
                {claim.resolution && (
                  <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${
                    claim.resolution.outcome === "true" ? "bg-accent text-white"
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
            <div className="rounded-[2rem] p-10 border border-border bg-surface-card">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-content-muted mb-8">Due Diligence Verdict</h3>
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div className="p-6 bg-surface-primary rounded-2xl">
                  <div className="text-[10px] font-black uppercase tracking-widest text-content-muted mb-2">Probability True</div>
                  <div className={`text-4xl font-black ${style?.text}`}>{Math.round((verdict.probabilityTrue ?? 0) * 100)}%</div>
                </div>
                <div className="p-6 bg-surface-primary rounded-2xl">
                  <div className="text-[10px] font-black uppercase tracking-widest text-content-muted mb-2">Evidence Strength</div>
                  <div className="text-4xl font-black text-content-primary">{Math.round((verdict.evidenceStrength ?? 0) * 100)}%</div>
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-content-muted mb-3">Analysis Summary</div>
                  <div className="text-base text-content-primary leading-relaxed">
                    <FormattedReasoning text={verdict.reasoningSummary} verdictLabel={verdict.verdictLabel} />
                  </div>
                </div>
                <div className="p-6 bg-verdict-speculative/10 rounded-2xl border border-verdict-speculative/20">
                  <div className="text-[10px] font-black uppercase tracking-widest text-verdict-speculative mb-3">What Would Change This Verdict?</div>
                  <p className="text-sm text-content-secondary">{verdict.invalidationTriggers}</p>
                </div>
              </div>
            </div>
          )}

          {/* Verdict History Timeline */}
          {verdictHistory.length >= 2 && (
            <div className="rounded-[2rem] p-10 border border-border bg-surface-card">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-content-muted mb-8">Verdict History</h3>
              <div className="relative">
                {verdictHistory.map((entry: any, i: number) => {
                  const isLast = i === verdictHistory.length - 1;
                  const dotColor = getTimelineVerdictColor(entry.verdictLabel);
                  return (
                    <div key={entry.id || i} className="relative flex gap-6">
                      {/* Timeline track */}
                      <div className="flex flex-col items-center">
                        <div className={`w-3.5 h-3.5 rounded-full ${dotColor} flex-shrink-0 mt-1 shadow-lg`} />
                        {!isLast && (
                          <div className="w-0.5 bg-border flex-1 min-h-[2rem]" />
                        )}
                      </div>
                      {/* Content */}
                      <div className={`pb-8 ${isLast ? "pb-0" : ""}`}>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-sm font-bold text-content-primary">
                            {entry.createdAt ? formatDate(entry.createdAt) : "Unknown date"}
                          </span>
                          <span className="text-sm text-content-muted">&mdash;</span>
                          <span className="text-sm font-black uppercase text-content-primary">
                            {(entry.verdictLabel || "unknown").replace(/_/g, " ")}
                          </span>
                          {getVerificationTierBadge(entry.verificationTier)}
                        </div>
                        {entry.reasoningSummary && (
                          <div className="text-sm text-content-secondary mt-2 leading-relaxed line-clamp-3">
                            <FormattedReasoning text={entry.reasoningSummary} verdictLabel={entry.verdictLabel} />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Evidence Ladder */}
          <div className="rounded-[2rem] p-10 border border-border bg-surface-card">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-content-muted">Evidence Ladder</h3>
              <span className="text-xs font-black text-accent">{evidence.length} Sources</span>
            </div>
            <div className="space-y-4">
              {visibleEvidence.map((ev: any) => {
                const gradeStyle = getGradeStyle(ev.evidenceGrade || ev.grade);
                const stanceStyle = getStanceStyle(ev.stance);
                return (
                  <div key={ev.id} className="p-6 bg-surface-primary rounded-2xl border border-transparent hover:border-border transition-all">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl ${gradeStyle.bg} flex items-center justify-center text-white font-black text-lg shadow-lg flex-shrink-0`}>
                        {ev.evidenceGrade || ev.grade}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <span className="font-bold text-content-primary">{ev.publisher}</span>
                          <span className={`px-2 py-1 ${stanceStyle.bg} ${stanceStyle.text} rounded-lg text-[10px] font-black uppercase tracking-widest`}>
                            {stanceStyle.icon} {ev.stance}
                          </span>
                          <span className={`px-2 py-1 ${gradeStyle.light} ${gradeStyle.text} rounded-lg text-[10px] font-black uppercase tracking-widest`}>
                            {gradeStyle.label}
                          </span>
                        </div>
                        <p className="text-sm text-content-secondary leading-relaxed mb-2">{ev.excerpt}</p>
                        {ev.url && (
                          <a
                            href={ev.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-accent hover:text-accent-hover transition-colors"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            View Source
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {hiddenCount > 0 && (
                <UpgradePrompt
                  requiredTier="tribune"
                  featureName="full evidence ladders"
                  description={`${hiddenCount} more evidence source${hiddenCount !== 1 ? "s" : ""} available. Upgrade to Tribune to see the complete evidence ladder.`}
                />
              )}
              {evidence.length === 0 && (
                <p className="text-content-muted text-center py-8">No evidence items available</p>
              )}
            </div>

            {/* Community Evidence Submission */}
            <div className="mt-8 pt-8 border-t border-border">
              {!showForm ? (
                <button
                  onClick={() => { setShowForm(true); submitMutation.reset(); }}
                  className="w-full py-4 border-2 border-dashed border-border rounded-2xl text-sm font-bold text-content-muted hover:text-accent hover:border-accent transition-all"
                >
                  + Submit Evidence
                </button>
              ) : (
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-[0.3em] text-content-muted">Submit Evidence</h4>
                  <input
                    type="url"
                    placeholder="https://example.com/article"
                    value={submitUrl}
                    onChange={(e) => setSubmitUrl(e.target.value)}
                    className="w-full px-4 py-3 bg-surface-primary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-transparent"
                    disabled={submitMutation.isPending}
                  />
                  <textarea
                    placeholder="Optional notes about this evidence..."
                    value={submitNotes}
                    onChange={(e) => setSubmitNotes(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-3 bg-surface-primary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-transparent resize-none"
                    disabled={submitMutation.isPending}
                  />
                  {submitMutation.isError && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                      {(submitMutation.error as Error).message}
                    </div>
                  )}
                  {submitMutation.isSuccess && (
                    <div className="p-4 bg-accent/10 border border-accent rounded-xl text-sm text-accent">
                      Evidence accepted! The verdict has been recalculated.
                    </div>
                  )}
                  <div className="flex gap-3">
                    <button
                      onClick={() => submitMutation.mutate()}
                      disabled={!submitUrl || submitMutation.isPending}
                      className="px-6 py-3 bg-accent text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-accent-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitMutation.isPending ? "Analyzing..." : "Submit"}
                    </button>
                    <button
                      onClick={() => { setShowForm(false); setSubmitUrl(""); setSubmitNotes(""); submitMutation.reset(); }}
                      className="px-6 py-3 text-content-secondary text-xs font-black uppercase tracking-widest hover:text-content-primary"
                      disabled={submitMutation.isPending}
                    >
                      Cancel
                    </button>
                  </div>
                  <p className="text-[10px] text-content-muted font-medium">
                    AI will analyze the URL content for relevance, extract key excerpts, and determine if it supports or contradicts this claim.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-10">
          {/* Coverage Details */}
          {verdict && (
            <div className="rounded-[2.5rem] p-10 border-border sticky top-28 shadow-2xl bg-surface-card">
              <h3 className="font-black text-xs tracking-[0.3em] text-content-muted uppercase mb-8">Coverage Details</h3>
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-content-secondary">Total Sources</span>
                  <span className="text-lg font-black text-content-primary">{evidence.length}</span>
                </div>
                {["verified", "plausible_unverified", "speculative", "misleading"].map((v) => {
                  const count = v === verdict.verdictLabel ? 1 : 0;
                  const vStyle = getVerdictStyle(v);
                  return (
                    <div key={v} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${vStyle.bg}`} />
                        <span className="text-sm text-content-secondary capitalize">{v.replace(/_/g, " ")}</span>
                      </div>
                      <span className="text-sm font-bold text-content-primary">{count}</span>
                    </div>
                  );
                })}
                {/* Verification bar */}
                <div className="pt-4 border-t border-border">
                  <div className="text-[10px] font-black uppercase tracking-widest text-content-muted mb-3">Verification Distribution</div>
                  <div className="h-3 bg-surface-card-hover rounded-full overflow-hidden">
                    <div className={`h-full ${style?.bg} rounded-full`} style={{ width: `${(verdict.probabilityTrue ?? 0) * 100}%` }} />
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className={`text-xs font-black ${style?.text}`}>{Math.round((verdict.probabilityTrue ?? 0) * 100)}% verified</span>
                    <span className="text-xs text-content-muted">{Math.round((1 - (verdict.probabilityTrue ?? 0)) * 100)}% unverified</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Source Profile */}
          {source && (
            <div className="rounded-[2.5rem] p-10 border-border shadow-2xl bg-surface-card">
              <h3 className="font-black text-xs tracking-[0.3em] text-content-muted uppercase mb-8">Asserting Source</h3>
              <div className="flex items-center space-x-4 mb-8">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-xl shadow-xl ${
                  source.logoUrl ? "bg-surface-secondary p-1.5" :
                  (source.score?.trackRecord || 0) >= 70 ? "bg-accent text-white"
                  : (source.score?.trackRecord || 0) >= 50 ? "bg-slate-400 text-white" : "bg-orange-500 text-white"
                }`}>
                  {source.logoUrl ? (
                    <img src={source.logoUrl} alt={source.displayName} className="w-full h-full object-contain rounded-lg" />
                  ) : (
                    <span className="text-white font-black text-xl">{source.logo || source.displayName?.charAt(0) || "?"}</span>
                  )}
                </div>
                <div>
                  <div className="font-black text-xl text-content-primary">{source.displayName}</div>
                  <div className="text-sm text-content-secondary">{source.handleOrDomain}</div>
                </div>
              </div>
              {source.score && (
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-content-muted">Track Record</span>
                      <span className="text-lg font-black text-accent">{source.score.trackRecord}</span>
                    </div>
                    <div className="h-2 bg-surface-card-hover rounded-full overflow-hidden">
                      <div className="h-full bg-accent rounded-full" style={{ width: `${source.score.trackRecord}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-content-muted">Method Discipline</span>
                      <span className="text-lg font-black text-content-primary">{source.score.methodDiscipline}</span>
                    </div>
                    <div className="h-2 bg-surface-card-hover rounded-full overflow-hidden">
                      <div className="h-full bg-slate-500 rounded-full" style={{ width: `${source.score.methodDiscipline}%` }} />
                    </div>
                  </div>
                  <div className="pt-4 border-t border-border text-xs text-content-secondary">
                    Based on {source.score.sampleSize} resolved claims
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Claim Metadata */}
          <div className="rounded-[2.5rem] p-10 border-border bg-surface-card">
            <h3 className="font-black text-xs tracking-[0.3em] text-content-muted uppercase mb-8">Claim Metadata</h3>
            <div className="space-y-4">
              {[
                { label: "Falsifiability", value: `${Math.round((claim.falsifiabilityScore || 0) * 100)}%` },
                { label: "Initial Confidence", value: `${Math.round((claim.llmConfidence || 0) * 100)}%` },
                { label: "Resolution Type", value: claim.resolutionType },
                { label: "Status", value: claim.status },
              ].map((item) => (
                <div key={item.label} className="flex justify-between py-3 border-b border-border">
                  <span className="text-sm text-content-secondary">{item.label}</span>
                  <span className="text-sm font-bold text-content-primary capitalize">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
