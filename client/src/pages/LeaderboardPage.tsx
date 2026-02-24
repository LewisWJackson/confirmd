import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { fetchCreatorLeaderboard, fetchActivePoll, voteOnPoll, suggestCreator } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import UpgradePrompt from "../components/UpgradePrompt";
import TierBadge from "../components/TierBadge";

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

function accuracyColor(pct: number): string {
  if (pct >= 75) return "text-emerald-500";
  if (pct >= 60) return "text-amber-500";
  if (pct >= 45) return "text-orange-500";
  return "text-red-500";
}

function accuracyBarColor(pct: number): string {
  if (pct >= 75) return "bg-emerald-500";
  if (pct >= 60) return "bg-amber-500";
  if (pct >= 45) return "bg-orange-500";
  return "bg-red-500";
}

/* ------------------------------------------------------------------ */
/* Animated counter                                                     */
/* ------------------------------------------------------------------ */

function AnimatedNumber({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (target === 0) { setDisplay(0); return; }
    const duration = 1000;
    const steps = 45;
    const interval = duration / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const eased = 1 - Math.pow(1 - step / steps, 3);
      setDisplay(Math.round(eased * target));
      if (step >= steps) clearInterval(timer);
    }, interval);
    return () => clearInterval(timer);
  }, [target]);

  return <>{display}{suffix}</>;
}

/* ------------------------------------------------------------------ */
/* Rank Change indicator                                                */
/* ------------------------------------------------------------------ */

function RankChange({ change }: { change: number }) {
  if (change > 0) {
    return (
      <span className="flex items-center gap-0.5 text-xs font-bold text-emerald-500">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
        {change}
      </span>
    );
  }
  if (change < 0) {
    return (
      <span className="flex items-center gap-0.5 text-xs font-bold text-red-500">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
        {Math.abs(change)}
      </span>
    );
  }
  return <span className="text-xs text-content-muted">—</span>;
}

/* ------------------------------------------------------------------ */
/* Accuracy bar (inline mini sparkline)                                 */
/* ------------------------------------------------------------------ */

