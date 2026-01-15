// Test full signup flow with email verification
require('dotenv').config({ path: '.env.local' });

async function testSignup() {
  console.log('🧪 Testing full signup flow...\n');

  const timestamp = Date.now();
  const testEmail = `test+${timestamp}@wingside.ng`;
  const testData = {
    email: testEmail,
    password: 'testpassword123',
    firstName: 'Test',
    lastName: 'User',
    phone: '8012345678',
    referralId: '',
  };

  console.log('📝 Creating test user:', testEmail);

  try {
    const response = await fetch('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    const result = await response.json();

    console.log('\n📋 Response Status:', response.status);
    console.log('📋 Response Body:', JSON.stringify(result, null, 2));

    if (response.ok) {
      console.log('\n✅ Signup successful!');
      console.log('   User ID:', result.user?.id);
      console.log('   Referral Code:', result.user?.referralCode);

      // Check Resend logs
      console.log('\n📧 Check Resend logs for verification email:');
      console.log('   https://resend.com/dashboard/logs');
      console.log('   Look for email sent to:', testEmail);

    } else {
      console.log('\n❌ Signup failed:', result.error);
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

// Local test using direct Supabase call
async function testDirectSupabase() {
  console.log('\n\n🔍 Testing direct Supabase email send...\n');
  const { createClient } = require('@supabase/supabase-js');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const timestamp = Date.now();
  const testEmail = `direct+${timestamp}@wingside.ng`;

  console.log('📝 Creating user directly via Supabase admin API...');

  try {
    // Create user
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'testpassword123',
      email_confirm: false,
      user_metadata: {
        full_name: 'Direct Test User',
      },
    });

    if (createError) {
      console.error('❌ Create user error:', createError.message);
      return;
    }

    console.log('✅ User created:', userData.user.id);

    // Generate verification link
    console.log('\n📧 Generating verification link...');
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'signup',
      email: testEmail,
      password: 'testpassword123',
    });

    if (linkError) {
      console.error('❌ Link generation error:', linkError.message);
      console.error('   Details:', JSON.stringify(linkError, null, 2));
    } else {
      console.log('✅ Verification link generated!');
      console.log('   Email:', testEmail);
      console.log('   Action URL:', linkData.properties?.action_link);

      console.log('\n📧 EMAIL SHOULD HAVE BEEN SENT TO:', testEmail);
      console.log('   Check: https://resend.com/dashboard/logs');
      console.log('   Filter by: ' + testEmail);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function main() {
  console.log('='.repeat(80));
  console.log('SIGNUP & EMAIL VERIFICATION TEST');
  console.log('='.repeat(80));

  // Test direct Supabase first
  await testDirectSupabase();

  // Test via API endpoint (if dev server is running)
  console.log('\n\n' + '='.repeat(80));
  console.log('To test via API endpoint:');
  console.log('1. Make sure dev server is running: npm run dev');
  console.log('2. Run: node scripts/test-full-signup.js');
  console.log('='.repeat(80));
}

main().catch(console.error);
