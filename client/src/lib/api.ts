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
export function fetchStories() {
  return fetchJson<{ data: any[] }>("/stories").then(r => r.data);
}

export function fetchStory(id: string) {
  return fetchJson<any>(`/stories/${id}`);
}

// Evidence
export function fetchEvidence(claimId: string) {
  return fetchJson<{ data: any[] }>(`/evidence/${claimId}`).then(r => r.data);
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
