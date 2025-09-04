import { NextRequest, NextResponse } from "next/server";
import { analyzeRepositoryAction, getUserIdByUsernameAction } from "@/actions/analyze";

// Use Node runtime for SSE
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// In-memory SSE broker replacing Redis for now
// TODO(backend): Reintroduce Redis-backed progress store and fan-out when Upstash is configured.
type ProgressUpdate = {
  status?: string;
  progress?: number;
  complete?: boolean;
  error?: string;
  // Store terminal result for consumers using polling/non-stream fallbacks
  result?: any;
};

const subscribers = new Map<string, Set<(u: ProgressUpdate) => void>>();
const lastUpdate = new Map<string, ProgressUpdate>();

function publish(jobId: string, update: ProgressUpdate) {
  const prev = lastUpdate.get(jobId) || {};
  const merged = { ...prev, ...update } as ProgressUpdate;
  lastUpdate.set(jobId, merged);
  const subs = subscribers.get(jobId);
  if (!subs) return;
  for (const cb of subs) {
    try {
      cb(merged);
    } catch {}
  }
}

function subscribe(jobId: string, cb: (u: ProgressUpdate) => void) {
  let set = subscribers.get(jobId);
  if (!set) {
    set = new Set();
    subscribers.set(jobId, set);
  }
  set.add(cb);
  return () => {
    set?.delete(cb);
    if (set && set.size === 0) subscribers.delete(jobId);
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("jobId");
  const stream = searchParams.get("stream");
  const health = searchParams.get("health");

  // Simple analyzer health probe used by client before kicking off SSE
  if (health) {
    try {
      const analyzerServiceUrl = process.env.ANALYZER_SERVICE_URL || 'http://localhost:8080';
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(`${analyzerServiceUrl}/health`, { signal: controller.signal });
      clearTimeout(t);
      const ok = res.ok;
      return NextResponse.json({ success: ok }, { status: ok ? 200 : 503 });
    } catch (e) {
      return NextResponse.json({ success: false }, { status: 503 });
    }
  }
  if (!jobId) {
    return NextResponse.json({ success: false, error: "jobId is required" }, { status: 400 });
  }

  if (stream) {
    // SSE stream of progress updates
    const encoder = new TextEncoder();
    const startWork = searchParams.get("start");
    const username = searchParams.get("username") || undefined;
    const repoFull = searchParams.get("repo") || undefined;

    const streamBody = new ReadableStream<Uint8Array>({
      async start(controller) {
        const send = (u: ProgressUpdate & { result?: any }) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(u)}\n\n`));
        };

        const doSubscribe = () => {
          // Initial event with last known state (if any)
          const initial = lastUpdate.get(jobId);
          if (initial) send(initial);
          const unsubscribe = subscribe(jobId, send);
          return unsubscribe;
        };

        let unsubscribe: (() => void) | undefined;

        // If start=1, perform the work and stream updates from this connection
        if (startWork) {
          const push = (u: ProgressUpdate) => {
            publish(jobId, u);
            send(u);
          };
          try {
            push({ status: "Validating request", progress: 2, complete: false });
            if (!username || !repoFull) {
              push({ status: "Missing parameters", progress: 0, complete: true, error: "username and repo are required" });
              return;
            }
            const [owner, repoName] = decodeURIComponent(repoFull).split("/");
            if (!owner || !repoName) {
              push({ status: "Invalid repository format", progress: 5, complete: true, error: "Invalid repo full name" });
              return;
            }
            push({ status: "Resolving user", progress: 10 });
            const resolved = await getUserIdByUsernameAction(username);
            if (!resolved.success || !resolved.userId) {
              push({ status: "User not found", progress: 15, complete: true, error: resolved.error || "User not found" });
              return;
            }
            push({ status: "Starting analyzer", progress: 20 });
            
            // Create a progress callback to track analysis progress
            const progressCallback = (status: string, progress: number) => {
              push({ status, progress });
            };
            
            const result = await analyzeRepositoryAction(resolved.userId!, owner, repoName, 200, progressCallback);
            push({ status: "Processing response", progress: 90 });
            if (!result.success) {
              push({ status: "Analysis failed", progress: 100, complete: true, error: result.error || "Analysis failed" });
              return;
            }
            // Publish and send the terminal result so both SSE and polling consumers can obtain it
            push({ status: "Completed", progress: 100, complete: true, result: result.data });
            send({ status: "Completed", progress: 100, complete: true, result: result.data });
          } catch (e: any) {
            send({ status: "Unexpected error", progress: 100, complete: true, error: e?.message || "Unexpected error" });
          }
        } else {
          // Passive subscription mode
          unsubscribe = doSubscribe();
        }

        // Heartbeat to keep the connection alive
        const hb = setInterval(() => controller.enqueue(encoder.encode(`: keep-alive\n\n`)), 15000);

        const onAbort = () => {
          clearInterval(hb);
          if (unsubscribe) unsubscribe();
          try {
            controller.close();
          } catch {}
        };
        // Close when client disconnects
        req.signal.addEventListener("abort", onAbort);
      },
      cancel() {
        // no-op; handled in abort listener
      },
    });

    return new Response(streamBody, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  }

  // Non-stream fallback returns the last known update (if any)
  return NextResponse.json({ success: true, data: lastUpdate.get(jobId) || null });
}

export async function POST(req: NextRequest) {
  try {
    const { username, repo, jobId: incomingJobId } = await req.json();
    const jobId = incomingJobId || crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    publish(jobId, { status: "Validating request", progress: 2, complete: false });
    if (!username || !repo) {
      publish(jobId, { status: "Missing parameters", progress: 0, complete: true, error: "username and repo are required" });
      return NextResponse.json({ success: false, error: "username and repo are required", jobId }, { status: 400 });
    }
    const decodedRepo = decodeURIComponent(repo as string);
    const [owner, repoName] = decodedRepo.split("/");
    if (!owner || !repoName) {
      publish(jobId, { status: "Invalid repository format", progress: 5, complete: true, error: "Invalid repo full name" });
      return NextResponse.json({ success: false, error: "Invalid repo full name", jobId }, { status: 400 });
    }
    publish(jobId, { status: "Resolving user", progress: 10 });
    const resolved = await getUserIdByUsernameAction(username as string);
    if (!resolved.success || !resolved.userId) {
      publish(jobId, { status: "User not found", progress: 15, complete: true, error: resolved.error || "User not found" });
      return NextResponse.json({ success: false, error: resolved.error || "User not found", jobId }, { status: 404 });
    }
    publish(jobId, { status: "Starting analyzer", progress: 20 });
    
    // Create a progress callback to track analysis progress
    const progressCallback = (status: string, progress: number) => {
      publish(jobId, { status, progress });
    };
    
    const result = await analyzeRepositoryAction(resolved.userId!, owner, repoName, 200, progressCallback);
    publish(jobId, { status: "Processing response", progress: 90 });
    if (!result.success) {
      publish(jobId, { status: "Analysis failed", progress: 100, complete: true, error: result.error || "Analysis failed" });
      return NextResponse.json({ success: false, error: result.error || "Analysis failed", jobId }, { status: 500 });
    }
    publish(jobId, { status: "Completed", progress: 100, complete: true });
    return NextResponse.json({ success: true, data: result.data, jobId }, { status: 200 });
  } catch (e: any) {
    // Attempt to include jobId if available
    let jobId: string | undefined = undefined;
    try {
      const { jobId: j } = await req.json();
      jobId = j;
      if (jobId) publish(jobId, { status: "Unexpected error", complete: true, progress: 100, error: e?.message || "Unexpected error" });
    } catch {}
    return NextResponse.json({ success: false, error: e?.message || "Unexpected error", jobId }, { status: 500 });
  }
}
