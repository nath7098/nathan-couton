/**
 * In-memory rate limiter, keyed by client IP.
 *
 * Fine for a portfolio contact form: the function is small, traffic is low,
 * and losing the counter on a cold start only costs an attacker a few extra
 * requests. If this ever needs to hold across instances, swap the Map for
 * Vercel KV — the interface stays the same.
 */
interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  const bucket = buckets.get(key)

  if (!bucket || bucket.resetAt <= now) {
    const resetAt = now + windowMs
    buckets.set(key, { count: 1, resetAt })

    // Opportunistic sweep: without it the map grows with every unique IP.
    if (buckets.size > 5000) {
      for (const [id, entry] of buckets) if (entry.resetAt <= now) buckets.delete(id)
    }
    return { allowed: true, remaining: limit - 1, resetAt }
  }

  bucket.count++
  return {
    allowed: bucket.count <= limit,
    remaining: Math.max(limit - bucket.count, 0),
    resetAt: bucket.resetAt,
  }
}

/** Test seam; not used at runtime. */
export function _resetRateLimit() {
  buckets.clear()
}
