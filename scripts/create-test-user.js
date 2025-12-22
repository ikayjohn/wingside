// Script to create a test user and check if wallet is auto-created
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize admin client with service role key
const adminSupabase = createClient(
  'https://cxbqochxrhokdscgijxe.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4YnFvY2h4cmhva2RzY2dpanhlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjA1MTUzNCwiZXhwIjoyMDgxNjI3NTM0fQ.NkuvWwmfalPWiIc_hRBFHIrzAyP3Shbv9sw167ITXFQ',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function createTestUser() {
  const testEmail = `testuser${Date.now()}@wingside.ng`;
  const password = 'Hoodhop@1';

  console.log('🔄 Creating test user...');
  console.log(`📧 Email: ${testEmail}`);
  console.log(`🔒 Password: ${password}\n`);

  try {
    // Step 1: Create user in Supabase Auth
    const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
      email: testEmail,
      password: password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: 'Test User',
        phone: '+2348012345678'
      }
    });

    if (authError) {
      console.error('❌ Error creating auth user:', authError.message);
      throw authError;
    }

    console.log('✅ Auth user created successfully');
    console.log(`   User ID: ${authData.user.id}\n`);

    // Step 2: Generate referral code
    const referralCode = `TEST${authData.user.id.slice(-4).toUpperCase()}`;

    // Step 3: Update profile with referral code (Supabase auto-creates profile)
    const { error: profileError } = await adminSupabase.from('profiles').update({
      full_name: 'Test User',
      phone: '+2348012345678',
      referral_code: referralCode
    }).eq('id', authData.user.id);

    if (profileError) {
      console.error('❌ Error updating profile:', profileError.message);
      throw profileError;
    }

    console.log('✅ Profile updated successfully');
    console.log(`   Referral Code: ${referralCode}\n`);

    // Step 4: Check if Embedly customer and wallet were auto-created
    console.log('🔍 Checking Embedly wallet status...');
    const { data: profileCheck, error: checkError } = await adminSupabase
      .from('profiles')
      .select('embedly_customer_id, embedly_wallet_id, bank_account, bank_name, wallet_balance')
      .eq('id', authData.user.id)
      .single();

    if (checkError) {
      console.error('❌ Error checking profile:', checkError.message);
    } else {
      console.log('\n📊 Embedly Integration Status:');
      console.log(`   Customer ID: ${profileCheck.embedly_customer_id || 'Not created'}`);
      console.log(`   Wallet ID: ${profileCheck.embedly_wallet_id || 'Not created'}`);

      if (profileCheck.embedly_wallet_id) {
        console.log(`   Bank Account: ${profileCheck.bank_account || 'N/A'}`);
        console.log(`   Bank Name: ${profileCheck.bank_name || 'N/A'}`);
        console.log(`   Wallet Balance: ₦${(profileCheck.wallet_balance || 0).toLocaleString()}`);
        console.log('\n✅ Wallet auto-created successfully! 🎉');
      } else {
        console.log('\n⚠️  Wallet was not auto-created during signup');
        console.log('   You can try logging in to trigger wallet creation');
      }
    }

    console.log('\n📝 Login Credentials:');
    console.log(`   Email: ${testEmail}`);
    console.log(`   Password: ${password}`);
    console.log('\n💡 You can use these credentials to login at /my-account');

  } catch (error) {
    console.error('\n❌ User creation failed:', error.message);
    process.exit(1);
  }
}

// Run the script
createTestUser()
  .then(() => {
    console.log('\n✅ Test user creation completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
