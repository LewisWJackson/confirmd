import React, { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { fetchSource } from "../lib/api";

function getGoogleFaviconUrl(domain: string): string {
  const clean = domain.replace(/^@/, "").replace(/^https?:\/\//, "").split("/")[0];
  return `https://www.google.com/s2/favicons?domain=${clean}&sz=128`;
}

function SourceLogo({ src, alt, domain, fallbackLetter, className }: {
  src: string | null | undefined;
  alt: string;
  domain: string;
  fallbackLetter: string;
  className: string;
}) {
  const [imgState, setImgState] = useState<"primary" | "google" | "letter">(src ? "primary" : "letter");

  const handleError = useCallback(() => {
    setImgState((prev) => {
      if (prev === "primary") return "google";
      return "letter";
    });
  }, []);

  if (imgState === "letter") {
    return <span className="text-white font-black text-3xl">{fallbackLetter}</span>;
  }

  const imgSrc = imgState === "primary" ? src! : getGoogleFaviconUrl(domain);
  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      onError={handleError}
    />
  );
}

const getVerdictStyle = (label: string) => {
  const styles: Record<string, { bg: string; text: string; light: string }> = {
    verified: { bg: "bg-accent", text: "text-accent", light: "bg-accent/10" },
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
          <div className="h-8 bg-surface-card-hover rounded-xl w-48" />
          <div className="h-48 bg-surface-card-hover rounded-[2rem]" />
          <div className="h-96 bg-surface-card-hover rounded-[2rem]" />
        </div>
      </div>
    );
  }

  if (error || !source) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-6 md:px-12 relative z-10 text-center">
        <h2 className="text-3xl font-black text-content-primary">Source not found</h2>
        <button
          onClick={() => setLocation("/sources")}
          className="mt-6 px-8 py-3 bg-surface-card text-content-primary rounded-xl font-bold"
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
      ? "text-accent"
      : score.trackRecord >= 50
      ? "text-content-secondary"
      : "text-orange-600";
  const trackBg =
    score.trackRecord >= 70
      ? "bg-accent"
      : score.trackRecord >= 50
      ? "bg-slate-500"
      : "bg-orange-500";
  const trackGlow =
    score.trackRecord >= 70 ? "shadow-accent/20" : "";
  const recentClaims = source.recentClaims || [];

  return (
    <div className="max-w-7xl mx-auto py-12 px-6 md:px-12 relative z-10 animate-in fade-in duration-700">
      {/* Back button */}
      <button
        onClick={() => setLocation("/sources")}
        className="flex items-center text-[10px] font-black tracking-[0.3em] text-content-secondary hover:text-accent mb-12 group transition-colors uppercase"
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
          <div className="rounded-[2rem] p-10 border border-border bg-surface-card">
            <div className="flex items-center space-x-6 mb-8">
              <div
                className={`w-24 h-24 rounded-3xl flex items-center justify-center font-black text-3xl shadow-2xl ${
                  source.logoUrl
                    ? "bg-surface-secondary p-2"
                    : score.trackRecord >= 70
                    ? "bg-accent text-white"
                    : score.trackRecord >= 50
                    ? "bg-slate-400 text-white"
                    : "bg-orange-500 text-white"
                }`}
              >
                <SourceLogo
                  src={source.logoUrl}
                  alt={source.displayName}
                  domain={source.handleOrDomain || ""}
                  fallbackLetter={source.logo || source.displayName?.charAt(0) || "?"}
                  className="w-full h-full object-contain rounded-2xl"
                />
              </div>
              <div>
                <h1 className="text-4xl font-black text-content-primary tracking-tighter">
                  {source.displayName}
                </h1>
                <div className="text-sm text-content-secondary mt-1">
                  {source.handleOrDomain}
                </div>
                <span
                  className={`inline-block mt-3 text-[10px] font-black uppercase tracking-[0.3em] px-4 py-1.5 rounded-full ${
                    source.type === "regulator"
                      ? "bg-accent/10 text-accent"
                      : source.type === "publisher"
                      ? "bg-surface-card-hover text-content-secondary"
                      : source.type === "x_handle"
                      ? "bg-orange-100 text-orange-700"
                      : "bg-surface-card-hover text-content-secondary"
                  }`}
                >
                  {(source.type || "unknown").replace(/_/g, " ")}
                </span>
              </div>
            </div>
          </div>

          {/* Recent Claims */}
          <div className="rounded-[2rem] p-10 border border-border bg-surface-card">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-content-muted">
                Recent Claims
              </h3>
              <span className="text-xs font-black text-accent">
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
                    className="p-6 bg-surface-primary rounded-2xl border border-transparent hover:border-border transition-all cursor-pointer group"
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
                                className="text-[10px] font-black text-accent uppercase tracking-widest"
                              >
                                ${s}
                              </span>
                            ))}
                        </div>
                        <p className="text-sm text-content-primary font-medium leading-relaxed group-hover:text-content-primary transition-colors">
                          {claim.claimText}
                        </p>
                      </div>
                      <svg
                        className="w-5 h-5 text-content-muted group-hover:text-accent transition-colors flex-shrink-0 mt-1"
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
                <p className="text-content-muted text-center py-8">
                  No recent claims from this source
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-10">
          {/* Score Card */}
          <div className="rounded-[2.5rem] p-10 border-border sticky top-28 shadow-2xl bg-surface-card">
            <h3 className="font-black text-xs tracking-[0.3em] text-content-muted uppercase mb-8">
              Source Score
            </h3>
            {score.computedAt && (
              <div className="text-[10px] font-black text-content-muted uppercase tracking-widest mb-6">
                Version {score.scoreVersion || "v1"} &middot;{" "}
                {new Date(score.computedAt).toLocaleDateString()}
              </div>
            )}
            <div className="space-y-8">
              {/* Track Record */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-content-muted">
                    Track Record
                  </span>
                  <span className={`text-3xl font-black ${trackColor}`}>
                    {Math.round(score.trackRecord)}
                    <span className="text-sm text-content-muted font-normal ml-1">
                      &plusmn;
                      {Math.round(
                        ((score.confidenceInterval?.upper || 100) -
                          (score.confidenceInterval?.lower || 0)) /
                          2
                      )}
                    </span>
                  </span>
                </div>
                <div className="h-3 bg-surface-card-hover rounded-full overflow-hidden">
                  <div
                    className={`h-full ${trackBg} rounded-full ${trackGlow} transition-all duration-1000`}
                    style={{ width: `${score.trackRecord}%` }}
                  />
                </div>
                {score.confidenceInterval && (
                  <div className="flex justify-between mt-2">
                    <span className="text-[10px] text-content-muted">
                      Low: {Math.round(score.confidenceInterval.lower)}
                    </span>
                    <span className="text-[10px] text-content-muted">
                      High: {Math.round(score.confidenceInterval.upper)}
                    </span>
                  </div>
                )}
              </div>

              {/* Method Discipline */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-content-muted">
                    Method Discipline
                  </span>
                  <span className="text-3xl font-black text-content-primary">
                    {Math.round(score.methodDiscipline)}
                  </span>
                </div>
                <div className="h-3 bg-surface-card-hover rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-500 rounded-full transition-all duration-1000"
                    style={{ width: `${score.methodDiscipline}%` }}
                  />
                </div>
              </div>

              {/* Sample Size */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-content-muted">
                    Sample Size
                  </span>
                  <span className="text-3xl font-black text-content-primary">
                    {score.sampleSize}
                  </span>
                </div>
                <div className="h-3 bg-surface-card-hover rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full transition-all duration-1000"
                    style={{
                      width: `${Math.min(
                        100,
                        (score.sampleSize / 500) * 100
                      )}%`,
                    }}
                  />
                </div>
                <div className="text-[10px] text-content-muted mt-2">
                  Resolved claims analyzed
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-border">
              <div className="text-[10px] font-black uppercase tracking-widest text-content-muted mb-3">
                Overall Assessment
              </div>
              <div
                className={`text-sm font-bold ${
                  score.trackRecord >= 70
                    ? "text-accent"
                    : score.trackRecord >= 50
                    ? "text-content-secondary"
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
