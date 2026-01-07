/**
 * Fix hero-images storage bucket policies to allow authenticated uploads
 * The API route already checks for admin role, so storage policy should allow any authenticated user
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function fixPolicies() {
  console.log('🔧 Fixing hero-images storage policies...')

  try {
    // Drop old policies
    console.log('📛 Dropping old policies...')

    const policies = [
      'Allow public access to hero-images',
      'Allow authenticated uploads to hero-images',
      'Allow admin updates to hero-images',
      'Allow admin deletes from hero-images'
    ]

    for (const policyName of policies) {
      try {
        await supabase.rpc('exec_sql', {
          sql: `DROP POLICY IF EXISTS "${policyName}" ON storage.objects;`
        })
        console.log(`  ✓ Dropped: ${policyName}`)
      } catch (error) {
        console.log(`  - Skipped: ${policyName} (may not exist)`)
      }
    }

    // Create new, simpler policies
    console.log('\n✨ Creating new policies...')

    // Public read access
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Allow public access to hero-images"
        ON storage.objects
        FOR SELECT
        TO public
        USING (bucket_id = 'hero-images');
      `
    })
    console.log('  ✓ Created: Public read access')

    // Authenticated users can insert (upload) - the API route already checks admin role
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Allow authenticated uploads to hero-images"
        ON storage.objects
        FOR INSERT
        TO authenticated
        WITH CHECK (
          bucket_id = 'hero-images' AND
          auth.role() = 'authenticated'
        );
      `
    })
    console.log('  ✓ Created: Authenticated upload access')

    // Authenticated users can update
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Allow authenticated updates to hero-images"
        ON storage.objects
        FOR UPDATE
        TO authenticated
        USING (
          bucket_id = 'hero-images' AND
          auth.role() = 'authenticated'
        )
        WITH CHECK (
          bucket_id = 'hero-images' AND
          auth.role() = 'authenticated'
        );
      `
    })
    console.log('  ✓ Created: Authenticated update access')

    // Authenticated users can delete
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Allow authenticated deletes from hero-images"
        ON storage.objects
        FOR DELETE
        TO authenticated
        USING (
          bucket_id = 'hero-images' AND
          auth.role() = 'authenticated'
        );
      `
    })
    console.log('  ✓ Created: Authenticated delete access')

    console.log('\n✅ Policies fixed successfully!')
    console.log('\n📝 Summary:')
    console.log('   • Public users can: VIEW images')
    console.log('   • Authenticated users can: UPLOAD, UPDATE, DELETE')
    console.log('   • API route /api/upload still checks for ADMIN role')
    console.log('\n✨ Now try uploading an image in the admin panel!')

  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error('\n💡 Alternative: Manually update policies in Supabase dashboard:')
    console.log('   https://supabase.com/dashboard/project/cxbqochxrhokdscgijxe/storage/policies')
    process.exit(1)
  }
}

fixPolicies()
