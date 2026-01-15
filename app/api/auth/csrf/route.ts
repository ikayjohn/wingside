import { NextResponse } from 'next/server'
import { setCsrfToken, getCsrfTokenForClient } from '@/lib/csrf'

// GET /api/auth/csrf - Get CSRF token for forms
export async function GET() {
  try {
    // Ensure CSRF token exists in cookie
    await setCsrfToken()

    // Get token for client
    const { token, headerName } = await getCsrfTokenForClient()

    return NextResponse.json({
      token,
      headerName,
    })
  } catch (error) {
    console.error('CSRF token generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    )
  }
}
