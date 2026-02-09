import React from "react";

interface VerdictBarProps {
  distribution: Record<string, number>;
  size?: "sm" | "md" | "lg";
  showLabels?: boolean;
}

const sizeClasses: Record<string, string> = {
  sm: "h-2",
  md: "h-3",
  lg: "h-4",
};

const verdictConfig: Record<string, { color: string; label: string }> = {
  verified: { color: "var(--verdict-verified)", label: "Verified" },
  plausible_unverified: { color: "var(--verdict-plausible)", label: "Plausible" },
  speculative: { color: "var(--verdict-speculative)", label: "Speculative" },
  misleading: { color: "var(--verdict-misleading)", label: "Misleading" },
};

export const VerdictBar: React.FC<VerdictBarProps> = ({
  distribution,
  size = "md",
  showLabels = false,
}) => {
  const entries = Object.entries(distribution).filter(([, count]) => count > 0);
  const total = entries.reduce((sum, [, count]) => sum + count, 0);
  if (total === 0) return null;

  const segments = entries.map(([key, count]) => ({
    key,
    count,
    pct: Math.round((count / total) * 100),
    color: verdictConfig[key]?.color || "var(--text-muted)",
    label: verdictConfig[key]?.label || key,
  }));

  return (
    <div className="w-full">
      {showLabels && (
        <div className="flex justify-between text-[10px] font-semibold mb-1.5">
          {segments.map((seg) => (
            <span key={seg.key} style={{ color: seg.color }}>
              {seg.pct}% {seg.label}
            </span>
          ))}
        </div>
      )}
      <div className={`flex w-full rounded-full overflow-hidden ${sizeClasses[size]}`}>
        {segments.map((seg) => (
          <div
            key={seg.key}
            className="transition-all duration-300"
            style={{ width: `${seg.pct}%`, backgroundColor: seg.color }}
          />
        ))}
      </div>
      <div className="flex items-center gap-5 mt-3">
        {segments.map((seg) => (
          <div key={seg.key} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: seg.color }}
            />
            <span className="text-[11px] font-bold text-content-primary">
              {seg.label} {seg.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