function AccuracyBar({ pct }: { pct: number }) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setWidth(pct), 120);
    return () => clearTimeout(timer);
  }, [pct]);

  return (
    <div className="w-20 h-1.5 rounded-full bg-surface-card-hover overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ease-out ${accuracyBarColor(pct)}`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Podium Card                                                          */
/* ------------------------------------------------------------------ */

function PodiumCard({ creator, rank }: { creator: any; rank: number }) {
  const config = {
    1: {
      height: "h-40",
      border: "border-amber-400/40",
      bg: "bg-gradient-to-b from-amber-500/10 to-transparent",
      badge: "bg-amber-400 text-black",
      label: "1st",
      glow: "shadow-[0_0_24px_rgba(251,191,36,0.25)] ring-2 ring-amber-400/30",
    },
    2: {
      height: "h-32",
      border: "border-slate-400/30",
      bg: "bg-gradient-to-b from-slate-400/8 to-transparent",
      badge: "bg-slate-400 text-white",
      label: "2nd",
      glow: "",
    },
    3: {
      height: "h-28",
      border: "border-amber-600/30",
      bg: "bg-gradient-to-b from-amber-700/8 to-transparent",
      badge: "bg-amber-600 text-white",
      label: "3rd",
      glow: "",
    },
  }[rank] || {
    height: "h-24", border: "border-border", bg: "bg-surface-card",
    badge: "bg-slate-600 text-white", label: `${rank}`, glow: "",
  };

  return (
    <div className={`flex flex-col items-center ${rank === 1 ? "order-2" : rank === 2 ? "order-1" : "order-3"}`}>
      <div className="relative mb-3">
        <div className={`w-16 h-16 rounded-2xl overflow-hidden border ${config.border} ${config.glow}`}>
          {creator.avatarUrl ? (
            <img src={creator.avatarUrl} alt={creator.channelName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-surface-card-hover flex items-center justify-center text-lg font-black text-content-muted">
              {(creator.channelName || "?").charAt(0)}
            </div>
          )}
        </div>
        <div className={`absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-lg ${config.badge} flex items-center justify-center text-[10px] font-black`}>
          {config.label}
        </div>
      </div>
      <h3 className="text-sm font-black text-content-primary tracking-tight text-center truncate max-w-[120px]">
        {creator.channelName}
      </h3>
      <div className={`text-lg font-black ${accuracyColor(creator.overallAccuracy || 0)} mt-1`}>
        <AnimatedNumber target={creator.overallAccuracy ?? 0} suffix="%" />
      </div>
      <div className="text-[9px] font-bold text-content-muted uppercase tracking-wider">
        {creator.totalClaims ?? 0} claims
      </div>
      <div className={`rounded-xl ${config.bg} border ${config.border} ${config.height} w-24 mt-3`} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Loading Skeleton                                                     */
/* ------------------------------------------------------------------ */

function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-end justify-center gap-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col items-center animate-pulse">
            <div className="w-16 h-16 bg-surface-card-hover rounded-2xl mb-3" />
            <div className="h-4 bg-surface-card-hover rounded w-20 mb-2" />
            <div className="h-6 bg-surface-card-hover rounded w-12" />
          </div>
        ))}
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="rounded-2xl border border-border bg-surface-card p-5 animate-pulse flex items-center gap-4">
            <div className="w-10 h-10 bg-surface-card-hover rounded-xl" />
            <div className="w-10 h-10 bg-surface-card-hover rounded-full" />
            <div className="flex-1 h-5 bg-surface-card-hover rounded-lg w-1/3" />
            <div className="h-5 bg-surface-card-hover rounded-lg w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Creator Poll Section                                                 */
/* ------------------------------------------------------------------ */

function CreatorPollSection() {
  const queryClient = useQueryClient();
  const [votedOptionId, setVotedOptionId] = useState<string | null>(null);
  const [showSuggest, setShowSuggest] = useState(false);
  const [suggestForm, setSuggestForm] = useState({ channelName: "", channelHandle: "" });
  const [suggestSuccess, setSuggestSuccess] = useState(false);
  const [suggestError, setSuggestError] = useState("");

  const { data: poll, isLoading: pollLoading } = useQuery({
    queryKey: ["active-poll"],
    queryFn: fetchActivePoll,
    retry: false,
  });

  const voteMutation = useMutation({
    mutationFn: ({ pollId, optionId }: { pollId: string; optionId: string }) =>
      voteOnPoll(pollId, optionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-poll"] });
    },
  });

  const suggestMutation = useMutation({
    mutationFn: (data: { channelName: string; channelHandle: string }) =>
      suggestCreator(data),
    onSuccess: () => {
      setSuggestSuccess(true);
      setSuggestForm({ channelName: "", channelHandle: "" });
    },
    onError: (err: any) => {
      setSuggestError(err.message || "Something went wrong. Try again.");
    },
  });

  const handleVote = (optionId: string) => {
    if (!poll?.id || votedOptionId) return;
    setVotedOptionId(optionId);
    voteMutation.mutate({ pollId: poll.id, optionId });
  };

  const handleSuggest = (e: React.FormEvent) => {
    e.preventDefault();
    setSuggestError("");
    if (!suggestForm.channelName.trim()) { setSuggestError("Channel name is required."); return; }
    suggestMutation.mutate(suggestForm);
  };

  const totalVotes = poll?.options?.reduce((sum: number, o: any) => sum + (o.voteCount ?? 0), 0) || 0;
  const hasVoted = !!votedOptionId;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="mt-12 rounded-2xl border border-border bg-surface-card p-6 md:p-8"
    >
      {/* Section header */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <span className="text-[10px] font-black tracking-[0.4em] text-accent uppercase">Community</span>
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-content-primary mt-1">
            Vote: Next Creator to Track
          </h2>
          <p className="text-sm text-content-muted mt-1 font-medium">
            Who should we add to the verification pipeline next?
          </p>
        </div>
        <button
          onClick={() => { setShowSuggest((v) => !v); setSuggestSuccess(false); setSuggestError(""); }}
          className="px-4 py-2 text-[12px] font-bold border border-accent/30 text-accent rounded-full hover:bg-accent/5 transition-all whitespace-nowrap"
        >
          {showSuggest ? "Close" : "Suggest a creator"}
        </button>
      </div>

      {/* Suggest form */}
      <AnimatePresence>
        {showSuggest && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl border border-border bg-surface-primary p-5 mb-6">
              {suggestSuccess ? (
                <div className="text-center py-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm font-bold text-content-primary">Suggestion submitted!</p>
                  <p className="text-xs text-content-muted mt-1">We review suggestions weekly. Thank you.</p>
                </div>
              ) : (
                <form onSubmit={handleSuggest} className="space-y-3">
                  <h3 className="text-sm font-bold text-content-primary mb-3">Suggest a creator</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-content-muted uppercase tracking-wider block mb-1">
                        Channel Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Coin Bureau"
                        value={suggestForm.channelName}
                        onChange={(e) => setSuggestForm((f) => ({ ...f, channelName: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg bg-surface-card border border-border text-sm text-content-primary placeholder:text-content-muted focus:outline-none focus:border-accent/50 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-content-muted uppercase tracking-wider block mb-1">
                        Channel Handle
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. @CoinBureau"
                        value={suggestForm.channelHandle}
                        onChange={(e) => setSuggestForm((f) => ({ ...f, channelHandle: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg bg-surface-card border border-border text-sm text-content-primary placeholder:text-content-muted focus:outline-none focus:border-accent/50 transition-colors"
                      />
                    </div>
                  </div>
                  {suggestError && (
                    <p className="text-[12px] text-red-400">{suggestError}</p>
                  )}
                  <button
                    type="submit"
                    disabled={suggestMutation.isPending}
                    className="px-5 py-2 bg-accent text-white text-sm font-bold rounded-full hover:bg-accent-hover transition-all disabled:opacity-50"
                  >
                    {suggestMutation.isPending ? "Submitting..." : "Submit suggestion"}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Poll */}
      {pollLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-surface-primary p-4 animate-pulse flex items-center gap-4">
              <div className="w-10 h-10 bg-surface-card-hover rounded-full" />
              <div className="flex-1 h-4 bg-surface-card-hover rounded" />
              <div className="w-16 h-8 bg-surface-card-hover rounded-full" />
            </div>
          ))}
        </div>
      ) : !poll || !poll.options || poll.options.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface-primary p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-surface-card-hover flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-content-muted opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm font-bold text-content-primary">Poll coming soon</p>
          <p className="text-xs text-content-muted mt-1">A new voting round will open shortly. Check back later.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {poll.options.map((option: any) => {
            const votes = option.voteCount ?? 0;
            const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
            const isVoted = votedOptionId === option.id;

            return (
              <div
                key={option.id}
                className={`rounded-xl border p-4 transition-all ${
                  hasVoted
                    ? isVoted
                      ? "border-accent/40 bg-accent/5"
                      : "border-border bg-surface-primary"
                    : "border-border bg-surface-primary hover:border-accent/30 cursor-pointer"
                }`}
                onClick={() => !hasVoted && handleVote(option.id)}
              >
                <div className="flex items-center gap-3">
                  {/* Avatar / initial */}
                  <div className="w-10 h-10 rounded-full bg-surface-card-hover flex-shrink-0 overflow-hidden">
                    {option.avatarUrl ? (
                      <img src={option.avatarUrl} alt={option.channelName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm font-black text-content-muted">
                        {(option.channelName || "?").charAt(0)}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-content-primary">{option.channelName}</span>
                      {option.channelHandle && (
                        <span className="text-[12px] text-content-muted">{option.channelHandle}</span>
                      )}
                    </div>
                    {hasVoted && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] text-content-muted">{votes} vote{votes !== 1 ? "s" : ""}</span>
                          <span className="text-[11px] font-bold text-content-secondary">{pct}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-surface-card-hover overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            className={`h-full rounded-full ${isVoted ? "bg-accent" : "bg-surface-card-hover-dark bg-white/20"}`}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Vote button */}
                  {!hasVoted ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleVote(option.id); }}
                      disabled={voteMutation.isPending}
                      className="px-4 py-1.5 text-[12px] font-bold bg-accent/10 text-accent border border-accent/20 rounded-full hover:bg-accent/20 transition-all disabled:opacity-50 whitespace-nowrap"
                    >
                      Vote
                    </button>
                  ) : isVoted ? (
                    <span className="px-3 py-1 text-[11px] font-bold text-accent bg-accent/10 rounded-full border border-accent/20">
                      Voted
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
          {totalVotes > 0 && (
            <p className="text-[11px] text-content-muted text-center pt-1">
              {totalVotes} total vote{totalVotes !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      )}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Row animation variants                                               */
/* ------------------------------------------------------------------ */

const rowContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const rowItem = {
  hidden: { opacity: 0, x: -16 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

/* ------------------------------------------------------------------ */
/* Main Page                                                            */
/* ------------------------------------------------------------------ */

export default function LeaderboardPage() {
  const [, setLocation] = useLocation();
  const { tier } = useAuth();

  const { data: creators = [], isLoading } = useQuery({
    queryKey: ["creators-leaderboard"],
    queryFn: fetchCreatorLeaderboard,
  });

  /* Gate behind tribune tier */
  if (tier === "free") {
    return (
      <div className="animate-in fade-in duration-1000 relative z-10">
        <section className="max-w-7xl mx-auto px-6 md:px-12 pt-16 pb-8 text-center">
          <span className="text-[10px] font-black tracking-[0.5em] text-accent uppercase">Rankings</span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-content-primary mt-2 leading-[0.95]">
            Creator Accuracy Leaderboard
          </h1>
          <p className="text-lg text-content-secondary mt-4 font-medium max-w-xl mx-auto">
            Who's actually right about crypto?
          </p>
        </section>
        <section className="max-w-2xl mx-auto px-6 md:px-12 pb-24">
          <UpgradePrompt
            requiredTier="plus"
            featureName="Creator Leaderboard"
            description="Access the full leaderboard with accuracy rankings, podium positions, and rank changes."
          />
        </section>
      </div>
    );
  }

  const top3 = creators.slice(0, 3);
  const rest = creators.slice(3);

  return (
    <div className="animate-in fade-in duration-1000 relative z-10">
      {/* Header */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 pt-16 pb-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <span className="text-[10px] font-black tracking-[0.5em] text-accent uppercase">Rankings</span>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08 }}
          className="text-4xl md:text-5xl font-black tracking-tighter text-content-primary mt-2 leading-[0.95]"
        >
          Creator Accuracy Leaderboard
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.16 }}
          className="text-lg text-content-secondary mt-4 font-medium max-w-xl mx-auto"
        >
          Who's actually right about crypto?
        </motion.p>
      </section>

      <section className="max-w-7xl mx-auto px-6 md:px-12 pb-24">
        {isLoading ? (
          <LoadingSkeleton />
        ) : creators.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface-card p-16 text-center">
            <h3 className="text-xl font-black text-content-primary tracking-tight">No ranked creators yet</h3>
            <p className="text-sm text-content-secondary mt-2 font-medium">
              Rankings will appear once creators have enough verified claims.
            </p>
          </div>
        ) : (
          <>
            {/* Podium */}
            {top3.length >= 3 && (
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex items-end justify-center gap-6 md:gap-10 mb-12 pt-4"
              >
                {top3.map((c: any, i: number) => (
                  <div key={c.id} className="cursor-pointer" onClick={() => setLocation(`/creators/${c.id}`)}>
                    <PodiumCard creator={c} rank={i + 1} />
                  </div>
                ))}
              </motion.div>
            )}

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.28 }}
              className="grid grid-cols-3 gap-4 mb-8"
            >
              <div className="rounded-2xl border border-border bg-surface-card p-5 text-center">
                <div className="text-2xl font-black text-content-primary">
                  <AnimatedNumber target={creators.length} />
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest text-content-muted mt-1">Ranked</div>
              </div>
              <div className="rounded-2xl border border-border bg-surface-card p-5 text-center">
                <div className="text-2xl font-black text-content-primary">
                  <AnimatedNumber target={creators.reduce((sum: number, c: any) => sum + (c.totalClaims || 0), 0)} />
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest text-content-muted mt-1">Total Claims</div>
              </div>
              <div className="rounded-2xl border border-border bg-surface-card p-5 text-center">
                <div className="text-2xl font-black text-content-primary">
                  <AnimatedNumber
                    target={creators.length > 0
                      ? Math.round(creators.reduce((sum: number, c: any) => sum + (c.overallAccuracy || 0), 0) / creators.length)
                      : 0}
                    suffix="%"
                  />
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest text-content-muted mt-1">Avg Accuracy</div>
              </div>
            </motion.div>

            {/* Full Table */}
            <motion.div
              variants={rowContainer}
              initial="hidden"
              animate="visible"
              className="space-y-3"
            >
              {(top3.length < 3 ? creators : rest).map((creator: any, i: number) => {
                const rank = top3.length < 3 ? i + 1 : i + 4;
                return (
                  <motion.div
                    key={creator.id}
                    variants={rowItem}
                    onClick={() => setLocation(`/creators/${creator.id}`)}
                    className="rounded-2xl border border-border bg-surface-card p-4 md:p-5 hover:border-accent/20 hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-all cursor-pointer group flex items-center gap-4"
                  >
                    {/* Rank */}
                    <div className="w-10 h-10 rounded-xl bg-surface-primary border border-border flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-black text-content-secondary">{rank}</span>
                    </div>

                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-card-hover flex-shrink-0">
                      {creator.avatarUrl ? (
                        <img src={creator.avatarUrl} alt={creator.channelName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm font-black text-content-muted">
                          {(creator.channelName || "?").charAt(0)}
                        </div>
                      )}
                    </div>

                    {/* Name + tier */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-content-primary truncate group-hover:text-accent transition-colors">
                          {creator.channelName}
                        </span>
                        <TierBadge tier={creator.tier || "unranked"} size="sm" />
                      </div>
                      <div className="text-xs text-content-muted font-medium mt-0.5">
                        {creator.subscriberCount ? `${(creator.subscriberCount / 1000).toFixed(0)}K subs` : ""}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="hidden sm:flex items-center gap-5">
                      {/* Accuracy + bar */}
                      <div className="text-center">
                        <div className={`text-lg font-black ${accuracyColor(creator.overallAccuracy || 0)}`}>
                          {creator.overallAccuracy ?? 0}%
                        </div>
                        <AccuracyBar pct={creator.overallAccuracy ?? 0} />
                        <div className="text-[9px] font-bold text-content-muted uppercase tracking-wider mt-1">Accuracy</div>
                      </div>
                      <div className="text-center w-16">
                        <div className="text-sm font-black text-content-secondary">{creator.totalClaims ?? 0}</div>
                        <div className="text-[9px] font-bold text-content-muted uppercase tracking-wider">Claims</div>
                      </div>
                      <div className="w-12">
                        <RankChange change={creator.rankChange ?? 0} />
                      </div>
                    </div>

                    {/* Arrow */}
                    <svg className="w-5 h-5 text-content-muted group-hover:text-accent transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Footer note */}
            <div className="text-center py-8">
              <p className="text-xs text-content-muted font-medium">
                Rankings based on verified claim accuracy. Minimum 5 scored claims to qualify.
              </p>
            </div>

            {/* Creator Poll */}
            <CreatorPollSection />
          </>
        )}
      </section>
    </div>
  );
}
