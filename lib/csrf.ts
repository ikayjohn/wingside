import { cookies } from 'next/headers'

/**
 * CSRF Protection Utility
 * Generates and validates CSRF tokens for state-changing operations
 */

const CSRF_COOKIE_NAME = 'csrf_token'
const CSRF_HEADER_NAME = 'x-csrf-token'

/**
 * Generate a random CSRF token
 */
function generateToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Set CSRF token in HTTP-only cookie
 */
export async function setCsrfToken(): Promise<string> {
  const token = generateToken()
  const cookieStore = await cookies()

  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  })

  return token
}

/**
 * Get CSRF token from cookie
 */
export async function getCsrfToken(): Promise<string | undefined> {
  const cookieStore = await cookies()
  return cookieStore.get(CSRF_COOKIE_NAME)?.value
}

/**
 * Validate CSRF token from request headers
 */
export async function validateCsrfToken(request: Request): Promise<boolean> {
  // Only validate for state-changing methods
  const method = request.method.toUpperCase()
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    return true
  }

  const tokenFromHeader = request.headers.get(CSRF_HEADER_NAME)
  const tokenFromCookie = await getCsrfToken()

  if (!tokenFromCookie) {
    console.warn('CSRF token cookie missing')
    return false
  }

  if (!tokenFromHeader) {
    console.warn('CSRF token header missing')
    return false
  }

  // Use constant-time comparison to prevent timing attacks
  if (tokenFromCookie.length !== tokenFromHeader.length) {
    return false
  }

  // Constant-time comparison to prevent timing attacks
  let valid = 0
  for (let i = 0; i < tokenFromCookie.length; i++) {
    valid |= tokenFromCookie.charCodeAt(i) ^ tokenFromHeader.charCodeAt(i)
  }

  if (valid !== 0) {
    console.warn('CSRF token validation failed')
  }

  return valid === 0
}

/**
 * Middleware to validate CSRF token
 * Returns error response if validation fails, null if valid
 */
export async function csrfProtection(request: Request): Promise<Response | null> {
  const isValid = await validateCsrfToken(request)

  if (!isValid) {
    return new Response(
      JSON.stringify({
        error: 'Invalid CSRF token',
        message: 'CSRF validation failed. Please refresh the page and try again.'
      }),
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }

  return null
}

/**
 * Get CSRF token for client-side use
 * Call this from API routes to provide the token to the client
 */
export async function getCsrfTokenForClient(): Promise<{ token: string; headerName: string }> {
  let token = await getCsrfToken()

  // Generate new token if none exists
  if (!token) {
    token = await setCsrfToken()
  }

  return {
    token,
    headerName: CSRF_HEADER_NAME,
  }
}
