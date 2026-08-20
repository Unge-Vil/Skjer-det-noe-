interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitOptions {
  bucket: string;
  key: string;
  max: number;
  windowMs: number;
}

const stores = new Map<string, Map<string, RateLimitEntry>>();
let hitCounter = 0;

function bucketStore(bucket: string): Map<string, RateLimitEntry> {
  let store = stores.get(bucket);
  if (!store) {
    store = new Map<string, RateLimitEntry>();
    stores.set(bucket, store);
  }
  return store;
}

function pruneExpired(bucket: string, now: number): void {
  const store = stores.get(bucket);
  if (!store) return;
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= now) store.delete(key);
  }
}

function touchEntry(store: Map<string, RateLimitEntry>, key: string, now: number, windowMs: number): RateLimitEntry {
  const current = store.get(key);
  if (!current || current.resetAt <= now) {
    const fresh = { count: 0, resetAt: now + windowMs };
    store.set(key, fresh);
    return fresh;
  }
  return current;
}

export function clientIp(request: Request): string {
  const cf = request.headers.get("cf-connecting-ip");
  if (cf) return cf;

  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || "unknown";

  const realIp = request.headers.get("x-real-ip");
  return realIp?.trim() || "unknown";
}

export function limitKey(parts: Array<string | number | null | undefined>): string {
  return parts
    .filter((part): part is string | number => part !== null && part !== undefined && part !== "")
    .map((part) => String(part))
    .join(":");
}

export function enforceRateLimit(options: RateLimitOptions): Response | null {
  const now = Date.now();
  const store = bucketStore(options.bucket);
  const entry = touchEntry(store, options.key, now, options.windowMs);
  entry.count += 1;

  hitCounter += 1;
  if (hitCounter % 200 === 0) {
    pruneExpired(options.bucket, now);
  }

  if (entry.count <= options.max) return null;

  const retryAfter = Math.max(Math.ceil((entry.resetAt - now) / 1000), 1);
  return Response.json(
    {
      error: "rate_limited",
      message: "For mange foresporsler. Prov igjen senere.",
      retryAfter,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
      },
    },
  );
}
