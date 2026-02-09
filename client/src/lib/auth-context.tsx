import React, { createContext, useContext, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchMe } from "./api";

export type SubscriptionTier = "free" | "plus";

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  subscriptionTier: SubscriptionTier;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoggedIn: boolean;
  tier: SubscriptionTier;
  canAccess: (feature: string) => boolean;
  isLoading: boolean;
}

const TIER_RANK: Record<SubscriptionTier, number> = {
  free: 0,
  plus: 1,
};

const FEATURE_REQUIREMENTS: Record<string, SubscriptionTier> = {
  full_evidence: "plus",
  real_time_alerts: "plus",
  source_history: "plus",
  extended_watchlist: "plus",
  priority_support: "plus",
  api_access: "plus",
  data_export: "plus",
  custom_alerts: "plus",
  unlimited_history: "plus",
  creator_claims: "plus",
  creator_profiles: "plus",
  leaderboard: "plus",
  blindspot_reports: "plus",
  source_leaderboard: "plus",
  source_claims: "plus",
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoggedIn: false,
  tier: "free",
  canAccess: () => false,
  isLoading: true,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: apiUser, isLoading } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: fetchMe,
    staleTime: 60_000,
    retry: false,
  });

  const value = useMemo<AuthContextValue>(() => {
    const raw = apiUser?.subscriptionTier || "free";
    // Map any legacy tier names to "plus"
    const tier: SubscriptionTier = raw === "free" ? "free" : "plus";

    return {
      user: apiUser
        ? {
            id: apiUser.id,
            email: apiUser.email,
            displayName: apiUser.displayName,
            subscriptionTier: tier,
          }
        : null,
      isLoggedIn: !!apiUser,
      tier,
      canAccess: (feature: string) => {
        const required = FEATURE_REQUIREMENTS[feature];
        if (!required) return true;
        return TIER_RANK[tier] >= TIER_RANK[required];
      },
      isLoading,
    };
  }, [apiUser, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  return useContext(AuthContext);
}

export function tierLabel(tier: SubscriptionTier): string {
  return { free: "Free", plus: "Plus" }[tier];
}
