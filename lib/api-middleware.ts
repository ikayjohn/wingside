/**
 * API middleware for Next.js routes
 * Provides common functionality like rate limiting, error handling, etc.
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, RateLimitResult, RateLimitConfig } from './rate-limit';

export interface MiddlewareContext {
  request: NextRequest;
  identifier?: string;
}

export type MiddlewareFunction<T = any> = (
  context: MiddlewareContext
) => Promise<NextResponse | T> | NextResponse | T;

/**
 * Extract client identifier from request
 * Priority: User ID > API Key > Email > IP Address
 */
export function extractIdentifier(request: NextRequest): string {
  // Try to get user ID from authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    return `user:${authHeader}`;
  }

  // Try to get email from request body (for form submissions)
  const url = request.url;
  if (url.includes('auth') || url.includes('signup') || url.includes('login')) {
    // For auth endpoints, we'll use IP as identifier
    const ip = request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') ||
               'unknown';
    return `ip:${ip}`;
  }

  // Fall back to IP address
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
             request.headers.get('x-real-ip') ||
             'unknown';
  return `ip:${ip}`;
}

/**
 * Rate limiting middleware
 */
export function withRateLimit(
  handler: MiddlewareFunction,
  config: RateLimitConfig,
  options: { identifier?: string } = {}
): MiddlewareFunction {
  return async (context: MiddlewareContext) => {
    const identifier = options.identifier || extractIdentifier(context.request);
    const prefix = context.request.nextUrl.pathname;

    const result = checkRateLimit(`${prefix}:${identifier}`, config);

    // Add rate limit headers to response
    const addRateLimitHeaders = (response: NextResponse): NextResponse => {
      response.headers.set('X-RateLimit-Limit', result.limit.toString());
      response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
      response.headers.set('X-RateLimit-Reset', new Date(result.reset).toISOString());

      if (result.retryAfter) {
        response.headers.set('Retry-After', result.retryAfter.toString());
      }

      return response;
    };

    // Block if rate limit exceeded
    if (!result.success) {
      const response = NextResponse.json(
        {
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: result.retryAfter,
        },
        { status: 429 }
      );

      return addRateLimitHeaders(response);
    }

    // Call the handler
    const handlerResponse = await handler(context);

    // Add rate limit headers to successful responses
    if (handlerResponse instanceof NextResponse) {
      return addRateLimitHeaders(handlerResponse);
    }

    return handlerResponse;
  };
}

/**
 * Error handling middleware
 */
export function withErrorHandler(
  handler: MiddlewareFunction
): MiddlewareFunction {
  return async (context: MiddlewareContext) => {
    try {
      return await handler(context);
    } catch (error) {
      console.error('API Error:', error);

      // Handle specific error types
      if (error instanceof Error) {
        return NextResponse.json(
          {
            error: 'Internal server error',
            message: process.env.NODE_ENV === 'development'
              ? error.message
              : 'An unexpected error occurred',
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Combine multiple middleware
 */
export function composeMiddleware(
  ...middlewares: Array<(handler: MiddlewareFunction) => MiddlewareFunction>
): (handler: MiddlewareFunction) => MiddlewareFunction {
  return (handler: MiddlewareFunction) => {
    return middlewares.reduceRight(
      (acc, middleware) => middleware(acc),
      handler
    );
  };
}

/**
 * Common middleware combinations
 */
export const middleware = {
  /**
   * Apply rate limiting for auth endpoints
   */
  withAuthRateLimit: (handler: MiddlewareFunction) =>
    withRateLimit(handler, {
      limit: 5,
      window: 15 * 60 * 1000, // 15 minutes
      blockDuration: 60 * 60 * 1000, // 1 hour
    }),

  /**
   * Apply rate limiting for form submissions
   */
  withFormRateLimit: (handler: MiddlewareFunction) =>
    withRateLimit(handler, {
      limit: 3,
      window: 60 * 60 * 1000, // 1 hour
      blockDuration: 24 * 60 * 60 * 1000, // 24 hours
    }),

  /**
   * Apply both rate limiting and error handling
   */
  withProtection: (handler: MiddlewareFunction, config?: RateLimitConfig) =>
    composeMiddleware(
      (h) => withErrorHandler(h),
      (h) => withRateLimit(h, config || { limit: 100, window: 60000 })
    )(handler),
};
