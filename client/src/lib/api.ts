// API client for Confirmd backend

const BASE = "/api";

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

async function postJson<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

// Claims
export function fetchClaims(params?: {
  asset?: string;
  verdict?: string;
  status?: string;
  sort?: string;
  limit?: number;
  offset?: number;
}) {
  const qs = new URLSearchParams();
  if (params?.asset) qs.set("asset", params.asset);
  if (params?.verdict) qs.set("verdict", params.verdict);
  if (params?.status) qs.set("status", params.status);
  if (params?.sort) qs.set("sort", params.sort);
  if (params?.limit) qs.set("limit", String(params.limit));
  if (params?.offset) qs.set("offset", String(params.offset));
  const query = qs.toString();
  return fetchJson<{ data: any[] }>(`/claims${query ? `?${query}` : ""}`).then(r => r.data);
}

export function fetchClaim(id: string) {
  return fetchJson<any>(`/claims/${id}`);
}

// Sources
export function fetchSources() {
  return fetchJson<{ data: any[] }>("/sources").then(r => r.data);
}

export function fetchSource(id: string) {
  return fetchJson<any>(`/sources/${id}`);
}

// Stories
export function fetchStories(params?: { category?: string; asset?: string }) {
  const qs = new URLSearchParams();
  if (params?.category) qs.set("category", params.category);
  if (params?.asset) qs.set("asset", params.asset);
  const query = qs.toString();
  return fetchJson<{ data: any[] }>(`/stories${query ? `?${query}` : ""}`).then(r => r.data);
}

export function fetchStoryDetail(id: string) {
  return fetchJson<any>(`/stories/${id}`);
}

// Keep old fetchStory as alias for backward compatibility
export function fetchStory(id: string) {
  return fetchStoryDetail(id);
}

// Evidence
export function fetchEvidence(claimId: string) {
  return fetchJson<{ data: any[] }>(`/evidence/${claimId}`).then(r => r.data);
}

// Verdict History
export function fetchVerdictHistory(claimId: string) {
  return fetchJson<{ data: any[] }>(`/claims/${claimId}/verdict-history`).then(r => r.data);
}

// Community Evidence Submission
export async function submitEvidence(
  claimId: string,
  data: { url: string; notes?: string },
) {
  const res = await fetch(`${BASE}/evidence/${claimId}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(body.reason || body.error || "Submission failed");
  }
  return body;
}

// Pipeline
export function fetchPipelineStatus() {
  return fetchJson<any>("/pipeline/status");
}

export function triggerPipeline() {
  return postJson<any>("/pipeline/run");
}

// Auth
export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  subscriptionTier: string;
  createdAt: string;
}

export function fetchMe(): Promise<AuthUser | null> {
  return fetchJson<AuthUser | null>("/auth/me");
}

export async function signup(data: { email: string; password: string; displayName: string }): Promise<AuthUser> {
  const res = await fetch(`${BASE}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(body.error || "Signup failed");
  }
  return body;
}

export async function login(data: { email: string; password: string }): Promise<AuthUser> {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(body.error || "Login failed");
  }
  return body;
}

export async function logout(): Promise<void> {
  await postJson("/auth/logout");
}

// Creators
export function fetchCreators(params?: {
  search?: string;
  tier?: string;
  sort?: string;
  limit?: number;
  offset?: number;
}) {
  const qs = new URLSearchParams();
  if (params?.search) qs.set("search", params.search);
  if (params?.tier) qs.set("tier", params.tier);
  if (params?.sort) qs.set("sort", params.sort);
  if (params?.limit) qs.set("limit", String(params.limit));
  if (params?.offset) qs.set("offset", String(params.offset));
  const query = qs.toString();
  return fetchJson<{ data: any[] }>(`/creators${query ? `?${query}` : ""}`).then(r => r.data);
}

export function fetchCreatorLeaderboard() {
  return fetchJson<{ data: any[] }>("/creators/leaderboard").then(r => r.data);
}

export function fetchCreatorDetail(id: string) {
  return fetchJson<any>(`/creators/${id}`);
}

export function fetchCreatorClaims(id: string, params?: {
  status?: string;
  category?: string;
  limit?: number;
  offset?: number;
}) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  if (params?.category) qs.set("category", params.category);
  if (params?.limit) qs.set("limit", String(params.limit));
  if (params?.offset) qs.set("offset", String(params.offset));
  const query = qs.toString();
  return fetchJson<{ data: any[] }>(`/creators/${id}/claims${query ? `?${query}` : ""}`).then(r => r.data);
}

// Creator Feed
export function fetchCreatorFeed(params?: { limit?: number; offset?: number }) {
  const qs = new URLSearchParams();
  if (params?.limit) qs.set("limit", String(params.limit));
  if (params?.offset) qs.set("offset", String(params.offset));
  const query = qs.toString();
  return fetchJson<{ data: any[] }>(`/creators/feed${query ? `?${query}` : ""}`).then(r => r.data);
}

// Disputes
export function submitDispute(data: { claimId: string; reason: string; evidenceUrl?: string }) {
  return postJson<any>("/disputes", data);
}

// Stripe
export function createCheckoutSession(tier: string) {
  return postJson<{ url: string }>("/stripe/create-checkout", { tier });
}

// Gift subscriptions
export function createGiftCheckoutSession(giftTier: string) {
  return postJson<{ url: string }>("/stripe/create-gift-checkout", { giftTier });
}

export function fetchGiftBySession(sessionId: string) {
  return fetchJson<{ code: string; durationMonths: number; status: string; createdAt: string }>(`/stripe/gift/${sessionId}`);
}

export function validateGiftCode(code: string) {
  return fetchJson<{ valid: boolean; durationMonths: number; status: string }>(`/gifts/validate/${encodeURIComponent(code)}`);
}

export function redeemGiftCode(code: string) {
  return postJson<{ success: boolean; durationMonths: number; subscriptionTier: string; subscriptionExpiresAt: string }>("/gifts/redeem", { code });
}
