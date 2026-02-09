import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { fetchCreatorFeed, fetchCreatorLeaderboard } from "../lib/api";
import { useAuth } from "../lib/auth-context";

const FREE_VISIBLE = 8;
const FREE_BLURRED = 4;

const CATEGORIES = ["All", "Markets", "Regulation", "DeFi", "Security", "Technology"];

/* --- Helpers -------------------------------------------------- */

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin} minutes ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hours ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay} days ago`;
  const diffWeek = Math.floor(diffDay / 7);
  if (diffWeek < 4) return `${diffWeek} weeks ago`;
  return `${Math.floor(diffDay / 30)} months ago`;
}

function accuracyColor(pct: number): string {
  if (pct >= 75) return "text-factuality-high";
  if (pct >= 60) return "text-factuality-mixed";
  return "text-factuality-low";
}

function confidenceColor(conf: string): string {
  const key = (conf || "").toLowerCase();
  if (key === "strong") return "bg-factuality-low";
  if (key === "medium") return "bg-factuality-mixed";
  return "bg-content-muted";
}

/* --- YouTube-style Video Card --------------------------------- */

function VideoCard({
  prediction,
  onClick,
}: {
  prediction: any;
  onClick: () => void;
}) {
  const creator = prediction.creator;
  const video = prediction.video;
  const confidence = (prediction.confidenceLanguage || "").toLowerCase();

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video rounded-xl overflow-hidden bg-surface-card mb-3">
        {/* Gradient placeholder with category visual */}
        <div className="absolute inset-0 bg-gradient-to-br from-surface-secondary via-surface-card to-surface-card-hover" />

        {/* Center play icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center group-hover:bg-accent/90 transition-colors">
            <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>

        {/* Video title overlay at bottom */}
        {video?.title && (
          <div className="absolute bottom-0 left-0 right-0 p-2.5 bg-gradient-to-t from-black/70 to-transparent">
            <p className="text-[10px] text-white/80 font-medium line-clamp-1">
              {video.title}
            </p>
          </div>
        )}

        {/* Confidence pill top-right */}
        {confidence && (
          <div className="absolute top-2 right-2">
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold text-white uppercase ${confidenceColor(confidence)}`}>
              {prediction.confidenceLanguage}
            </span>
          </div>
        )}

        {/* Category pill top-left */}
        {prediction.category && (
          <div className="absolute top-2 left-2">
            <span className="px-1.5 py-0.5 rounded bg-black/50 text-[9px] font-bold text-white uppercase backdrop-blur-sm">
              {prediction.category}
            </span>
          </div>
        )}
      </div>

      {/* Meta row: avatar + text */}
      <div className="flex gap-3">
        {/* Creator avatar */}
        <div className="w-9 h-9 rounded-full overflow-hidden bg-surface-card-hover flex-shrink-0 mt-0.5">
          {creator?.avatarUrl ? (
            <img
              src={creator.avatarUrl}
              alt={creator.channelName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm font-black text-content-muted bg-surface-card">
              {(creator?.channelName || "?").charAt(0)}
            </div>
          )}
        </div>

        {/* Title + channel info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-content-primary leading-snug line-clamp-2 group-hover:text-accent transition-colors">
            {prediction.claimText}
          </h3>
          <p className="text-[13px] text-content-muted mt-1 hover:text-content-secondary transition-colors">
            {creator?.channelName || "Unknown"}
          </p>
          <p className="text-[12px] text-content-muted">
            {creator?.overallAccuracy != null && (
              <span className={accuracyColor(creator.overallAccuracy)}>
                {Math.round(creator.overallAccuracy)}% accuracy
              </span>
            )}
            {creator?.overallAccuracy != null && prediction.createdAt && (
              <span className="mx-1">&middot;</span>
            )}
            {prediction.createdAt && (
              <span>{timeAgo(prediction.createdAt)}</span>
            )}
          </p>
        </div>
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
    <div className="col-span-full rounded-xl border border-accent/30 bg-accent/5 p-8 text-center">
      <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
        <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <h3 className="text-lg font-bold text-content-primary mb-2">{heading}</h3>
      <p className="text-sm text-content-secondary max-w-md mx-auto mb-6">{description}</p>
      <button
        onClick={() => setLocation("/plus")}
        className="px-6 py-3 bg-accent text-accent-text text-sm font-bold rounded-full hover:bg-accent-hover transition-all"
      >
        Upgrade to Confirmd+
      </button>
    </div>
  );
}

/* --- Leaderboard Channel Card --------------------------------- */

function LeaderboardChannel({
  creator,
  rank,
  onClick,
}: {
  creator: any;
  rank: number;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="group flex items-center gap-3 py-2 cursor-pointer"
    >
      <span className="text-[12px] font-bold text-content-muted w-5 text-right flex-shrink-0">
        {rank}
      </span>
      <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-card-hover flex-shrink-0">
        {creator.avatarUrl ? (
          <img
            src={creator.avatarUrl}
            alt={creator.channelName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs font-black text-content-muted">
            {(creator.channelName || "?").charAt(0)}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-[13px] font-semibold text-content-primary group-hover:text-accent transition-colors line-clamp-1">
          {creator.channelName}
        </span>
        <span className="text-[11px] text-content-muted block">
          {creator.totalClaims ?? 0} claims
        </span>
      </div>
      <span className={`text-sm font-bold ${accuracyColor(creator.overallAccuracy || 0)}`}>
        {creator.overallAccuracy ?? 0}%
      </span>
    </div>
  );
}

/* --- Loading Skeleton ----------------------------------------- */

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-video bg-surface-card rounded-xl mb-3" />
          <div className="flex gap-3">
            <div className="w-9 h-9 bg-surface-card rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-surface-card rounded w-full" />
              <div className="h-3 bg-surface-card rounded w-2/3" />
              <div className="h-3 bg-surface-card rounded w-1/2" />
            </div>
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
  const [activeCategory, setActiveCategory] = useState("All");

  const { data: predictions = [], isLoading: feedLoading } = useQuery({
    queryKey: ["creator-feed", "claims-page"],
    queryFn: () => fetchCreatorFeed({ limit: 50 }),
  });

  const { data: leaderboard = [], isLoading: lbLoading } = useQuery({
    queryKey: ["creators-leaderboard"],
    queryFn: fetchCreatorLeaderboard,
  });

  // All predictions (no creator dedup on this page — show all claims)
  const allPredictions = useMemo(() => {
    let items = predictions;
    if (activeCategory !== "All") {
      items = items.filter((p: any) => p.category === activeCategory);
    }
    return items;
  }, [predictions, activeCategory]);

  const visibleClaims = isPaid
    ? allPredictions
    : allPredictions.slice(0, FREE_VISIBLE);
  const blurredClaims = isPaid
    ? []
    : allPredictions.slice(FREE_VISIBLE, FREE_VISIBLE + FREE_BLURRED);

  const visibleLeaderboard = isPaid ? leaderboard : leaderboard.slice(0, 5);
  const blurredLeaderboard = isPaid ? [] : leaderboard.slice(5, 10);

  return (
    <div className="animate-in fade-in duration-700 min-h-screen bg-surface-primary">
      {/* Category filter chips — YouTube style */}
      <div className="sticky top-0 z-20 bg-surface-primary border-b border-border">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-3">
          <div className="flex gap-2.5 overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: "none" }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-[13px] font-medium whitespace-nowrap transition-all ${
                  activeCategory === cat
                    ? "bg-content-primary text-surface-primary"
                    : "bg-surface-card text-content-primary hover:bg-surface-card-hover"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6">
        <div className="flex gap-6">
          {/* Video grid — main content */}
          <div className="flex-1 min-w-0">
            {feedLoading ? (
              <LoadingSkeleton />
            ) : allPredictions.length === 0 ? (
              <div className="rounded-xl bg-surface-card p-16 text-center">
                <svg className="w-16 h-16 text-content-muted mx-auto mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <h3 className="text-lg font-bold text-content-primary">
                  No creator claims yet
                </h3>
                <p className="text-sm text-content-muted mt-1">
                  {activeCategory !== "All"
                    ? `No claims in ${activeCategory}. Try a different category.`
                    : "Creator predictions will appear here once data is available."}
                </p>
              </div>
            ) : (
              <>
                {/* Video grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
                  {visibleClaims.map((prediction: any) => (
                    <VideoCard
                      key={prediction.id}
                      prediction={prediction}
                      onClick={() =>
                        setLocation(
                          `/creators/${prediction.creator?.id || prediction.id}`
                        )
                      }
                    />
                  ))}

                  {/* Blurred cards (free users) */}
                  {!isPaid && blurredClaims.length > 0 && (
                    <>
                      {blurredClaims.map((prediction: any) => (
                        <div key={prediction.id} className="blur-[6px] pointer-events-none select-none">
                          <VideoCard
                            prediction={prediction}
                            onClick={() => {}}
                          />
                        </div>
                      ))}
                    </>
                  )}
                </div>

                {/* Upgrade CTA below grid (free users) */}
                {!isPaid && (
                  <div className="mt-8">
                    <UpgradeCTA
                      heading="Unlock all creator claims"
                      description="Get Confirmd+ to see every prediction, track creator accuracy, and access full creator profiles."
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right sidebar — Leaderboard */}
          <aside className="hidden lg:block w-[300px] flex-shrink-0">
            <div className="sticky top-16">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-content-primary">
                  Top Creators
                </h2>
                {isPaid && (
                  <button
                    onClick={() => setLocation("/leaderboard")}
                    className="text-[12px] font-semibold text-accent hover:text-accent-hover transition-colors"
                  >
                    View all
                  </button>
                )}
              </div>

              {lbLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-3 animate-pulse">
                      <div className="w-5 h-4 bg-surface-card rounded" />
                      <div className="w-8 h-8 bg-surface-card rounded-full" />
                      <div className="flex-1 h-4 bg-surface-card rounded" />
                    </div>
                  ))}
                </div>
              ) : leaderboard.length === 0 ? (
                <p className="text-sm text-content-muted py-4">
                  No ranked creators yet.
                </p>
              ) : (
                <div>
                  <div className="divide-y divide-border">
                    {visibleLeaderboard.map((creator: any, i: number) => (
                      <LeaderboardChannel
                        key={creator.id}
                        creator={creator}
                        rank={i + 1}
                        onClick={() => setLocation(`/creators/${creator.id}`)}
                      />
                    ))}
                  </div>

                  {/* Blurred leaderboard (free users) */}
                  {!isPaid && blurredLeaderboard.length > 0 && (
                    <div className="relative mt-0">
                      <div className="divide-y divide-border blur-[5px] pointer-events-none select-none">
                        {blurredLeaderboard.map((creator: any, i: number) => (
                          <LeaderboardChannel
                            key={creator.id}
                            creator={creator}
                            rank={i + 6}
                            onClick={() => {}}
                          />
                        ))}
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-surface-primary" />
                    </div>
                  )}

                  {!isPaid && (
                    <button
                      onClick={() => setLocation("/plus")}
                      className="w-full mt-4 py-2.5 text-[12px] font-semibold text-accent border border-accent/30 rounded-full hover:bg-accent/5 transition-colors"
                    >
                      Unlock full leaderboard
                    </button>
                  )}
                </div>
              )}

              {/* Confirmd+ promo card */}
              <div className="mt-6 p-4 rounded-xl bg-surface-card border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-bold text-content-primary">Confirmd+</span>
                  <span className="text-[9px] font-bold text-accent bg-accent/10 px-1.5 py-0.5 rounded">PRO</span>
                </div>
                <p className="text-[12px] text-content-muted leading-relaxed mb-3">
                  Track every creator's predictions, see full accuracy history, and get real-time alerts.
                </p>
                <button
                  onClick={() => setLocation("/plus")}
                  className="w-full py-2 text-[12px] font-semibold bg-accent text-accent-text rounded-full hover:bg-accent-hover transition-colors"
                >
                  Get Confirmd+
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
