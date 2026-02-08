import React, { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { fetchSources } from "../lib/api";

function getGoogleFaviconUrl(domain: string): string {
  const clean = domain.replace(/^@/, "").replace(/^https?:\/\//, "").split("/")[0];
  return `https://www.google.com/s2/favicons?domain=${clean}&sz=128`;
}

function SourceLogo({
  src,
  alt,
  domain,
  fallbackLetter,
  className,
}: {
  src: string | null | undefined;
  alt: string;
  domain: string;
  fallbackLetter: string;
  className: string;
}) {
  const [imgState, setImgState] = useState<"primary" | "google" | "letter">(
    src ? "primary" : "letter"
  );

  const handleError = useCallback(() => {
    setImgState((prev) => {
      if (prev === "primary") return "google";
      return "letter";
    });
  }, []);

  if (imgState === "letter") {
    return (
      <span className="text-content-primary font-bold text-lg">{fallbackLetter}</span>
    );
  }

  const imgSrc = imgState === "primary" ? src! : getGoogleFaviconUrl(domain);
  return <img src={imgSrc} alt={alt} className={className} onError={handleError} />;
}

export default function SourcesPage() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");

  const { data: sources = [], isLoading } = useQuery({
    queryKey: ["sources"],
    queryFn: fetchSources,
  });

  // Trending: top 10 by track record
  const trending = useMemo(() => {
    return [...sources]
      .sort((a: any, b: any) => (b.score?.trackRecord || 0) - (a.score?.trackRecord || 0))
      .slice(0, 10);
  }, [sources]);

  // All sources alphabetical, filtered by search
  const alphabetical = useMemo(() => {
    let result = [...sources];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (s: any) =>
          s.displayName?.toLowerCase().includes(q) ||
          s.handleOrDomain?.toLowerCase().includes(q)
      );
    }
    return result.sort((a: any, b: any) =>
      (a.displayName || "").localeCompare(b.displayName || "")
    );
  }, [sources, search]);

  // Group alphabetical sources by first letter
  const grouped = useMemo(() => {
    const groups: Record<string, any[]> = {};
    alphabetical.forEach((s: any) => {
      const letter = (s.displayName || "?")[0].toUpperCase();
      if (!groups[letter]) groups[letter] = [];
      groups[letter].push(s);
    });
    return groups;
  }, [alphabetical]);

  return (
    <div className="min-h-screen bg-surface-primary">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-content-primary tracking-tight">
            Trending
          </h1>
        </div>

        {/* Trending Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-16">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <div
                key={i}
                className="border border-border rounded-xl p-4 animate-pulse bg-surface-card"
              >
                <div className="w-12 h-12 bg-surface-secondary rounded-full mx-auto mb-3" />
                <div className="h-4 bg-surface-secondary rounded w-3/4 mx-auto mb-2" />
                <div className="h-8 bg-surface-secondary rounded-lg w-8 mx-auto" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-16">
            {trending.map((source: any) => (
              <div
                key={source.id}
                className="border border-border rounded-xl p-4 bg-surface-card hover:bg-surface-card-hover transition-all cursor-pointer group flex flex-col items-center text-center"
                onClick={() => setLocation(`/sources/${source.id}`)}
              >
                {/* Source Logo */}
                <div className="w-14 h-14 rounded-full bg-surface-secondary border border-border flex items-center justify-center mb-3 overflow-hidden group-hover:border-accent transition-colors">
                  <SourceLogo
                    src={source.logoUrl}
                    alt={source.displayName}
                    domain={source.handleOrDomain || ""}
                    fallbackLetter={source.logo || source.displayName?.charAt(0) || "?"}
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>

                {/* Source Name */}
                <div className="text-sm font-semibold text-content-primary mb-1 truncate w-full">
                  {source.displayName}
                </div>
                <div className="text-xs text-content-muted truncate w-full mb-3">
                  {source.handleOrDomain}
                </div>

                {/* Follow / Add button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-content-muted hover:border-accent hover:text-accent transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* All Sources Header + Search */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <h2 className="text-2xl font-bold text-content-primary">All Sources</h2>
          <input
            type="text"
            placeholder="Search sources..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-surface-card border border-border rounded-lg px-4 py-2.5 text-sm text-content-primary focus:ring-2 focus:ring-accent/40 focus:border-accent outline-none transition-all placeholder:text-content-muted w-full md:w-72"
          />
        </div>

        {/* Alphabetical list */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-surface-card rounded-lg animate-pulse border border-border" />
            ))}
          </div>
        ) : alphabetical.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-content-muted">No sources found matching your search.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.keys(grouped)
              .sort()
              .map((letter) => (
                <div key={letter}>
                  <div className="text-xs font-bold text-content-muted uppercase tracking-wider mb-3 border-b border-border pb-2">
                    {letter}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {grouped[letter].map((source: any) => (
                      <button
                        key={source.id}
                        onClick={() => setLocation(`/sources/${source.id}`)}
                        className="flex items-center space-x-3 p-3 rounded-lg border border-border bg-surface-card hover:bg-surface-card-hover transition-all text-left group"
                      >
                        <div className="w-8 h-8 rounded-full bg-surface-secondary border border-border flex items-center justify-center flex-shrink-0 overflow-hidden">
                          <SourceLogo
                            src={source.logoUrl}
                            alt={source.displayName}
                            domain={source.handleOrDomain || ""}
                            fallbackLetter={source.logo || source.displayName?.charAt(0) || "?"}
                            className="w-full h-full object-cover rounded-full"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-content-primary truncate group-hover:text-accent transition-colors">
                            {source.displayName}
                          </div>
                        </div>
                        <div className="text-xs text-content-muted">
                          {source.score?.trackRecord != null
                            ? `${Math.round(source.score.trackRecord)}%`
                            : "--"}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
