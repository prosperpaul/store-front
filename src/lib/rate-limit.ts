import { headers } from 'next/headers'

/**
 * A fixed-window limiter for the public buyer endpoints.
 *
 * Honest about what this is: counters held in this process's memory. They
 * reset on deploy and aren't shared between instances, so on a multi-instance
 * host the real limit is this number times the instance count. That's fine
 * for the job -- it exists to stop someone hammering the order endpoint into
 * thousands of junk customer rows, not to survive a determined attacker.
 *
 * If this app ever runs at a scale where that matters, move the counter into
 * Postgres or Redis and keep the same call sites.
 */
type Window = { count: number; resetAt: number }

const windows = new Map<string, Window>()

// Stops the map growing without bound on a long-running server.
const MAX_TRACKED = 10_000

function sweep(now: number) {
  for (const [key, window] of windows) {
    if (window.resetAt <= now) windows.delete(key)
  }
}

export type RateLimitResult = { allowed: boolean; retryAfterSeconds: number }

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now()

  if (windows.size > MAX_TRACKED) sweep(now)

  const existing = windows.get(key)

  if (!existing || existing.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, retryAfterSeconds: 0 }
  }

  existing.count += 1

  if (existing.count > limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000),
    }
  }

  return { allowed: true, retryAfterSeconds: 0 }
}

/**
 * Best-effort client address. Behind a proxy or CDN the socket address is the
 * proxy's, so the forwarded headers are what identify the caller.
 */
export async function clientKey(scope: string): Promise<string> {
  const headerList = await headers()

  const forwarded = headerList.get('x-forwarded-for')?.split(',')[0]?.trim()
  const address =
    forwarded || headerList.get('x-real-ip') || headerList.get('cf-connecting-ip')

  return `${scope}:${address ?? 'unknown'}`
}
