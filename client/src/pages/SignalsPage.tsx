import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchClaims } from "../lib/api";
import { Claim, VerdictLabel } from "../types";

type FilterTab = "all" | "verified" | "emerging";

// Crypto logo URLs (CoinGecko CDN)
const CRYPTO_LOGOS: Record<string, string> = {
  BTC: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png",
  ETH: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
  XRP: "https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png",
  SOL: "https://assets.coingecko.com/coins/images/4128/small/solana.png",
  ADA: "https://assets.coingecko.com/coins/images/975/small/cardano.png",
  DOGE: "https://assets.coingecko.com/coins/images/5/small/dogecoin.png",
  DOT: "https://assets.coingecko.com/coins/images/12171/small/polkadot.png",
  AVAX: "https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png",
  MATIC: "https://assets.coingecko.com/coins/images/4713/small/polygon.png",
  LINK: "https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png",
  UNI: "https://assets.coingecko.com/coins/images/12504/small/uni.jpg",
  AAVE: "https://assets.coingecko.com/coins/images/12645/small/aave-token-round.png",
  BNB: "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png",
  USDT: "https://assets.coingecko.com/coins/images/325/small/Tether.png",
  USDC: "https://assets.coingecko.com/coins/images/6319/small/usdc.png",
};

// Full names for common symbols
const CRYPTO_NAMES: Record<string, string> = {
  BTC: "Bitcoin",
  ETH: "Ethereum",
  XRP: "XRP",
  SOL: "Solana",
  ADA: "Cardano",
  DOGE: "Dogecoin",
  DOT: "Polkadot",
  AVAX: "Avalanche",
  MATIC: "Polygon",
  LINK: "Chainlink",
  UNI: "Uniswap",
  AAVE: "Aave",
  BNB: "BNB Chain",
  USDT: "Tether",
  USDC: "USD Coin",
};

