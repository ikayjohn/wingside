import { NextResponse } from 'next/server'

/**
 * Standardized Error Handling System
 * Provides consistent error responses across the application
 */

/**
 * Base Application Error
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string,
    public details?: any
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
  constructor(message: string, details?: any) {
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
  constructor(message: string, details?: any) {
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
  constructor(message: string = 'Internal server error', details?: any) {
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
 */
export function errorToResponse(error: Error | AppError): NextResponse {
  // Log error for debugging
  console.error('API Error:', {
    name: error.name,
    message: error.message,
    stack: error.stack,
  })

  // Handle known application errors
  if (error instanceof AppError) {
    const response: any = {
      error: error.message,
      code: error.code,
    }

    // Include details in development
    if (process.env.NODE_ENV === 'development' && error.details) {
      response.details = error.details
    }

    return NextResponse.json(response, { status: error.statusCode })
  }

  // Handle unknown errors
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

/**
 * Async handler wrapper that catches errors and converts them to responses
 */
export function asyncHandler(
  handler: (...args: any[]) => Promise<NextResponse>
): (...args: any[]) => Promise<NextResponse> {
  return async (...args: any[]): Promise<NextResponse> => {
    try {
      return await handler(...args)
    } catch (error) {
      return errorToResponse(error as Error)
    }
  }
}

/**
 * Validate required fields
 */
export function validateRequired(
  data: Record<string, any>,
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
export function successResponse(data: any, status: number = 200): NextResponse {
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
