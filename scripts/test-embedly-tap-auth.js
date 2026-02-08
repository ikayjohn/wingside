/**
 * Test Embedly TAP API Authentication
 * Run: node scripts/test-embedly-tap-auth.js
 */

require('dotenv').config({ path: '.env.local' });

const EMBEDLY_API_KEY = process.env.EMBEDLY_API_KEY;
const EMBEDLY_TAP_API_URL = process.env.EMBEDLY_TAP_API_URL || 'https://waas-prod.embedly.ng/embedded/api/v1/tap';

async function testAuth() {
  console.log('🔍 Testing Embedly TAP API Authentication\n');
  console.log('Configuration:');
  console.log(`  API Key: ${EMBEDLY_API_KEY ? EMBEDLY_API_KEY.substring(0, 10) + '...' : '❌ NOT SET'}`);
  console.log(`  TAP URL: ${EMBEDLY_TAP_API_URL}\n`);

  if (!EMBEDLY_API_KEY) {
    console.error('❌ ERROR: EMBEDLY_API_KEY not found in .env.local');
    process.exit(1);
  }

  // Test 1: Get Balance (simplest endpoint)
  console.log('📊 Test 1: Testing GET Balance endpoint...');
  try {
    const response = await fetch(`${EMBEDLY_TAP_API_URL}/get-balance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': EMBEDLY_API_KEY
      },
      body: JSON.stringify({
        cardSerial: '12345678' // Test card serial
      })
    });

    console.log(`  Status: ${response.status} ${response.statusText}`);

    const data = await response.json();
    console.log('  Response:', JSON.stringify(data, null, 2));

    if (response.status === 401) {
      console.log('\n❌ DIAGNOSIS: 401 Unauthorized');
      console.log('   Your API key is being rejected by Embedly TAP API.\n');
      console.log('   Possible reasons:');
      console.log('   1. API key does not have TAP card permissions');
      console.log('   2. API key is for wrong environment (prod vs staging)');
      console.log('   3. API key is expired or invalid');
      console.log('   4. TAP feature not enabled on your Embedly account\n');
    } else if (response.status === 200) {
      console.log('\n✅ SUCCESS: API key is valid!');
      console.log('   Your API key has TAP card access.\n');
    } else {
      console.log(`\n⚠️  Unexpected status: ${response.status}`);
    }

  } catch (error) {
    console.error('❌ Network error:', error.message);
  }

  // Test 2: Try staging if production fails
  if (EMBEDLY_TAP_API_URL.includes('prod')) {
    console.log('\n📊 Test 2: Trying STAGING endpoint...');
    const stagingUrl = 'https://waas-staging.embedly.ng/embedded/api/v1/tap';

    try {
      const response = await fetch(`${stagingUrl}/get-balance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': EMBEDLY_API_KEY
        },
        body: JSON.stringify({
          cardSerial: '12345678'
        })
      });

      console.log(`  Status: ${response.status} ${response.statusText}`);

      if (response.status === 200) {
        console.log('\n✅ SUCCESS: Your key works with STAGING!');
        console.log('   Update your .env.local:');
        console.log('   EMBEDLY_TAP_API_URL=https://waas-staging.embedly.ng/embedded/api/v1/tap\n');
      } else if (response.status === 401) {
        console.log('\n❌ Staging also returns 401.');
        console.log('   Your API key does not have TAP access.\n');
      }

    } catch (error) {
      console.error('❌ Network error:', error.message);
    }
  }

  console.log('\n📋 Next Steps:');
  console.log('   1. Contact Embedly support: support@embedly.ng');
  console.log('   2. Ask: "Please enable TAP card API access for my account"');
  console.log('   3. Provide them with your API key prefix: ' + EMBEDLY_API_KEY.substring(0, 10));
  console.log('   4. Ask for test card serials for your environment\n');
}

testAuth();
