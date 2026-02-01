import { createBrowserClient } from '@supabase/ssr'

/**
 * Creates a Supabase client for client-side use
 *
 * Note: NEXT_PUBLIC_* environment variables are inlined at build time by Next.js.
 * This means they're replaced with their actual values during compilation,
 * making them safe to access directly in client-side code.
 */
export function createClient() {
  // Access environment variables directly
  // These are inlined at build time for NEXT_PUBLIC_* variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Validate at runtime with helpful error message
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please ensure your .env.local file contains:\n' +
      '  NEXT_PUBLIC_SUPABASE_URL=your-project-url\n' +
      '  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key\n\n' +
      'See .env.example for reference.'
    )
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
