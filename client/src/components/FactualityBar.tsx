import React from "react";

interface FactualityBarProps {
  distribution: {
    high: number;
    medium: number;
    low: number;
  };
  size?: "sm" | "md" | "lg";
  showLabels?: boolean;
}

const sizeClasses: Record<string, string> = {
  sm: "h-2",
  md: "h-3",
  lg: "h-4",
};

export const FactualityBar: React.FC<FactualityBarProps> = ({
  distribution,
  size = "md",
  showLabels = false,
}) => {
  const total = distribution.high + distribution.medium + distribution.low;
  if (total === 0) return null;

  const pctHigh = Math.round((distribution.high / total) * 100);
  const pctMixed = Math.round((distribution.medium / total) * 100);
  const pctLow = Math.round((distribution.low / total) * 100);

  return (
    <div className="w-full">
      {showLabels && (
        <div className="flex justify-between text-[10px] font-semibold mb-1.5">
          {pctHigh > 0 && (
            <span className="text-[var(--factuality-high)]">{pctHigh}% High</span>
          )}
          {pctMixed > 0 && (
            <span className="text-[var(--factuality-mixed)]">{pctMixed}% Mixed</span>
          )}
          {pctLow > 0 && (
            <span className="text-[var(--factuality-low)]">{pctLow}% Low</span>
          )}
        </div>
      )}
      <div className={`flex w-full rounded-full overflow-hidden ${sizeClasses[size]}`}>
        {pctHigh > 0 && (
          <div
            className="bg-[var(--factuality-high)] transition-all duration-300"
            style={{ width: `${pctHigh}%` }}
          />
        )}
        {pctMixed > 0 && (
          <div
            className="bg-[var(--factuality-mixed)] transition-all duration-300"
            style={{ width: `${pctMixed}%` }}
          />
        )}
        {pctLow > 0 && (
          <div
            className="bg-[var(--factuality-low)] transition-all duration-300"
            style={{ width: `${pctLow}%` }}
          />
        )}
      </div>
    </div>
  );
};
