// Sync Embedly details for an existing customer
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const EMBEDLY_API_KEY = process.env.EMBEDLY_API_KEY;
const EMBEDLY_BASE_URL = process.env.EMBEDLY_BASE_URL || 'https://waas-prod.embedly.ng/api/v1';

async function embedlyRequest(endpoint, method = 'GET', body = null) {
  const response = await fetch(`${EMBEDLY_BASE_URL}${endpoint}`, {
    method,
    headers: {
      'x-api-key': EMBEDLY_API_KEY,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : null,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Embedly API error (${endpoint}): ${error}`);
  }

  return response.json();
}

async function syncCustomer(email) {
  console.log(`🔄 Syncing Embedly details for: ${email}\n`);

  // Get profile from database
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email)
    .single();

  if (profileError || !profile) {
    throw new Error('Profile not found in database');
  }

  console.log('📋 Current Profile Status:');
  console.log(`   Email: ${profile.email}`);
  console.log(`   Customer ID: ${profile.embedly_customer_id || 'NOT SET'}`);
  console.log(`   Wallet ID: ${profile.embedly_wallet_id || 'NOT SET'}`);
  console.log(`   Bank Account: ${profile.bank_account || 'NOT SET'}\n`);

  // Search for customer in Embedly by email
  console.log('🔍 Searching for customer in Embedly...\n');
  const customersResponse = await embedlyRequest('/customers/get/all');
  const customersData = customersResponse.data || customersResponse;

  const existingCustomer = customersData.find(
    c => c.emailAddress && c.emailAddress.toLowerCase() === email.toLowerCase()
  );

  if (!existingCustomer) {
    throw new Error('Customer not found in Embedly');
  }

  console.log('✅ Found Customer in Embedly:');
  console.log(`   Customer ID: ${existingCustomer.id}`);
  console.log(`   Name: ${existingCustomer.firstName} ${existingCustomer.lastName}`);
  console.log(`   Email: ${existingCustomer.emailAddress}\n`);

  // Try to get wallets for this customer
  console.log('💰 Searching for wallets...\n');

  try {
    // Since we can't list wallets by customer, we'll need the account number
    // Ask the user for it or check if we have a way to find it
    console.log('⚠️ Cannot automatically list wallets for customer.');
    console.log('⚠️ We need the account number to fetch wallet details.\n');

    if (profile.bank_account) {
      console.log(`✅ Found account number in database: ${profile.bank_account}`);
      console.log(`🔍 Fetching wallet details...\n`);

      const walletResponse = await embedlyRequest(`/wallets/get/wallet/account/${profile.bank_account}`);
      const wallet = walletResponse.data || walletResponse;

      console.log('✅ Wallet Found:');
      console.log(`   Wallet ID: ${wallet.id}`);
      console.log(`   Account: ${wallet.virtualAccount.accountNumber}`);
      console.log(`   Bank: ${wallet.virtualAccount.bankName}`);
      console.log(`   Balance: ₦${wallet.availableBalance || 0}\n`);

      // Update profile
      console.log('💾 Updating profile in database...\n');
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          embedly_customer_id: existingCustomer.id,
          embedly_wallet_id: wallet.id,
          bank_account: wallet.virtualAccount.accountNumber,
          bank_name: wallet.virtualAccount.bankName,
          bank_code: wallet.virtualAccount.bankCode,
          wallet_balance: wallet.availableBalance || 0,
          is_wallet_active: true,
          last_wallet_sync: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (updateError) {
        throw new Error(`Failed to update profile: ${updateError.message}`);
      }

      console.log('✅ Profile updated successfully!\n');

      console.log('='.repeat(60));
      console.log('📊 SYNC SUMMARY');
      console.log('='.repeat(60));
      console.log(`Email: ${profile.email}`);
      console.log(`Customer ID: ${existingCustomer.id}`);
      console.log(`Wallet ID: ${wallet.id}`);
      console.log(`Account: ${wallet.virtualAccount.accountNumber} - ${wallet.virtualAccount.bankName}`);
      console.log(`Balance: ₦${wallet.availableBalance || 0}`);
      console.log('='.repeat(60));

    } else {
      console.log('❌ No account number found in database.');
      console.log('\n🔧 To complete the sync, please provide the account number:');
      console.log(`   node scripts/link-existing-wallets.js ${email} <account-number>`);
    }

  } catch (error) {
    console.log(`⚠️ Could not fetch wallet: ${error.message}`);
    console.log('\n💾 At least updating customer ID...\n');

    // Update with customer ID even if wallet fetch fails
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        embedly_customer_id: existingCustomer.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', profile.id);

    if (updateError) {
      throw new Error(`Failed to update profile: ${updateError.message}`);
    }

    console.log('✅ Customer ID updated');
    console.log('⚠️ Wallet not linked - please provide account number to complete sync');
  }
}

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.log('Usage: node scripts/sync-embedly-customer.js <email>');
    console.log('\nExample:');
    console.log('  node scripts/sync-embedly-customer.js larte@wingside.ng');
    return;
  }

  await syncCustomer(email);
}

main().catch(console.error);
