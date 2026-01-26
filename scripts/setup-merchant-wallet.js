// Script to set up merchant wallet for receiving customer payments
const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

const EMBEDLY_API_KEY = process.env.EMBEDLY_API_KEY;
const EMBEDLY_BASE_URL = process.env.EMBEDLY_BASE_URL || 'https://waas-prod.embedly.ng/api/v1';
const EMBEDLY_ORG_ID = process.env.EMBEDLY_ORG_ID;

async function embedlyRequest(endpoint, options = {}) {
  const url = `${EMBEDLY_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': EMBEDLY_API_KEY,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  return await response.json();
}

async function setupMerchantWallet() {
  console.log('🔍 Setting up merchant wallet for Wingside...\n');

  try {
    // Step 1: Check if you already have a customer account
    console.log('📋 Step 1: Checking for existing customer account...');
    const customersResponse = await embedlyRequest('/customers/get/all');
    const customers = customersResponse.data;

    if (!customers || customers.length === 0) {
      console.error('❌ No customers found. You need to create a customer account first.');
      console.log('\n💡 To create a customer account for your business:');
      console.log('   1. Go to your Embedly dashboard');
      console.log('   2. Navigate to Customers → Add Customer');
      console.log('   3. Fill in your business details');
      console.log('   4. Or contact Embedly support to set up a business/merchant account\n');
      return;
    }

    console.log(`✅ Found ${customers.length} customer account(s)\n`);

    // Step 2: Get currencies to find NGN
    console.log('📋 Step 2: Getting available currencies...');
    const currenciesResponse = await embedlyRequest('/utilities/currencies/get');
    const ngnCurrency = currenciesResponse.data.find(c => c.shortName === 'NGN');

    if (!ngnCurrency) {
      console.error('❌ NGN currency not found');
      return;
    }
    console.log(`✅ Found NGN currency: ${ngnCurrency.id}\n`);

    // Step 3: Check for existing wallets
    console.log('📋 Step 3: Checking for existing wallets...');

    for (const customer of customers) {
      console.log(`\n👤 Customer: ${customer.firstName} ${customer.lastName} (${customer.emailAddress})`);
      console.log(`   Customer ID: ${customer.id}`);

      // Try to get wallets for this customer
      try {
        // Embedly doesn't have a direct "get wallets by customer" endpoint
        // But we can try to search or you might need to check your dashboard
        console.log('   ℹ️  To check wallets for this customer:');
        console.log('      1. Go to Embedly Dashboard → Wallets');
        console.log('      2. Look for wallets owned by this customer');
        console.log('      3. Copy the Wallet ID');
      } catch (err) {
        console.log('   ⚠️  Could not auto-detect wallets');
      }
    }

    // Step 4: Instructions for creating/using merchant wallet
    console.log('\n\n📝 NEXT STEPS:\n');
    console.log('Option 1: Use an existing wallet');
    console.log('─────────────────────────────────');
    console.log('1. Log into your Embedly dashboard: https://dashboard.embedly.ng');
    console.log('2. Navigate to Wallets section');
    console.log('3. If you already have a wallet, copy its Wallet ID');
    console.log('4. Update your .env.local file:');
    console.log('   EMBEDLY_MERCHANT_WALLET_ID=<your-wallet-id>');
    console.log('');
    console.log('Option 2: Create a new merchant wallet');
    console.log('──────────────────────────────────────');
    console.log('1. Log into Embedly dashboard');
    console.log('2. Navigate to Wallets → Create Wallet');
    console.log('3. Select your business customer account');
    console.log('4. Select Currency: NGN');
    console.log('5. Name it something like "Wingside Merchant Wallet"');
    console.log('6. Copy the created Wallet ID');
    console.log('7. Update your .env.local file:');
    console.log('   EMBEDLY_MERCHANT_WALLET_ID=<your-wallet-id>');
    console.log('');
    console.log('Option 3: Create wallet via API (recommended)');
    console.log('──────────────────────────────────────────────');
    console.log('Run: node scripts/create-merchant-wallet.js');
    console.log('This will automatically create a wallet and update your .env.local');
    console.log('');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Full error:', error);
  }
}

// Run the script
setupMerchantWallet()
  .then(() => {
    console.log('\n✅ Done!');
  })
  .catch(error => {
    console.error('\n❌ Failed:', error);
    process.exit(1);
  });
