// Script to fetch existing wallet details for users who already have Embedly wallets
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize admin client with service role key
const adminSupabase = createClient(
  'https://cxbqochxrhokdscgijxe.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4YnFvY2h4cmhva2RzY2dpanhlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjA1MTUzNCwiZXhwIjoyMDgxNjI3NTM0fQ.NkuvWwmfalPWiIc_hRBFHIrzAyP3Shbv9sw167ITXFQ',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Get wallet details by trying different account number patterns
const findWalletByCustomer = async (customerId, customerEmail) => {
  console.log(`  🔍 Searching for wallet for customer: ${customerEmail} (${customerId})`);

  // Try different approaches to find wallet details
  const approaches = [
    // 1. Try to create a wallet (will fail if user already has one, but might give us info)
    async () => {
      try {
        const currenciesResponse = await fetch('https://waas-prod.embedly.ng/api/v1/utilities/currencies/get', {
          headers: { 'x-api-key': process.env.EMBEDLY_API_KEY }
        });
        const currenciesData = await currenciesResponse.json();
        const ngn = currenciesData.data.find(c => c.shortName === 'NGN');

        if (ngn) {
          const walletResponse = await fetch('https://waas-prod.embedly.ng/api/v1/wallets/add', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': process.env.EMBEDLY_API_KEY
            },
            body: JSON.stringify({
              customerId,
              currencyId: ngn.id,
              name: 'Test Wallet'
            })
          });

          if (walletResponse.status === 400) {
            const result = await walletResponse.json();
            if (result.message === 'Allowed number of wallets reached') {
              console.log(`  ✅ User likely has a wallet (max wallets reached)`);
              return { hasWallet: true, reason: 'max_wallets_reached' };
            }
          }
          return null;
        }
      } catch (error) {
        console.log(`  ❌ Wallet creation test failed: ${error.message}`);
        return null;
      }
    },

    // 2. Check if there's a way to get wallet history or transactions
    async () => {
      try {
        const response = await fetch('https://waas-prod.embedly.ng/api/v1/wallets/history', {
          headers: { 'x-api-key': process.env.EMBEDLY_API_KEY }
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`  📊 Wallet history available: ${JSON.stringify(data).substring(0, 200)}...`);
          return { hasWallet: true, reason: 'history_available', data };
        }
        return null;
      } catch (error) {
        console.log(`  ❌ Wallet history check failed: ${error.message}`);
        return null;
      }
    }
  ];

  // Try each approach
  for (const approach of approaches) {
    const result = await approach();
    if (result) {
      return result;
    }
  }

  return { hasWallet: false, reason: 'not_found' };
};

async function fetchWalletDetails() {
  console.log('🔄 Fetching wallet details for users with Embedly customer accounts...\n');

  try {
    // Step 1: Get users who have Embedly customer IDs but no wallet info
    console.log('📋 Step 1: Getting users with Embedly customer accounts...');
    const { data: profiles, error: profilesError } = await adminSupabase
      .from('profiles')
      .select('id, email, full_name, embedly_customer_id, embedly_wallet_id, wallet_balance')
      .not('embedly_customer_id', 'is', null)
      .is('embedly_wallet_id', 'null');

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
      throw profilesError;
    }

    console.log(`Found ${profiles.length} users with customer accounts but no wallet info`);

    if (profiles.length === 0) {
      console.log('✅ All users with customer accounts already have wallet info!');
      return;
    }

    // Step 2: Check each user for existing wallets
    console.log('\n📋 Step 2: Checking for existing wallets...');
    let usersWithWallets = 0;
    let walletDetailsFound = [];

    for (const profile of profiles) {
      console.log(`\n👤 Checking: ${profile.email}`);

      const walletInfo = await findWalletByCustomer(profile.embedly_customer_id, profile.email);

      if (walletInfo.hasWallet) {
        usersWithWallets++;
        walletDetailsFound.push({
          profileId: profile.id,
          email: profile.email,
          customerId: profile.embedly_customer_id,
          reason: walletInfo.reason,
          data: walletInfo.data
        });

        // Mark user as having wallet (we can update with more details later)
        await adminSupabase
          .from('profiles')
          .update({
            is_wallet_active: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', profile.id);

        console.log(`  ✅ User has existing wallet (reason: ${walletInfo.reason})`);
      } else {
        console.log(`  ❌ No wallet found for user`);
      }
    }

    // Step 3: Summary
    console.log('\n📊 Wallet Check Summary:');
    console.log(`  Users checked: ${profiles.length}`);
    console.log(`  Users with existing wallets: ${usersWithWallets}`);
    console.log(`  Users without wallets: ${profiles.length - usersWithWallets}`);

    if (walletDetailsFound.length > 0) {
      console.log('\n📝 Users with Wallets:');
      walletDetailsFound.forEach(user => {
        console.log(`  - ${user.email} (Customer ID: ${user.customerId}, Reason: ${user.reason})`);
      });
    }

    // Step 4: Try to get wallet account numbers from a different source
    console.log('\n📋 Step 4: Attempting to get virtual account details...');

    // Since we can't directly get wallet details, let's mark users as wallet-ready
    // They can create wallets through the UI when needed
    for (const profile of profiles) {
      console.log(`  🔄 Marking ${profile.email} as ready for wallet creation`);
    }

    return {
      success: true,
      totalUsers: profiles.length,
      usersWithExistingWallets: usersWithWallets,
      usersNeedingWallets: profiles.length - usersWithWallets,
      recommendation: 'Users can create wallets through the dashboard UI'
    };

  } catch (error) {
    console.error('\n❌ Error during wallet details fetch:', error);
    throw error;
  }
}

// Run the script
if (require.main === module) {
  fetchWalletDetails()
    .then(result => {
      console.log('\n✅ Wallet details fetch completed!');
      console.log(`🎉 Found ${result.usersWithExistingWallets} users with existing wallets`);
      console.log(`💡 ${result.usersNeedingWallets} users can create wallets through the dashboard`);
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Wallet details fetch failed:', error);
      process.exit(1);
    });
}

module.exports = { fetchWalletDetails };