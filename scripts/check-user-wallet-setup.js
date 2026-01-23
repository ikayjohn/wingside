// Check user's Embedly wallet setup
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUserWallet() {
  console.log('🔍 Checking User Wallet Setup...\n');

  // Get first user
  const { data: users } = await supabase.auth.admin.listUsers();
  const firstUser = users.users[0];

  if (!firstUser) {
    console.log('❌ No users found!');
    return;
  }

  console.log(`👤 Checking user: ${firstUser.email} (${firstUser.id})\n`);

  // Check profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', firstUser.id)
    .single();

  if (profileError) {
    console.log('❌ Profile error:', profileError.message);
  } else {
    console.log('📋 Profile found:');
    console.log(`   - Name: ${profile.full_name}`);
    console.log(`   - Bank Account: ${profile.bank_account || 'NOT SET'}`);
    console.log(`   - Embedly Wallet ID: ${profile.embedly_wallet_id || 'NOT SET'}`);
    console.log(`   - Wallet Balance: ₦${profile.wallet_balance || 0}`);
  }

  // Check local wallet transactions
  console.log('\n💰 Local wallet_transactions:');
  const { data: localTxns, error: localError } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('user_id', firstUser.id)
    .order('created_at', { ascending: false })
    .limit(5);

  if (localError) {
    console.log('   ❌ Error:', localError.message);
  } else if (!localTxns || localTxns.length === 0) {
    console.log('   ⚠️  No local transactions found');
  } else {
    console.log(`   ✅ Found ${localTxns.length} transactions:`);
    localTxns.forEach((t) => {
      console.log(`      - ${t.transaction_type}: ₦${t.amount} (${t.type})`);
    });
  }

  // If user has Embedly wallet, check if we can fetch history
  if (profile?.embedly_wallet_id) {
    console.log('\n🔗 User has Embedly wallet!');
    console.log(`   Wallet ID: ${profile.embedly_wallet_id}`);

    // Test Embedly API call
    try {
      const embedlyClient = require('@/lib/embedly/client').default;
      const history = await embedlyClient.getWalletHistory(profile.embedly_wallet_id);
      console.log(`\n📊 Embedly wallet history: ${history.length} transactions`);

      if (history.length > 0) {
        console.log('   Recent transactions:');
        history.slice(0, 3).forEach((t) => {
          console.log(`      - ${t.debitCreditIndicator === 'D' ? 'DEBIT' : 'CREDIT'}: ₦${t.amount} - ${t.remarks || t.description}`);
        });
      } else {
        console.log('   ⚠️  No transactions in Embedly wallet');
      }
    } catch (error) {
      console.log('   ❌ Error fetching Embedly history:', error.message);
    }
  } else {
    console.log('\n⚠️  User does NOT have an Embedly wallet set up');
    console.log('   This means wallet history will only show local transactions');
  }
}

checkUserWallet().catch(console.error);
