/**
 * Test different request formats for Embedly TAP API
 */

require('dotenv').config({ path: '.env.local' });

const EMBEDLY_API_KEY = process.env.EMBEDLY_API_KEY;
const EMBEDLY_TAP_API_URL = process.env.EMBEDLY_TAP_API_URL || 'https://waas-prod.embedly.ng/embedded/api/v1/tap';

async function testFormat(testName, endpoint, options) {
  console.log(`\n📊 Testing: ${testName}`);
  console.log(`   URL: ${EMBEDLY_TAP_API_URL}${endpoint}`);
  console.log(`   Body: ${options.body || 'none'}`);

  try {
    const response = await fetch(`${EMBEDLY_TAP_API_URL}${endpoint}`, options);
    const data = await response.json();

    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Response:`, JSON.stringify(data, null, 2).substring(0, 300));

    if (response.status === 200) {
      console.log('   ✅ SUCCESS!');
      return true;
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  return false;
}

async function main() {
  console.log('🔍 Testing Different API Request Formats\n');
  console.log(`API Key: ${EMBEDLY_API_KEY.substring(0, 10)}...`);
  console.log(`Base URL: ${EMBEDLY_TAP_API_URL}\n`);

  const testCardSerial = '12345678';

  // Test 1: Original format (POST with JSON body)
  await testFormat(
    'Test 1: POST /get-balance with cardSerial in body',
    '/get-balance',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': EMBEDLY_API_KEY
      },
      body: JSON.stringify({ cardSerial: testCardSerial })
    }
  );

  // Test 2: Try CardSerial (capitalized)
  await testFormat(
    'Test 2: POST /get-balance with CardSerial (capitalized)',
    '/get-balance',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': EMBEDLY_API_KEY
      },
      body: JSON.stringify({ CardSerial: testCardSerial })
    }
  );

  // Test 3: Try as query parameter
  await testFormat(
    'Test 3: GET /get-balance with query parameter',
    `/get-balance?cardSerial=${testCardSerial}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': EMBEDLY_API_KEY
      }
    }
  );

  // Test 4: Try different endpoint format
  await testFormat(
    'Test 4: POST /balance with cardSerial',
    '/balance',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': EMBEDLY_API_KEY
      },
      body: JSON.stringify({ cardSerial: testCardSerial })
    }
  );

  // Test 5: Try with card_serial (underscore)
  await testFormat(
    'Test 5: POST /get-balance with card_serial (underscore)',
    '/get-balance',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': EMBEDLY_API_KEY
      },
      body: JSON.stringify({ card_serial: testCardSerial })
    }
  );

  // Test 6: Try form-urlencoded
  await testFormat(
    'Test 6: POST /get-balance with form-urlencoded',
    '/get-balance',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'x-api-key': EMBEDLY_API_KEY
      },
      body: `cardSerial=${testCardSerial}`
    }
  );

  console.log('\n✅ Testing complete!');
  console.log('\n💡 If none worked, you need to:');
  console.log('   1. Check Embedly\'s actual API documentation');
  console.log('   2. Contact Embedly support for correct request format');
  console.log('   3. Ask for example curl command that works');
}

main();
