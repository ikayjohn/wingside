import { createBrowserClient } from '@supabase/ssr'

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

export function createClient() {
  const { url, key } = validateEnv();

  return createBrowserClient(url, key);
}
