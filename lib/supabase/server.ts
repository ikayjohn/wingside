import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// Validate required environment variables
function validateEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error('Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL');
  }

  if (!key) {
    throw new Error('Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  return { url, key };
}

// Create client with user's auth context (anon key)
export async function createClient() {
  const { url, key } = validateEnv();
  const cookieStore = await cookies()

  return createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

// Create client with service role key (bypasses RLS, use with caution!)
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error('Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL');
  }

  if (!key) {
    throw new Error('Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY');
  }

  return createSupabaseClient(
    url,
    key,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}
