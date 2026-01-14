require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log('📊 Checking for bank account numbers...\n');

  const { data, error } = await supabase
    .from('profiles')
    .select('email, bank_account, bank_name, bank_code, embedly_customer_id, embedly_wallet_id')
    .not('embedly_customer_id', 'is', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Profiles with bank_account data:\n');

  data.forEach(profile => {
    if (profile.bank_account) {
      console.log(`✅ ${profile.email}`);
      console.log(`   Account: ${profile.bank_account}`);
      console.log(`   Bank: ${profile.bank_name || 'N/A'}`);
      console.log(`   Customer ID: ${profile.embedly_customer_id}`);
      console.log(`   Wallet ID: ${profile.embedly_wallet_id || 'MISSING'}`);
      console.log('');
    }
  });

  const withBankAccount = data.filter(p => p.bank_account).length;
  const withoutBankAccount = data.filter(p => !p.bank_account && p.embedly_customer_id).length;

  console.log('\n' + '='.repeat(60));
  console.log('Summary:');
  console.log('='.repeat(60));
  console.log(`With bank_account: ${withBankAccount}`);
  console.log(`With customer_id but no bank_account: ${withoutBankAccount}`);
}

main().catch(console.error);
