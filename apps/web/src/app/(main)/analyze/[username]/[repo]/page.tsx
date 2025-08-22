"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAnalyzeMutation } from "@/react-query/analysis";
import AIAnalysisGame from "./_components/loadingpage";

export default function AnalyzeRepoPage() {
  const params = useParams<{ username: string; repo: string }>();
  const router = useRouter();
  const [error, setError] = useState<string>("");
  const analyze = useAnalyzeMutation();
  const startedRef = useRef(false);
  const [status, setStatus] = useState<string>("Initializing...");
  const [progress, setProgress] = useState<number>(0);
  const [jobId, setJobId] = useState<string | undefined>(undefined);
  const [complete, setComplete] = useState<boolean>(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const pseudoRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<number>(Date.now());
  const sseRef = useRef<EventSource | null>(null);
  const fallbackStartedRef = useRef(false);
  const redirectedRef = useRef(false);
  const startupTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const receivedFirstEventRef = useRef(false);

  // Wait for analyzer to be healthy before opening SSE to avoid getting stuck on first load
  const waitForAnalyzerHealth = async (maxMs = 12000) => {
    try {
      setStatus((s) => (s && s !== "Initializing..." ? s : "Warming up analyzer"));
      setProgress((p) => (p < 5 ? 5 : p));
      const start = Date.now();
      let i = 0;
      while (Date.now() - start < maxMs) {
        try {
          const controller = new AbortController();
          const t = setTimeout(() => controller.abort(), 1500);
          const res = await fetch(`/api/analyze?health=1`, { signal: controller.signal, cache: "no-store" });
          clearTimeout(t);
          if (res.ok) return true;
        } catch {}
        i++;
        // Nudge progress a bit while waiting
        setProgress((p) => (p < 12 ? Math.min(12, p + 1) : p));
        await new Promise((r) => setTimeout(r, 400));
      }
    } catch {}
    return false;
  };

  // Helper to safely redirect to results exactly once
  const redirectToResults = () => {
    if (redirectedRef.current) return;
    redirectedRef.current = true;
    const username = params.username;
    const decoded = decodeURIComponent(params.repo);
    const [owner, repo] = decoded.includes("/") ? decoded.split("/") : [username, decoded];
    router.replace(
      `/analyze/${encodeURIComponent(username)}/${encodeURIComponent(`${owner}/${repo}`)}/results`
    );
  };

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    async function start() {
      try {
        const username = params.username;
        const decoded = decodeURIComponent(params.repo);
        const [owner, repo] = decoded.includes("/") ? decoded.split("/") : [username, decoded];
  const newJobId = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  setJobId(newJobId);
  // Give the UI a head start so steps don't look stuck while backend warms up
  setStatus("Validating request");
  setProgress((p) => (p > 3 ? p : 3));
  lastUpdateRef.current = Date.now();

        // Ensure analyzer is up to reduce "stuck on validating" scenarios
        const healthy = await waitForAnalyzerHealth(10000);

        // Start SSE stream for live updates and kick off analysis server-side (start=1)
        try {
          const es = new EventSource(
            `/api/analyze?jobId=${encodeURIComponent(newJobId)}&stream=1&start=1&username=${encodeURIComponent(
              username
            )}&repo=${encodeURIComponent(`${owner}/${repo}`)}`
          );
          sseRef.current = es;
          es.onopen = () => {
            // connection established; keep waiting for first event
          };
          // If we don't receive the first event shortly, kick off POST once as a safety net
          receivedFirstEventRef.current = false;
          if (startupTimeoutRef.current) clearTimeout(startupTimeoutRef.current as any);
          startupTimeoutRef.current = setTimeout(() => {
            if (!receivedFirstEventRef.current && !fallbackStartedRef.current) {
              fallbackStartedRef.current = true;
              (async () => {
                try {
                  const result = await analyze.mutateAsync({ username, owner, repo, jobId: newJobId });
                  try {
                    sessionStorage.setItem("analysisResult", JSON.stringify({ success: true, data: result.data || result }));
                  } catch {}
                  redirectToResults();
                } catch {}
              })();
            }
          }, 4000);

          es.onmessage = (ev) => {
            try {
              const data = JSON.parse(ev.data || "{}");
              const nextStatus = data?.status || "";
              const nextProgress = typeof data?.progress === "number" ? data.progress : progress;
              setStatus(nextStatus);
              // Mark that we have started receiving server updates
              if (!receivedFirstEventRef.current) receivedFirstEventRef.current = true;
              if (typeof data?.progress === "number") setProgress(nextProgress);
              lastUpdateRef.current = Date.now();
              if (data?.result) {
                try {
                  sessionStorage.setItem("analysisResult", JSON.stringify({ success: true, data: data.result }));
                } catch {}
                setComplete(true);
                es.close();
                if (pseudoRef.current) clearInterval(pseudoRef.current as any);
                if (pollingRef.current) clearInterval(pollingRef.current as any);
                if (startupTimeoutRef.current) clearTimeout(startupTimeoutRef.current as any);
        redirectToResults();
                return;
              }
              if (data?.complete) {
                setComplete(true);
                es.close();
                if (pseudoRef.current) clearInterval(pseudoRef.current as any);
                if (pollingRef.current) clearInterval(pollingRef.current as any);
                if (startupTimeoutRef.current) clearTimeout(startupTimeoutRef.current as any);
        // Some backends signal completion without inlining the result
        redirectToResults();
              }
            } catch {}
          };
          // Always keep a lightweight poll as a safety net
          const pollOnce = async () => {
            try {
              const res = await fetch(`/api/analyze?jobId=${encodeURIComponent(newJobId)}`);
              const js = await res.json();
              if (js?.success && js?.data) {
                if (js.data.status) setStatus(js.data.status);
                if (typeof js.data.progress === "number") setProgress(js.data.progress);
                if (js.data.result) {
                  try {
                    sessionStorage.setItem("analysisResult", JSON.stringify({ success: true, data: js.data.result }));
                  } catch {}
                }
                if (js.data.complete) {
                  setComplete(true);
                  es.close();
                  if (pseudoRef.current) clearInterval(pseudoRef.current as any);
                  if (pollingRef.current) clearInterval(pollingRef.current as any);
                  // Ensure navigation even if SSE didn't deliver the final payload
                  redirectToResults();
                }
                lastUpdateRef.current = Date.now();
              }
            } catch {}
          };
          pollingRef.current = setInterval(pollOnce, 2000);
          es.onerror = () => {
            // SSE hiccup: polling continues; if still no result later, trigger POST fallback once
            if (!fallbackStartedRef.current) {
              fallbackStartedRef.current = true;
              (async () => {
                try {
                  const result = await analyze.mutateAsync({ username, owner, repo, jobId: newJobId });
                  try {
                    sessionStorage.setItem("analysisResult", JSON.stringify({ success: true, data: result.data || result }));
                  } catch {}
                  redirectToResults();
                } catch {}
              })();
            }
          };
        } catch {}

        // If analyzer wasn't healthy in time, proactively kick the POST fallback once
        if (!healthy && !fallbackStartedRef.current) {
          fallbackStartedRef.current = true;
          (async () => {
            try {
              const result = await analyze.mutateAsync({ username, owner, repo, jobId: newJobId });
              try {
                sessionStorage.setItem("analysisResult", JSON.stringify({ success: true, data: result.data || result }));
              } catch {}
              redirectToResults();
            } catch {}
          })();
        }

        // Pseudo-progress fallback if backend isn't updating
        pseudoRef.current = setInterval(() => {
          const staleFor = Date.now() - lastUpdateRef.current;
          if (!complete && staleFor > 4000) {
            setStatus((s) => (s && s !== "Pending" ? s : "Processing..."));
            setProgress((p) => (p < 70 ? Math.min(70, p + 2) : p));
          }
          // Stall watchdog: if we received an early event but nothing since for a while, kick POST fallback once
          if (!complete && staleFor > 8000 && !fallbackStartedRef.current) {
            fallbackStartedRef.current = true;
            setStatus("Starting analysis (fallback)");
            (async () => {
              try {
                const result = await analyze.mutateAsync({ username, owner, repo, jobId: newJobId });
                try {
                  sessionStorage.setItem("analysisResult", JSON.stringify({ success: true, data: result.data || result }));
                } catch {}
                redirectToResults();
              } catch {}
            })();
          }
        }, 1000);

  // No direct POST here; SSE start mode streams the result and triggers redirect above.
      } catch (e: any) {
        setError(e?.message || "Unexpected error");
        setStatus("Error");
        setComplete(true);
        if (pollingRef.current) clearInterval(pollingRef.current as any);
        if (pseudoRef.current) clearInterval(pseudoRef.current as any);
      }
    }
    start();
    // We intentionally omit dependencies to avoid re-running in Strict Mode
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Failsafe: if complete flips true for any reason, navigate to results
  useEffect(() => {
    if (complete) {
      redirectToResults();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complete]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current as any);
  if (pseudoRef.current) clearInterval(pseudoRef.current as any);
  if (sseRef.current) sseRef.current.close();
  if (startupTimeoutRef.current) clearTimeout(startupTimeoutRef.current as any);
    };
  }, []);

  return (
    <div className="relative">
      <AIAnalysisGame currentRepo={decodeURIComponent(params.repo)} status={status} progress={progress} complete={complete} />
      {error ? (
        <div className="absolute inset-x-0 top-4 mx-auto max-w-xl">
          <div className="mx-auto rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 shadow-sm">
            {error}
          </div>
        </div>
      ) : null}
    </div>
  );
}
