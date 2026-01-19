import { NextResponse } from 'next/server';
import { getCsrfTokenForClient } from '@/lib/csrf';

/**
 * GET /api/csrf/token
 * Returns a CSRF token for client-side use
 *
 * The token is automatically set in an HTTP-only cookie,
 * and this endpoint returns the token value so the client
 * can include it in request headers.
 */
export async function GET() {
  try {
    const { token, headerName } = await getCsrfTokenForClient();

    return NextResponse.json({
      token,
      headerName,
    });
  } catch (error) {
    console.error('Error generating CSRF token:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate CSRF token',
      },
      { status: 500 }
    );
  }
}
