import React, { createContext, useContext, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchMe } from "./api";

export type SubscriptionTier = "free" | "tribune" | "oracle";

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
  tribune: 1,
  oracle: 2,
};

const FEATURE_REQUIREMENTS: Record<string, SubscriptionTier> = {
  full_evidence: "tribune",
  real_time_alerts: "tribune",
  source_history: "tribune",
  extended_watchlist: "tribune",
  priority_support: "tribune",
  api_access: "oracle",
  data_export: "oracle",
  custom_alerts: "oracle",
  unlimited_history: "oracle",
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
    const tier: SubscriptionTier =
      (apiUser?.subscriptionTier as SubscriptionTier) || "free";

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
  return { free: "Scholar", tribune: "Tribune", oracle: "Oracle" }[tier];
}
