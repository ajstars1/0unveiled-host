"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAnalyzeMutation } from "@/react-query/analysis";

export default function AnalyzeRepoPage() {
  const params = useParams<{ username: string; repo: string }>();
  const router = useRouter();
  const [error, setError] = useState<string>("");
  const analyze = useAnalyzeMutation();

  useEffect(() => {
    async function start() {
      try {
        const username = params.username;
        const decoded = decodeURIComponent(params.repo);
        const [owner, repo] = decoded.includes("/") ? decoded.split("/") : [username, decoded];
        const data = await analyze.mutateAsync({ username, owner, repo });
        // Save result and navigate to results page
        try {
          sessionStorage.setItem("analysisResult", JSON.stringify({ success: true, data }));
        } catch {}
        router.replace(`/analyze/${encodeURIComponent(username)}/${encodeURIComponent(`${owner}/${repo}`)}/results`);
      } catch (e: any) {
        setError(e?.message || "Unexpected error");
      }
    }
    start();
  }, [params, router, analyze]);

  return (
    <div className="max-w-xl mx-auto p-12 text-center space-y-4">
      <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
      <h1 className="text-xl font-semibold">Analyzing repository…</h1>
      {error ? <p className="text-sm text-red-500">{error}</p> : <p className="text-sm text-muted-foreground">This can take a minute.</p>}
    </div>
  );
}
