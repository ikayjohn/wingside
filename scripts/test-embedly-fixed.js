// Test Embedly API with date parameters
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

class SimpleEmbedlyClient {
  constructor(apiKey, environment = 'production') {
    this.apiKey = apiKey;

    if (environment === 'production') {
      this.baseUrl = 'https://waas-prod.embedly.ng/api/v1';
    } else {
      this.baseUrl = 'https://waas-staging.embedly.ng/api/v1';
    }
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;

    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      console.log(`   Status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.log(`   Error response: ${errorText}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Request error:', error.message);
      throw error;
    }
  }

  async getWalletHistory(walletId) {
    console.log(`\n📡 Fetching Embedly wallet history...`);

    // Add required date parameters
    const fromDate = new Date();
    fromDate.setMonth(fromDate.getMonth() - 6);
    const from = fromDate.toISOString().split('T')[0];

    const toDate = new Date();
    const to = toDate.toISOString().split('T')[0];

    console.log(`   From: ${from}`);
    console.log(`   To: ${to}`);
    console.log(`   Wallet ID: ${walletId}`);

    const response = await this.makeRequest(`/wallets/history?walletId=${walletId}&from=${from}&to=${to}`);

    return response.data?.walletHistories || [];
  }
}

async function testEmbedlyAPI() {
  console.log('🔍 Testing Embedly API with Date Parameters...\n');

  const apiKey = process.env.EMBEDLY_API_KEY;
  if (!apiKey) {
    console.log('❌ EMBEDLY_API_KEY is not set');
    return;
  }

  const { data: users } = await supabase.auth.admin.listUsers();
  const firstUser = users.users[0];

  const { data: profile } = await supabase
    .from('profiles')
    .select('embedly_wallet_id')
    .eq('id', firstUser.id)
    .single();

  if (!profile?.embedly_wallet_id) {
    console.log('❌ User does not have an Embedly wallet');
    return;
  }

  try {
    const client = new SimpleEmbedlyClient(apiKey, 'production');
    const history = await client.getWalletHistory(profile.embedly_wallet_id);

    console.log(`\n✅ Successfully fetched ${history.length} transactions from Embedly`);

    if (history.length > 0) {
      console.log('\n📊 Recent Embedly transactions:');
      history.slice(0, 10).forEach((t, i) => {
        const type = t.debitCreditIndicator === 'D' ? 'DEBIT (Payment)' : 'CREDIT (Funding)';
        const amount = Math.abs(t.amount).toLocaleString();
        console.log(`\n   ${i + 1}. ${type}`);
        console.log(`      Amount: ₦${amount}`);
        console.log(`      Balance: ₦${t.balance.toLocaleString()}`);
        console.log(`      Description: ${t.remarks || t.name || 'No description'}`);
        console.log(`      Reference: ${t.transactionReference}`);
        console.log(`      Date: ${t.dateCreated}`);
      });
    } else {
      console.log('\n⚠️  No transactions found in Embedly wallet');
      console.log('   This could mean:');
      console.log('   - The wallet is brand new');
      console.log('   - No one has funded it yet');
      console.log('   - All transactions are older than 6 months');
    }

  } catch (error) {
    console.log(`\n❌ Failed: ${error.message}`);
  }
}

testEmbedlyAPI().catch(console.error);
