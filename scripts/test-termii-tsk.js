#!/usr/bin/env node

/**
 * Test with tsk_ key
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const TERMII_API_KEY = 'tsk_MLIRpsrKLQGNl3daLvkLp27Lqr'; // Test with this key
const TERMII_SENDER_ID = 'Wingside';

console.log('🔍 Testing with tsk_ key\n');
console.log('='.repeat(50));
console.log(`API Key: ${TERMII_API_KEY}`);

async function testKey() {
  try {
    const response = await fetch('https://v3.api.termii.com/api/sms/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: TERMII_API_KEY,
        to: '2348176423576',
        from: TERMII_SENDER_ID,
        sms: 'Test message with tsk_ key',
        type: 'plain',
        channel: 'dnd',
      }),
    });

    const data = await response.json();

    console.log('\n📊 API Response:');
    console.log(`  Status Code: ${response.status}`);
    console.log(`  Response:`, JSON.stringify(data, null, 2));

    if (data.message_id) {
      console.log('\n✅ SUCCESS! This key works!');
      console.log(`  Application ID appears to have sender ID configured`);
    } else {
      console.log('\n❌ FAILED');
      console.log(`  Error: ${data.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

testKey();
