import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Handles Supabase auth callbacks: password reset, email confirmation, OAuth
// The code is exchanged server-side so the session is properly set in cookies
// before the client page loads — eliminating "Auth session missing" errors.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type') // Supabase passes type=recovery for password resets

  if (code) {
    try {
      const supabase = await createClient()
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (!error) {
        // Route to the right page based on the auth type
        if (type === 'recovery') {
          return NextResponse.redirect(`${origin}/reset-password/`)
        }
        return NextResponse.redirect(`${origin}/my-account`)
      }
      console.error('[auth/callback] exchangeCodeForSession error:', error.message)
    } catch (err) {
      console.error('[auth/callback] unexpected error:', err)
    }
  }

  // Invalid, expired, or already-used code
  return NextResponse.redirect(`${origin}/forgot-password?error=invalid_link`)
}
