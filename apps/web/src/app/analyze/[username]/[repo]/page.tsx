"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function AnalyzeRepoPage() {
  const params = useParams<{ username: string; repo: string }>();
  const router = useRouter();
  const [error, setError] = useState<string>("");

  useEffect(() => {
    async function start() {
      try {
        const username = params.username;
        const repo = decodeURIComponent(params.repo);
        const res = await fetch(`/api/analyze`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, repo }),
        });
        const data = await res.json();
        if (!res.ok || !data?.success) {
          const msg = data?.error || "Failed to start analysis";
          router.replace(`/analyze/error?msg=${encodeURIComponent(msg)}`);
          return;
        }
        // Save result and navigate to results page
        try {
          sessionStorage.setItem("analysisResult", JSON.stringify(data));
        } catch {}
        router.replace(`/analyze/${encodeURIComponent(username)}/${encodeURIComponent(repo)}/results`);
      } catch (e: any) {
        setError(e?.message || "Unexpected error");
      }
    }
    start();
  }, [params, router]);

  return (
    <div className="max-w-xl mx-auto p-12 text-center space-y-4">
      <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
      <h1 className="text-xl font-semibold">Analyzing repository…</h1>
      {error ? <p className="text-sm text-red-500">{error}</p> : <p className="text-sm text-muted-foreground">This can take a minute.</p>}
    </div>
  );
}
