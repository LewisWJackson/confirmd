import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { fetchMe, validateGiftCode, redeemGiftCode } from "../lib/api";

interface ValidationResult {
  valid: boolean;
  durationMonths: number;
  status: string;
}

interface RedeemResult {
  success: boolean;
  durationMonths: number;
  subscriptionTier: string;
  subscriptionExpiresAt: string;
}

const GiftRedeemPage: React.FC = () => {
  const [, setLocation] = useLocation();

  // State
  const [code, setCode] = useState("");
  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [redeeming, setRedeeming] = useState(false);
  const [redeemResult, setRedeemResult] = useState<RedeemResult | null>(null);
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null); // null = loading
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check auth on mount
  useEffect(() => {
    let cancelled = false;
    async function checkAuth() {
      try {
        const user = await fetchMe();
        if (!cancelled) {
          setIsLoggedIn(user !== null);
          setCheckingAuth(false);
        }
      } catch {
        if (!cancelled) {
          setIsLoggedIn(false);
          setCheckingAuth(false);
        }
      }
    }
    checkAuth();
    return () => { cancelled = true; };
  }, []);

  // Read code from URL params and auto-validate
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlCode = params.get("code");
    if (urlCode) {
      setCode(urlCode);
      handleValidate(urlCode);
    }
  }, []);

  const handleValidate = async (codeToValidate?: string) => {
    const targetCode = codeToValidate || code;
    if (!targetCode.trim()) return;

    setValidating(true);
    setValidation(null);
    setValidationError(null);
    setRedeemError(null);
    setRedeemResult(null);

    try {
      const result = await validateGiftCode(targetCode.trim());
      setValidation(result);
      if (!result.valid) {
        if (result.status === "redeemed") {
          setValidationError("This gift code has already been redeemed.");
        } else {
          setValidationError("This gift code is not valid.");
        }
      }
    } catch (err: any) {
      setValidationError("Unable to validate this code. Please check and try again.");
    } finally {
      setValidating(false);
    }
  };

  const handleRedeem = async () => {
    if (!code.trim()) return;

    setRedeeming(true);
    setRedeemError(null);

    try {
      const result = await redeemGiftCode(code.trim());
      if (result.success) {
        setRedeemResult(result);
      } else {
        setRedeemError("Unable to redeem this gift code. Please try again.");
      }
    } catch (err: any) {
      const message = err.message || "";
      if (message.includes("401") || message.includes("not logged in")) {
        setRedeemError("You must be logged in to redeem a gift code.");
      } else if (message.includes("already redeemed") || message.includes("409")) {
        setRedeemError("This gift code has already been redeemed.");
      } else {
        setRedeemError("Unable to redeem this gift code. Please try again.");
      }
    } finally {
      setRedeeming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleValidate();
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // Success/celebration state after redeeming
  if (redeemResult) {
    return (
      <div className="min-h-screen bg-surface-primary flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          {/* Success icon */}
          <div className="w-20 h-20 rounded-full bg-green-900/30 border-2 border-green-600 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-content-primary mb-3">
            Gift activated!
          </h1>
          <p className="text-content-secondary text-sm mb-6">
            You now have {redeemResult.durationMonths} months of Confirmd+
          </p>

          {/* Details card */}
          <div className="bg-surface-card border border-border rounded-xl p-6 mb-8 text-left">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-content-muted">Subscription</span>
                <span className="text-sm font-bold text-accent">{redeemResult.subscriptionTier}</span>
              </div>
              <div className="border-t border-border" />
              <div className="flex items-center justify-between">
                <span className="text-sm text-content-muted">Duration</span>
                <span className="text-sm font-semibold text-content-primary">{redeemResult.durationMonths} months</span>
              </div>
              <div className="border-t border-border" />
              <div className="flex items-center justify-between">
                <span className="text-sm text-content-muted">Expires</span>
                <span className="text-sm font-semibold text-content-primary">{formatDate(redeemResult.subscriptionExpiresAt)}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setLocation("/")}
            className="bg-accent text-accent-text px-8 py-3 rounded-lg text-sm font-bold hover:bg-accent-hover transition-all"
          >
            Explore Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-primary">
      <div className="max-w-lg mx-auto px-6 py-16 md:py-24">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-full bg-accent/15 flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-content-primary mb-2">
            Redeem a Gift
          </h1>
          <p className="text-content-secondary text-sm">
            Enter your gift code below to activate your Confirmd+ subscription.
          </p>
        </div>

        {/* Code input */}
        <div className="bg-surface-card border border-border rounded-xl p-6 md:p-8 mb-6">
          <label className="text-xs font-semibold text-content-muted uppercase tracking-wider block mb-3">
            Gift Code
          </label>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                // Clear validation when code changes
                if (validation) {
                  setValidation(null);
                  setValidationError(null);
                }
              }}
              onKeyDown={handleKeyDown}
              placeholder="GIFT-XXXX-XXXX-XXXX"
              className="flex-1 bg-surface-primary border border-border rounded-lg px-4 py-3 text-sm font-mono text-content-primary tracking-wider focus:ring-2 focus:ring-accent/40 focus:border-accent outline-none transition-all placeholder:text-content-muted"
            />
            <button
              onClick={() => handleValidate()}
              disabled={validating || !code.trim()}
              className="flex-shrink-0 border border-accent text-accent px-4 py-3 rounded-lg text-sm font-bold hover:bg-accent hover:text-accent-text transition-all disabled:opacity-50 disabled:cursor-wait"
            >
              {validating ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Checking
                </span>
              ) : (
                "Validate"
              )}
            </button>
          </div>

          {/* Validation error */}
          {validationError && (
            <div className="mt-4 p-3 bg-red-900/20 border border-red-700 rounded-lg text-sm text-red-400 font-medium flex items-start space-x-2">
              <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{validationError}</span>
            </div>
          )}

          {/* Redeem error */}
          {redeemError && (
            <div className="mt-4 p-3 bg-red-900/20 border border-red-700 rounded-lg text-sm text-red-400 font-medium flex items-start space-x-2">
              <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{redeemError}</span>
            </div>
          )}
        </div>

        {/* Valid code details */}
        {validation && validation.valid && (
          <div className="bg-surface-card border border-border rounded-xl p-6 md:p-8 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-green-900/30 border border-green-600 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-content-primary">Valid gift code</h3>
                <p className="text-xs text-content-muted">This code is ready to be redeemed</p>
              </div>
            </div>

            <div className="bg-surface-primary border border-border rounded-lg p-4 mb-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-content-muted">Gift includes</span>
                <span className="text-sm font-bold text-accent">{validation.durationMonths} months of Confirmd+</span>
              </div>
            </div>

            {/* Auth check */}
            {checkingAuth ? (
              <div className="flex items-center justify-center py-4">
                <svg className="w-5 h-5 animate-spin text-accent" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            ) : isLoggedIn ? (
              <button
                onClick={handleRedeem}
                disabled={redeeming}
                className="w-full bg-accent text-accent-text py-3 rounded-lg text-sm font-bold hover:bg-accent-hover transition-all disabled:opacity-60 disabled:cursor-wait"
              >
                {redeeming ? (
                  <span className="flex items-center justify-center space-x-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Redeeming...</span>
                  </span>
                ) : (
                  "Redeem Gift"
                )}
              </button>
            ) : (
              <div>
                <div className="bg-amber-900/20 border border-amber-600/50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-amber-300 font-medium">
                    You need an account to redeem this gift.
                  </p>
                  <p className="text-xs text-amber-300/70 mt-1">
                    Log in or create an account, then come back to redeem your code.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setLocation(`/login?redirect=${encodeURIComponent(`/gift/redeem?code=${encodeURIComponent(code)}`)}`)}
                    className="flex-1 border border-accent text-accent py-3 rounded-lg text-sm font-bold hover:bg-accent hover:text-accent-text transition-all"
                  >
                    Log In
                  </button>
                  <button
                    onClick={() => setLocation(`/signup?redirect=${encodeURIComponent(`/gift/redeem?code=${encodeURIComponent(code)}`)}`)}
                    className="flex-1 bg-accent text-accent-text py-3 rounded-lg text-sm font-bold hover:bg-accent-hover transition-all"
                  >
                    Sign Up
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Help text at bottom */}
        {!validation && !validating && (
          <div className="text-center">
            <p className="text-xs text-content-muted">
              Gift codes look like GIFT-XXXX-XXXX-XXXX. Check the message from the person who sent you this gift.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GiftRedeemPage;
