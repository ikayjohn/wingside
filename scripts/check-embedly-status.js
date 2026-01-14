require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log('📊 Checking Embedly account status...\n');

  const { data, error } = await supabase
    .from('profiles')
    .select('email, full_name, embedly_customer_id, embedly_wallet_id, wallet_balance, created_at')
    .gte('created_at', '2025-01-13')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Total customers:', data.length);
  console.log('With Embedly customer ID:', data.filter(p => p.embedly_customer_id).length);
  console.log('With Embedly wallet ID:', data.filter(p => p.embedly_wallet_id).length);
  console.log('\nDetails:\n');

  data.forEach(profile => {
    const hasCustomer = profile.embedly_customer_id ? '✅' : '❌';
    const hasWallet = profile.embedly_wallet_id ? '✅' : '❌';
    console.log(`${hasCustomer} ${hasWallet} ${profile.email}`);
    if (profile.embedly_customer_id) {
      console.log(`   Customer: ${profile.embedly_customer_id}`);
    }
    if (profile.embedly_wallet_id) {
      console.log(`   Wallet: ${profile.embedly_wallet_id}`);
      console.log(`   Balance: ₦${profile.wallet_balance || 0}`);
    }
    console.log('');
  });
}

main().catch(console.error);
