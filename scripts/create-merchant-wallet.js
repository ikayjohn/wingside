// Script to automatically create a merchant wallet via Embedly API
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
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

async function createMerchantWallet() {
  console.log('🚀 Creating merchant wallet for Wingside...\n');

  try {
    // Step 1: Get all customers to find your business account
    console.log('📋 Step 1: Finding your business customer account...');
    const customersResponse = await embedlyRequest('/customers/get/all');
    const customers = customersResponse.data;

    if (!customers || customers.length === 0) {
      throw new Error('No customer accounts found. Please create a customer account first.');
    }

    // Show all customers and let user choose
    console.log('\n📋 Available customer accounts:');
    customers.forEach((customer, index) => {
      console.log(`\n${index + 1}. ${customer.firstName} ${customer.lastName}`);
      console.log(`   Email: ${customer.emailAddress}`);
      console.log(`   ID: ${customer.id}`);
    });

    // For automation, use the first customer (you can modify this logic)
    const selectedCustomer = customers[0];
    console.log(`\n✅ Using customer: ${selectedCustomer.firstName} ${selectedCustomer.lastName}`);

    // Step 2: Get NGN currency ID
    console.log('\n📋 Step 2: Getting NGN currency...');
    const currenciesResponse = await embedlyRequest('/utilities/currencies/get');
    const ngnCurrency = currenciesResponse.data.find(c => c.shortName === 'NGN');

    if (!ngnCurrency) {
      throw new Error('NGN currency not found');
    }
    console.log(`✅ NGN Currency ID: ${ngnCurrency.id}`);

    // Step 3: Create merchant wallet
    console.log('\n📋 Step 3: Creating merchant wallet...');
    const walletData = {
      customerId: selectedCustomer.id,
      currencyId: ngnCurrency.id,
      name: 'Wingside Merchant Wallet'
    };

    const createWalletResponse = await embedlyRequest('/wallets/add', {
      method: 'POST',
      body: JSON.stringify(walletData),
    });

    const walletId = createWalletResponse.walletId;
    const virtualAccount = createWalletResponse.virtualAccount;

    console.log('\n🎉 Merchant wallet created successfully!\n');
    console.log('Wallet Details:');
    console.log('───────────────');
    console.log(`Wallet ID: ${walletId}`);
    console.log(`Account Number: ${virtualAccount.accountNumber}`);
    console.log(`Bank Name: ${virtualAccount.bankName}`);
    console.log(`Bank Code: ${virtualAccount.bankCode}`);

    // Step 4: Update .env.local file
    console.log('\n📋 Step 4: Updating .env.local file...');
    const envPath = path.join(__dirname, '../.env.local');
    let envContent = fs.readFileSync(envPath, 'utf8');

    // Replace the placeholder with actual wallet ID
    envContent = envContent.replace(
      /EMBEDLY_MERCHANT_WALLET_ID=.*/,
      `EMBEDLY_MERCHANT_WALLET_ID=${walletId}`
    );

    fs.writeFileSync(envPath, envContent);
    console.log('✅ Updated .env.local with merchant wallet ID');

    // Step 5: Verify the wallet was created
    console.log('\n📋 Step 5: Verifying wallet...');
    const walletResponse = await embedlyRequest(`/wallets/get/wallet/${walletId}`);
    const wallet = walletResponse.data;

    console.log('\n✅ Wallet verified:');
    console.log(`   Available Balance: ₦${wallet.availableBalance}`);
    console.log(`   Ledger Balance: ₦${wallet.ledgerBalance}`);
    console.log(`   Currency: ${wallet.currencyId}`);
    console.log(`   Is Default: ${wallet.isDefault}`);

    console.log('\n\n🎉 SUCCESS! Merchant wallet is ready to receive payments.');
    console.log('\n📝 IMPORTANT NOTES:');
    console.log('──────────────────');
    console.log('1. Restart your dev server (npm run dev) to load the new wallet ID');
    console.log('2. Customer wallet payments will now transfer to this merchant wallet');
    console.log('3. You can fund this wallet via bank transfer to:');
    console.log(`   Account: ${virtualAccount.accountNumber}`);
    console.log(`   Bank: ${virtualAccount.bankName}`);
    console.log('4. Monitor balance in Embedly dashboard or via API\n');

    return {
      walletId,
      customerId: selectedCustomer.id,
      virtualAccount
    };

  } catch (error) {
    console.error('\n❌ Error creating merchant wallet:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   - Make sure EMBEDLY_API_KEY is correct in .env.local');
    console.error('   - Verify you have a customer account in Embedly dashboard');
    console.error('   - Check your Embedly API permissions');
    console.error('   - Contact Embedly support if issues persist\n');
    throw error;
  }
}

// Run the script
if (require.main === module) {
  createMerchantWallet()
    .then(() => {
      console.log('✅ Merchant wallet setup complete!\n');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Failed to create merchant wallet');
      process.exit(1);
    });
}

module.exports = { createMerchantWallet };
