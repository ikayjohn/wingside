#!/usr/bin/env node

/**
 * Link existing Embedly wallets for customers who have max wallets
 * This finds their existing wallets in Embedly and updates their profile
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getCustomerWallets(embedlyCustomerId) {
  const fetch = require('node-fetch');
  const EMBEDLY_API_KEY = process.env.EMBEDLY_API_KEY;
  const EMBEDLY_BASE_URL = process.env.EMBEDLY_BASE_URL || 'https://waas-prod.embedly.ng/api/v1';

  try {
    const response = await fetch(`${EMBEDLY_BASE_URL}/wallets/get/wallet/${embedlyCustomerId}`, {
      headers: {
        'x-api-key': EMBEDLY_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.data || data;
  } catch (error) {
    console.error(`Error fetching wallets: ${error.message}`);
    return null;
  }
}

async function linkExistingWallet(supabase, customer) {
  try {
    console.log(`Checking wallets for ${customer.email}...`);

    const walletData = await getCustomerWallets(customer.embedly_customer_id);

    if (!walletData || !walletData.id) {
      console.log(`⚠️  No wallets found for ${customer.email}`);
      return { success: false, error: 'No wallets found' };
    }

    const walletId = walletData.id;

    // Update profile with existing wallet ID
    await supabase
      .from('profiles')
      .update({
        embedly_wallet_id: walletId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', customer.id);

    console.log(`✅ Linked existing wallet: ${walletId}`);
    return { success: true, walletId };
  } catch (error) {
    console.error(`❌ Error linking wallet for ${customer.email}:`, error.message);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🔗 Linking Existing Embedly Wallets...\n');

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

  if (customers.length === 0) {
    console.log('✅ All customers have wallets linked!');
    return;
  }

  console.log(`Found ${customers.length} customers to link\n`);

  let successCount = 0;
  let failCount = 0;

  for (const customer of customers) {
    console.log(`\n--- Linking wallet for: ${customer.full_name || 'No Name'} (${customer.email}) ---`);
    const result = await linkExistingWallet(supabase, customer);

    if (result.success) {
      successCount++;
    } else {
      failCount++;
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`\n\n========================================`);
  console.log(`📊 Wallet Linking Complete!`);
  console.log(`========================================`);
  console.log(`✅ Successfully linked: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📊 Total processed: ${customers.length}`);
  console.log(`========================================\n`);
}

main().catch(console.error);
