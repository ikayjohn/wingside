// Manually create Embedly account for a user with corrected data
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Embedly API error (${endpoint}): ${error}`);
  }

  return response.json();
}

async function createEmbedlyAccount(email, correctedFullName) {
  console.log(`🔄 Creating Embedly account for: ${email}\n`);

  // Get profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email)
    .single();

  if (profileError || !profile) {
    throw new Error('Profile not found');
  }

  console.log(`📋 Current Name: ${profile.full_name}`);
  console.log(`📋 Corrected Name: ${correctedFullName}\n`);

  // Get required data
  const [countries, customerTypes, currencies] = await Promise.all([
    embedlyRequest('/utilities/countries/get'),
    embedlyRequest('/customers/types/all'),
    embedlyRequest('/utilities/currencies/get')
  ]);

  const countriesData = countries.data || countries;
  const customerTypesData = customerTypes.data || customerTypes;
  const currenciesData = currencies.data || currencies;

  const nigeria = countriesData.find(country => country.countryCodeTwo === 'NG');
  const individualType = customerTypesData.find(type => type.name.toLowerCase() === 'individual');
  const ngn = currenciesData.find(currency => currency.shortName === 'NGN');

  if (!nigeria || !individualType || !ngn) {
    throw new Error('Required data not found in Embedly');
  }

  // Parse corrected name
  const nameParts = correctedFullName.trim().split(/\s+/);
  const firstName = nameParts[0] || 'User';
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : 'Name';
  const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : undefined;

  console.log(`   First Name: ${firstName}`);
  console.log(`   Last Name: ${lastName}`);
  console.log(`   Middle Name: ${middleName || '(none)'}\n`);

  // Create customer
  const customerData = {
    organizationId: EMBEDLY_ORG_ID,
    firstName,
    lastName,
    middleName,
    emailAddress: profile.email,
    mobileNumber: profile.phone || '',
    customerTypeId: individualType.id,
    countryId: nigeria.id,
    address: 'Port Harcourt',
    city: 'Port Harcourt',
    alias: correctedFullName,
  };

  console.log(`📝 Creating customer in Embedly...`);
  const embedlyCustomer = await embedlyRequest('/customers/add', 'POST', customerData);

  if (!embedlyCustomer.data || !embedlyCustomer.data.id) {
    throw new Error('Invalid customer response from Embedly');
  }

  const customerId = embedlyCustomer.data.id;
  console.log(`✅ Customer created: ${customerId}\n`);

  // Create wallet
  const walletData = {
    customerId: customerId,
    currencyId: ngn.id,
    name: correctedFullName,
  };

  console.log(`💰 Creating wallet...`);
  const walletResponse = await embedlyRequest('/wallets/add', 'POST', walletData);

  if (!walletResponse.walletId) {
    throw new Error(`Invalid wallet response: ${JSON.stringify(walletResponse)}`);
  }

  console.log(`✅ Wallet created, fetching details...`);
  const walletDetailsResponse = await embedlyRequest(`/wallets/get/wallet/${walletResponse.walletId}`);
  const walletDetailsData = walletDetailsResponse.data || walletDetailsResponse;

  const wallet = walletDetailsData;
  console.log(`✅ Wallet: ${wallet.id}`);
  console.log(`🏦 Account: ${wallet.virtualAccount.accountNumber} - ${wallet.virtualAccount.bankName}\n`);

  // Update profile
  console.log(`💾 Updating database...`);
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      embedly_customer_id: customerId,
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

  console.log(`✅ Profile updated successfully!\n`);

  console.log('='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`Email: ${profile.email}`);
  console.log(`Customer ID: ${customerId}`);
  console.log(`Wallet ID: ${wallet.id}`);
  console.log(`Account Number: ${wallet.virtualAccount.accountNumber}`);
  console.log(`Bank: ${wallet.virtualAccount.bankName}`);
  console.log(`Balance: ₦${wallet.availableBalance || 0}`);
  console.log('='.repeat(60));
}

async function main() {
  const email = process.argv[2];
  const correctedName = process.argv[3];

  if (!email || !correctedName) {
    console.log('Usage: node scripts/fix-embedly-account.js <email> <corrected-full-name>');
    console.log('\nExample:');
    console.log('  node scripts/fix-embedly-account.js rogershotnoise@gmail.com "Rogers Test"');
    console.log('\nNote: Use a proper last name without numbers');
    return;
  }

  await createEmbedlyAccount(email, correctedName);
}

main().catch(console.error);
