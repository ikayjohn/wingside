#!/usr/bin/env node

/**
 * Diagnostic script to test Embedly API connection
 * This will help identify what's wrong with the Embedly integration
 */

require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

const EMBEDLY_API_KEY = process.env.EMBEDLY_API_KEY;
const EMBEDLY_ORG_ID = process.env.EMBEDLY_ORG_ID;
const EMBEDLY_BASE_URL = process.env.EMBEDLY_BASE_URL || 'https://waas-prod.embedly.ng/api/v1';

async function testEmbedlyConnection() {
  console.log('🔍 Testing Embedly API Connection...\n');

  // Check environment variables
  console.log('Environment Variables:');
  console.log('===================');
  console.log(`API Key: ${EMBEDLY_API_KEY ? `✅ Set (${EMBEDLY_API_KEY.substring(0, 15)}...)` : '❌ Missing'}`);
  console.log(`Org ID: ${EMBEDLY_ORG_ID ? `✅ Set (${EMBEDLY_ORG_ID})` : '❌ Missing'}`);
  console.log(`Base URL: ${EMBEDLY_BASE_URL}`);
  console.log('');

  // Test 1: List all customers (this should work even if create fails)
  console.log('Test 1: List All Customers');
  console.log('----------------------------');
  try {
    const response = await fetch(`${EMBEDLY_BASE_URL}/customers/get/all`, {
      method: 'GET',
      headers: {
        'x-api-key': EMBEDLY_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    console.log(`Status: ${response.status} ${response.statusText}`);
    const responseText = await response.text();
    console.log(`Response: ${responseText.substring(0, 200)}...`);

    if (response.ok) {
      const data = JSON.parse(responseText);
      const customers = data.data || data;
      const customerCount = Array.isArray(customers) ? customers.length : 0;
      console.log(`✅ Success! Found ${customerCount} customers in Embedly\n`);
    } else {
      console.log(`❌ Failed to list customers\n`);
      console.log(`Full error: ${responseText}\n`);
    }
  } catch (error) {
    console.log(`❌ Exception: ${error.message}\n`);
  }

  // Test 2: Get organization info
  console.log('Test 2: Get Organization Info');
  console.log('-------------------------------');
  try {
    const response = await fetch(`${EMBEDLY_BASE_URL}/organisation`, {
      method: 'GET',
      headers: {
        'x-api-key': EMBEDLY_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    console.log(`Status: ${response.status} ${response.statusText}`);
    const responseText = await response.text();
    console.log(`Response: ${responseText.substring(0, 200)}...\n`);

    if (response.ok) {
      console.log(`✅ Organization info retrieved successfully\n`);
    } else {
      console.log(`⚠️  Could not get org info (this might be normal)\n`);
    }
  } catch (error) {
    console.log(`⚠️  Exception: ${error.message}\n`);
  }

  // Test 2.5: Get countries and customer types
  console.log('\nTest 2.5: Get Countries and Customer Types');
  console.log('------------------------------------------');

  let nigeriaCountryId = null;
  let individualCustomerTypeId = null;

  try {
    // Get countries
    const countriesResponse = await fetch(`${EMBEDLY_BASE_URL}/utilities/countries/get`, {
      headers: {
        'x-api-key': EMBEDLY_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (countriesResponse.ok) {
      const countriesData = await countriesResponse.json();
      const nigeria = countriesData.data?.find(c => c.countryCodeTwo === 'NG');
      if (nigeria) {
        nigeriaCountryId = nigeria.id;
        console.log(`✅ Found Nigeria: ${nigeriaCountryId}`);
      }
    }
  } catch (error) {
    console.log(`⚠️  Could not fetch countries: ${error.message}`);
  }

  try {
    // Get customer types
    const typesResponse = await fetch(`${EMBEDLY_BASE_URL}/customers/types/all`, {
      headers: {
        'x-api-key': EMBEDLY_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (typesResponse.ok) {
      const typesData = await typesResponse.json();
      const individual = typesData.data?.find(t => t.name.toLowerCase() === 'individual');
      if (individual) {
        individualCustomerTypeId = individual.id;
        console.log(`✅ Found Individual type: ${individualCustomerTypeId}`);
      } else {
        // Use first customer type if individual not found
        if (typesData.data && typesData.data.length > 0) {
          individualCustomerTypeId = typesData.data[0].id;
          console.log(`✅ Using first customer type: ${individualCustomerTypeId} (${typesData.data[0].name})`);
        }
      }
    }
  } catch (error) {
    console.log(`⚠️  Could not fetch customer types: ${error.message}`);
  }

  if (!nigeriaCountryId || !individualCustomerTypeId) {
    console.log(`\n❌ Cannot proceed with customer creation - missing required IDs`);
    console.log(`   countryId: ${nigeriaCountryId || 'NOT FOUND'}`);
    console.log(`   customerTypeId: ${individualCustomerTypeId || 'NOT FOUND'}`);
    return;
  }

  // Test 3: Try to create a test customer
  console.log('\n\nTest 3: Create Test Customer');
  console.log('---------------------------');
  const testCustomerData = {
    organizationId: EMBEDLY_ORG_ID,
    firstName: 'Test',
    lastName: 'User',
    emailAddress: `test-${Date.now()}@wingside.ng`,
    mobileNumber: '+2348000000000',
    countryId: nigeriaCountryId,
    customerTypeId: individualCustomerTypeId,
    city: 'Port Harcourt',
    address: 'Wingside Customer',
  };

  console.log('Request body:', JSON.stringify(testCustomerData, null, 2));

  try {
    const response = await fetch(`${EMBEDLY_BASE_URL}/customers/add`, {
      method: 'POST',
      headers: {
        'x-api-key': EMBEDLY_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testCustomerData),
    });

    console.log(`\nStatus: ${response.status} ${response.statusText}`);
    const responseText = await response.text();
    console.log(`Full Response:`, responseText);

    if (response.ok) {
      const data = JSON.parse(responseText);
      const customerId = data.data?.id || data.id;
      console.log(`\n✅ Customer created successfully! ID: ${customerId}`);

      // Clean up - delete the test customer
      console.log(`\nDeleting test customer...`);
      await fetch(`${EMBEDLY_BASE_URL}/customers/customer/${customerId}`, {
        method: 'DELETE',
        headers: {
          'x-api-key': EMBEDLY_API_KEY,
          'Content-Type': 'application/json',
        },
      });
      console.log(`✅ Test customer deleted`);
    } else {
      console.log(`\n❌ Failed to create customer`);
      console.log(`\n💡 Possible issues:`);
      console.log(`   - API version might be wrong (check Embedly docs)`);
      console.log(`   - Org ID might be invalid`);
      console.log(`   - API key might not have create permission`);
      console.log(`   - Required fields might be missing (countryId, customerTypeId)`);
    }
  } catch (error) {
    console.log(`\n❌ Exception: ${error.message}`);
  }

  // Test 4: Create a wallet for the customer
  console.log('\n\nTest 4: Create Test Wallet');
  console.log('---------------------------');
  console.log('Note: Skipping wallet creation test as customer creation needs to succeed first.');
  console.log('If customer creation succeeds above, wallets can be created with:');
  console.log(`POST ${EMBEDLY_BASE_URL}/wallets/add`);
  console.log('Body: { customerId, currencyId: "NGN", name: "Default Wallet" }');

  console.log('\n\n========================================');
  console.log('Diagnostic Complete!');
  console.log('========================================');
}

testEmbedlyConnection().catch(console.error);
