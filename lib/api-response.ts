import { NextResponse } from 'next/server'

/**
 * Standard API Response Utilities
 *
 * Provides consistent response formats across all API endpoints
 */

export interface ErrorResponse {
  error: string
  details?: unknown
  code?: string
}

export interface SuccessResponse<T = unknown> {
  success: true
  data?: T
  message?: string
}

/**
 * Create a standardized error response
 *
 * @param message - Error message
 * @param status - HTTP status code (default: 500)
 * @param details - Optional additional error details
 * @param code - Optional error code
 */
export function errorResponse(
  message: string,
  status: number = 500,
  details?: unknown,
  code?: string
): NextResponse<ErrorResponse> {
  const response: ErrorResponse = { error: message }
  if (details) response.details = details
  if (code) response.code = code

  return NextResponse.json(response, { status })
}

/**
 * Create a standardized success response
 *
 * @param data - Response data
 * @param message - Optional success message
 * @param status - HTTP status code (default: 200)
 */
export function successResponse<T = unknown>(
  data?: T,
  message?: string,
  status: number = 200
): NextResponse<SuccessResponse<T>> {
  const response: SuccessResponse<T> = { success: true }
  if (data !== undefined) response.data = data
  if (message) response.message = message

  return NextResponse.json(response, { status })
}

/**
 * Common error responses for quick use
 */
export const ApiErrors = {
  unauthorized: (message: string = 'Unauthorized') =>
    errorResponse(message, 401, undefined, 'UNAUTHORIZED'),

  forbidden: (message: string = 'Forbidden') =>
    errorResponse(message, 403, undefined, 'FORBIDDEN'),

  notFound: (message: string = 'Resource not found') =>
    errorResponse(message, 404, undefined, 'NOT_FOUND'),

  badRequest: (message: string, details?: unknown) =>
    errorResponse(message, 400, details, 'BAD_REQUEST'),

  validationError: (details: unknown) =>
    errorResponse('Validation failed', 400, details, 'VALIDATION_ERROR'),

  internalError: (message: string = 'Internal server error') =>
    errorResponse(message, 500, undefined, 'INTERNAL_ERROR'),

  conflict: (message: string) =>
    errorResponse(message, 409, undefined, 'CONFLICT'),

  tooManyRequests: (message: string = 'Too many requests') =>
    errorResponse(message, 429, undefined, 'TOO_MANY_REQUESTS'),
}
