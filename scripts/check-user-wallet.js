// Check existing user wallet status
const { createClient } = require('@supabase/supabase-js');

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

async function checkUserWallet() {
  const userId = 'b0c5db1a-7d93-47a0-8ab3-29ece9a0beb5';

  console.log('🔍 Checking wallet status for user...\n');

  const { data: profileCheck, error: checkError } = await adminSupabase
    .from('profiles')
    .select('id, email, full_name, embedly_customer_id, embedly_wallet_id, bank_account, bank_name, wallet_balance, created_at')
    .eq('id', userId)
    .single();

  if (checkError) {
    console.error('❌ Error checking profile:', checkError.message);
    return;
  }

  if (profileCheck) {
    console.log('📊 User Profile:');
    console.log(`   Email: ${profileCheck.email}`);
    console.log(`   Name: ${profileCheck.full_name}`);
    console.log(`   Created: ${profileCheck.created_at}\n`);

    console.log('🏦 Embedly Integration Status:');
    console.log(`   Customer ID: ${profileCheck.embedly_customer_id || '❌ Not created'}`);
    console.log(`   Wallet ID: ${profileCheck.embedly_wallet_id || '❌ Not created'}`);

    if (profileCheck.embedly_wallet_id) {
      console.log(`   Bank Account: ${profileCheck.bank_account || 'N/A'}`);
      console.log(`   Bank Name: ${profileCheck.bank_name || 'N/A'}`);
      console.log(`   Wallet Balance: ₦${(profileCheck.wallet_balance || 0).toLocaleString()}`);
      console.log('\n✅ Wallet exists! 🎉');
    } else {
      console.log('\n⚠️  Wallet was not auto-created');
      console.log('   Try logging in at /my-account to trigger wallet creation');
    }
  }
}

checkUserWallet().then(() => process.exit(0));
