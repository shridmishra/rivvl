import { NextRequest, NextResponse } from "next/server";

/**
 * Simple in-memory sliding-window rate limiter.
 *
 * Each key (userId or IP) gets a list of timestamps. On each check, expired
 * entries outside the window are pruned. If the count exceeds the limit, the
 * request is rejected.
 *
 * This is ephemeral (resets on deploy/restart) which is fine for basic abuse
 * prevention. For production-grade rate limiting, swap in Redis/Upstash.
 */

interface RateLimitEntry {
  timestamps: number[];
}

const stores = new Map<string, Map<string, RateLimitEntry>>();

// Periodic cleanup to prevent memory leaks from abandoned keys
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
const cleanupTimers = new Map<string, NodeJS.Timeout>();

function getStore(name: string): Map<string, RateLimitEntry> {
  let store = stores.get(name);
  if (!store) {
    store = new Map();
    stores.set(name, store);

    // Set up periodic cleanup for this store
    if (!cleanupTimers.has(name)) {
      const timer = setInterval(() => {
        const now = Date.now();
        const keys = Array.from(store!.keys());
        for (const key of keys) {
          const entry = store!.get(key);
          if (!entry) continue;
          entry.timestamps = entry.timestamps.filter((t: number) => now - t < 3600_000);
          if (entry.timestamps.length === 0) {
            store!.delete(key);
          }
        }
      }, CLEANUP_INTERVAL);
      // Unref so the timer doesn't prevent process exit
      if (typeof timer === "object" && "unref" in timer) timer.unref();
      cleanupTimers.set(name, timer);
    }
  }
  return store;
}

interface RateLimitConfig {
  /** Unique name for this limiter (e.g., "analyze", "scrape") */
  name: string;
  /** Maximum number of requests allowed within the window */
  maxRequests: number;
  /** Window size in milliseconds (default: 1 hour) */
  windowMs?: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetMs: number;
}

/**
 * Check rate limit for a given key.
 */
export function checkRateLimit(
  config: RateLimitConfig,
  key: string
): RateLimitResult {
  const windowMs = config.windowMs ?? 3600_000; // default 1 hour
  const store = getStore(config.name);
  const now = Date.now();

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Prune expired timestamps
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

  if (entry.timestamps.length >= config.maxRequests) {
    const oldestInWindow = entry.timestamps[0];
    const resetMs = oldestInWindow + windowMs - now;
    return {
      allowed: false,
      remaining: 0,
      resetMs: Math.max(resetMs, 0),
    };
  }

  entry.timestamps.push(now);
  return {
    allowed: true,
    remaining: config.maxRequests - entry.timestamps.length,
    resetMs: windowMs,
  };
}

/**
 * Extract a rate-limit key from a request.
 * Uses the authenticated user ID if available, otherwise falls back to IP.
 */
export function getRateLimitKey(req: NextRequest, userId?: string): string {
  if (userId) return `user:${userId}`;

  // Try common headers for real IP behind proxies
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return `ip:${forwarded.split(",")[0].trim()}`;

  const realIp = req.headers.get("x-real-ip");
  if (realIp) return `ip:${realIp}`;

  return "ip:unknown";
}

/**
 * Helper that checks rate limit and returns a 429 response if exceeded.
 * Returns null if the request is allowed.
 */
export function rateLimitResponse(
  config: RateLimitConfig,
  req: NextRequest,
  userId?: string
): NextResponse | null {
  const key = getRateLimitKey(req, userId);
  const result = checkRateLimit(config, key);

  if (!result.allowed) {
    const retryAfterSec = Math.ceil(result.resetMs / 1000);
    return NextResponse.json(
      {
        error: "Too many requests. Please try again later.",
        retryAfterSeconds: retryAfterSec,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfterSec),
        },
      }
    );
  }

  return null;
}
