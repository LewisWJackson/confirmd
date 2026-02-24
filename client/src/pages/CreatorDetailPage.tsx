import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { fetchCreatorDetail, fetchCreatorClaims } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import UpgradePrompt from "../components/UpgradePrompt";
import TierBadge from "../components/TierBadge";
import RadarChart from "../components/RadarChart";

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

function accuracyColor(pct: number): string {
  if (pct >= 75) return "text-emerald-500";
  if (pct >= 60) return "text-amber-500";
  if (pct >= 45) return "text-orange-500";
  return "text-red-500";
}

function statusBadge(status: string) {
  const map: Record<string, { label: string; classes: string }> = {
    verified_true: { label: "Verified True", classes: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    verified_false: { label: "Verified False", classes: "bg-red-500/10 text-red-400 border-red-500/20" },
    partially_true: { label: "Partially True", classes: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    pending: { label: "Pending", classes: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
    expired: { label: "Expired", classes: "bg-surface-primary text-content-muted border-border" },
    unverifiable: { label: "Unverifiable", classes: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  };
  const cfg = map[status] || { label: status, classes: "bg-surface-primary text-content-muted border-border" };
  return (
    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border ${cfg.classes}`}>
      {cfg.label}
    </span>
  );
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return `${Math.floor(diffDay / 7)}w ago`;
}

/* Tier → glow ring color */
function tierGlowClass(tier: string): string {
  switch (tier) {
    case "diamond": return "ring-cyan-400/60 shadow-[0_0_24px_rgba(34,211,238,0.35)]";
    case "gold":    return "ring-amber-400/60 shadow-[0_0_24px_rgba(251,191,36,0.35)]";
    case "silver":  return "ring-slate-400/60 shadow-[0_0_16px_rgba(148,163,184,0.3)]";
    case "bronze":  return "ring-amber-600/60 shadow-[0_0_16px_rgba(180,83,9,0.3)]";
    default:        return "ring-border";
  }
}

function tierGradient(tier: string): string {
  switch (tier) {
    case "diamond": return "from-cyan-500/20 via-purple-500/10 to-transparent";
    case "gold":    return "from-amber-500/20 via-yellow-500/10 to-transparent";
    case "silver":  return "from-slate-400/15 via-slate-500/5 to-transparent";
    case "bronze":  return "from-amber-700/20 via-orange-500/10 to-transparent";
    default:        return "from-accent/10 to-transparent";
  }
}

/* ------------------------------------------------------------------ */
/* Consistency badge                                                    */
/* ------------------------------------------------------------------ */

function ConsistencyBadge({ consistency }: { consistency: string }) {
  if (!consistency || consistency === "first_occurrence") return null;
  const map: Record<string, { label: string; classes: string }> = {
    repeated: { label: "Repeated claim", classes: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    evolved:  { label: "Evolved view",   classes: "bg-blue-500/10  text-blue-400  border-blue-500/20"  },
    reversed: { label: "Reversed stance", classes: "bg-red-500/10   text-red-400   border-red-500/20"   },
  };
  const cfg = map[consistency];
  if (!cfg) return null;
  return (
    <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full border ${cfg.classes}`}>
      {cfg.label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Animated counter                                                     */
/* ------------------------------------------------------------------ */

function AnimatedNumber({ target, suffix = "" }: { target: number | null | undefined; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const val = target ?? 0;

  useEffect(() => {
    if (val === 0) { setDisplay(0); return; }
    const duration = 1200;
    const steps = 50;
    const interval = duration / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * val));
      if (step >= steps) clearInterval(timer);
    }, interval);
    return () => clearInterval(timer);
  }, [val]);

  return <>{display}{suffix}</>;
}

/* ------------------------------------------------------------------ */
/* Animation variants                                                   */
/* ------------------------------------------------------------------ */

const pageVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

const slideFromRight = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5, delay: 0.25, ease: "easeOut" } },
};

/* ------------------------------------------------------------------ */
/* Main page                                                            */
/* ------------------------------------------------------------------ */

