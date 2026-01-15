// Test Supabase email verification
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testEmailVerification() {
  console.log('🔍 Testing Supabase email verification...\n');

  // Test 1: Check if we can trigger a verification email for a test user
  const testEmail = 'test@wingside.ng';

  console.log(`📧 Attempting to send verification email to: ${testEmail}\n`);

  try {
    // Create a test user
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'testpassword123',
      email_confirm: false,
      user_metadata: {
        full_name: 'Test User',
      },
    });

    if (createError) {
      console.error('❌ Error creating test user:', createError.message);
      return;
    }

    console.log('✅ Test user created:', userData.user.id);
    console.log('   Email:', userData.user.email);
    console.log('   Email confirmed:', userData.user.email_confirmed_at ? 'Yes' : 'No');

    // Try to send verification email
    console.log('\n📧 Sending verification email...');

    const { error: otpError } = await supabase.auth.admin.generateLink({
      type: 'signup',
      email: testEmail,
      password: 'testpassword123',
    });

    if (otpError) {
      console.error('❌ Error generating verification link:', otpError.message);
      console.error('   Details:', JSON.stringify(otpError, null, 2));
    } else {
      console.log('✅ Verification link generated successfully!');
    }

    // Check SMTP configuration
    console.log('\n📋 Checking your Supabase project settings:');
    console.log('   Go to: https://supabase.com/dashboard/project/' + process.env.NEXT_PUBLIC_SUPABASE_URL.split('//')[1].split('.')[0] + '/auth/templates');
    console.log('\n   Things to check:');
    console.log('   1. SMTP settings are configured (Settings > Auth > SMTP Settings)');
    console.log('   2. Email templates are enabled (Auth > Templates > Confirm signup)');
    console.log('   3. Sender email is verified with Resend');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testEmailVerification().catch(console.error);
