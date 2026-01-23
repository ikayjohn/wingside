// Test Embedly API directly
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Simple Embedly client implementation for testing
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
    console.log(`   URL: ${this.baseUrl}/wallets/history?walletId=${walletId}`);
    console.log(`   API Key: ${this.apiKey ? this.apiKey.substring(0, 10) + '...' : 'MISSING'}`);

    const response = await this.makeRequest(`/wallets/history?walletId=${walletId}`);
    console.log(`   Response keys: ${Object.keys(response)}`);

    if (response.data) {
      console.log(`   Data keys: ${Object.keys(response.data)}`);
      if (response.data.walletHistories) {
        console.log(`   Wallet histories count: ${response.data.walletHistories.length}`);
      }
    }

    return response.data?.walletHistories || [];
  }
}

async function testEmbedlyAPI() {
  console.log('🔍 Testing Embedly API...\n');

  // Check if API key is set
  const apiKey = process.env.EMBEDLY_API_KEY;
  if (!apiKey) {
    console.log('❌ EMBEDLY_API_KEY is not set in .env.local');
    return;
  }
  console.log(`✅ EMBEDLY_API_KEY is set`);

  // Get first user
  const { data: users } = await supabase.auth.admin.listUsers();
  const firstUser = users.users[0];

  if (!firstUser) {
    console.log('❌ No users found!');
    return;
  }

  // Get profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('embedly_wallet_id')
    .eq('id', firstUser.id)
    .single();

  if (!profile?.embedly_wallet_id) {
    console.log('❌ User does not have an Embedly wallet');
    return;
  }

  console.log(`\n👤 User: ${firstUser.email}`);
  console.log(`🔑 Wallet ID: ${profile.embedly_wallet_id}`);

  // Test API
  try {
    const client = new SimpleEmbedlyClient(apiKey, 'production');
    const history = await client.getWalletHistory(profile.embedly_wallet_id);

    console.log(`\n✅ Successfully fetched ${history.length} transactions from Embedly`);

    if (history.length > 0) {
      console.log('\n📊 Recent Embedly transactions:');
      history.slice(0, 5).forEach((t, i) => {
        console.log(`   ${i + 1}. ${t.debitCreditIndicator === 'D' ? 'DEBIT' : 'CREDIT'} - ₦${t.amount}`);
        console.log(`      Ref: ${t.transactionReference}`);
        console.log(`      Remarks: ${t.remarks || 'No description'}`);
        console.log(`      Date: ${t.dateCreated}`);
        console.log('');
      });
    } else {
      console.log('\n⚠️  No transactions found in Embedly wallet');
      console.log('   This means either:');
      console.log('   - The wallet is brand new');
      console.log('   - No one has funded it yet');
      console.log('   - The wallet ID is incorrect');
    }

  } catch (error) {
    console.log(`\n❌ Failed to fetch Embedly history:`, error.message);
  }
}

testEmbedlyAPI().catch(console.error);
