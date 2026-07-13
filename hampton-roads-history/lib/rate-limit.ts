// In-process sliding-window rate limiter. This is a fallback layer only —
// the primary enforcement point for multi-instance deployments is the
// Traefik middleware configured in coolify/traefik-middleware.yml, since an
// in-memory counter doesn't share state across replicas or process
// restarts. Cheap enough to run on every request for a single instance.

interface Bucket {
  count: number;
  windowStart: number;
}

const buckets = new Map<string, Bucket>();
const WINDOW_MS = 60_000;

// Periodically clear entries so the map doesn't grow unbounded under
// sustained traffic from many distinct keys.
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (now - bucket.windowStart > WINDOW_MS) buckets.delete(key);
  }
}, WINDOW_MS).unref();

export function checkRateLimit(key: string, limitPerMinute: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now - bucket.windowStart > WINDOW_MS) {
    buckets.set(key, { count: 1, windowStart: now });
    return true;
  }

  if (bucket.count >= limitPerMinute) {
    return false;
  }

  bucket.count += 1;
  return true;
}

export function getClientIp(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}
