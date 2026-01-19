import { NextResponse } from 'next/server'

/**
 * Standardized Error Handling System
 * Provides consistent error responses across the application
 * - Generic messages to users (security)
 * - Detailed logs server-side (debugging)
 */

/**
 * Log error details server-side for debugging
 * Never exposed to clients in production
 */
function logError(error: unknown, context?: string): void {
  const timestamp = new Date().toISOString();

  if (error instanceof Error) {
    console.error(`[${timestamp}] Error${context ? ` in ${context}` : ''}:`, {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
  } else {
    console.error(`[${timestamp}] Unknown error${context ? ` in ${context}` : ''}:`, error);
  }
}

/**
 * Base Application Error
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * Validation Error (400)
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(400, message, 'VALIDATION_ERROR', details)
  }
}

/**
 * Authentication Error (401)
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(401, message, 'AUTHENTICATION_ERROR')
  }
}

/**
 * Authorization Error (403)
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(403, message, 'AUTHORIZATION_ERROR')
  }
}

/**
 * Not Found Error (404)
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(404, `${resource} not found`, 'NOT_FOUND')
  }
}

/**
 * Conflict Error (409)
 */
export class ConflictError extends AppError {
  constructor(message: string, details?: unknown) {
    super(409, message, 'CONFLICT_ERROR', details)
  }
}

/**
 * Rate Limit Error (429)
 */
export class RateLimitError extends AppError {
  constructor(retryAfter?: number) {
    const message = retryAfter
      ? `Rate limit exceeded. Try again in ${retryAfter} seconds.`
      : 'Rate limit exceeded. Please try again later.'
    super(429, message, 'RATE_LIMIT_ERROR', { retryAfter })
  }
}

/**
 * Server Error (500)
 */
export class ServerError extends AppError {
  constructor(message: string = 'Internal server error', details?: unknown) {
    super(500, message, 'SERVER_ERROR', details)
  }
}

/**
 * Service Unavailable Error (503)
 */
export class ServiceUnavailableError extends AppError {
  constructor(service: string = 'Service') {
    super(503, `${service} temporarily unavailable`, 'SERVICE_UNAVAILABLE')
  }
}

/**
 * Convert error to API response
 * - Logs detailed errors server-side
 * - Returns generic messages to clients (security)
 */
export function errorToResponse(error: unknown, context?: string): NextResponse {
  // Always log errors server-side for debugging
  logError(error, context)

  // Handle known application errors
  if (error instanceof AppError) {
    const response: Record<string, unknown> = {
      error: error.message,
      code: error.code,
    }

    // Include details ONLY in development
    if (process.env.NODE_ENV === 'development' && error.details !== undefined) {
      response.details = error.details
    }

    return NextResponse.json(response, { status: error.statusCode })
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    const isDevelopment = process.env.NODE_ENV === 'development'

    return NextResponse.json(
      {
        error: isDevelopment ? error.message : 'An unexpected error occurred',
        code: 'INTERNAL_ERROR',
        ...(isDevelopment && { stack: error.stack }),
      },
      { status: 500 }
    )
  }

  // Handle unknown errors (non-Error objects)
  return NextResponse.json(
    {
      error: 'An unexpected error occurred',
      code: 'INTERNAL_ERROR',
    },
    { status: 500 }
  )
}

/**
 * Async handler wrapper that catches errors and converts them to responses
 * Logs errors server-side and returns generic messages to clients
 */
export function asyncHandler(
  handler: (...args: unknown[]) => Promise<NextResponse>,
  context?: string
): (...args: unknown[]) => Promise<NextResponse> {
  return async (...args: unknown[]): Promise<NextResponse> => {
    try {
      return await handler(...args)
    } catch (error) {
      return errorToResponse(error, context)
    }
  }
}

/**
 * Validate required fields
 */
export function validateRequired(
  data: Record<string, unknown>,
  requiredFields: string[]
): void {
  const missing = requiredFields.filter(field => !data[field])

  if (missing.length > 0) {
    throw new ValidationError(
      `Missing required fields: ${missing.join(', ')}`,
      { missing }
    )
  }
}

/**
 * Validate email format
 */
export function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email address')
  }
}

/**
 * Validate phone number format (Nigeria)
 */
export function validatePhoneNumber(phone: string): void {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '')

  // Nigerian phone numbers should be 10-11 digits (excluding country code)
  if (digits.length < 10 || digits.length > 15) {
    throw new ValidationError('Invalid phone number format')
  }
}

/**
 * Validate amount range
 */
export function validateAmount(
  amount: number,
  min: number = 0,
  max: number = 1000000000
): void {
  if (typeof amount !== 'number' || isNaN(amount)) {
    throw new ValidationError('Amount must be a valid number')
  }

  if (amount < min) {
    throw new ValidationError(`Amount must be at least ${min}`)
  }

  if (amount > max) {
    throw new ValidationError(`Amount cannot exceed ${max}`)
  }
}

/**
 * Standard success response
 */
export function successResponse(data: Record<string, unknown>, status: number = 200): NextResponse {
  return NextResponse.json({ success: true, ...data }, { status })
}

/**
 * Standard error response (shortcut)
 */
export function errorResponse(
  message: string,
  status: number = 400,
  code?: string
): NextResponse {
  const error = new AppError(status, message, code)
  return errorToResponse(error)
}
