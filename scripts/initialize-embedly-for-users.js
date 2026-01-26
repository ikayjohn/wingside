// Script to initialize Embedly customer accounts for all existing users
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
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

// Import Embedly client (using built module)
const path = require('path');
const fs = require('fs');

// Load the Embedly client
const clientPath = path.join(__dirname, '../lib/embedly/client.ts');
let embedlyClient;

// Try to load the TypeScript file or use a simplified version
try {
  // For Node.js, we'll use the compiled JavaScript or create a simple client
  embedlyClient = {
    getCountries: async () => {
      const response = await fetch('https://waas-staging.embedly.ng/api/v1/utilities/countries/get', {
        headers: { 'x-api-key': process.env.EMBEDLY_API_KEY }
      });
      const data = await response.json();
      return data.data;
    },
    getCustomerTypes: async () => {
      const response = await fetch('https://waas-staging.embedly.ng/api/v1/customers/types/all', {
        headers: { 'x-api-key': process.env.EMBEDLY_API_KEY }
      });
      const data = await response.json();
      return data.data;
    },
    createCustomer: async (customerData) => {
      const response = await fetch('https://waas-staging.embedly.ng/api/v1/customers/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.EMBEDLY_API_KEY
        },
        body: JSON.stringify(customerData)
      });
      const data = await response.json();
      return data.data;
    },
    getCustomerByEmail: async (email) => {
      const response = await fetch('https://waas-staging.embedly.ng/api/v1/customers/get/all', {
        headers: { 'x-api-key': process.env.EMBEDLY_API_KEY }
      });
      const data = await response.json();
      const customers = data.data.filter(customer =>
        customer.emailAddress.toLowerCase() === email.toLowerCase()
      );
      return customers.length > 0 ? customers[0] : null;
    }
  };
} catch (error) {
  console.error('Could not load Embedly client:', error);
  process.exit(1);
}

async function initializeEmbedlyForAllUsers() {
  console.log('🚀 Initializing Embedly accounts for all users...\n');

  try {
    // Step 1: Get all users without Embedly customer ID
    console.log('📋 Step 1: Fetching users without Embedly customer accounts...');
    const { data: profiles, error: profilesError } = await adminSupabase
      .from('profiles')
      .select('id, email, full_name, phone')
      .is('embedly_customer_id', null);

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
      throw profilesError;
    }

    console.log(`Found ${profiles.length} users without Embedly customer accounts`);

    if (profiles.length === 0) {
      console.log('✅ All users already have Embedly customer accounts!');
      return;
    }

    // Step 2: Get Embedly system data
    console.log('\n📋 Step 2: Getting Embedly system data...');

    let countries, customerTypes;
    try {
      [countries, customerTypes] = await Promise.all([
        embedlyClient.getCountries(),
        embedlyClient.getCustomerTypes()
      ]);

      console.log(`✅ Retrieved ${countries?.length || 0} countries and ${customerTypes?.length || 0} customer types`);
    } catch (apiError) {
      console.error('❌ Error fetching Embedly system data:', apiError);
      throw new Error('Failed to fetch Embedly system data');
    }

    // Find Nigeria
    const nigeria = countries?.find(country => country.countryCodeTwo === 'NG');
    if (!nigeria) {
      console.error('Available countries:', countries?.map(c => ({ name: c.name, code: c.countryCodeTwo })));
      throw new Error('Nigeria country not found in Embedly system');
    }

    // Find Individual customer type
    const individualType = customerTypes?.find(type => type.name.toLowerCase() === 'individual');
    if (!individualType) {
      console.error('Available customer types:', customerTypes);
      throw new Error('Individual customer type not found');
    }

    console.log(`✅ Found Nigeria (${nigeria.name}) and Individual customer type`);

    // Step 3: Create Embedly customers for each user
    console.log('\n📋 Step 3: Creating Embedly customer accounts...');
    let successCount = 0;
    let errorCount = 0;
    let skipCount = 0;

    for (const profile of profiles) {
      try {
        console.log(`  🔄 Processing: ${profile.email}`);

        // Check if customer already exists in Embedly
        try {
          const existingCustomer = await embedlyClient.getCustomerByEmail(profile.email);
          if (existingCustomer) {
            // Update profile with existing customer ID
            await adminSupabase
              .from('profiles')
              .update({
                embedly_customer_id: existingCustomer.id,
                updated_at: new Date().toISOString()
              })
              .eq('id', profile.id);

            console.log(`  ✅ Already exists: ${profile.email} → ${existingCustomer.id}`);
            successCount++;
            continue;
          }
        } catch (findError) {
          // Customer doesn't exist, proceed with creation
        }

        // Parse full name
        const nameParts = (profile.full_name || '').trim().split(/\s+/);
        const firstName = nameParts[0] || 'User';
        const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : 'Name';
        const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : undefined;

        // Prepare customer data
        const customerData = {
          organizationId: '02600494-1a3c-11f0-a818-6045bd97b81d',
          firstName,
          lastName,
          middleName,
          emailAddress: profile.email,
          mobileNumber: profile.phone || '',
          customerTypeId: individualType.id,
          countryId: nigeria.id,
          alias: profile.full_name || undefined,
        };

        // Create customer in Embedly
        const embedlyCustomer = await embedlyClient.createCustomer(customerData);

        // Update profile with Embedly customer ID
        await adminSupabase
          .from('profiles')
          .update({
            embedly_customer_id: embedlyCustomer.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', profile.id);

        console.log(`  ✅ Created: ${profile.email} → ${embedlyCustomer.id}`);
        successCount++;

      } catch (error) {
        console.error(`  ❌ Error for ${profile.email}:`, error.message);
        errorCount++;
      }

      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Step 4: Summary
    console.log('\n📊 Initialization Summary:');
    console.log(`  Total users processed: ${profiles.length}`);
    console.log(`  Successfully created: ${successCount}`);
    console.log(`  Errors: ${errorCount}`);
    console.log(`  Skipped (already exists): ${skipCount}`);

    return {
      success: true,
      totalProcessed: profiles.length,
      successCount,
      errorCount,
      skipCount
    };

  } catch (error) {
    console.error('\n❌ Error during Embedly initialization:', error);
    throw error;
  }
}

// Run the script
if (require.main === module) {
  initializeEmbedlyForAllUsers()
    .then(result => {
      console.log('\n✅ Embedly initialization completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Embedly initialization failed:', error);
      process.exit(1);
    });
}

module.exports = { initializeEmbedlyForAllUsers };