import React from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchClaims } from "../lib/api";
import { Claim, VerdictLabel } from "../types";

const getVerdictStyle = (label: VerdictLabel) =>
  ({
    verified: {
      bg: "bg-cyan-500",
      text: "text-cyan-600",
      light: "bg-cyan-50",
      border: "border-cyan-200",
    },
    plausible_unverified: {
      bg: "bg-slate-500",
      text: "text-slate-600",
      light: "bg-slate-50",
      border: "border-slate-200",
    },
    speculative: {
      bg: "bg-orange-500",
      text: "text-orange-600",
      light: "bg-orange-50",
      border: "border-orange-200",
    },
    misleading: {
      bg: "bg-red-500",
      text: "text-red-600",
      light: "bg-red-50",
      border: "border-red-200",
    },
  }[label]);

const BlindspotPage: React.FC = () => {
  const {
    data: speculativeClaims,
    isLoading: loadingSpec,
    isError: errorSpec,
  } = useQuery({
    queryKey: ["claims", { verdict: "speculative" }],
    queryFn: () => fetchClaims({ verdict: "speculative" }),
  });

  const {
    data: misleadingClaims,
    isLoading: loadingMis,
    isError: errorMis,
  } = useQuery({
    queryKey: ["claims", { verdict: "misleading" }],
    queryFn: () => fetchClaims({ verdict: "misleading" }),
  });

  const isLoading = loadingSpec || loadingMis;

  const renderClaimCard = (claim: Claim) => {
    const verdict = claim.verdict;
    const style = verdict ? getVerdictStyle(verdict.verdictLabel) : null;
    const probability = verdict
      ? Math.round(verdict.probabilityTrue * 100)
      : null;

    return (
      <div
        key={claim.id}
        className={`glass rounded-[2rem] p-7 border ${
          style?.border || "border-slate-200"
        } hover:shadow-xl transition-all duration-500 cursor-pointer group bg-white/50`}
      >
        {/* Verdict Badge */}
        {verdict && (
          <div className="flex items-center justify-between mb-5">
            <div
              className={`px-3 py-1.5 ${style?.light} ${style?.text} rounded-xl text-[9px] font-black uppercase tracking-widest border ${style?.border}`}
            >
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${style?.bg}`} />
                <span>{verdict.verdictLabel.replace("_", " ")}</span>
              </div>
            </div>
            {probability !== null && (
              <span className={`text-sm font-black ${style?.text}`}>
                {probability}%
              </span>
            )}
          </div>
        )}

        {/* Claim Text */}
        <h3 className="text-lg font-black text-slate-900 tracking-tight mb-4 group-hover:text-cyan-600 transition-colors leading-tight">
          {claim.claimText}
        </h3>

        {/* Source & Assets */}
        <div className="flex flex-wrap gap-2 mb-5">
          {claim.assetSymbols?.map((s) => (
            <span
              key={s}
              className="px-3 py-1 bg-slate-100 text-slate-600 rounded-xl text-[9px] font-black uppercase tracking-widest"
            >
              ${s}
            </span>
          ))}
        </div>

        {/* Probability Bar */}
        {verdict && (
          <div>
            <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest mb-2">
              <span className="text-slate-400">Probability True</span>
              <span className={style?.text}>
                {probability}%
              </span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${style?.bg} rounded-full transition-all duration-700`}
                style={{ width: `${probability}%` }}
              />
            </div>
          </div>
        )}

        {/* Source info */}
        {claim.source && (
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500">
              {claim.source.logo || claim.source.displayName?.charAt(0) || "?"}
            </div>
            <span className="text-xs font-bold text-slate-500">
              {claim.source.displayName || "Unknown Source"}
            </span>
          </div>
        )}
      </div>
    );
  };

  const renderEmptyState = (message: string) => (
    <div className="glass rounded-[2rem] p-12 border border-slate-100 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-6">
        <svg
          className="w-8 h-8 text-slate-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
      </div>
      <p className="text-sm font-bold text-slate-400">{message}</p>
    </div>
  );

  const renderLoadingSkeleton = () => (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="glass rounded-[2rem] p-7 border border-slate-100 animate-pulse"
        >
          <div className="h-5 bg-slate-100 rounded-xl w-24 mb-5" />
          <div className="h-6 bg-slate-100 rounded-xl w-full mb-3" />
          <div className="h-6 bg-slate-100 rounded-xl w-3/4 mb-5" />
          <div className="h-2 bg-slate-100 rounded-full w-full" />
        </div>
      ))}
    </div>
  );

  // Compute hype index from claim data
  const allClaims = [
    ...(speculativeClaims || []),
    ...(misleadingClaims || []),
  ];
  const totalClaims = allClaims.length;
  const avgProbability =
    totalClaims > 0
      ? allClaims.reduce(
          (sum, c: Claim) => sum + (c.verdict?.probabilityTrue || 0),
          0
        ) / totalClaims
      : 0;
  const hypeIndex = totalClaims > 0 ? Math.round((1 - avgProbability) * 100) : 0;

  return (
    <div className="relative z-10 animate-in">
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 pt-20 pb-12">
        <div className="max-w-4xl">
          <div className="inline-block px-5 py-2 bg-orange-50 border border-orange-100 rounded-full mb-8">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-600">
              Hype Scanner
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter uppercase leading-[0.9] mb-6">
            BLINDSP
            <span className="inline-block w-[0.65em] h-[0.65em] bg-orange-500 rounded-full relative -top-[0.05em] mx-[0.02em] shadow-[0_0_20px_rgba(249,115,22,0.4)]" />
            T
          </h1>
          <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-2xl">
            Claims that need your attention. These are assertions circulating
            in the crypto ecosystem that our verification system flags as
            speculative or misleading -- narratives you should approach with
            evidence, not emotion.
          </p>
        </div>
      </section>

      {/* Hype Index */}
      {!isLoading && totalClaims > 0 && (
        <section className="max-w-7xl mx-auto px-6 md:px-12 pb-12">
          <div className="glass rounded-[2.5rem] p-8 md:p-10 border border-orange-100 shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <div className="text-[10px] font-black text-orange-600 uppercase tracking-[0.3em] mb-2">
                  Hype Index
                </div>
                <div className="flex items-baseline space-x-3">
                  <span className="text-5xl font-black text-slate-900 tracking-tighter">
                    {hypeIndex}
                  </span>
                  <span className="text-sm font-bold text-slate-400">
                    / 100
                  </span>
                </div>
                <p className="text-sm text-slate-500 font-medium mt-2">
                  Based on {totalClaims} flagged claims.{" "}
                  {hypeIndex > 70
                    ? "High speculation detected."
                    : hypeIndex > 40
                    ? "Moderate speculation levels."
                    : "Low speculation environment."}
                </p>
              </div>
              <div className="w-full md:w-64">
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${hypeIndex}%`,
                      background: `linear-gradient(90deg, #f59e0b, #ef4444)`,
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

      {/* Two Column Layout */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Speculative Column */}
          <div>
            <div className="flex items-center space-x-4 mb-8">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center border border-orange-100">
                <div className="w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_10px_orange]" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                  Speculative Claims
                </h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Little to no verifiable evidence
                </p>
              </div>
            </div>

            {isLoading ? (
              renderLoadingSkeleton()
            ) : errorSpec || !speculativeClaims ? (
              renderEmptyState(
                "Unable to load speculative claims. The API may be unavailable."
              )
            ) : speculativeClaims.length === 0 ? (
              renderEmptyState(
                "No speculative claims detected right now. The signal is clear."
              )
            ) : (
              <div className="space-y-4">
                {(speculativeClaims as Claim[]).map(renderClaimCard)}
              </div>
            )}
          </div>

          {/* Misleading Column */}
          <div>
            <div className="flex items-center space-x-4 mb-8">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center border border-red-100">
                <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_red]" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                  Misleading Claims
                </h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Evidence contradicts the claim
                </p>
              </div>
            </div>

            {isLoading ? (
              renderLoadingSkeleton()
            ) : errorMis || !misleadingClaims ? (
              renderEmptyState(
                "Unable to load misleading claims. The API may be unavailable."
              )
            ) : misleadingClaims.length === 0 ? (
              renderEmptyState(
                "No misleading claims detected right now. Stay vigilant."
              )
            ) : (
              <div className="space-y-4">
                {(misleadingClaims as Claim[]).map(renderClaimCard)}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default BlindspotPage;
