// Create Embedly customer and wallet for existing test user
const { createClient } = require('@supabase/supabase-js');

const adminSupabase = createClient(
  'https://cxbqochxrhokdscgijxe.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4YnFvY2h4cmhva2RzY2dpanhlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjA1MTUzNCwiZXhwIjoyMDgxNjI3NTM0fQ.NkuvWwmfalPWiIc_hRBFHIrzAyP3Shbv9sw167ITXFQ'
);

require('dotenv').config({ path: '.env.local' });

async function createWalletForCustomer(customerId, profile) {
  console.log('💰 Creating wallet...');

  // Get NGN currency
  const currenciesResponse = await fetch('https://waas-prod.embedly.ng/api/v1/utilities/currencies/get', {
    headers: { 'x-api-key': process.env.EMBEDLY_API_KEY }
  });

  const currenciesData = await currenciesResponse.json();
  const ngn = currenciesData.data.find(c => c.shortName === 'NGN');

  if (!ngn) {
    console.error('❌ NGN currency not found');
    return null;
  }

  // Create wallet
  const walletResponse = await fetch('https://waas-prod.embedly.ng/api/v1/wallets/add', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.EMBEDLY_API_KEY
    },
    body: JSON.stringify({
      customerId: customerId,
      currencyId: ngn.id,
      name: profile.full_name || 'Test Wallet'
    })
  });

  const walletData = await walletResponse.json();

  if (!walletResponse.ok) {
    console.error('❌ Wallet creation failed:', walletData.message || walletData);
    if (walletData.message && walletData.message.includes('Allowed number of wallets reached')) {
      console.log('\n⚠️  Max wallet limit reached (5 per customer)');
      console.log('   You may need to use an existing wallet');
    }
    return null;
  }

  const wallet = walletData.data;
  console.log(`✅ Wallet created: ${wallet.id}`);
  console.log(`   Account: ${wallet.virtualAccount.accountNumber}`);
  console.log(`   Bank: ${wallet.virtualAccount.bankName}`);
  console.log(`   Balance: ₦${wallet.availableBalance.toLocaleString()}\n`);

  // Update profile
  await adminSupabase.from('profiles').update({
    embedly_wallet_id: wallet.id,
    wallet_balance: wallet.availableBalance
  }).eq('id', profile.id);

  return wallet;
}

async function createEmbedlyAccount() {
  const testEmail = 'wallettest812372@wingside.ng';

  console.log('🔄 Setting up Embedly account...\n');

  try {
    // Get user profile
    const { data: profile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('email', testEmail)
      .single();

    if (profileError || !profile) {
      console.error('❌ Profile not found');
      return;
    }

    console.log(`✅ Profile: ${profile.full_name}\n`);

    // Get config
    console.log('📝 Getting Embedly config...');
    const [customerTypesResponse, countriesResponse, customersResponse] = await Promise.all([
      fetch('https://waas-prod.embedly.ng/api/v1/customers/types/all', {
        headers: { 'x-api-key': process.env.EMBEDLY_API_KEY }
      }),
      fetch('https://waas-prod.embedly.ng/api/v1/utilities/countries/get', {
        headers: { 'x-api-key': process.env.EMBEDLY_API_KEY }
      }),
      fetch('https://waas-prod.embedly.ng/api/v1/customers/getall', {
        headers: { 'x-api-key': process.env.EMBEDLY_API_KEY }
      })
    ]);

    const customerTypes = await customerTypesResponse.json();
    const countries = await countriesResponse.json();
    const customersData = await customersResponse.ok ? await customersResponse.json() : { data: [] };

    const customerType = customerTypes.data?.find(ct => ct.name.toLowerCase() === 'individual');
    const country = countries.data?.find(c => c.countryCodeTwo === 'NG');

    if (!customerType || !country) {
      console.error('❌ Required config not found');
      return;
    }

    console.log(`✅ Config loaded\n`);

    // Check if customer already exists
    console.log('🔍 Checking for existing customer...');
    console.log(`   Looking for: ${testEmail.toLowerCase()}`);

    if (customersData.data && customersData.data.length > 0) {
      console.log(`   Found ${customersData.data.length} customers in Embedly`);
      // Show first few emails for debugging
      customersData.data.slice(0, 3).forEach(c => {
        console.log(`   - ${c.emailAddress || c.email || 'no email'} (${c.customerId || c.id || 'no id'})`);
      });
    }

    const existingCustomer = customersData.data?.find(c => {
      const email = (c.emailAddress || c.email || '').toLowerCase();
      return email === testEmail.toLowerCase();
    });

    let customerId;
    if (existingCustomer) {
      customerId = existingCustomer.customerId || existingCustomer.id;
      console.log(`✅ Found existing customer: ${customerId}\n`);

      // Update profile
      await adminSupabase.from('profiles').update({
        embedly_customer_id: customerId
      }).eq('id', profile.id);
    } else {
      // Create new customer
      console.log('📝 Creating new customer...');
      const customerResponse = await fetch('https://waas-prod.embedly.ng/api/v1/customers/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.EMBEDLY_API_KEY
        },
        body: JSON.stringify({
          organizationId: process.env.EMBEDLY_ORG_ID,
          firstName: 'John',
          lastName: 'Doe',
          emailAddress: profile.email,
          mobileNumber: '09087654321',
          customerTypeId: customerType.id,
          countryId: country.id,
          address: '456 Test Avenue',
          city: 'Lagos',
          state: 'Lagos'
        })
      });

      const customerData = await customerResponse.json();

      if (!customerResponse.ok) {
        console.error('❌ Customer creation failed:', customerData.message || customerData);
        return;
      }

      customerId = customerData.data?.customerId || customerData.data?.id;

      if (!customerId) {
        console.error('❌ Could not extract customer ID');
        console.log('Response:', JSON.stringify(customerData, null, 2));
        return;
      }

      console.log(`✅ Customer created: ${customerId}\n`);

      // Update profile
      await adminSupabase.from('profiles').update({
        embedly_customer_id: customerId
      }).eq('id', profile.id);
    }

    // Create wallet
    const wallet = await createWalletForCustomer(customerId, profile);

    if (wallet) {
      console.log('=' .repeat(60));
      console.log('🎉 SUCCESS! EMBEDLY WALLET CREATED');
      console.log('='.repeat(60));
      console.log(`   Customer ID: ${customerId}`);
      console.log(`   Wallet ID: ${wallet.id}`);
      console.log(`   Account: ${wallet.virtualAccount.accountNumber}`);
      console.log(`   Bank: ${wallet.virtualAccount.bankName}`);
      console.log(`   Balance: ₦${wallet.availableBalance.toLocaleString()}`);
      console.log('='.repeat(60));
      console.log('\n💡 Login to see your wallet in the dashboard!\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createEmbedlyAccount().then(() => process.exit(0));
