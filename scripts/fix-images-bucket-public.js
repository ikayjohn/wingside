const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixBucketPermissions() {
  try {
    console.log('🔄 Fixing images bucket permissions...\n');

    // Check current bucket status
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      throw listError;
    }

    const imagesBucket = buckets?.find(b => b.id === 'images');

    if (!imagesBucket) {
      throw new Error('Images bucket not found!');
    }

    console.log('📋 Current bucket status:');
    console.log(`   - Name: ${imagesBucket.id}`);
    console.log(`   - Public: ${imagesBucket.public ? 'Yes' : 'No'}`);
    console.log(`   - File size limit: ${imagesBucket.file_size_limit || 'None'}`);
    console.log(`   - Allowed MIME types: ${imagesBucket.allowed_mime_types?.join(', ') || 'All'}\n`);

    if (!imagesBucket.public) {
      console.log('⚠️  Bucket is not public. Making it public now...\n');

      // Update bucket to public
      const { error: updateError } = await supabase.storage.updateBucket('images', {
        public: true
      });

      if (updateError) {
        console.error('❌ Error updating bucket:', updateError.message);
        console.error('\n💡 Manual steps to fix:');
        console.log('1. Go to: https://supabase.com/dashboard/project/cxbqochxrhokdscgijxe/storage/images');
        console.log('2. Click on the "Configuration" or "Settings" tab');
        console.log('3. Toggle "Public bucket" to ON');
        console.log('4. Click "Save"\n');
        throw updateError;
      }

      console.log('✅ Bucket is now public!\n');
    } else {
      console.log('✅ Bucket is already public!\n');
    }

    // Test by getting a public URL
    console.log('🧪 Testing public access...');
    const { data: testUrlData } = supabase.storage.from('images').getPublicUrl('sports-events/test.jpg');
    console.log(`   Sample public URL format: ${testUrlData.publicUrl}\n`);

    console.log('✨ Permissions fixed! Images should now be visible on the sports page.');
    console.log('\n💡 If images still don\'t show:');
    console.log('   1. Clear your browser cache');
    console.log('   2. Check the browser console for specific errors');
    console.log('   3. Verify images exist in the bucket\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixBucketPermissions();
