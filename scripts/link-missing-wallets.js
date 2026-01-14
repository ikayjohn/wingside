// Script to find and link missing Embedly wallets for customers who have customer IDs but no wallet IDs
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const EMBEDLY_API_KEY = process.env.EMBEDLY_API_KEY;
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

async function main() {
  console.log('🚀 Finding and linking missing Embedly wallets...\n');

  // Get customers who have embedly_customer_id but no embedly_wallet_id
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, embedly_customer_id, embedly_wallet_id')
    .not('embedly_customer_id', 'is', null)
    .is('embedly_wallet_id', null)
    .gte('created_at', '2025-01-13')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching profiles:', error);
    process.exit(1);
  }

  if (!profiles || profiles.length === 0) {
    console.log('✅ All customers with Embedly accounts also have wallets linked!');
    return;
  }

  console.log(`📊 Found ${profiles.length} customers with customer IDs but missing wallet IDs\n`);

  let linkedCount = 0;
  let failedCount = 0;

  for (const profile of profiles) {
    try {
      console.log(`\n🔄 Processing: ${profile.email}`);
      console.log(`   Customer ID: ${profile.embedly_customer_id}`);

      // Get wallets for this customer
      const walletsResponse = await embedlyRequest(`/wallets/get/customer/${profile.embedly_customer_id}`);
      const walletsData = walletsResponse.data || walletsResponse;

      if (!walletsData || walletsData.length === 0) {
        console.log(`   ⚠️ No wallets found in Embedly`);
        failedCount++;
        continue;
      }

      // Use the first wallet (or find NGN wallet)
      const wallet = walletsData[0];
      console.log(`   ✅ Found wallet: ${wallet.id}`);
      console.log(`   🏦 Account: ${wallet.virtualAccount?.accountNumber || 'N/A'} - ${wallet.virtualAccount?.bankName || 'Unknown'}`);

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          embedly_wallet_id: wallet.id,
          wallet_balance: wallet.availableBalance || 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (updateError) {
        throw new Error(`Failed to update profile: ${updateError.message}`);
      }

      console.log(`   ✅ Profile updated`);
      linkedCount++;

    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
      failedCount++;
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total processed: ${profiles.length}`);
  console.log(`✅ Successfully linked: ${linkedCount}`);
  console.log(`❌ Failed: ${failedCount}`);
  console.log('='.repeat(60));
}

main().catch(console.error);
