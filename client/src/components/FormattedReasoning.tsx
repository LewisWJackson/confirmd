import React from "react";

interface FormattedReasoningProps {
  text: string;
  verdictLabel?: string;
}

/**
 * Renders structured reasoning text with proper formatting.
 * Parses **Section Header**: patterns, numbered lists, and bullet points.
 * Falls back to simple paragraph rendering for unstructured text.
 */
export function FormattedReasoning({ text, verdictLabel }: FormattedReasoningProps) {
  if (!text) return null;

  // Check if text contains structured markdown patterns
  const hasStructuredFormat = /\*\*[^*]+\*\*\s*:/.test(text);

  if (!hasStructuredFormat) {
    return <p className="text-sm text-content-secondary leading-relaxed">{text}</p>;
  }

  // Split on double newlines for paragraph-level blocks
  const blocks = text.split(/\n\n/).filter((b) => b.trim());

  return (
    <div className="space-y-2 text-sm text-content-secondary leading-relaxed">
      {blocks.map((block, blockIdx) => {
        const lines = block.split("\n").filter((l) => l.trim());

        // Check if the first line is a section header
        const headerMatch = lines[0]?.match(/^\*\*([^*]+)\*\*\s*(?:\(([^)]+)\))?\s*:\s*(.*)/);

        if (headerMatch) {
          const headerText = headerMatch[1];
          const parenthetical = headerMatch[2];
          const inlineContent = headerMatch[3]?.trim();
          const remainingLines = lines.slice(1);

          // Check if remaining lines form a list
          const isList = remainingLines.length > 0 && remainingLines.every(
            (l) => /^\d+\.\s/.test(l.trim()) || /^[-*]\s/.test(l.trim())
          );
          const isNumberedList = remainingLines.length > 0 && remainingLines.every(
            (l) => /^\d+\.\s/.test(l.trim())
          );

          return (
            <div key={blockIdx}>
              <h4 className="text-xs font-bold text-content-primary uppercase tracking-wide mb-1">
                {headerText}
                {parenthetical && (
                  <span className="text-content-muted font-medium normal-case tracking-normal"> ({parenthetical})</span>
                )}
              </h4>
              {inlineContent && (
                <p className="text-content-secondary">{inlineContent}</p>
              )}
              {isList && (
                isNumberedList ? (
                  <ol className="list-decimal list-inside space-y-0.5 text-content-secondary">
                    {remainingLines.map((line, i) => (
                      <li key={i}>{line.replace(/^\d+\.\s*/, "")}</li>
                    ))}
                  </ol>
                ) : (
                  <ul className="list-disc list-inside space-y-0.5 text-content-secondary">
                    {remainingLines.map((line, i) => (
                      <li key={i}>{line.replace(/^[-*]\s*/, "")}</li>
                    ))}
                  </ul>
                )
              )}
              {!isList && remainingLines.length > 0 && (
                <p className="text-content-secondary">{remainingLines.join(" ")}</p>
              )}
            </div>
          );
        }

        // Non-header block — render as plain paragraph
        return (
          <p key={blockIdx} className="text-content-secondary">
            {block}
          </p>
        );
      })}
    </div>
  );
}
