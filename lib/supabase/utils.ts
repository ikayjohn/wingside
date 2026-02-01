/**
 * Supabase Query Utilities
 * Safe wrappers for common query patterns with proper error handling
 */

import { PostgrestSingleResponse } from '@supabase/supabase-js';

/**
 * Safe wrapper for .single() queries with proper error handling
 *
 * Usage:
 * const profile = await safeSingle(
 *   supabase.from('profiles').select('*').eq('id', userId).single(),
 *   'Profile not found'
 * );
 *
 * Returns null if not found, throws error with message if query fails
 */
export async function safeSingle<T>(
  query: Promise<PostgrestSingleResponse<T>>,
  notFoundMessage: string = 'Record not found'
): Promise<T | null> {
  const { data, error } = await query;

  if (error) {
    // PGRST116 = Row not found (not an error, just no results)
    if (error.code === 'PGRST116') {
      console.log(`[Database] ${notFoundMessage}`);
      return null;
    }

    // Actual database error
    console.error('[Database Error]', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });

    throw new Error(error.message || 'Database query failed');
  }

  return data;
}

/**
 * Safe wrapper for .maybeSingle() queries
 * Returns null if not found, throws error if multiple rows or query fails
 */
export async function safeMaybeSingle<T>(
  query: Promise<PostgrestSingleResponse<T>>
): Promise<T | null> {
  const { data, error } = await query;

  if (error) {
    console.error('[Database Error]', {
      message: error.message,
      code: error.code,
      details: error.details
    });

    throw new Error(error.message || 'Database query failed');
  }

  return data;
}

/**
 * Type-safe error response helper for API routes
 */
export function createErrorResponse(
  message: string,
  status: number = 500,
  details?: any
) {
  console.error('[API Error]', { message, status, details });

  return {
    error: message,
    ...(process.env.NODE_ENV === 'development' && details && { details })
  };
}

/**
 * Safe JSON parsing with proper error handling
 * Returns parsed data or throws with user-friendly error message
 */
export async function safeJsonParse<T = any>(
  request: Request
): Promise<T> {
  try {
    const body = await request.json();
    return body as T;
  } catch (error) {
    console.error('[JSON Parse Error]', {
      error: error instanceof Error ? error.message : 'Unknown error',
      contentType: request.headers.get('content-type')
    });

    throw new Error('Invalid JSON in request body. Please check your request format.');
  }
}

/**
 * Categorized error types for better error handling
 */
export enum ErrorType {
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_API_ERROR = 'EXTERNAL_API_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  INVALID_JSON = 'INVALID_JSON'
}

/**
 * Create categorized error response
 */
export function categorizedError(
  type: ErrorType,
  message: string,
  details?: any
) {
  const statusMap: Record<ErrorType, number> = {
    [ErrorType.NOT_FOUND]: 404,
    [ErrorType.UNAUTHORIZED]: 401,
    [ErrorType.FORBIDDEN]: 403,
    [ErrorType.VALIDATION_ERROR]: 400,
    [ErrorType.DATABASE_ERROR]: 500,
    [ErrorType.EXTERNAL_API_ERROR]: 502,
    [ErrorType.INTERNAL_ERROR]: 500
  };

  return {
    response: createErrorResponse(message, statusMap[type], details),
    status: statusMap[type],
    type
  };
}
