const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupImagesBucket() {
  try {
    console.log('🔄 Setting up images storage bucket...\n');

    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      throw listError;
    }

    const imagesBucket = buckets?.find(b => b.id === 'images');

    if (imagesBucket) {
      console.log('✅ Images bucket already exists!');
    } else {
      // Create the bucket
      const { error: createError } = await supabase.storage.createBucket('images', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
      });

      if (createError) {
        throw createError;
      }

      console.log('✅ Images bucket created successfully!');
    }

    // Set up bucket policies (make it public)
    const { error: policyError } = await supabase.storage.from('images').createSignedUrl('test.txt', 60);

    console.log('\n📋 Bucket Configuration:');
    console.log('   - Name: images');
    console.log('   - Public: Yes');
    console.log('   - File size limit: 5MB');
    console.log('   - Allowed types: PNG, JPEG, GIF, WebP');

    console.log('\n✨ Storage bucket is ready!');
    console.log('\n💡 You can now upload images from the admin panel.');

  } catch (error) {
    console.error('❌ Error setting up bucket:', error.message);
    console.error('\n💡 Please set up the bucket manually in your Supabase dashboard:');
    console.log('\n1. Go to: https://supabase.com/dashboard/project/cxbqochxrhokdscgijxe/storage');
    console.log('2. Click "New bucket"');
    console.log('3. Name it: images');
    console.log('4. Make it Public');
    console.log('5. Set file size limit to 5MB (optional)');
    console.log('6. Click "Create bucket"\n');
    process.exit(1);
  }
}

setupImagesBucket();
