import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Handles Supabase auth callback for password reset (PKCE flow).
// The code is exchanged server-side so the session is properly set in cookies
// before the reset-password page loads — eliminating "Auth session missing" errors.
//
// NOTE: In Supabase's PKCE flow, `type=recovery` is NOT passed as a URL param —
// the type is encoded inside the PKCE code itself. This route is only used for
// password reset, so we always redirect to /reset-password/ on success.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    try {
      const supabase = await createClient()
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (!error) {
        return NextResponse.redirect(`${origin}/reset-password/`)
      }
      console.error('[auth/callback] exchangeCodeForSession error:', error.message)
    } catch (err) {
      console.error('[auth/callback] unexpected error:', err)
    }
  }

  // Invalid, expired, or already-used code
  return NextResponse.redirect(`${origin}/forgot-password?error=invalid_link`)
}
