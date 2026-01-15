/**
 * API middleware for Next.js routes
 * Provides common functionality like rate limiting, error handling, authentication, etc.
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, RateLimitResult, RateLimitConfig } from './rate-limit';
import { createClient } from '@/lib/supabase/server';
import { AuthenticationError, AuthorizationError, errorToResponse } from './errors';
import { csrfProtection } from './csrf';

export interface MiddlewareContext {
  request: NextRequest;
  identifier?: string;
  user?: {
    id: string;
    email: string;
    role?: string;
  };
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
 * Verify authentication from session
 */
export async function requireAuth(request: NextRequest): Promise<MiddlewareContext> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new AuthenticationError('Valid authentication required');
  }

  // Get user role from profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return {
    request,
    user: {
      id: user.id,
      email: user.email || '',
      role: profile?.role,
    },
  };
}

/**
 * Verify admin role
 */
export async function requireAdmin(request: NextRequest): Promise<MiddlewareContext> {
  const context = await requireAuth(request);

  if (context.user?.role !== 'admin') {
    throw new AuthorizationError('Admin access required');
  }

  return context;
}

/**
 * Verify customer role
 */
export async function requireCustomer(request: NextRequest): Promise<MiddlewareContext> {
  const context = await requireAuth(request);

  if (context.user?.role !== 'customer' && context.user?.role !== 'admin') {
    throw new AuthorizationError('Customer access required');
  }

  return context;
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
      // Use the standardized error response
      return errorToResponse(error as Error);
    }
  };
}

/**
 * Authentication middleware
 */
export function withAuth(
  handler: MiddlewareFunction,
  options: {
    requireAdmin?: boolean;
    requireCustomer?: boolean;
  } = {}
): MiddlewareFunction {
  return async (context: MiddlewareContext) => {
    let authenticatedContext;

    if (options.requireAdmin) {
      authenticatedContext = await requireAdmin(context.request);
    } else if (options.requireCustomer) {
      authenticatedContext = await requireCustomer(context.request);
    } else {
      authenticatedContext = await requireAuth(context.request);
    }

    // Merge authenticated context with original context
    return await handler({ ...context, ...authenticatedContext });
  };
}

/**
 * CSRF protection middleware
 */
export function withCsrf(handler: MiddlewareFunction): MiddlewareFunction {
  return async (context: MiddlewareContext) => {
    const csrfError = await csrfProtection(context.request);
    if (csrfError) {
      return csrfError;
    }

    return await handler(context);
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

  /**
   * Full protection: auth + CSRF + rate limit + error handling
   */
  withFullProtection: (
    handler: MiddlewareFunction,
    options: {
      requireAdmin?: boolean;
      requireCustomer?: boolean;
      rateLimit?: RateLimitConfig;
    } = {}
  ) =>
    composeMiddleware(
      (h) => withErrorHandler(h),
      (h) => withCsrf(h),
      (h) => withAuth(h, {
        requireAdmin: options.requireAdmin,
        requireCustomer: options.requireCustomer,
      }),
      (h) => withRateLimit(h, options.rateLimit || { limit: 100, window: 60000 })
    )(handler),

  /**
   * API route protection: auth + error handling
   */
  withApiAuth: (
    handler: MiddlewareFunction,
    options?: { requireAdmin?: boolean; requireCustomer?: boolean }
  ) =>
    composeMiddleware(
      (h) => withErrorHandler(h),
      (h) => withAuth(h, options || {})
    )(handler),

  /**
   * Public API: CSRF + rate limit + error handling
   */
  withPublicApi: (handler: MiddlewareFunction, config?: RateLimitConfig) =>
    composeMiddleware(
      (h) => withErrorHandler(h),
      (h) => withCsrf(h),
      (h) => withRateLimit(h, config || { limit: 20, window: 60000 })
    )(handler),
};
