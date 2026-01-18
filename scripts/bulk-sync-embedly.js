#!/usr/bin/env node

/**
 * Bulk Sync All Customers to Embedly
 * Run this script to sync all customers that haven't been synced yet
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Cached GUIDs
let NIGERIA_COUNTRY_ID = null;
let INDIVIDUAL_CUSTOMER_TYPE_ID = null;
let NGN_CURRENCY_ID = null;

async function getNigeriaCountryId(fetch) {
  if (NIGERIA_COUNTRY_ID) {
    return NIGERIA_COUNTRY_ID;
  }

  const response = await fetch(`${process.env.EMBEDLY_BASE_URL}/utilities/countries/get`, {
    headers: {
      'x-api-key': process.env.EMBEDLY_API_KEY,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  const nigeria = data.data?.find(c => c.countryCodeTwo === 'NG');
  if (nigeria) {
    NIGERIA_COUNTRY_ID = nigeria.id;
    return NIGERIA_COUNTRY_ID;
  }
  throw new Error('Nigeria not found in countries list');
}

async function getIndividualCustomerTypeId(fetch) {
  if (INDIVIDUAL_CUSTOMER_TYPE_ID) {
    return INDIVIDUAL_CUSTOMER_TYPE_ID;
  }

  const response = await fetch(`${process.env.EMBEDLY_BASE_URL}/customers/types/all`, {
    headers: {
      'x-api-key': process.env.EMBEDLY_API_KEY,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  const individual = data.data?.find(t => t.name.toLowerCase() === 'individual');
  if (individual) {
    INDIVIDUAL_CUSTOMER_TYPE_ID = individual.id;
    return INDIVIDUAL_CUSTOMER_TYPE_ID;
  }
  // Use first customer type if individual not found
  if (data.data && data.data.length > 0) {
    INDIVIDUAL_CUSTOMER_TYPE_ID = data.data[0].id;
    return INDIVIDUAL_CUSTOMER_TYPE_ID;
  }
  throw new Error('No customer types found');
}

async function getNgnCurrencyId(fetch) {
  if (NGN_CURRENCY_ID) {
    return NGN_CURRENCY_ID;
  }

  const response = await fetch(`${process.env.EMBEDLY_BASE_URL}/utilities/currencies/get`, {
    headers: {
      'x-api-key': process.env.EMBEDLY_API_KEY,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  const ngn = data.data?.find(c => c.shortName === 'NGN');
  if (ngn) {
    NGN_CURRENCY_ID = ngn.id;
    return NGN_CURRENCY_ID;
  }
  throw new Error('NGN currency not found in currencies list');
}

async function syncCustomerToEmbedly(supabase, customer) {
  const fetch = require('node-fetch');

  const EMBEDLY_API_KEY = process.env.EMBEDLY_API_KEY;
  const EMBEDLY_ORG_ID = process.env.EMBEDLY_ORG_ID;
  const EMBEDLY_BASE_URL = process.env.EMBEDLY_BASE_URL || 'https://waas-prod.embedly.ng/api/v1';

  const nameParts = (customer.full_name || '').split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || firstName;

  let customerId;
  let isNewCustomer = false;
  let walletId;

  try {
    // Step 1: Check if customer exists
    console.log(`Checking if customer exists in Embedly...`);
    const customersResponse = await fetch(`${EMBEDLY_BASE_URL}/customers/get/all`, {
      headers: {
        'x-api-key': EMBEDLY_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    const customersData = await customersResponse.json();
    const customerArray = Array.isArray(customersData.data) ? customersData.data : [];

    const existingCustomer = customerArray.find((c) => {
      const customerEmail = (c.emailAddress || c.email || '').toLowerCase();
      return customerEmail === customer.email.toLowerCase();
    });

    if (existingCustomer?.id) {
      customerId = existingCustomer.id;
      console.log(`✅ Found existing customer: ${customerId}`);
    } else {
      // Create new customer
      console.log(`Creating new customer in Embedly...`);

      // Get required GUIDs
      const countryId = await getNigeriaCountryId(fetch);
      const customerTypeId = await getIndividualCustomerTypeId(fetch);

      const createResponse = await fetch(`${EMBEDLY_BASE_URL}/customers/add`, {
        method: 'POST',
        headers: {
          'x-api-key': EMBEDLY_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId: EMBEDLY_ORG_ID,
          firstName,
          lastName,
          emailAddress: customer.email,
          mobileNumber: customer.phone || '',
          countryId,
          customerTypeId,
          city: 'Port Harcourt', // Default city
          address: 'Wingside Customer', // Default address
        }),
      });

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        throw new Error(`Failed to create customer: ${createResponse.status} - ${errorText}`);
      }

      const createData = await createResponse.json();
      customerId = createData.data?.id || createData.id;
      isNewCustomer = true;
      console.log(`✅ Created customer: ${customerId}`);
    }

    // Step 2: Create wallet
    console.log(`Creating wallet...`);

    // Get NGN currency GUID
    const currencyId = await getNgnCurrencyId(fetch);

    const walletResponse = await fetch(`${EMBEDLY_BASE_URL}/wallets/add`, {
      method: 'POST',
      headers: {
        'x-api-key': EMBEDLY_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerId,
        currencyId,
        name: 'Default Wallet',
      }),
    });

    if (!walletResponse.ok) {
      const errorText = await walletResponse.text();
      console.error(`⚠️  Wallet creation warning: ${errorText}`);

      // Try to get existing wallets
      const listWalletsResponse = await fetch(`${EMBEDLY_BASE_URL}/wallets/get/wallet/${customerId}`, {
        headers: {
          'x-api-key': EMBEDLY_API_KEY,
          'Content-Type': 'application/json',
        },
      });

      if (listWalletsResponse.ok) {
        const walletsData = await listWalletsResponse.json();
        const wallets = walletsData.data || walletsData;
        if (Array.isArray(wallets) && wallets.length > 0) {
          walletId = wallets[0].id;
          console.log(`✅ Using existing wallet: ${walletId}`);
        } else {
          console.log(`⚠️  No wallet available for customer`);
          walletId = null;
        }
      } else {
        console.log(`⚠️  Could not list wallets`);
        walletId = null;
      }
    } else {
      const walletData = await walletResponse.json();
      walletId = walletData.data?.id || walletData.walletId || walletData.id;
      console.log(`✅ Created wallet: ${walletId}`);
    }

    // Step 3: Update profile
    console.log(`Updating profile...`);
    await supabase
      .from('profiles')
      .update({
        embedly_customer_id: customerId,
        embedly_wallet_id: walletId || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', customer.id);

    console.log(`✅ Successfully synced ${customer.email}`);
    console.log(`   Customer ID: ${customerId}`);
    console.log(`   Wallet ID: ${walletId || 'N/A'}`);
    console.log(`   New Customer: ${isNewCustomer}\n`);

    return { success: true, customerId, walletId, isNewCustomer };

  } catch (error) {
    console.error(`❌ Error syncing ${customer.email}:`, error.message);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🚀 Starting Bulk Embedly Sync...\n');

  // Get all customers who need syncing
  const { data: customers, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, phone, created_at, embedly_customer_id, embedly_wallet_id')
    .eq('role', 'customer')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Failed to fetch customers:', error);
    process.exit(1);
  }

  const unsyncedCustomers = customers.filter(c => !c.embedly_customer_id);
  console.log(`Found ${unsyncedCustomers.length} customers to sync\n`);

  let successCount = 0;
  let failCount = 0;

  for (const customer of unsyncedCustomers) {
    console.log(`\n--- Syncing: ${customer.full_name || 'No Name'} (${customer.email}) ---`);
    const result = await syncCustomerToEmbedly(supabase, customer);

    if (result.success) {
      successCount++;
    } else {
      failCount++;
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`\n\n========================================`);
  console.log(`📊 Sync Complete!`);
  console.log(`========================================`);
  console.log(`✅ Successfully synced: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📊 Total processed: ${unsyncedCustomers.length}`);
  console.log(`========================================\n`);
}

main().catch(console.error);
