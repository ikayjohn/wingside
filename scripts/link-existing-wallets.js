// Script to link existing Embedly wallets using account numbers
// Usage: node scripts/link-existing-wallets.js <email> <accountNumber>
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

async function linkWalletByEmail(email, accountNumber) {
  console.log(`🔄 Looking up wallet for account: ${accountNumber}`);

  try {
    // Get wallet by account number
    const walletResponse = await embedlyRequest(`/wallets/get/wallet/account/${accountNumber}`);
    const wallet = walletResponse.data || walletResponse;

    if (!wallet || !wallet.id) {
      throw new Error('Wallet not found with this account number');
    }

    console.log(`✅ Found wallet: ${wallet.id}`);
    console.log(`   Account: ${wallet.virtualAccount?.accountNumber}`);
    console.log(`   Bank: ${wallet.virtualAccount?.bankName}`);
    console.log(`   Balance: ₦${wallet.availableBalance || 0}`);
    console.log(`   Customer ID: ${wallet.customerId}`);

    // Get user profile by email
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (profileError || !profile) {
      throw new Error(`Profile not found for email: ${email}`);
    }

    console.log(`\n👤 Found profile: ${profile.email}`);

    // Verify customer ID matches
    if (profile.embedly_customer_id && profile.embedly_customer_id !== wallet.customerId) {
      console.log(`\n⚠️ WARNING: Customer ID mismatch!`);
      console.log(`   Profile customer ID: ${profile.embedly_customer_id}`);
      console.log(`   Wallet customer ID: ${wallet.customerId}`);
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const answer = await new Promise(resolve => {
        rl.question('Do you want to continue anyway? (yes/no): ', resolve);
      });
      rl.close();

      if (answer.toLowerCase() !== 'yes') {
        console.log('❌ Cancelled');
        return;
      }
    }

    // Update profile with wallet details
    console.log(`\n💾 Updating profile...`);
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        embedly_customer_id: wallet.customerId,
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

    console.log(`✅ Profile updated successfully!`);
    console.log(`\n📊 Summary:`);
    console.log(`   Email: ${profile.email}`);
    console.log(`   Customer ID: ${wallet.customerId}`);
    console.log(`   Wallet ID: ${wallet.id}`);
    console.log(`   Account: ${wallet.virtualAccount.accountNumber} - ${wallet.virtualAccount.bankName}`);
    console.log(`   Balance: ₦${wallet.availableBalance || 0}`);

  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
  }
}

async function listUnlinkedProfiles() {
  console.log('📊 Listing profiles with customer IDs but missing wallets...\n');

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('email, full_name, embedly_customer_id, created_at')
    .not('embedly_customer_id', 'is', null)
    .is('embedly_wallet_id', null)
    .gte('created_at', '2025-01-13')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching profiles:', error);
    return;
  }

  if (!profiles || profiles.length === 0) {
    console.log('✅ All profiles have wallets linked!');
    return;
  }

  console.log(`Found ${profiles.length} profiles needing wallet linkage:\n`);
  console.log('EMAIL'.padEnd(40), 'CUSTOMER ID');
  console.log('='.repeat(100));

  profiles.forEach(profile => {
    console.log(
      profile.email.padEnd(40),
      profile.embedly_customer_id
    );
  });

  console.log('\n' + '='.repeat(100));
  console.log('\nTo link a wallet, run:');
  console.log('  node scripts/link-existing-wallets.js <email> <account_number>');
  console.log('\nExample:');
  console.log('  node scripts/link-existing-wallets.js user@example.com 9710295526');
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    // List all unlinked profiles
    await listUnlinkedProfiles();
  } else if (args.length === 2) {
    // Link specific wallet
    const [email, accountNumber] = args;
    await linkWalletByEmail(email, accountNumber);
  } else {
    console.log('Usage:');
    console.log('  node scripts/link-existing-wallets.js                    # List unlinked profiles');
    console.log('  node scripts/link-existing-wallets.js <email> <account>   # Link wallet by account number');
  }
}

main().catch(console.error);
