import React from "react";

type CreatorTier = "diamond" | "gold" | "silver" | "bronze" | "unranked";

interface TierBadgeProps {
  tier: CreatorTier;
  size?: "sm" | "md";
}

const TIER_CONFIG: Record<CreatorTier, { emoji: string; label: string; classes: string }> = {
  diamond: {
    emoji: "💎",
    label: "Diamond",
    classes: "bg-gradient-to-r from-purple-500/15 to-violet-500/15 text-purple-400 border-purple-500/30",
  },
  gold: {
    emoji: "🥇",
    label: "Gold",
    classes: "bg-gradient-to-r from-amber-500/15 to-yellow-500/15 text-amber-400 border-amber-500/30",
  },
  silver: {
    emoji: "🥈",
    label: "Silver",
    classes: "bg-slate-100 text-slate-500 border-slate-200",
  },
  bronze: {
    emoji: "🥉",
    label: "Bronze",
    classes: "bg-orange-50 text-orange-500 border-orange-200",
  },
  unranked: {
    emoji: "—",
    label: "Unranked",
    classes: "bg-slate-50 text-slate-400 border-slate-200",
  },
};

const TierBadge: React.FC<TierBadgeProps> = ({ tier, size = "md" }) => {
  const config = TIER_CONFIG[tier] || TIER_CONFIG.unranked;
  const sizeClasses = size === "sm"
    ? "text-[9px] px-1.5 py-0.5 gap-0.5"
    : "text-[10px] px-2.5 py-1 gap-1";

  return (
    <span className={`inline-flex items-center ${sizeClasses} rounded-lg border font-black uppercase tracking-wider ${config.classes}`}>
      <span>{config.emoji}</span>
      <span>{config.label}</span>
    </span>
  );
};

export default TierBadge;
