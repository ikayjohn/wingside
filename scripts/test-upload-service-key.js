/**
 * Test Supabase Storage upload with service role key
 * Run with: node scripts/test-upload-service-key.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testUpload() {
  console.log('🧪 Testing Supabase Storage upload with service role key...\n')

  try {
    // List buckets
    console.log('1️⃣ Listing buckets...')
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()

    if (listError) {
      console.error('❌ Failed to list buckets:', listError.message)
      return
    }

    console.log(`✅ Found ${buckets.length} buckets:`)
    buckets.forEach(bucket => {
      console.log(`   - ${bucket.name} (public: ${bucket.public})`)
    })

    // Check for hero-images bucket
    const heroBucket = buckets.find(b => b.id === 'hero-images')
    if (!heroBucket) {
      console.log('\n⚠️  hero-images bucket not found!')
      return
    }

    console.log('\n2️⃣ Testing upload to hero-images bucket...')

    // Create a small test file
    const testContent = Buffer.from('test upload ' + Date.now())
    const testFileName = `service-key-test-${Date.now()}.txt`

    const { data, error } = await supabase.storage
      .from('hero-images')
      .upload(testFileName, testContent, {
        contentType: 'text/plain',
        upsert: true
      })

    if (error) {
      console.error('❌ Upload failed:', error.message)
      console.error('   Error details:', error)
      return
    }

    console.log(`✅ Upload successful!`)
    console.log(`   File: ${testFileName}`)
    console.log(`   Path: ${data.path}`)

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('hero-images')
      .getPublicUrl(testFileName)

    console.log(`   Public URL: ${publicUrl}`)

    // Clean up
    console.log('\n3️⃣ Cleaning up test file...')
    await supabase.storage.from('hero-images').remove([testFileName])
    console.log('✅ Test file removed')

    console.log('\n✨ All tests passed! Storage bucket is working correctly.')

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

testUpload()
