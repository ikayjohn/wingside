import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Handles Supabase auth callbacks: password reset, email confirmation, OAuth
// The code is exchanged server-side so the session is properly set in cookies
// before the client page loads — eliminating "Auth session missing" errors.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
    console.error('[auth/callback] exchangeCodeForSession error:', error.message)
  }

  // Invalid or already-used code — send to forgot-password with error flag
  return NextResponse.redirect(`${origin}/forgot-password?error=invalid_link`)
}
