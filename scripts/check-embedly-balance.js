// Check actual Embedly wallet balance
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

class SimpleEmbedlyClient {
  constructor(apiKey, environment = 'production') {
    this.apiKey = apiKey;
    this.baseUrl = environment === 'production'
      ? 'https://waas-prod.embedly.ng/api/v1'
      : 'https://waas-staging.embedly.ng/api/v1';
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
      ...options.headers,
    };

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return await response.json();
  }

  async getWalletById(walletId) {
    const response = await this.makeRequest(`/wallets/get/wallet/${walletId}`);
    return response.data;
  }
}

async function checkWallet() {
  console.log('💰 Checking Embedly Wallet Balance...\n');

  const apiKey = process.env.EMBEDLY_API_KEY;
  if (!apiKey) {
    console.log('❌ EMBEDLY_API_KEY not set');
    return;
  }

  const { data: users } = await supabase.auth.admin.listUsers();
  const firstUser = users.users[0];

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', firstUser.id)
    .single();

  console.log(`👤 User: ${profile.full_name} (${firstUser.email})`);
  console.log(`🔑 Wallet ID: ${profile.embedly_wallet_id}`);

  try {
    const client = new SimpleEmbedlyClient(apiKey, 'production');
    const wallet = await client.getWalletById(profile.embedly_wallet_id);

    console.log(`\n💳 Embedly Wallet Details:`);
    console.log(`   Name: ${wallet.name}`);
    console.log(`   Available Balance: ₦${wallet.availableBalance.toLocaleString()}`);
    console.log(`   Ledger Balance: ₦${wallet.ledgerBalance.toLocaleString()}`);
    console.log(`   Currency: ${wallet.currencyId}`);
    console.log(`   Is Default: ${wallet.isDefault}`);

    if (wallet.virtualAccount) {
      console.log(`\n🏦 Virtual Account:`);
      console.log(`   Account Number: ${wallet.virtualAccount.accountNumber}`);
      console.log(`   Bank Code: ${wallet.virtualAccount.bankCode}`);
      console.log(`   Bank Name: ${wallet.virtualAccount.bankName}`);
    }

    console.log(`\n📊 Local Profile Balance:`);
    console.log(`   wallet_balance: ₦${(profile.wallet_balance || 0).toLocaleString()}`);

    console.log(`\n🔍 Analysis:`);
    if (wallet.availableBalance > 0) {
      console.log(`   ✅ Embedly wallet HAS money (₦${wallet.availableBalance.toLocaleString()})`);
      console.log(`   ℹ️  But no transactions in the last 6 months`);
      console.log(`   ℹ️  This suggests the funding happened more than 6 months ago`);
      console.log(`   ℹ️  Or the transactions are not being returned by the API`);
    } else {
      console.log(`   ⚠️  Embedly wallet is EMPTY (₦0)`);
      if (profile.wallet_balance > 0) {
        console.log(`   ⚠️  But local profile shows ₦${profile.wallet_balance.toLocaleString()}`);
        console.log(`   ℹ️  This is a discrepancy - local balance doesn't match Embedly`);
      }
    }

  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

checkWallet().catch(console.error);
