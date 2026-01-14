// Script to retroactively create Embedly accounts for customers who don't have them
// Run with: node scripts/create-missing-embedly-accounts.js

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role key for admin access

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Embedly API setup
const EMBEDLY_API_KEY = process.env.EMBEDLY_API_KEY;
const EMBEDLY_ORG_ID = process.env.EMBEDLY_ORG_ID;
const EMBEDLY_BASE_URL = process.env.EMBEDLY_BASE_URL || 'https://waas-prod.embedly.ng/api/v1';

if (!EMBEDLY_API_KEY || !EMBEDLY_ORG_ID) {
  console.error('Missing Embedly credentials. Check EMBEDLY_API_KEY and EMBEDLY_ORG_ID in .env.local');
  process.exit(1);
}

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

async function findExistingCustomer(email) {
  try {
    // Get all customers and search by email
    const customers = await embedlyRequest('/customers/get/all');
    const customersData = customers.data || customers;

    const existing = customersData.find(
      c => c.emailAddress && c.emailAddress.toLowerCase() === email.toLowerCase()
    );

    return existing || null;
  } catch (error) {
    console.log(`    ⚠️ Could not check for existing customer: ${error.message}`);
    return null;
  }
}

async function createCustomerForProfile(profile) {
  let customerId = null;

  try {
    console.log(`\n🔄 Processing: ${profile.email}`);

    // First, check if customer already exists
    console.log(`  🔍 Checking if customer exists in Embedly...`);
    const existingCustomer = await findExistingCustomer(profile.email);

    if (existingCustomer) {
      console.log(`  ✅ Found existing customer: ${existingCustomer.id}`);
      customerId = existingCustomer.id;
    } else {
      // Get required Embedly data
      const [countries, customerTypes] = await Promise.all([
        embedlyRequest('/utilities/countries/get'),
        embedlyRequest('/customers/types/all')
      ]);

      const countriesData = countries.data || countries;
      const customerTypesData = customerTypes.data || customerTypes;

      const nigeria = countriesData.find(country => country.countryCodeTwo === 'NG');
      const individualType = customerTypesData.find(type => type.name.toLowerCase() === 'individual');

      if (!nigeria) {
        throw new Error('Nigeria country not found in Embedly');
      }
      if (!individualType) {
        throw new Error('Individual customer type not found in Embedly');
      }

      // Parse name
      const nameParts = (profile.full_name || '').trim().split(/\s+/);
      const firstName = nameParts[0] || 'User';
      const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : 'Name';
      const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : undefined;

      // Validate phone number (basic check for Nigerian numbers)
      let phone = profile.phone || '';
      if (phone && !phone.match(/^(\+234|0)[789]\d{9,10}$/)) {
        console.log(`  ⚠️ Invalid phone format, using empty string`);
        phone = '';
      }

      // Create customer
      const customerData = {
        organizationId: EMBEDLY_ORG_ID,
        firstName,
        lastName,
        middleName,
        emailAddress: profile.email,
        mobileNumber: phone,
        customerTypeId: individualType.id,
        countryId: nigeria.id,
        address: 'Port Harcourt', // Default address
        city: 'Port Harcourt', // Default city
        alias: profile.full_name || undefined,
      };

      console.log(`  📝 Creating customer...`);
      const embedlyCustomer = await embedlyRequest('/customers/add', 'POST', customerData);

      if (!embedlyCustomer.data || !embedlyCustomer.data.id) {
        throw new Error('Invalid customer response from Embedly');
      }

      customerId = embedlyCustomer.data.id;
      console.log(`  ✅ Customer created: ${customerId}`);
    }

    // Get NGN currency
    const currenciesResponse = await embedlyRequest('/utilities/currencies/get');
    const currenciesData = currenciesResponse.data || currenciesResponse;
    const ngn = currenciesData.find(currency => currency.shortName === 'NGN');

    if (!ngn) {
      throw new Error('NGN currency not found in Embedly');
    }

    // Check if customer already has wallets
    let wallet = null;
    try {
      console.log(`  🔍 Checking for existing wallets...`);
      const walletsResponse = await embedlyRequest(`/wallets/get/customer/${customerId}`);
      const walletsData = walletsResponse.data || walletsResponse;

      if (walletsData && walletsData.length > 0) {
        // Find NGN wallet
        wallet = walletsData.find(w => w.currencyId === ngn.id) || walletsData[0];
        console.log(`  ✅ Found existing wallet: ${wallet.id}`);
      }
    } catch (error) {
      console.log(`    ℹ️ No existing wallets found`);
    }

    // Create wallet if needed
    if (!wallet) {
      const walletData = {
        customerId: customerId,
        currencyId: ngn.id,
        name: `${profile.full_name || 'Digital Wallet'}`,
      };

      console.log(`  💰 Creating wallet...`);
      const walletResponse = await embedlyRequest('/wallets/add', 'POST', walletData);

      console.log(`  📦 Raw wallet response:`, JSON.stringify(walletResponse, null, 2));

      // Handle different response formats
      let walletId = walletResponse.walletId || walletResponse.data?.walletId || walletResponse.data?.id;

      if (!walletId) {
        // Try to get wallet by customer ID if walletId not in response
        console.log(`  ⚠️ No walletId in response, trying to fetch by customer...`);
        try {
          const customerWalletsResponse = await embedlyRequest(`/wallets/get/customer/${customerId}`);
          const customerWalletsData = customerWalletsResponse.data || customerWalletsResponse;

          if (customerWalletsData && customerWalletsData.length > 0) {
            // Get the most recent wallet
            wallet = customerWalletsData[0];
            console.log(`  ✅ Found newly created wallet: ${wallet.id}`);
          } else {
            throw new Error(`No wallets found for customer after creation`);
          }
        } catch (fetchError) {
          throw new Error(`Could not retrieve created wallet: ${fetchError.message}`);
        }
      } else {
        // Fetch full wallet details using walletId
        console.log(`  📋 Fetching wallet details for ${walletId}...`);
        const walletDetailsResponse = await embedlyRequest(`/wallets/get/wallet/${walletId}`);
        const walletDetailsData = walletDetailsResponse.data || walletDetailsResponse;

        wallet = walletDetailsData;
        console.log(`  ✅ Wallet created: ${wallet.id}`);
      }

      console.log(`  🏦 Account Number: ${wallet.virtualAccount?.accountNumber || 'N/A'}`);
    } else {
      console.log(`  🏦 Account Number: ${wallet.virtualAccount?.accountNumber || 'N/A'}`);
    }

    // Update profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        embedly_customer_id: customerId,
        embedly_wallet_id: wallet.id,
        wallet_balance: wallet.availableBalance || 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', profile.id);

    if (updateError) {
      throw new Error(`Failed to update profile: ${updateError.message}`);
    }

    console.log(`  ✅ Profile updated`);

    return {
      success: true,
      email: profile.email,
      customerId,
      walletId: wallet.id,
      accountNumber: wallet.virtualAccount?.accountNumber
    };

  } catch (error) {
    console.error(`  ❌ Error for ${profile.email}:`, error.message);

    // If customer was created but wallet failed, still save customer ID
    if (error.message.includes('wallet') && customerId) {
      await supabase
        .from('profiles')
        .update({ embedly_customer_id: customerId })
        .eq('id', profile.id);
      console.log(`  ℹ️ Saved customer ID despite wallet failure`);
    }

    return {
      success: false,
      email: profile.email,
      error: error.message
    };
  }
}

async function main() {
  console.log('🚀 Starting Embedly account creation for missing customers...\n');
  console.log(`Using Embedly Org: ${EMBEDLY_ORG_ID}`);
  console.log(`Embedly API: ${EMBEDLY_BASE_URL}\n`);

  // Find customers without embedly_customer_id (after wallettest812372@wingside.ng)
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, phone, created_at')
    .is('embedly_customer_id', null)
    .gte('created_at', '2025-01-13') // Adjust date as needed
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching profiles:', error);
    process.exit(1);
  }

  if (!profiles || profiles.length === 0) {
    console.log('✅ No profiles found missing Embedly accounts');
    return;
  }

  console.log(`📊 Found ${profiles.length} customers missing Embedly accounts\n`);

  const results = [];
  let successCount = 0;
  let failCount = 0;

  // Process each profile
  for (const profile of profiles) {
    const result = await createCustomerForProfile(profile);
    results.push(result);

    if (result.success) {
      successCount++;
    } else {
      failCount++;
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total processed: ${profiles.length}`);
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);

  if (failCount > 0) {
    console.log('\n❌ Failed accounts:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.email}: ${r.error}`);
    });
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Done!');
  console.log('='.repeat(60));
}

main().catch(console.error);
