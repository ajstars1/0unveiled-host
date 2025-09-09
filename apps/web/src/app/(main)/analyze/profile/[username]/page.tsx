
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
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

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

        // Set a timeout for the entire analysis process (10 minutes)
        timeoutRef.current = setTimeout(() => {
          throw new Error("Analysis timed out after 10 minutes");
        }, 10 * 60 * 1000);

        // Start SSE stream for profile analysis
        try {
          setStatus("Starting analysis stream...");
          setProgress(10);
          
          const response = await fetch(`/api/analyze/profile`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || "Failed to start profile analysis");
          }

          console.log("Profile analysis stream started successfully");

          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error("Unable to read analysis stream");
          }

          let analysisResult: any = null;
          let streamComplete = false;
          const decoder = new TextDecoder();
          let buffer = ''; // Buffer to store partial chunks
          let partialLine = ''; // Store incomplete lines

          // Stream the analysis progress
          while (!streamComplete) {
            const { done, value } = await reader.read();
            if (done) {
              console.log("Stream ended naturally");
              break;
            }

            const chunk = decoder.decode(value);
            buffer += chunk; // Add to buffer instead of processing immediately
            
            // Process complete events in the buffer
            let eventStart = 0;
            while (true) {
              // Find the start of an event
              const dataStart = buffer.indexOf('data: ', eventStart);
              if (dataStart === -1) break; // No more events found
              
              // Find the end of this event (start of next event or end of buffer)
              const nextDataStart = buffer.indexOf('data: ', dataStart + 6);
              
              // If we found a complete event
              if (nextDataStart !== -1) {
                // Extract the event data
                const eventData = buffer.substring(dataStart + 6, nextDataStart).trim();
                
                try {
                  if (eventData) {
                    const data = JSON.parse(eventData);
                    console.log("Stream event received:", data.step || data.error || "Event");
                    
                    if (data.step) {
                      setStatus(data.step);
                      console.log("Status updated:", data.step);
                    }
                    
                    if (typeof data.progress === 'number') {
                      setProgress(data.progress);
                      console.log("Progress updated:", data.progress);
                    }
                    
                    if (data.result) {
                      console.log("Analysis result received");
                      analysisResult = data.result;
                      setStatus("Analysis complete");
                      setProgress(100);
                      streamComplete = true;
                    }
                    
                    if (data.error) {
                      console.error("Stream error:", data.error);
                      throw new Error(data.error);
                    }

                    // Check for completion indicators
                    if (data.progress === 100 || (data.step && data.step.toLowerCase().includes('complete'))) {
                      console.log("Completion detected based on progress/step");
                      setStatus("Analysis complete");
                      setProgress(100);
                    }
                  }
                } catch (parseError) {
                  console.error("Error parsing stream event:", parseError);
                  // Continue processing other events
                }
                
                // Move to the next event
                eventStart = nextDataStart;
              } else {
                // We have an incomplete event at the end of the buffer
                // Keep it for the next iteration and process only complete events
                buffer = buffer.substring(dataStart);
                break;
              }
            }
            
            // Safety check: if buffer gets too large (over 1MB), trim it
            if (buffer.length > 1000000) {
              const lastEvent = buffer.lastIndexOf('data: ');
              if (lastEvent !== -1) {
                buffer = buffer.substring(lastEvent);
              } else {
                // If we can't find a recent event, keep only the last part
                buffer = buffer.substring(buffer.length - 10000);
              }
              console.warn("Buffer was too large and has been trimmed, current size:", buffer.length);
            }
          }
          
          // Process any remaining complete event in the buffer
          if (buffer.includes('data: ') && !analysisResult) {
            try {
              // Find the last complete data event in the buffer
              const lastDataIndex = buffer.lastIndexOf('data: ');
              if (lastDataIndex !== -1) {
                const eventData = buffer.substring(lastDataIndex + 6).trim();
                if (eventData) {
                  const data = JSON.parse(eventData);
                  if (data.result) {
                    console.log("Analysis result received from final buffer");
                    analysisResult = data.result;
                    setStatus("Analysis complete");
                    setProgress(100);
                  }
                }
              }
            } catch (finalError) {
              console.error("Error parsing final buffer:", finalError, "Buffer:", buffer.substring(buffer.lastIndexOf('data: ')));
            }
          }

          console.log("Stream processing completed. Result available:", !!analysisResult);

          if (analysisResult) {
            // Store the result in sessionStorage for the results page
              try {
                sessionStorage.setItem("profileAnalysisResult", JSON.stringify({
                  success: true,
                  data: analysisResult,
                  timestamp: Date.now()
                }));

                console.log("Profile analysis result stored in sessionStorage, size:", 
                  JSON.stringify(analysisResult).length);
                
                // Clear the timeout
                if (timeoutRef.current) {
                  clearTimeout(timeoutRef.current);
                  timeoutRef.current = null;
                }              setProgress(100);
              setStatus("Analysis complete");
              setComplete(true);
              
              // Navigate to results page after a short delay to ensure UI updates
              setTimeout(() => {
                redirectToResults();
              }, 500);
            } catch (storageError) {
              console.error("Error storing analysis result:", storageError);
              throw new Error("Failed to store analysis result");
            }
          } else {
            console.error("Stream ended but no analysis result was received");
            throw new Error("Analysis completed but no result received");
          }
        } catch (streamError) {
          // Clear the timeout on error
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          console.error("Streaming error:", streamError);
          throw streamError;
        }
      } catch (e: any) {
        // Clear the timeout on error
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
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
      console.log("Analysis complete, redirecting to results page");
      redirectToResults();
    }
  }, [complete, error]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sseRef.current) {
        console.log("Closing SSE connection on unmount");
        sseRef.current.close();
        sseRef.current = null;
      }
      if (timeoutRef.current) {
        console.log("Clearing timeout on unmount");
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
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