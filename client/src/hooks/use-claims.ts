import { useQuery } from "@tanstack/react-query";
import { fetchClaims, fetchClaim, fetchSources, fetchSource, fetchStories, fetchStory, fetchPipelineStatus } from "../lib/api";

export function useClaims(params?: {
  asset?: string;
  verdict?: string;
  status?: string;
  sort?: string;
}) {
  return useQuery({
    queryKey: ["claims", params],
    queryFn: () => fetchClaims(params),
  });
}

export function useClaim(id: string | null) {
  return useQuery({
    queryKey: ["claim", id],
    queryFn: () => fetchClaim(id!),
    enabled: !!id,
  });
}

export function useSources() {
  return useQuery({
    queryKey: ["sources"],
    queryFn: fetchSources,
  });
}

export function useSource(id: string | null) {
  return useQuery({
    queryKey: ["source", id],
    queryFn: () => fetchSource(id!),
    enabled: !!id,
  });
}

export function useStories() {
  return useQuery({
    queryKey: ["stories"],
    queryFn: fetchStories,
  });
}

export function useStory(id: string | null) {
  return useQuery({
    queryKey: ["story", id],
    queryFn: () => fetchStory(id!),
    enabled: !!id,
  });
}

export function usePipelineStatus() {
  return useQuery({
    queryKey: ["pipeline-status"],
    queryFn: fetchPipelineStatus,
    refetchInterval: 60000,
  });
}
