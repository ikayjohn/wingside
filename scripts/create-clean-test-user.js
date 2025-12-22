// Create a clean test user for wallet testing
const { createClient } = require('@supabase/supabase-js');

const adminSupabase = createClient(
  process.env.SUPABASE_URL || 'https://cxbqochxrhokdscgijxe.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function createCleanTestUser() {
  const timestamp = Date.now().toString().slice(-6);
  const testEmail = `wallettest${timestamp}@wingside.ng`;
  const password = 'Hoodhop@1';

  console.log('🔄 Creating clean test user...\n');
  console.log(`📧 Email: ${testEmail}`);
  console.log(`🔒 Password: ${password}\n`);

  try {
    // Create user in Supabase Auth (profile will be auto-created)
    const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
      email: testEmail,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: 'Wallet Test User',
        phone: '+2348012345678'
      }
    });

    if (authError) {
      console.error('❌ Error:', authError.message);
      throw authError;
    }

    console.log('✅ User created successfully!');
    console.log(`   User ID: ${authData.user.id}\n`);

    // Update profile with referral code
    const referralCode = `WLT${timestamp.toUpperCase()}`;
    await adminSupabase.from('profiles').update({
      referral_code: referralCode
    }).eq('id', authData.user.id);

    console.log(`✅ Profile updated with referral code: ${referralCode}\n`);

    console.log('=' .repeat(60));
    console.log('📝 TEST USER CREDENTIALS:');
    console.log('='.repeat(60));
    console.log(`   Email:    ${testEmail}`);
    console.log(`   Password: ${password}`);
    console.log('='.repeat(60));
    console.log('\n💡 Next Steps:');
    console.log('   1. Go to http://localhost:3000/my-account');
    console.log('   2. Login with these credentials');
    console.log('   3. Check if wallet is auto-created after login');
    console.log('   4. Or sign up as a new user to test auto-creation\n');

    // Note: Auto-wallet creation happens during signup flow
    console.log('⚠️  Note: Auto-wallet creation happens during SIGNUP, not login.');
    console.log('   To test auto-creation, sign up as a new user instead.\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createCleanTestUser()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
