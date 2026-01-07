/**
 * Test Supabase Storage upload with anon key (what the API uses)
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

// Simulate what happens in the upload API
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
})

async function testUploadWithAnonKey() {
  console.log('🧪 Testing upload with ANON KEY (simulating API behavior)...\n')

  try {
    // First, we need to sign in as an admin user to get a session
    console.log('1️⃣ Attempting to create a test session...')

    // Note: We can't actually sign in without credentials
    // But we can check if the policies are correctly set up

    // Check bucket policies
    console.log('\n⚠️  Note: Cannot test actual upload without admin session')
    console.log('📝 The upload API needs:')
    console.log('   1. User to be logged in (authenticated)')
    console.log('   2. User to have admin role in profiles table')
    console.log('   3. Storage policies to allow authenticated uploads')

    console.log('\n✅ Based on earlier policy fixes, storage should work if:')
    console.log('   - User is authenticated (has session)')
    console.log('   - User has admin role')
    console.log('   - RLS policies allow authenticated uploads')

    console.log('\n🔍 The issue might be:')
    console.log('   - Session not being passed correctly in server-side auth')
    console.log('   - Cookie domain mismatch (Cloudflare cookie error)')

    console.log('\n💡 Solution: Update Supabase project settings to allow cookies from your domain')
    console.log('   Go to: https://supabase.com/dashboard/project/cxbqochxrhokdscgijxe/auth/url-configuration')
    console.log('   Add: https://www.wingside.ng to allowed sites')

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

testUploadWithAnonKey()
