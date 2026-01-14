// Test script to see actual wallet creation API response
require('dotenv').config({ path: '.env.local' });

const EMBEDLY_API_KEY = process.env.EMBEDLY_API_KEY;
const EMBEDLY_ORG_ID = process.env.EMBEDLY_ORG_ID;
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

  console.log(`\n📡 Request: ${method} ${endpoint}`);
  console.log(`Status: ${response.status} ${response.statusText}`);

  const rawText = await response.text();
  console.log(`Raw response length: ${rawText.length}`);
  console.log(`Raw response (first 500 chars):\n${rawText.substring(0, 500)}`);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${rawText}`);
  }

  try {
    return JSON.parse(rawText);
  } catch (e) {
    return { rawResponse: rawText };
  }
}

async function main() {
  console.log('🧪 Testing Embedly wallet creation API...\n');

  // Use an existing customer ID
  const customerId = 'bc28ec07-f180-11f0-86fd-7e79517010a5'; // nuel.impact@gmail.com

  // Get NGN currency
  console.log('\n1️⃣ Getting currencies...');
  const currencies = await embedlyRequest('/utilities/currencies/get');
  const currenciesData = currencies.data || currencies;
  const ngn = currenciesData.find(c => c.shortName === 'NGN');

  if (!ngn) {
    console.error('❌ NGN currency not found');
    process.exit(1);
  }

  console.log(`✅ NGN Currency ID: ${ngn.id}`);

  // Create wallet
  console.log('\n2️⃣ Creating wallet...');
  const walletData = {
    customerId: customerId,
    currencyId: ngn.id,
    name: 'Test Wallet',
  };

  console.log('Request body:', JSON.stringify(walletData, null, 2));

  const walletResponse = await embedlyRequest('/wallets/add', 'POST', walletData);

  console.log('\n3️⃣ Full response:');
  console.log(JSON.stringify(walletResponse, null, 2));

  // Check response structure
  console.log('\n4️⃣ Response structure analysis:');
  console.log(`- Has walletId: ${!!walletResponse.walletId}`);
  console.log(`- Has data.walletId: ${!!walletResponse.data?.walletId}`);
  console.log(`- Has data.id: ${!!walletResponse.data?.id}`);
  console.log(`- Has message: ${!!walletResponse.message}`);
  console.log(`- Message text: "${walletResponse.message}"`);

  // Try to get wallet by different methods
  if (walletResponse.walletId) {
    console.log(`\n5️⃣ Fetching wallet details for ${walletResponse.walletId}...`);
    try {
      const walletDetails = await embedlyRequest(`/wallets/get/wallet/${walletResponse.walletId}`);
      console.log('✅ Wallet details:');
      console.log(JSON.stringify(walletDetails, null, 2));
    } catch (error) {
      console.error(`❌ Error fetching wallet details: ${error.message}`);
    }
  }
}

main().catch(console.error);
