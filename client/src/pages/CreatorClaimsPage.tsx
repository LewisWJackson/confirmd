import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { fetchCreatorFeed, fetchCreatorLeaderboard } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import TierBadge from "../components/TierBadge";

const FREE_VISIBLE = 5;
const FREE_BLURRED = 4;

/* --- Helpers -------------------------------------------------- */

function accuracyColor(pct: number): string {
  if (pct >= 75) return "text-emerald-600";
  if (pct >= 60) return "text-amber-500";
  if (pct >= 45) return "text-orange-500";
  return "text-red-500";
}

function ConfidenceBadge({ confidence }: { confidence: string }) {
  const styles: Record<string, string> = {
    strong: "bg-red-50 text-red-600 border-red-200",
    medium: "bg-amber-50 text-amber-600 border-amber-200",
    weak: "bg-surface-card text-content-muted border-border",
  };
  const key = (confidence || "").toLowerCase();
  return (
    <span
      className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-md border ${styles[key] || styles.weak}`}
    >
      {confidence || "Unknown"}
    </span>
  );
}

function CategoryPill({ category }: { category: string }) {
  return (
    <span className="px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-lg bg-surface-primary text-content-muted border border-border">
      {category}
    </span>
  );
}

/* --- Claim Card ----------------------------------------------- */

function ClaimCard({
  prediction,
  onClick,
}: {
  prediction: any;
  onClick: () => void;
}) {
  const creator = prediction.creator;
  const video = prediction.video;

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-2xl border border-border bg-surface-card p-5 hover:shadow-[0_6px_30px_rgba(0,0,0,0.06)] transition-all duration-500 hover:-translate-y-0.5"
    >
      <div className="flex items-start gap-4">
        {/* Left: content */}
        <div className="flex-1 min-w-0">
          {/* Creator row */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full overflow-hidden bg-surface-card-hover flex-shrink-0 border border-border">
              {creator?.avatarUrl ? (
                <img
                  src={creator.avatarUrl}
                  alt={creator.channelName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm font-black text-content-muted">
                  {(creator?.channelName || "?").charAt(0)}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-content-primary truncate group-hover:text-accent transition-colors">
                  {creator?.channelName || "Unknown"}
                </span>
                <TierBadge tier={creator?.tier || "unranked"} size="sm" />
              </div>
              {creator?.overallAccuracy != null && (
                <span
                  className={`text-[10px] font-bold ${accuracyColor(creator.overallAccuracy)}`}
                >
                  {creator.overallAccuracy}% accuracy
                </span>
              )}
            </div>
          </div>

          {/* Claim text */}
          <p className="text-sm font-medium text-content-primary leading-relaxed mb-3 line-clamp-2">
            {prediction.claimText}
          </p>

          {/* Badges row */}
          <div className="flex items-center gap-2 flex-wrap">
            <ConfidenceBadge confidence={prediction.confidenceLanguage} />
            {prediction.category && (
              <CategoryPill category={prediction.category} />
            )}
          </div>
        </div>

        {/* Right: video thumbnail */}
        {video?.thumbnailUrl && (
          <div className="flex-shrink-0 w-24 h-16 rounded-xl overflow-hidden bg-surface-card-hover border border-border">
            <img
              src={video.thumbnailUrl}
              alt={video.title || ""}
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>
    </div>
  );
}

/* --- Upgrade CTA Card ----------------------------------------- */

function UpgradeCTA({
  heading,
  description,
}: {
  heading: string;
  description: string;
}) {
  const [, setLocation] = useLocation();

  return (
    <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-8 text-center">
      <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-4">
        <svg
          className="w-6 h-6 text-amber-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-black text-content-primary tracking-tight mb-2">
        {heading}
      </h3>
      <p className="text-sm text-content-secondary font-medium max-w-md mx-auto mb-6">
        {description}
      </p>
      <button
        onClick={() => setLocation("/plus")}
        className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg hover:shadow-xl"
      >
        Upgrade to Confirmd Plus
      </button>
    </div>
  );
}

/* --- Leaderboard Row ------------------------------------------ */

function LeaderboardRow({
  creator,
  rank,
  onClick,
}: {
  creator: any;
  rank: number;
  onClick: () => void;
}) {
  const medals: Record<number, string> = {
    1: "bg-amber-400 text-white",
    2: "bg-slate-400 text-white",
    3: "bg-orange-400 text-white",
  };

  return (
    <div
      onClick={onClick}
      className="group flex items-center gap-4 p-4 rounded-2xl border border-border bg-surface-card hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)] transition-all cursor-pointer"
    >
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-[11px] font-black ${medals[rank] || "bg-surface-primary text-content-secondary border border-border"}`}
      >
        {rank}
      </div>
      <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-card-hover flex-shrink-0">
        {creator.avatarUrl ? (
          <img
            src={creator.avatarUrl}
            alt={creator.channelName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-sm font-black text-content-muted">
            {(creator.channelName || "?").charAt(0)}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-black text-content-primary truncate group-hover:text-accent transition-colors">
          {creator.channelName}
        </span>
      </div>
      <div className={`text-lg font-black ${accuracyColor(creator.overallAccuracy || 0)}`}>
        {creator.overallAccuracy ?? 0}%
      </div>
    </div>
  );
}

/* --- Loading Skeleton ----------------------------------------- */

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="rounded-2xl border border-border bg-surface-card p-5 animate-pulse"
        >
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 bg-surface-card-hover rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-surface-card-hover rounded-lg w-1/3 mb-1" />
                  <div className="h-3 bg-surface-card-hover rounded-lg w-1/5" />
                </div>
              </div>
              <div className="h-4 bg-surface-card-hover rounded-lg w-3/4 mb-2" />
              <div className="h-4 bg-surface-card-hover rounded-lg w-1/2" />
            </div>
            <div className="w-24 h-16 bg-surface-card-hover rounded-xl flex-shrink-0" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* --- Main Page ------------------------------------------------ */

export default function CreatorClaimsPage() {
  const [, setLocation] = useLocation();
  const { tier } = useAuth();
  const isPaid = tier !== "free";

  const { data: predictions = [], isLoading: feedLoading } = useQuery({
    queryKey: ["creator-feed", "claims-page"],
    queryFn: () => fetchCreatorFeed({ limit: 50 }),
  });

  const { data: leaderboard = [], isLoading: lbLoading } = useQuery({
    queryKey: ["creators-leaderboard"],
    queryFn: fetchCreatorLeaderboard,
  });

  // Deduplicate predictions by creator (one per creator)
  const uniquePredictions = useMemo(() => {
    const seen = new Set<string>();
    const unique: any[] = [];
    for (const p of predictions) {
      const cid = p.creator?.id || p.creator?.channelName || "";
      if (seen.has(cid)) continue;
      seen.add(cid);
      unique.push(p);
    }
    return unique;
  }, [predictions]);

  const visibleClaims = isPaid
    ? uniquePredictions
    : uniquePredictions.slice(0, FREE_VISIBLE);
  const blurredClaims = isPaid
    ? []
    : uniquePredictions.slice(FREE_VISIBLE, FREE_VISIBLE + FREE_BLURRED);

  const visibleLeaderboard = isPaid ? leaderboard : leaderboard.slice(0, 3);
  const blurredLeaderboard = isPaid ? [] : leaderboard.slice(3, 7);

  return (
    <div className="animate-in fade-in duration-1000 relative z-10">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 pt-16 pb-8">
        <span className="text-[10px] font-black tracking-[0.5em] text-accent uppercase">
          Creator Intelligence
        </span>
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-content-primary mt-2 leading-[0.95]">
          Creator Claims
        </h1>
        <p className="text-lg text-content-secondary mt-4 font-medium max-w-xl">
          Track what crypto creators are predicting and how accurate they are.
        </p>
      </section>

      {/* Claims List */}
      <section className="max-w-3xl mx-auto px-6 md:px-12 pb-12">
        {feedLoading ? (
          <LoadingSkeleton />
        ) : uniquePredictions.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface-card p-16 text-center">
            <h3 className="text-xl font-black text-content-primary tracking-tight">
              No creator claims yet
            </h3>
            <p className="text-sm text-content-secondary mt-2 font-medium">
              Creator predictions will appear here once data is available.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Fully visible claims */}
            {visibleClaims.map((prediction: any) => (
              <ClaimCard
                key={prediction.id}
                prediction={prediction}
                onClick={() =>
                  setLocation(
                    `/creators/${prediction.creator?.id || prediction.id}`
                  )
                }
              />
            ))}

            {/* Blurred claims (free users only) */}
            {!isPaid && blurredClaims.length > 0 && (
              <div className="relative">
                <div className="space-y-4 blur-[6px] pointer-events-none select-none">
                  {blurredClaims.map((prediction: any) => (
                    <ClaimCard
                      key={prediction.id}
                      prediction={prediction}
                      onClick={() => {}}
                    />
                  ))}
                </div>

                {/* Gradient fade overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-surface-primary rounded-2xl" />
              </div>
            )}

            {/* Upgrade CTA (free users only) */}
            {!isPaid && (
              <UpgradeCTA
                heading="Unlock all creator claims"
                description="Get Confirmd Plus to see every prediction, track creator accuracy, and access full creator profiles."
              />
            )}
          </div>
        )}
      </section>

      {/* Leaderboard Teaser Section */}
      <section className="max-w-3xl mx-auto px-6 md:px-12 pb-24">
        <div className="flex items-end justify-between mb-6">
          <div>
            <span className="text-[10px] font-black tracking-[0.5em] text-accent uppercase">
              Rankings
            </span>
            <h2 className="text-2xl md:text-3xl font-black tracking-tighter text-content-primary mt-1 leading-[0.95]">
              Creator Leaderboard
            </h2>
          </div>
          {isPaid && (
            <button
              onClick={() => setLocation("/leaderboard")}
              className="px-5 py-2.5 bg-surface-card text-content-primary text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-accent hover:text-white transition-all shadow-lg"
            >
              View Full Leaderboard
            </button>
          )}
        </div>

        {lbLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-border bg-surface-card p-4 animate-pulse flex items-center gap-4"
              >
                <div className="w-8 h-8 bg-surface-card-hover rounded-lg" />
                <div className="w-10 h-10 bg-surface-card-hover rounded-full" />
                <div className="flex-1 h-4 bg-surface-card-hover rounded-lg w-1/3" />
                <div className="h-5 bg-surface-card-hover rounded-lg w-12" />
              </div>
            ))}
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface-card p-12 text-center">
            <h3 className="text-lg font-black text-content-primary tracking-tight">
              No ranked creators yet
            </h3>
            <p className="text-sm text-content-secondary mt-2 font-medium">
              Rankings will appear once creators have enough verified claims.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Visible leaderboard rows */}
            {visibleLeaderboard.map((creator: any, i: number) => (
              <LeaderboardRow
                key={creator.id}
                creator={creator}
                rank={i + 1}
                onClick={() => setLocation(`/creators/${creator.id}`)}
              />
            ))}

            {/* Blurred leaderboard rows (free users only) */}
            {!isPaid && blurredLeaderboard.length > 0 && (
              <div className="relative">
                <div className="space-y-3 blur-[6px] pointer-events-none select-none">
                  {blurredLeaderboard.map((creator: any, i: number) => (
                    <LeaderboardRow
                      key={creator.id}
                      creator={creator}
                      rank={i + 4}
                      onClick={() => {}}
                    />
                  ))}
                </div>

                {/* Gradient fade overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-surface-primary rounded-2xl" />
              </div>
            )}

            {/* Leaderboard Upgrade CTA (free users only) */}
            {!isPaid && (
              <UpgradeCTA
                heading="See the full leaderboard"
                description="Upgrade to Confirmd Plus for complete rankings and accuracy tracking."
              />
            )}
          </div>
        )}
      </section>
    </div>
  );
}
