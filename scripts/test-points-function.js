/**
 * Test get_user_points_details function
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function testFunction() {
  console.log('🧪 Testing get_user_points_details function\n');

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // First, get a list of users to test with
  console.log('📋 Fetching users...');
  const { data: users, error: usersError } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .limit(3);

  if (usersError) {
    console.error('❌ Error fetching users:', usersError);
    process.exit(1);
  }

  if (!users || users.length === 0) {
    console.error('❌ No users found in database');
    process.exit(1);
  }

  console.log(`✅ Found ${users.length} users to test\n`);

  // Test the function with each user
  for (const user of users) {
    console.log(`Testing user: ${user.email} (${user.id})`);
    console.log('='.repeat(60));

    const { data, error } = await supabase.rpc('get_user_points_details', {
      p_user_id: user.id
    });

    if (error) {
      console.error('❌ Error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
    } else if (!data || data.length === 0) {
      console.log('⚠️  No data returned');
    } else {
      console.log('✅ Success!');
      console.log('Data:', JSON.stringify(data[0], null, 2));
    }
    console.log('');
  }

  console.log('\n✨ Test complete!');
}

testFunction();
