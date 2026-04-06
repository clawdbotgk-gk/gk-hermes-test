// Simple in-memory rate limiter
// For production with multiple instances, use Upstash Redis instead

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_MAX = 100;

interface RateLimitConfig {
  windowMs?: number;
  max?: number;
}

// Default configs by route prefix
const configs: Record<string, RateLimitConfig> = {
  "/api/auth": { windowMs: 60_000, max: 10 },
  "/api/videos": { windowMs: 60_000, max: 30 },
  "/api/tournaments": { windowMs: 60_000, max: 60 },
};

export function getRateLimitConfig(pathname: string): RateLimitConfig {
  for (const [prefix, config] of Object.entries(configs)) {
    if (pathname.startsWith(prefix)) return config;
  }
  return { windowMs: DEFAULT_WINDOW_MS, max: DEFAULT_MAX };
}

export function checkRateLimit(key: string, config: RateLimitConfig = {}) {
  const { windowMs = DEFAULT_WINDOW_MS, max = DEFAULT_MAX } = config;
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: max - 1, resetAt: now + windowMs };
  }

  entry.count++;
  const remaining = Math.max(0, max - entry.count);
  const allowed = entry.count <= max;

  return { allowed, remaining, resetAt: entry.resetAt };
}

export function cleanupExpiredEntries() {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetAt) store.delete(key);
  }
}

// Cleanup every 5 minutes
setInterval(cleanupExpiredEntries, 5 * 60_000);
