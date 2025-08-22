import { useMutation, useQuery, keepPreviousData, QueryKey } from "@tanstack/react-query";

// Query keys
export const analysisKeys = {
  all: ["analysis"] as const,
  repo: (username: string, owner: string, repo: string) =>
    ["analysis", username, owner, repo] as const,
} as const;

// API helpers
async function postAnalyze(username: string, owner: string, repo: string, jobId?: string) {
  const res = await fetch(`/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, repo: `${owner}/${repo}` , ...(jobId ? { jobId } : {})}),
  });
  const json = await res.json();
  if (!res.ok || !json?.success) {
    throw new Error(json?.error || "Failed to analyze repository");
  }
  return { data: json.data, jobId: json.jobId as string | undefined };
}

// Mutations
export function useAnalyzeMutation() {
  return useMutation({
    mutationFn: async (vars: { username: string; owner: string; repo: string; jobId?: string }) =>
      postAnalyze(vars.username, vars.owner, vars.repo, vars.jobId),
  });
}

// Cached query wrapper using sessionStorage hydration
export function useAnalysisQuery(username: string, owner: string, repo: string) {
  const key = analysisKeys.repo(username, owner, repo) as unknown as QueryKey;
  // Read any cached result stored by the analyze page before redirect
  const initial = (() => {
    try {
      const cached = sessionStorage.getItem("analysisResult");
      if (!cached) return undefined;
      const parsed = JSON.parse(cached);
      return parsed?.data || undefined;
    } catch {
      return undefined;
    }
  })();

  return useQuery({
    queryKey: key,
    // Only call the backend when there is no cached result
    queryFn: async () => postAnalyze(username, owner, repo).then((r) => r.data),
    enabled: !initial,
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
    initialData: initial,
    initialDataUpdatedAt: Date.now(),
  });
}

// Cache-only variant for the results page to avoid any loading state or backend calls.
export function useAnalysisCacheOnly() {
  try {
    const cached = sessionStorage.getItem("analysisResult");
    if (!cached) return { data: undefined } as const;
    const parsed = JSON.parse(cached);
    return { data: parsed?.data } as const;
  } catch {
    return { data: undefined } as const;
  }
}
