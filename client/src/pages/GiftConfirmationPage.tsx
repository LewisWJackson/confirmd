import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { fetchGiftBySession } from "../lib/api";

interface GiftData {
  code: string;
  durationMonths: number;
  status: string;
  createdAt: string;
}

const GiftConfirmationPage: React.FC = () => {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);
  const [gift, setGift] = useState<GiftData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const sessionId = new URLSearchParams(window.location.search).get("session_id");

  useEffect(() => {
    if (!sessionId) {
      setError("No session ID found. Please check your confirmation email or try purchasing again.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadGift() {
      try {
        const data = await fetchGiftBySession(sessionId!);
        if (!cancelled) {
          setGift(data);
          setLoading(false);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError("Unable to load your gift details. Please try refreshing the page or contact support.");
          setLoading(false);
        }
      }
    }

    loadGift();
    return () => { cancelled = true; };
  }, [sessionId]);

  const redeemLink = gift ? `${window.location.origin}/gift/redeem?code=${encodeURIComponent(gift.code)}` : "";

  const copyCode = async () => {
    if (!gift) return;
    try {
      await navigator.clipboard.writeText(gift.code);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch {
      // Fallback: select text
    }
  };

  const copyLink = async () => {
    if (!redeemLink) return;
    try {
      await navigator.clipboard.writeText(redeemLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      // Fallback: select text
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-surface-primary flex items-center justify-center">
        <div className="text-center">
          <svg className="w-8 h-8 animate-spin text-accent mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-content-secondary text-sm">Loading your gift details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !gift) {
    return (
      <div className="min-h-screen bg-surface-primary flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-red-900/20 border border-red-700 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-content-primary mb-3">Something went wrong</h1>
          <p className="text-content-secondary text-sm mb-8">
            {error || "Unable to load gift details."}
          </p>
          <button
            onClick={() => setLocation("/gift")}
            className="border border-accent text-accent px-6 py-3 rounded-lg text-sm font-bold hover:bg-accent hover:text-accent-text transition-all"
          >
            Back to Gifts
          </button>
        </div>
      </div>
    );
  }

  // Success state
  return (
    <div className="min-h-screen bg-surface-primary">
      <div className="max-w-2xl mx-auto px-6 py-16 md:py-24">
        {/* Success icon */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-green-900/30 border-2 border-green-600 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-content-primary mb-2">
            Your gift is ready!
          </h1>
          <p className="text-content-secondary text-sm">
            Share this code or link with the recipient to activate their subscription.
          </p>
        </div>

        {/* Duration badge */}
        <div className="flex justify-center mb-8">
          <span className="inline-flex items-center gap-2 bg-accent/15 text-accent text-sm font-bold px-4 py-2 rounded-full">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
            </svg>
            {gift.durationMonths} months of Confirmd+
          </span>
        </div>

        {/* Gift code card */}
        <div className="bg-surface-card border border-border rounded-xl p-6 md:p-8 mb-6">
          <label className="text-xs font-semibold text-content-muted uppercase tracking-wider block mb-3">
            Gift Code
          </label>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-surface-primary border border-border rounded-lg px-4 py-3 font-mono text-lg md:text-xl font-bold text-content-primary tracking-wider text-center select-all">
              {gift.code}
            </div>
            <button
              onClick={copyCode}
              className="flex-shrink-0 bg-accent text-accent-text px-4 py-3 rounded-lg text-sm font-bold hover:bg-accent-hover transition-all flex items-center gap-2"
            >
              {codeCopied ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </>
              )}
            </button>
          </div>
        </div>

        {/* Shareable link card */}
        <div className="bg-surface-card border border-border rounded-xl p-6 md:p-8 mb-8">
          <label className="text-xs font-semibold text-content-muted uppercase tracking-wider block mb-3">
            Shareable Redemption Link
          </label>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-surface-primary border border-border rounded-lg px-4 py-3 text-sm text-content-secondary truncate select-all">
              {redeemLink}
            </div>
            <button
              onClick={copyLink}
              className="flex-shrink-0 border border-accent text-accent px-4 py-3 rounded-lg text-sm font-bold hover:bg-accent hover:text-accent-text transition-all flex items-center gap-2"
            >
              {linkCopied ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  Copy Link
                </>
              )}
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-surface-secondary border border-border rounded-xl p-6 mb-8">
          <h3 className="text-sm font-bold text-content-primary mb-2">How to share this gift</h3>
          <ul className="text-sm text-content-secondary space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-accent font-bold mt-0.5">1.</span>
              Copy the gift code or link above
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent font-bold mt-0.5">2.</span>
              Share it with the recipient via text, email, or however you like
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent font-bold mt-0.5">3.</span>
              They'll use the code or link to activate their Confirmd+ subscription
            </li>
          </ul>
        </div>

        {/* Back to home */}
        <div className="text-center">
          <button
            onClick={() => setLocation("/")}
            className="border border-border text-content-primary px-8 py-3 rounded-lg text-sm font-bold hover:bg-surface-card transition-all"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default GiftConfirmationPage;
