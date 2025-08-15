// Progress record shape shared by API route and UI
export type ProgressRecord = {
  jobId: string;
  status: string;
  progress: number; // 0..100
  updatedAt: number;
  complete: boolean;
  error?: string;
};

type UpstashRedis = {
  hgetall<T = any>(key: string): Promise<T | null>;
  hset(key: string, data: Record<string, unknown>): Promise<number>;
  expire(key: string, ttlSeconds: number): Promise<number>;
};

let redis: UpstashRedis | null = null;
async function getRedis(): Promise<UpstashRedis | null> {
  if (redis) return redis;
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null;
  try {
    const mod = await import("@upstash/redis");
    // @ts-ignore - ESM types
    redis = mod.Redis.fromEnv();
    return redis;
  } catch {
    return null;
  }
}

const key = (jobId: string) => `analysis:job:${jobId}`;

// Fallback in-memory store to keep things working without Redis
const memStore = new Map<string, ProgressRecord>();

export async function hasRedis(): Promise<boolean> {
  const r = await getRedis();
  return !!r;
}

export async function setAnalysisProgress(jobId: string, partial: Partial<ProgressRecord>): Promise<ProgressRecord> {
  const now = Date.now();
  const base: ProgressRecord = {
    jobId,
    status: "Initializing...",
    progress: 0,
    updatedAt: now,
    complete: false,
  };
  const r = await getRedis();
  if (r) {
    const existing = (await r.hgetall<ProgressRecord>(key(jobId))) || base;
    const merged: ProgressRecord = { ...existing, ...partial, updatedAt: now };
    await r.hset(key(jobId), merged as any);
    // TTL 2 hours to avoid stale keys
    await r.expire(key(jobId), 60 * 60 * 2);
    return merged;
  }
  const existing = memStore.get(jobId) || base;
  const merged: ProgressRecord = { ...existing, ...partial, updatedAt: now };
  memStore.set(jobId, merged);
  return merged;
}

export async function getAnalysisProgress(jobId: string): Promise<ProgressRecord> {
  const r = await getRedis();
  if (r) {
    const rec = await r.hgetall<ProgressRecord>(key(jobId));
    return (
      rec || {
        jobId,
        status: "Pending",
        progress: 0,
        updatedAt: Date.now(),
        complete: false,
      }
    );
  }
  return (
    memStore.get(jobId) || {
      jobId,
      status: "Pending",
      progress: 0,
      updatedAt: Date.now(),
      complete: false,
    }
  );
}
