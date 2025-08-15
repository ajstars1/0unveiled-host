import { useMutation, useQuery, keepPreviousData, QueryKey } from "@tanstack/react-query";

// Query keys
export const analysisKeys = {
  all: ["analysis"] as const,
  repo: (username: string, owner: string, repo: string) =>
    ["analysis", username, owner, repo] as const,
} as const;

// API helpers
async function postAnalyze(username: string, owner: string, repo: string) {
  const res = await fetch(`/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, repo: `${owner}/${repo}` }),
  });
  const json = await res.json();
  if (!res.ok || !json?.success) {
    throw new Error(json?.error || "Failed to analyze repository");
  }
  return json.data;
}

// Mutations
export function useAnalyzeMutation() {
  return useMutation({
    mutationFn: async (vars: { username: string; owner: string; repo: string }) =>
      postAnalyze(vars.username, vars.owner, vars.repo),
  });
}

// Cached query wrapper using sessionStorage hydration
export function useAnalysisQuery(username: string, owner: string, repo: string) {
  const key = analysisKeys.repo(username, owner, repo) as unknown as QueryKey;
  return useQuery({
    queryKey: key,
    queryFn: async () => postAnalyze(username, owner, repo),
    placeholderData: keepPreviousData,
    initialData: (() => {
      try {
        const cached = sessionStorage.getItem("analysisResult");
        if (!cached) return undefined;
        const parsed = JSON.parse(cached);
        // The loader stored { success, data }. Return data only.
        return parsed?.data || undefined;
      } catch {
        return undefined;
      }
    })(),
    initialDataUpdatedAt: Date.now(),
  });
}
