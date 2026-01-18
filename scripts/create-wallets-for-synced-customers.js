#!/usr/bin/env node

/**
 * Create wallets for customers who have embedly_customer_id but no embedly_wallet_id
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Cached GUIDs
let NGN_CURRENCY_ID = null;

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

async function createWalletForCustomer(supabase, customer) {
  const fetch = require('node-fetch');

  const EMBEDLY_API_KEY = process.env.EMBEDLY_API_KEY;
  const EMBEDLY_BASE_URL = process.env.EMBEDLY_BASE_URL || 'https://waas-prod.embedly.ng/api/v1';
  const customerId = customer.embedly_customer_id;

  try {
    // Get NGN currency GUID
    const currencyId = await getNgnCurrencyId(fetch);

    // Create wallet
    console.log(`Creating wallet for ${customer.email}...`);
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
      return { success: false, error: errorText };
    }

    const walletData = await walletResponse.json();
    const walletId = walletData.data?.id || walletData.walletId || walletData.id;

    // Update profile
    await supabase
      .from('profiles')
      .update({
        embedly_wallet_id: walletId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', customer.id);

    console.log(`✅ Created wallet: ${walletId}`);
    return { success: true, walletId };
  } catch (error) {
    console.error(`❌ Error creating wallet for ${customer.email}:`, error.message);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🚀 Creating Wallets for Synced Customers...\n');

  // Get customers who have embedly_customer_id but no embedly_wallet_id
  const { data: customers, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, embedly_customer_id, embedly_wallet_id')
    .not('embedly_customer_id', 'is', null)
    .is('embedly_wallet_id', null)
    .eq('role', 'customer');

  if (error) {
    console.error('❌ Failed to fetch customers:', error);
    process.exit(1);
  }

  console.log(`Found ${customers.length} customers without wallets\n`);

  let successCount = 0;
  let failCount = 0;

  for (const customer of customers) {
    console.log(`\n--- Creating wallet for: ${customer.full_name || 'No Name'} (${customer.email}) ---`);
    const result = await createWalletForCustomer(supabase, customer);

    if (result.success) {
      successCount++;
    } else {
      failCount++;
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`\n\n========================================`);
  console.log(`📊 Wallet Creation Complete!`);
  console.log(`========================================`);
  console.log(`✅ Successfully created: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📊 Total processed: ${customers.length}`);
  console.log(`========================================\n`);
}

main().catch(console.error);
