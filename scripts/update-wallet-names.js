#!/usr/bin/env node

/**
 * Update wallet names for customers to use their actual names instead of "Default Wallet"
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateWalletName(walletId, newName) {
  const fetch = require('node-fetch');
  const EMBEDLY_API_KEY = process.env.EMBEDLY_API_KEY;
  const EMBEDLY_BASE_URL = process.env.EMBEDLY_BASE_URL || 'https://waas-prod.embedly.ng/api/v1';

  try {
    const response = await fetch(`${EMBEDLY_BASE_URL}/wallets/update`, {
      method: 'PUT',
      headers: {
        'x-api-key': EMBEDLY_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletId,
        name: newName,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to update wallet: ${errorText}`);
      return false;
    }

    console.log(`✅ Updated wallet name to: ${newName}`);
    return true;
  } catch (error) {
    console.error(`Error updating wallet: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🔄 Updating Wallet Names...\n');

  // Get customers who have embedly_wallet_id
  const { data: customers, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, embedly_wallet_id')
    .not('embedly_wallet_id', 'is', null)
    .eq('role', 'customer')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Failed to fetch customers:', error);
    process.exit(1);
  }

  // Filter for recently created wallets (last 10 customers)
  const recentCustomers = customers.slice(0, 10);

  console.log(`Updating wallet names for ${recentCustomers.length} recent customers\n`);

  let successCount = 0;
  let failCount = 0;

  for (const customer of recentCustomers) {
    console.log(`--- ${customer.full_name || 'No Name'} (${customer.email}) ---`);

    const walletName = customer.full_name || customer.email;
    const success = await updateWalletName(customer.embedly_wallet_id, walletName);

    if (success) {
      successCount++;
    } else {
      failCount++;
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`\n\n========================================`);
  console.log(`📊 Wallet Name Update Complete!`);
  console.log(`========================================`);
  console.log(`✅ Successfully updated: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📊 Total processed: ${recentCustomers.length}`);
  console.log(`========================================\n`);
}

main().catch(console.error);