const getVerdictStyle = (label: VerdictLabel) =>
  ({
    verified: {
      bg: "bg-accent",
      text: "text-accent",
      light: "bg-accent/10",
      border: "border-accent",
    },
    plausible_unverified: {
      bg: "bg-slate-500",
      text: "text-slate-600",
      light: "bg-slate-50",
      border: "border-border",
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
      symbols.forEach((s) => {
        if (!symbolMap[s]) symbolMap[s] = [];
        symbolMap[s].push(claim);
      });
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
      verified: "text-accent",
      speculative: "text-orange-600",
      misleading: "text-red-600",
    }[dominant];

    return (
      <div
        key={signal.symbol}
        className="rounded-[2rem] p-8 border border-border hover:border-accent hover:shadow-2xl transition-all duration-500 cursor-pointer group bg-surface-card"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-[#1a1a1a] flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform overflow-hidden">
              {CRYPTO_LOGOS[signal.symbol] ? (
                <img
                  src={CRYPTO_LOGOS[signal.symbol]}
                  alt={signal.symbol}
                  className="w-9 h-9 rounded-full object-cover"
                />
              ) : (
                <span className="text-lg font-black text-white">
                  {signal.symbol.charAt(0)}
                </span>
              )}
            </div>
            <div>
              <h3 className="text-xl font-black text-content-primary tracking-tight group-hover:text-accent transition-colors">
                ${signal.symbol}
              </h3>
              <div className="text-[10px] font-black text-content-muted uppercase tracking-widest">
                {CRYPTO_NAMES[signal.symbol] || signal.symbol} · {signal.totalClaims} claim{signal.totalClaims !== 1 ? "s" : ""}
              </div>
            </div>
          </div>
          <div className={`text-2xl font-black ${dominantColor} tracking-tighter`}>
            {Math.round(signal.avgProbability * 100)}%
          </div>
        </div>

        {/* Verdict Distribution Bar */}
        <div className="mb-6">
          <div className="flex h-2.5 w-full rounded-full overflow-hidden bg-surface-card-hover border border-border p-[1px]">
            {verifiedPct > 0 && (
              <div
                className="h-full bg-accent transition-all duration-700 first:rounded-l-full shadow-accent/20"
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
            { label: "Verified", count: dist.verified, color: "bg-accent", textColor: "text-accent" },
            { label: "Plausible", count: dist.plausible, color: "bg-slate-400", textColor: "text-content-secondary" },
            { label: "Speculative", count: dist.speculative, color: "bg-orange-500", textColor: "text-orange-600" },
            { label: "Misleading", count: dist.misleading, color: "bg-red-500", textColor: "text-red-600" },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <div className="flex items-center justify-center space-x-1.5 mb-1">
                <div className={`w-1.5 h-1.5 rounded-full ${item.color}`} />
                <span className="text-[8px] font-black text-content-muted uppercase tracking-widest">
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
        <div className="border-t border-border pt-5 space-y-3">
          <div className="text-[9px] font-black text-content-muted uppercase tracking-widest">
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
                <p className="text-sm text-content-secondary font-medium leading-snug line-clamp-1">
                  {claim.claimText}
                </p>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end mt-5 pt-4 border-t border-border">
          <div className="text-[10px] font-black text-accent uppercase tracking-widest group-hover:translate-x-1 transition-transform">
            View All Signals →
          </div>
        </div>
      </div>
    );
  };

  const renderEmptyState = () => (
    <div className="col-span-full rounded-[2.5rem] p-16 border border-border text-center bg-surface-card">
      <div className="w-20 h-20 rounded-2xl bg-surface-card-hover flex items-center justify-center mx-auto mb-8">
        <svg
          className="w-10 h-10 text-content-muted"
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
      <h3 className="text-xl font-black text-content-primary tracking-tight mb-3">
        No Signals Available
      </h3>
      <p className="text-sm text-content-secondary font-medium max-w-md mx-auto">
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
          className="rounded-[2rem] p-8 border border-border animate-pulse bg-surface-card"
        >
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-surface-card-hover" />
            <div className="space-y-2">
              <div className="h-5 bg-surface-card-hover rounded-xl w-20" />
              <div className="h-3 bg-surface-card-hover rounded-lg w-32" />
            </div>
          </div>
          <div className="h-2.5 bg-surface-card-hover rounded-full mb-6" />
          <div className="grid grid-cols-4 gap-3 mb-6">
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="h-10 bg-surface-primary rounded-lg" />
            ))}
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-surface-primary rounded-lg w-full" />
            <div className="h-4 bg-surface-primary rounded-lg w-3/4" />
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
          <div className="inline-block px-5 py-2 bg-accent/10 border border-accent rounded-full mb-8">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">
              Intelligence
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-content-primary tracking-tighter uppercase leading-[0.9] mb-6">
            Signals
          </h1>
          <p className="text-lg text-content-secondary font-medium leading-relaxed max-w-2xl">
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
                  ? "bg-accent text-white shadow-lg"
                  : "bg-surface-card-hover text-content-secondary hover:bg-surface-card-hover hover:text-content-primary"
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
          <div className="rounded-[2rem] p-6 md:p-8 border border-border shadow-sm bg-surface-card">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-3xl font-black text-content-primary tracking-tighter">
                  {signals.length}
                </div>
                <div className="text-[9px] font-black text-content-muted uppercase tracking-widest mt-1">
                  Assets Tracked
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-black text-accent tracking-tighter">
                  {signals.reduce((s, a) => s + a.verdictDistribution.verified, 0)}
                </div>
                <div className="text-[9px] font-black text-content-muted uppercase tracking-widest mt-1">
                  Verified Claims
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-black text-orange-600 tracking-tighter">
                  {signals.reduce((s, a) => s + a.verdictDistribution.speculative, 0)}
                </div>
                <div className="text-[9px] font-black text-content-muted uppercase tracking-widest mt-1">
                  Speculative
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-black text-red-600 tracking-tighter">
                  {signals.reduce((s, a) => s + a.verdictDistribution.misleading, 0)}
                </div>
                <div className="text-[9px] font-black text-content-muted uppercase tracking-widest mt-1">
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
