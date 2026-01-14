// Script to create wallets for customers by calling the auto-wallet API
// This uses the same API that's called during signup
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createWalletForUser(email, password) {
  // First, sign in as the user to get their session
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    throw new Error(`Sign in failed: ${signInError.message}`);
  }

  // Now call the auto-wallet API using the session
  const response = await fetch('http://localhost:3000/api/embedly/auto-wallet', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${signInData.session.access_token}`,
      // Include session cookie
      'Cookie': `sb-access-token=${signInData.session.access_token}; sb-refresh-token=${signInData.session.refresh_token}`
    },
  });

  const result = await response.json();

  // Sign out
  await supabase.auth.signOut();

  return result;
}

async function main() {
  console.log('🚀 Creating wallets via auto-wallet API...\n');
  console.log('⚠️ This requires the dev server to be running on port 3000\n');

  // Get customers who have embedly_customer_id but no embedly_wallet_id
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, embedly_customer_id, embedly_wallet_id')
    .not('embedly_customer_id', 'is', null)
    .is('embedly_wallet_id', null)
    .gte('created_at', '2025-01-13')
    .order('created_at', { ascending: false })
    .limit(5); // Start with first 5

  if (error) {
    console.error('Error fetching profiles:', error);
    process.exit(1);
  }

  if (!profiles || profiles.length === 0) {
    console.log('✅ All customers have wallets!');
    return;
  }

  console.log(`📊 Found ${profiles.length} customers needing wallets\n`);
  console.log('⚠️ Note: You will need to provide passwords for these accounts\n');

  for (const profile of profiles) {
    console.log(`\n🔄 Processing: ${profile.email}`);
    console.log(`   Customer ID: ${profile.embedly_customer_id}`);
    console.log(`   ⚠️ Please enter the password for this account (or press Enter to skip):`);

    // This would require interactive input, which is complex
    // Instead, let's suggest a different approach
    console.log(`   ℹ️ Skipping - requires password`);
  }

  console.log('\n⚠️ This script requires passwords for each user account.');
  console.log('ℹ️ A better approach is to have each user sign in to their account,');
  console.log('   which will trigger automatic wallet creation via the API.');
}

main().catch(console.error);