export default function CreatorDetailPage() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const { tier } = useAuth();
  const [claimFilter, setClaimFilter] = useState("all");

  const { data: creator, isLoading: creatorLoading } = useQuery({
    queryKey: ["creator", params.id],
    queryFn: () => fetchCreatorDetail(params.id!),
    enabled: !!params.id,
  });

  const { data: claims = [] } = useQuery({
    queryKey: ["creator-claims", params.id],
    queryFn: () => fetchCreatorClaims(params.id!),
    enabled: !!params.id,
  });

  /* Gate behind tribune tier */
  if (tier === "free") {
    return (
      <div className="animate-in fade-in duration-1000 relative z-10">
        <section className="max-w-7xl mx-auto px-6 md:px-12 pt-16 pb-8">
          <button
            onClick={() => setLocation("/creators")}
            className="text-sm font-bold text-content-muted hover:text-accent transition-colors mb-6 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Creators
          </button>
          <h1 className="text-4xl font-black tracking-tighter text-content-primary mt-2">Creator Profile</h1>
        </section>
        <section className="max-w-2xl mx-auto px-6 md:px-12 pb-24">
          <UpgradePrompt
            requiredTier="plus"
            featureName="Creator Profiles"
            description="View detailed creator profiles with accuracy breakdowns, radar charts, claim histories, and more."
          />
        </section>
      </div>
    );
  }

  if (creatorLoading) {
    return (
      <div className="animate-in fade-in duration-1000 relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-16">
        <div className="animate-pulse space-y-8">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 bg-surface-card-hover rounded-2xl" />
            <div className="flex-1 space-y-3">
              <div className="h-8 bg-surface-card-hover rounded-lg w-1/3" />
              <div className="h-4 bg-surface-card-hover rounded-lg w-1/4" />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 bg-surface-card-hover rounded-2xl" />)}
          </div>
          <div className="h-64 bg-surface-card-hover rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-32 text-center">
        <h1 className="text-3xl font-black text-content-primary tracking-tight">Creator not found</h1>
        <button onClick={() => setLocation("/creators")} className="text-accent text-sm font-bold mt-4 hover:text-accent-hover">
          Back to Creators
        </button>
      </div>
    );
  }

  const profile = creator.profile || {};
  const radarScores = {
    price: profile.priceAccuracy || 0,
    timeline: profile.timelineAccuracy || 0,
    regulatory: profile.regulatoryAccuracy || 0,
    partnership: profile.partnershipAccuracy || 0,
    technology: profile.technologyAccuracy || 0,
    market: profile.marketAccuracy || 0,
  };

  const filteredClaims = claimFilter === "all"
    ? claims
    : claims.filter((c: any) => c.status === claimFilter);

  const videos = creator.videos || [];
  const creatorTier = creator.tier || "unranked";

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="relative z-10"
    >
      {/* Hero banner strip */}
      <div className={`w-full h-32 bg-gradient-to-r ${tierGradient(creatorTier)} border-b border-border/50 relative overflow-hidden`}>
        <div className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: "radial-gradient(circle at 20% 50%, rgba(139,92,246,0.15) 0%, transparent 60%), radial-gradient(circle at 80% 50%, rgba(59,130,246,0.1) 0%, transparent 60%)",
          }}
        />
      </div>

      <section className="max-w-7xl mx-auto px-6 md:px-12 pb-8 -mt-16">
        {/* Back nav */}
        <button
          onClick={() => setLocation("/creators")}
          className="text-sm font-bold text-content-muted hover:text-accent transition-colors mb-6 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Creators
        </button>

        {/* Creator Header */}
        <div className="flex flex-col md:flex-row items-start gap-6 mb-10">
          {/* Avatar with tier glow ring */}
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className={`w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 ring-2 ${tierGlowClass(creatorTier)} bg-surface-card-hover`}
          >
            {creator.avatarUrl ? (
              <img src={creator.avatarUrl} alt={creator.channelName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl font-black text-content-muted">
                {(creator.channelName || "?").charAt(0)}
              </div>
            )}
          </motion.div>

          <div className="flex-1">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="flex items-center gap-3 flex-wrap"
            >
              <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-content-primary">
                {creator.channelName}
              </h1>
              {/* Animated tier badge */}
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.35, delay: 0.2, type: "spring", stiffness: 300 }}
              >
                <TierBadge tier={creatorTier} />
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="flex items-center gap-4 mt-2 text-sm text-content-muted font-medium"
            >
              {creator.channelHandle && <span>{creator.channelHandle}</span>}
              {creator.subscriberCount && (
                <span>{(creator.subscriberCount / 1000).toFixed(0)}K subscribers</span>
              )}
              {creator.niche && <span className="text-accent">{creator.niche}</span>}
            </motion.div>

            {profile.currentStance && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.3 }}
                className="mt-3"
              >
                <span className={`text-xs font-bold px-3 py-1 rounded-lg border ${
                  profile.currentSentiment === "bullish"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : profile.currentSentiment === "bearish"
                    ? "bg-red-500/10 text-red-400 border-red-500/20"
                    : "bg-surface-primary text-content-muted border-border"
                }`}>
                  {profile.currentSentiment === "bullish" ? "↗" : profile.currentSentiment === "bearish" ? "↘" : "→"}{" "}
                  {profile.currentStance}
                </span>
              </motion.div>
            )}
          </div>
        </div>

        {/* Stats Grid + Radar */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 mb-10">
          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.15 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            <div className="rounded-2xl border border-border bg-surface-card p-5 text-center">
              <div className={`text-3xl font-black ${accuracyColor(creator.overallAccuracy || 0)}`}>
                <AnimatedNumber target={creator.overallAccuracy} suffix="%" />
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-content-muted mt-1">Accuracy</div>
            </div>
            <div className="rounded-2xl border border-border bg-surface-card p-5 text-center">
              <div className="text-3xl font-black text-emerald-500">
                <AnimatedNumber target={profile.verifiedTrue ?? 0} />
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-content-muted mt-1">Verified True</div>
            </div>
            <div className="rounded-2xl border border-border bg-surface-card p-5 text-center">
              <div className="text-3xl font-black text-red-500">
                <AnimatedNumber target={profile.verifiedFalse ?? 0} />
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-content-muted mt-1">Verified False</div>
            </div>
            <div className="rounded-2xl border border-border bg-surface-card p-5 text-center">
              <div className="text-3xl font-black text-blue-400">
                <AnimatedNumber target={profile.pending ?? creator.totalClaims ?? 0} />
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-content-muted mt-1">Total Claims</div>
            </div>
            <div className="rounded-2xl border border-border bg-surface-card p-5 text-center col-span-2">
              <div className="text-3xl font-black text-accent">
                {creator.reliabilityScore != null
                  ? <AnimatedNumber target={creator.reliabilityScore} />
                  : "—"}
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-content-muted mt-1">Reliability Score</div>
            </div>
            <div className="rounded-2xl border border-border bg-surface-card p-5 text-center col-span-2">
              <div className="text-3xl font-black text-purple-400">
                {creator.rankOverall != null ? <>#{<AnimatedNumber target={creator.rankOverall} />}</> : "—"}
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-content-muted mt-1">Leaderboard Rank</div>
            </div>
          </motion.div>

          {/* Radar Chart — slides in from right */}
          <motion.div
            variants={slideFromRight}
            initial="hidden"
            animate="visible"
            className="rounded-2xl border border-border bg-surface-card p-6"
          >
            <h3 className="text-[10px] font-black uppercase tracking-widest text-content-muted mb-4">Accuracy by Category</h3>
            <RadarChart scores={radarScores} />
          </motion.div>
        </div>

        {/* Recent Videos */}
        {videos.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="mb-10"
          >
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-content-muted mb-4">Recent Videos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {videos.slice(0, 6).map((video: any) => (
                <div key={video.id} className="rounded-2xl border border-border bg-surface-card p-5 hover:shadow-sm transition-all">
                  <h4 className="text-sm font-bold text-content-primary line-clamp-2 mb-2">{video.title}</h4>
                  <div className="flex items-center justify-between text-xs text-content-muted">
                    <span>{video.publishedAt ? new Date(video.publishedAt).toLocaleDateString() : ""}</span>
                    <span className="text-[10px] font-black text-accent">
                      {video.claimCount ?? 0} claims
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Claims */}
        <div className="mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-content-muted">
              Claims ({claims.length})
            </h2>
            <div className="flex flex-wrap gap-2">
              {["all", "verified_true", "verified_false", "partially_true", "pending"].map((f) => (
                <button
                  key={f}
                  onClick={() => setClaimFilter(f)}
                  className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                    claimFilter === f
                      ? "bg-accent text-white shadow-lg"
                      : "bg-surface-card-hover text-content-secondary hover:bg-surface-card-hover"
                  }`}
                >
                  {f === "all" ? "All" : f.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </div>

          {filteredClaims.length === 0 ? (
            <div className="rounded-2xl border border-border bg-surface-card p-12 text-center">
              <p className="text-sm text-content-muted font-medium">No claims found.</p>
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-3"
            >
              <AnimatePresence>
                {filteredClaims.map((claim: any) => (
                  <motion.div
                    key={claim.id}
                    variants={itemVariants}
                    onClick={() => claim.id && setLocation(`/claims/${claim.id}`)}
                    className="rounded-2xl border border-border bg-surface-card p-5 hover:border-accent/30 hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-content-primary group-hover:text-accent transition-colors">
                          {claim.claimText || claim.text}
                        </p>
                        {claim.consistencyNote && (
                          <p className="text-[11px] text-content-muted italic mt-1">{claim.consistencyNote}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {statusBadge(claim.status)}
                          {claim.consistency && claim.consistency !== "first_occurrence" && (
                            <ConsistencyBadge consistency={claim.consistency} />
                          )}
                          {claim.category && (
                            <span className="text-[9px] font-bold text-content-muted uppercase tracking-wider">
                              {claim.category}
                            </span>
                          )}
                          {claim.videoTimestamp && (
                            <span className="text-[9px] font-medium text-content-muted">
                              @{claim.videoTimestamp}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-content-muted whitespace-nowrap">
                        {claim.createdAt ? timeAgo(claim.createdAt) : ""}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </section>
    </motion.div>
  );
}
