/**
 * Setup hero-images storage bucket in Supabase
 * Run with: node scripts/setup-hero-images-storage.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function setupHeroImagesBucket() {
  console.log('🪣 Setting up hero-images storage bucket...')

  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()

    if (listError) {
      throw new Error(`Failed to list buckets: ${listError.message}`)
    }

    const heroImagesBucket = buckets?.find(b => b.id === 'hero-images')

    if (heroImagesBucket) {
      console.log('✅ hero-images bucket already exists')
    } else {
      // Create the bucket
      const { error: createError } = await supabase.storage.createBucket('hero-images', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
      })

      if (createError) {
        throw new Error(`Failed to create bucket: ${createError.message}`)
      }

      console.log('✅ Created hero-images bucket')
    }

    // Test upload to verify permissions
    console.log('\n🧪 Testing upload permissions...')

    const testFileName = `test-${Date.now()}.txt`
    const testContent = Buffer.from('test upload')

    const { error: uploadError } = await supabase.storage
      .from('hero-images')
      .upload(testFileName, testContent, {
        contentType: 'text/plain',
        upsert: true
      })

    if (uploadError) {
      console.error('⚠️  Upload test failed:', uploadError.message)
      console.log('\n⚠️  Note: You may need to manually set up RLS policies in Supabase dashboard:')
      console.log('   1. Go to https://supabase.com/dashboard/project/cxbqochxrhokdscgijxe/storage')
      console.log('   2. Click on "hero-images" bucket (or create it if it doesn\'t exist)')
      console.log('   3. Go to "Policies" tab')
      console.log('   4. Add a policy to allow authenticated users to upload')
      console.log('   5. Add a policy to allow public access for viewing')
    } else {
      console.log('✅ Upload test successful')

      // Clean up test file
      await supabase.storage.from('hero-images').remove([testFileName])
      console.log('✅ Cleaned up test file')
    }

    console.log('\n✨ Setup complete!')
    console.log('\n📝 Next steps:')
    console.log('   1. Try uploading an image in the admin panel')
    console.log('   2. If it still fails, check browser console for specific errors')
    console.log('   3. Check Supabase dashboard: https://supabase.com/dashboard/project/cxbqochxrhokdscgijxe/storage')

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

setupHeroImagesBucket()
