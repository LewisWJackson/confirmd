import React from "react";

const TYPE_STYLES: Record<string, string> = {
  regulator: "bg-accent/10 text-accent",
  publisher: "bg-surface-card-hover text-content-secondary",
  x_handle: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  telegram: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
};

export default function SourceTypeBadge({ type }: { type: string }) {
  const style = TYPE_STYLES[type] || TYPE_STYLES.publisher;
  return (
    <span className={`inline-block text-[9px] font-black uppercase tracking-[0.15em] px-2 py-0.5 rounded-full ${style}`}>
      {(type || "unknown").replace(/_/g, " ")}
    </span>
  );
}
