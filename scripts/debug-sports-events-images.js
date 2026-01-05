const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugSportsEvents() {
  try {
    console.log('🔍 Debugging sports events images...\n');

    // Get all sports events
    const { data: events, error } = await supabase
      .from('sports_events')
      .select('*');

    if (error) throw error;

    if (!events || events.length === 0) {
      console.log('❌ No sports events found in database.\n');
      console.log('💡 Add some events at: /admin/sports-events\n');
      return;
    }

    console.log(`📊 Found ${events.length} sports event(s):\n`);

    events.forEach((event, index) => {
      console.log(`\n${index + 1}. ${event.title}`);
      console.log(`   ID: ${event.id}`);
      console.log(`   Image URL: ${event.image_url}`);
      console.log(`   Active: ${event.is_active ? 'Yes' : 'No'}`);
      console.log(`   Date: ${event.date}`);

      // Check if URL is valid format
      const isValidUrl = event.image_url?.startsWith('http');
      const isSupabaseUrl = event.image_url?.includes('supabase.co');

      console.log(`   URL Format: ${isValidUrl ? '✅ Valid' : '❌ Invalid'}`);
      console.log(`   Source: ${isSupabaseUrl ? 'Supabase Storage' : 'External/Public folder'}`);

      // Test if image is accessible
      if (isValidUrl) {
        console.log(`   🔗 Test in browser: ${event.image_url}`);
      }
    });

    console.log('\n\n💡 Troubleshooting:');
    console.log('1. Copy any image URL above and paste it in your browser');
    console.log('2. Check browser console (F12) for CORS or 404 errors');
    console.log('3. If Supabase URLs fail, check bucket permissions');
    console.log('4. If external URLs fail, the image might not exist\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

debugSportsEvents();
