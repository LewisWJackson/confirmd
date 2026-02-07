import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchClaims } from "../lib/api";
import { Claim, VerdictLabel } from "../types";

type FilterTab = "all" | "verified" | "emerging";

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

interface AssetSignal {
  symbol: string;
  claims: Claim[];
  verdictDistribution: {
    verified: number;
    plausible: number;
    speculative: number;
    misleading: number;
  };
  totalClaims: number;
  avgProbability: number;
}

const SignalsPage: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");

  const {
    data: allClaims,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["claims", { sort: "newest" }],
    queryFn: () => fetchClaims({ sort: "newest" }),
  });

  // Group claims by asset symbol and compute signal data
  const signals: AssetSignal[] = useMemo(() => {
    if (!allClaims || allClaims.length === 0) return [];

    const symbolMap: Record<string, Claim[]> = {};

    (allClaims as Claim[]).forEach((claim) => {
      const symbols = claim.assetSymbols ?? [];
      if (symbols.length === 0) {
        const key = "OTHER";
        if (!symbolMap[key]) symbolMap[key] = [];
        symbolMap[key].push(claim);
      } else {
        symbols.forEach((s) => {
          if (!symbolMap[s]) symbolMap[s] = [];
          symbolMap[s].push(claim);
        });
      }
    });

    return Object.entries(symbolMap)
      .map(([symbol, claims]) => {
        const dist = { verified: 0, plausible: 0, speculative: 0, misleading: 0 };
        let probSum = 0;
        let probCount = 0;

        claims.forEach((c) => {
          if (c.verdict) {
            const label = c.verdict.verdictLabel;
            if (label === "verified") dist.verified++;
            else if (label === "plausible_unverified") dist.plausible++;
            else if (label === "speculative") dist.speculative++;
            else if (label === "misleading") dist.misleading++;
            probSum += c.verdict.probabilityTrue ?? 0;
            probCount++;
          } else {
            // Unreviewed claims count toward speculative for emerging
            dist.speculative++;
          }
        });

        return {
          symbol,
          claims,
          verdictDistribution: dist,
          totalClaims: claims.length,
          avgProbability: probCount > 0 ? probSum / probCount : 0,
        };
      })
      .sort((a, b) => b.totalClaims - a.totalClaims);
  }, [allClaims]);

  // Filter signals based on active tab
  const filteredSignals = useMemo(() => {
    if (activeFilter === "all") return signals;
    if (activeFilter === "verified") {
      return signals.filter((s) => s.verdictDistribution.verified > 0);
    }
    if (activeFilter === "emerging") {
      // Emerging = has unreviewed or speculative claims
      return signals.filter(
        (s) => s.verdictDistribution.speculative > 0 || s.claims.some((c) => c.status === "unreviewed" || c.status === "needs_evidence")
      );
    }
    return signals;
  }, [signals, activeFilter]);

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "all", label: "All Signals" },
    { key: "verified", label: "Verified" },
    { key: "emerging", label: "Emerging" },
  ];

  const renderSignalCard = (signal: AssetSignal) => {
    const dist = signal.verdictDistribution;
    const total = dist.verified + dist.plausible + dist.speculative + dist.misleading;
    const verifiedPct = total > 0 ? Math.round((dist.verified / total) * 100) : 0;
    const plausiblePct = total > 0 ? Math.round((dist.plausible / total) * 100) : 0;
    const speculativePct = total > 0 ? Math.round((dist.speculative / total) * 100) : 0;
    const misleadingPct = total > 0 ? Math.round((dist.misleading / total) * 100) : 0;

    // Determine dominant sentiment
    const dominant =
      dist.verified >= dist.speculative && dist.verified >= dist.misleading
        ? "verified"
        : dist.speculative >= dist.misleading
        ? "speculative"
        : "misleading";

    const dominantColor = {
      verified: "text-cyan-600",
      speculative: "text-orange-600",
      misleading: "text-red-600",
    }[dominant];

    return (
      <div
        key={signal.symbol}
        className="glass rounded-[2rem] p-8 border border-slate-100 hover:border-cyan-200 hover:shadow-2xl transition-all duration-500 cursor-pointer group"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <span className="text-sm font-black text-white tracking-tight">
                {signal.symbol === "OTHER" ? "..." : `$${signal.symbol}`}
              </span>
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight group-hover:text-cyan-600 transition-colors">
                {signal.symbol === "OTHER" ? "Other Assets" : signal.symbol}
              </h3>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {signal.totalClaims} claim{signal.totalClaims !== 1 ? "s" : ""} tracked
              </div>
            </div>
          </div>
          <div className={`text-2xl font-black ${dominantColor} tracking-tighter`}>
            {Math.round(signal.avgProbability * 100)}%
          </div>
        </div>

        {/* Verdict Distribution Bar */}
        <div className="mb-6">
          <div className="flex h-2.5 w-full rounded-full overflow-hidden bg-slate-100 border border-slate-200 p-[1px]">
            {verifiedPct > 0 && (
              <div
                className="h-full bg-cyan-500 transition-all duration-700 first:rounded-l-full shadow-[0_0_8px_rgba(6,182,212,0.3)]"
                style={{ width: `${verifiedPct}%` }}
              />
            )}
            {plausiblePct > 0 && (
              <div
                className="h-full bg-slate-400 transition-all duration-700"
                style={{ width: `${plausiblePct}%` }}
              />
            )}
            {speculativePct > 0 && (
              <div
                className="h-full bg-orange-500 transition-all duration-700 shadow-[0_0_8px_rgba(249,115,22,0.3)]"
                style={{ width: `${speculativePct}%` }}
              />
            )}
            {misleadingPct > 0 && (
              <div
                className="h-full bg-red-500 transition-all duration-700 last:rounded-r-full"
                style={{ width: `${misleadingPct}%` }}
              />
            )}
          </div>
        </div>

        {/* Verdict Legend */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: "Verified", count: dist.verified, color: "bg-cyan-500", textColor: "text-cyan-600" },
            { label: "Plausible", count: dist.plausible, color: "bg-slate-400", textColor: "text-slate-500" },
            { label: "Speculative", count: dist.speculative, color: "bg-orange-500", textColor: "text-orange-600" },
            { label: "Misleading", count: dist.misleading, color: "bg-red-500", textColor: "text-red-600" },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <div className="flex items-center justify-center space-x-1.5 mb-1">
                <div className={`w-1.5 h-1.5 rounded-full ${item.color}`} />
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                  {item.label}
                </span>
              </div>
              <span className={`text-lg font-black ${item.textColor}`}>
                {item.count}
              </span>
            </div>
          ))}
        </div>

        {/* Recent Claims Preview */}
        <div className="border-t border-slate-100 pt-5 space-y-3">
          <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
            Recent Claims
          </div>
          {signal.claims.slice(0, 3).map((claim) => {
            const style = claim.verdict
              ? getVerdictStyle(claim.verdict.verdictLabel)
              : null;
            return (
              <div
                key={claim.id}
                className="flex items-start space-x-3"
              >
                <div
                  className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                    style?.bg || "bg-slate-300"
                  }`}
                />
                <p className="text-sm text-slate-600 font-medium leading-snug line-clamp-1">
                  {claim.claimText}
                </p>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end mt-5 pt-4 border-t border-slate-100">
          <div className="text-[10px] font-black text-cyan-600 uppercase tracking-widest group-hover:translate-x-1 transition-transform">
            View All Signals →
          </div>
        </div>
      </div>
    );
  };

  const renderEmptyState = () => (
    <div className="col-span-full glass rounded-[2.5rem] p-16 border border-slate-100 text-center">
      <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-8">
        <svg
          className="w-10 h-10 text-slate-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
          />
        </svg>
      </div>
      <h3 className="text-xl font-black text-slate-900 tracking-tight mb-3">
        No Signals Available
      </h3>
      <p className="text-sm text-slate-500 font-medium max-w-md mx-auto">
        {isError
          ? "Unable to connect to the signals API. Please try again later."
          : "No claims matching this filter were found. Try a different filter or check back later."}
      </p>
    </div>
  );

  const renderLoadingSkeleton = () => (
    <>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="glass rounded-[2rem] p-8 border border-slate-100 animate-pulse"
        >
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-slate-100" />
            <div className="space-y-2">
              <div className="h-5 bg-slate-100 rounded-xl w-20" />
              <div className="h-3 bg-slate-100 rounded-lg w-32" />
            </div>
          </div>
          <div className="h-2.5 bg-slate-100 rounded-full mb-6" />
          <div className="grid grid-cols-4 gap-3 mb-6">
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="h-10 bg-slate-50 rounded-lg" />
            ))}
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-slate-50 rounded-lg w-full" />
            <div className="h-4 bg-slate-50 rounded-lg w-3/4" />
          </div>
        </div>
      ))}
    </>
  );

  return (
    <div className="relative z-10 animate-in">
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 pt-20 pb-8">
        <div className="max-w-4xl">
          <div className="inline-block px-5 py-2 bg-cyan-50 border border-cyan-100 rounded-full mb-8">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-600">
              Intelligence
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter uppercase leading-[0.9] mb-6">
            Signals
          </h1>
          <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-2xl">
            Emerging trends across the crypto ecosystem. See which assets are
            generating verified activity, which are surrounded by speculation,
            and where the narrative momentum is shifting.
          </p>
        </div>
      </section>

      {/* Filter Tabs */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 pb-12">
        <div className="flex items-center space-x-3">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-300 ${
                activeFilter === tab.key
                  ? "bg-slate-900 text-white shadow-lg"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
              }`}
            >
              {tab.label}
              {!isLoading && (
                <span className="ml-2 opacity-60">
                  {tab.key === "all"
                    ? signals.length
                    : tab.key === "verified"
                    ? signals.filter((s) => s.verdictDistribution.verified > 0).length
                    : signals.filter(
                        (s) =>
                          s.verdictDistribution.speculative > 0 ||
                          s.claims.some((c) => c.status === "unreviewed" || c.status === "needs_evidence")
                      ).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Signal Summary Bar */}
      {!isLoading && signals.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 md:px-12 pb-12">
          <div className="glass rounded-[2rem] p-6 md:p-8 border border-slate-100 shadow-sm">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-3xl font-black text-slate-900 tracking-tighter">
                  {signals.length}
                </div>
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                  Assets Tracked
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-black text-cyan-600 tracking-tighter">
                  {signals.reduce((s, a) => s + a.verdictDistribution.verified, 0)}
                </div>
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                  Verified Claims
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-black text-orange-600 tracking-tighter">
                  {signals.reduce((s, a) => s + a.verdictDistribution.speculative, 0)}
                </div>
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                  Speculative
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-black text-red-600 tracking-tighter">
                  {signals.reduce((s, a) => s + a.verdictDistribution.misleading, 0)}
                </div>
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                  Misleading
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Signals Grid */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 pb-32">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {isLoading ? (
            renderLoadingSkeleton()
          ) : filteredSignals.length === 0 ? (
            renderEmptyState()
          ) : (
            filteredSignals.map(renderSignalCard)
          )}
        </div>
      </section>
    </div>
  );
};

export default SignalsPage;
