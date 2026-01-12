/**
 * Rate limiting implementation using in-memory storage
 * For production, use Redis, Upstash, or Vercel KV for distributed rate limiting
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
  firstAttempt: number;
}

// In-memory storage (for single-instance deployments)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  /**
   * Maximum number of requests allowed
   */
  limit: number;

  /**
   * Time window in milliseconds
   */
  window: number;

  /**
   * Block duration after limit exceeded (in milliseconds)
   * @default window
   */
  blockDuration?: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

/**
 * Check if a request should be rate limited
 *
 * @param identifier - Unique identifier (IP address, user ID, email, etc.)
 * @param config - Rate limit configuration
 * @returns Rate limit result
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);
  const blockDuration = config.blockDuration || config.window;

  // Clean up expired entries
  if (entry && now > entry.resetTime) {
    rateLimitStore.delete(identifier);
  }

  const currentEntry = rateLimitStore.get(identifier);

  // If no entry exists, create new one
  if (!currentEntry) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + config.window,
      firstAttempt: now,
    });

    return {
      success: true,
      limit: config.limit,
      remaining: config.limit - 1,
      reset: now + config.window,
    };
  }

  // Check if still in block period
  if (currentEntry.count >= config.limit && now < currentEntry.resetTime) {
    const retryAfter = Math.ceil((currentEntry.resetTime - now) / 1000);

    return {
      success: false,
      limit: config.limit,
      remaining: 0,
      reset: currentEntry.resetTime,
      retryAfter,
    };
  }

  // Increment count
  currentEntry.count += 1;
  currentEntry.resetTime = now + blockDuration;
  rateLimitStore.set(identifier, currentEntry);

  return {
    success: true,
    limit: config.limit,
    remaining: Math.max(0, config.limit - currentEntry.count),
    reset: currentEntry.resetTime,
  };
}

/**
 * Reset rate limit for an identifier
 */
export function resetRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier);
}

/**
 * Get current rate limit status without incrementing
 */
export function getRateLimitStatus(identifier: string): RateLimitResult | null {
  const entry = rateLimitStore.get(identifier);
  if (!entry) return null;

  return {
    success: entry.count < entry.resetTime,
    limit: entry.count,
    remaining: 0,
    reset: entry.resetTime,
  };
}

// Pre-configured rate limiters for common use cases
export const RateLimitPresets = {
  /**
   * Strict rate limiting for authentication endpoints
   * 5 attempts per 15 minutes
   */
  auth: {
    limit: 5,
    window: 15 * 60 * 1000, // 15 minutes
    blockDuration: 60 * 60 * 1000, // 1 hour block
  },

  /**
   * Medium rate limiting for form submissions
   * 3 submissions per hour
   */
  form: {
    limit: 3,
    window: 60 * 60 * 1000, // 1 hour
    blockDuration: 24 * 60 * 60 * 1000, // 24 hour block
  },

  /**
   * Lenient rate limiting for API calls
   * 100 requests per minute
   */
  api: {
    limit: 100,
    window: 60 * 1000, // 1 minute
    blockDuration: 5 * 60 * 1000, // 5 minute block
  },

  /**
   * Very strict for email verification
   * 3 attempts per day
   */
  emailVerification: {
    limit: 3,
    window: 24 * 60 * 60 * 1000, // 24 hours
    blockDuration: 7 * 24 * 60 * 60 * 1000, // 7 day block
  },
};
