/**
 * Rate limiting implementation using in-memory storage
 * For production, use Redis, Upstash, or Vercel KV for distributed rate limiting
 */

import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

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

/**
 * Get client IP address from request headers
 */
export async function getClientIp(): Promise<string> {
  const headersList = await headers();

  // Check various headers for IP address
  const forwardedFor = headersList.get('x-forwarded-for');
  const realIp = headersList.get('x-real-ip');
  const cfConnectingIp = headersList.get('cf-connecting-ip');
  const xClientIp = headersList.get('x-client-ip');

  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim();
  }

  if (realIp) return realIp;
  if (cfConnectingIp) return cfConnectingIp;
  if (xClientIp) return xClientIp;

  // Fallback to a default (not ideal but prevents crashes)
  return 'unknown';
}

/**
 * Check rate limit based on client IP address
 * Convenience function for API routes
 */
export async function checkRateLimitByIp(
  config: RateLimitConfig
): Promise<{ rateLimit: RateLimitResult; ip: string }> {
  const ip = await getClientIp();
  const rateLimit = checkRateLimit(ip, config);
  return { rateLimit, ip };
}

/**
 * Create a rate limit error response with proper headers
 */
export function rateLimitErrorResponse(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    {
      error: 'Too many requests',
      message: `Rate limit exceeded. Please try again later.`,
    },
    {
      status: 429,
      headers: {
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': new Date(result.reset).toISOString(),
        'Retry-After': (result.retryAfter || 60).toString(),
      },
    }
  );
}

/**
 * Middleware to apply rate limiting to API routes
 *
 * Usage in API routes:
 * ```ts
 * import { withRateLimit } from '@/lib/rate-limit';
 *
 * export async function POST(request: NextRequest) {
 *   return withRateLimit(request, async () => {
 *     // Your route logic here
 *     return NextResponse.json({ success: true });
 *   }, 'auth');
 * }
 * ```
 */
export async function withRateLimit<T extends NextResponse>(
  request: Request,
  handler: () => Promise<T>,
  preset: keyof typeof RateLimitPresets | RateLimitConfig = 'api'
): Promise<T | NextResponse> {
  const config =
    typeof preset === 'string' ? RateLimitPresets[preset] : preset;

  const { rateLimit, ip } = await checkRateLimitByIp(config);

  if (!rateLimit.success) {
    return rateLimitErrorResponse(rateLimit);
  }

  const response = await handler();

  // Add rate limit headers to successful response
  response.headers.set('X-RateLimit-Limit', rateLimit.limit.toString());
  response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
  response.headers.set('X-RateLimit-Reset', new Date(rateLimit.reset).toISOString());

  return response;
}

