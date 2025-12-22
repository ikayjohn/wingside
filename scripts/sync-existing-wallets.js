// Script to sync existing Embedly wallets with user accounts
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize admin client with service role key from environment
const adminSupabase = createClient(
  process.env.SUPABASE_URL || 'https://cxbqochxrhokdscgijxe.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Embedly API client
const embedlyClient = {
  getAllCustomers: async () => {
    const response = await fetch('https://waas-prod.embedly.ng/api/v1/customers/get/all', {
      headers: { 'x-api-key': process.env.EMBEDLY_API_KEY }
    });
    const data = await response.json();
    return data.data;
  },

  getCustomerWallets: async (customerId) => {
    try {
      const response = await fetch('https://waas-prod.embedly.ng/api/v1/wallets/get/all', {
        headers: { 'x-api-key': process.env.EMBEDLY_API_KEY }
      });
      const data = await response.json();

      // Filter wallets by customer ID (since there's no direct endpoint)
      if (data.success && data.data) {
        return data.data.filter(wallet => wallet.customerId === customerId);
      }
      return [];
    } catch (error) {
      console.error(`Error fetching wallets for customer ${customerId}:`, error);
      return [];
    }
  },

  getWalletById: async (walletId) => {
    try {
      const response = await fetch(`https://waas-prod.embedly.ng/api/v1/wallets/get/wallet/${walletId}`, {
        headers: { 'x-api-key': process.env.EMBEDLY_API_KEY }
      });
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error(`Error fetching wallet ${walletId}:`, error);
      return null;
    }
  }
};

async function syncExistingWallets() {
  console.log('🔄 Syncing existing Embedly wallets with user accounts...\n');

  try {
    // Step 1: Get all users in our database
    console.log('📋 Step 1: Getting all users from database...');
    const { data: profiles, error: profilesError } = await adminSupabase
      .from('profiles')
      .select('id, email, full_name, embedly_customer_id, embedly_wallet_id');

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
      throw profilesError;
    }

    console.log(`Found ${profiles.length} users in database`);

    // Step 2: Get all customers from Embedly
    console.log('\n📋 Step 2: Getting all customers from Embedly...');
    let embedlyCustomers;
    try {
      embedlyCustomers = await embedlyClient.getAllCustomers();
      console.log(`Found ${embedlyCustomers.length} customers in Embedly`);
    } catch (error) {
      console.error('❌ Error fetching Embedly customers:', error);
      console.log('This might be expected if the API key or endpoint is different');
      return;
    }

    // Step 3: Match customers by email and sync wallet data
    console.log('\n📋 Step 3: Matching customers and syncing wallets...');
    let matchedUsers = 0;
    let walletsSynced = 0;

    for (const profile of profiles) {
      // Find matching customer by email
      const matchingCustomer = embedlyCustomers.find(
        customer => customer.emailAddress.toLowerCase() === profile.email.toLowerCase()
      );

      if (matchingCustomer) {
        console.log(`\n✅ Found match: ${profile.email} -> ${matchingCustomer.id}`);

        // Update profile with Embedly customer ID if not already set
        if (!profile.embedly_customer_id) {
          await adminSupabase
            .from('profiles')
            .update({
              embedly_customer_id: matchingCustomer.id,
              updated_at: new Date().toISOString()
            })
            .eq('id', profile.id);
          console.log(`  📝 Updated embedly_customer_id`);
        }

        matchedUsers++;

        // Get wallets for this customer
        const customerWallets = await embedlyClient.getCustomerWallets(matchingCustomer.id);

        if (customerWallets.length > 0) {
          // Get the primary/default wallet
          const primaryWallet = customerWallets.find(w => w.isDefault) || customerWallets[0];

          console.log(`  💳 Found ${customerWallets.length} wallet(s), primary: ${primaryWallet.id}`);

          // Get detailed wallet information
          const walletDetails = await embedlyClient.getWalletById(primaryWallet.id);

          if (walletDetails) {
            // Update profile with wallet information
            await adminSupabase
              .from('profiles')
              .update({
                embedly_wallet_id: primaryWallet.id,
                bank_account: walletDetails.virtualAccount?.accountNumber || primaryWallet.accountNumber,
                bank_name: walletDetails.virtualAccount?.bankName || 'Unknown Bank',
                bank_code: walletDetails.virtualAccount?.bankCode || '',
                wallet_balance: walletDetails.availableBalance || 0,
                is_wallet_active: true,
                last_wallet_sync: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('id', profile.id);

            console.log(`  💰 Updated wallet info - Balance: ₦${walletDetails.availableBalance || 0}`);
            console.log(`  🏦 Account: ${walletDetails.virtualAccount?.accountNumber} (${walletDetails.virtualAccount?.bankName})`);
            walletsSynced++;
          }
        }
      }
    }

    // Step 4: Summary
    console.log('\n📊 Sync Summary:');
    console.log(`  Total users in database: ${profiles.length}`);
    console.log(`  Customers in Embedly: ${embedlyCustomers.length}`);
    console.log(`  Users matched: ${matchedUsers}`);
    console.log(`  Wallets synced: ${walletsSynced}`);

    // Step 5: Show unmatched users
    const unmatchedProfiles = profiles.filter(profile =>
      !embedlyCustomers.some(customer => customer.emailAddress.toLowerCase() === profile.email.toLowerCase())
    );

    if (unmatchedProfiles.length > 0) {
      console.log(`\n⚠️  Unmatched users (${unmatchedProfiles.length}):`);
      unmatchedProfiles.forEach(profile => {
        console.log(`  - ${profile.email} (${profile.full_name})`);
      });
    }

    return {
      success: true,
      totalUsers: profiles.length,
      totalCustomers: embedlyCustomers.length,
      matchedUsers,
      walletsSynced,
      unmatchedUsers: unmatchedProfiles.length
    };

  } catch (error) {
    console.error('\n❌ Error during wallet sync:', error);
    throw error;
  }
}

// Run the script
if (require.main === module) {
  syncExistingWallets()
    .then(result => {
      console.log('\n✅ Wallet sync completed successfully!');
      console.log(`🎉 Matched ${result.matchedUsers} users and synced ${result.walletsSynced} wallets`);
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Wallet sync failed:', error);
      process.exit(1);
    });
}

module.exports = { syncExistingWallets };