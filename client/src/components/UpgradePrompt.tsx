import React from "react";
import { useLocation } from "wouter";
import { type SubscriptionTier, tierLabel } from "../lib/auth-context";

interface UpgradePromptProps {
  requiredTier: SubscriptionTier;
  featureName: string;
  description?: string;
  compact?: boolean;
}

const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  requiredTier,
  featureName,
  description,
  compact = false,
}) => {
  const [, setLocation] = useLocation();

  if (compact) {
    return (
      <div className="flex items-center gap-3 py-4 px-5 bg-surface-card rounded-2xl border border-border">
        <svg className="w-5 h-5 text-accent flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <span className="text-sm text-content-secondary font-medium">
          Upgrade to <strong className="text-accent">Confirmd {tierLabel(requiredTier)}</strong> to access {featureName}
        </span>
        <button
          onClick={() => setLocation("/plus")}
          className="ml-auto text-[10px] font-black uppercase tracking-widest text-accent hover:text-accent-hover whitespace-nowrap"
        >
          Upgrade
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-accent/20 bg-surface-card p-8 text-center">
      <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
        <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <h4 className="text-lg font-black text-content-primary tracking-tight mb-2">
        Upgrade to Confirmd {tierLabel(requiredTier)}
      </h4>
      <p className="text-sm text-content-secondary font-medium mb-6 max-w-sm mx-auto">
        {description || `${featureName} is available for Confirmd ${tierLabel(requiredTier)} members.`}
      </p>
      <button
        onClick={() => setLocation("/plus")}
        className="px-8 py-3 bg-accent text-accent-text text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-accent-hover transition-all"
      >
        Get Confirmd Plus — $9.99/mo
      </button>
    </div>
  );
};

export default UpgradePrompt;
