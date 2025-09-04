"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import LoadingPage from "../../[username]/[repo]/_components/loadingpage";

export default function AnalyzeProfilePage() {
  const params = useParams<{ username: string }>();
  const router = useRouter();
  const [error, setError] = useState<string>("");
  const startedRef = useRef(false);
  const [status, setStatus] = useState<string>("Initializing...");
  const [progress, setProgress] = useState<number>(0);
  const [complete, setComplete] = useState<boolean>(false);
  const redirectedRef = useRef(false);
  const sseRef = useRef<EventSource | null>(null);

  // Helper to safely redirect to results exactly once
  const redirectToResults = () => {
    if (redirectedRef.current) return;
    redirectedRef.current = true;
    router.replace(`/analyze/profile/${encodeURIComponent(params.username)}/results`);
  };

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    async function start() {
      try {
        const username = params.username;
        
        // Give the UI a head start
        setStatus("Validating request");
        setProgress(3);

        // Start SSE stream for profile analysis
        try {
          const response = await fetch(`/api/analyze/profile`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || "Failed to start profile analysis");
          }

          setStatus("Starting analysis stream...");
          setProgress(10);

          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error("Unable to read analysis stream");
          }

          let analysisResult: any = null;
          const decoder = new TextDecoder();

          // Stream the analysis progress
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.trim());

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  
                  if (data.step) {
                    setStatus(data.step);
                  }
                  
                  if (typeof data.progress === 'number') {
                    setProgress(data.progress);
                  }
                  
                  if (data.result) {
                    analysisResult = data.result;
                  }
                  
                  if (data.error) {
                    throw new Error(data.error);
                  }

                  if (data.complete) {
                    setComplete(true);
                    break;
                  }
                } catch (parseError) {
                  console.error("Error parsing stream data:", parseError);
                  // Don't break the stream for parsing errors, continue
                }
              }
            }
          }

          if (analysisResult) {
            // Store the result in sessionStorage for the results page
            sessionStorage.setItem("profileAnalysisResult", JSON.stringify({
              success: true,
              data: analysisResult,
              timestamp: Date.now()
            }));

            setComplete(true);
            // Navigate to results page
            redirectToResults();
          } else {
            throw new Error("Analysis completed but no result received");
          }
        } catch (streamError) {
          console.error("Streaming error:", streamError);
          throw streamError;
        }
      } catch (e: any) {
        setError(e?.message || "Unexpected error");
        setStatus("Error");
        setComplete(true);
      }
    }

    start();
    // We intentionally omit dependencies to avoid re-running in Strict Mode
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Failsafe: if complete flips true for any reason, navigate to results
  useEffect(() => {
    if (complete && !error) {
      redirectToResults();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complete]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sseRef.current) sseRef.current.close();
    };
  }, []);

  return (
    <div className="relative">
      <LoadingPage 
        currentRepo={`${params.username}'s complete profile`} 
        status={status} 
        progress={progress} 
        complete={complete} 
      />
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