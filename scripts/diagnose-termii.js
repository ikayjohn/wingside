#!/usr/bin/env node

/**
 * Detailed Termii Account Diagnostics
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const TERMII_API_KEY = process.env.TERMII_API_KEY;
const TERMII_SENDER_ID = process.env.TERMII_SENDER_ID || 'Wingside';

console.log('🔍 Termii Account Diagnostics\n');
console.log('='.repeat(60));

if (!TERMII_API_KEY) {
  console.error('❌ TERMII_API_KEY not set');
  process.exit(1);
}

async function diagnoseAccount() {
  try {
    // Test 1: Check Account Balance
    console.log('\n📊 Test 1: Checking Account Balance...');
    const balanceResponse = await fetch('https://v3.api.termii.com/api/get/balance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: TERMII_API_KEY,
      }),
    });

    const balanceData = await balanceResponse.json();
    console.log(`  Status: ${balanceResponse.ok ? '✅' : '❌'} (${balanceResponse.status})`);
    console.log(`  Response:`, JSON.stringify(balanceData, null, 2));

    if (balanceData.balance !== undefined) {
      console.log(`  💰 Balance: ₦${balanceData.balance}`);
      console.log(`  📦 User: ${balanceData.user || 'N/A'}`);
      console.log(`  📧 Email: ${balanceData.email || 'N/A'}`);
    }

    // Test 2: Check Sender ID Status
    console.log('\n📝 Test 2: Checking Sender ID Status...');
    const senderIdResponse = await fetch('https://v3.api.termii.com/api/sender-id/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: TERMII_API_KEY,
        sender_id: TERMII_SENDER_ID,
        use_case: 'Transactional', // or 'Promotional'
      }),
    });

    const senderIdData = await senderIdResponse.json();
    console.log(`  Status: ${senderIdResponse.ok ? '✅' : '❌'} (${senderIdResponse.status})`);
    console.log(`  Sender ID: ${TERMII_SENDER_ID}`);
    console.log(`  Response:`, JSON.stringify(senderIdData, null, 2));

    if (senderIdData.message === 'Sender ID requested' || senderIdData.message === 'Sender ID not approved') {
      console.log(`  ⚠️  Sender ID "${TERMII_SENDER_ID}" is NOT APPROVED yet!`);
      console.log(`  💡 You need to request/register this sender ID in your Termii dashboard.`);
    }

    // Test 3: Try sending with Termii's default sender ID
    console.log('\n📤 Test 3: Testing with numeric sender ID (works without registration)...');
    const testPhone = process.argv[2] || '+2348176423576';

    const numericSenderResponse = await fetch('https://v3.api.termii.com/api/sms/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: TERMII_API_KEY,
        to: testPhone,
        from: 'Termii', // Use Termii's default sender ID
        sms: `🎉 Wingside Test from Numeric Sender! Timestamp: ${new Date().toISOString()}`,
        type: 'plain',
        channel: 'dnd',
      }),
    });

    const numericSenderData = await numericSenderResponse.json();
    console.log(`  Status: ${numericSenderResponse.ok ? '✅' : '❌'} (${numericSenderResponse.status})`);
    console.log(`  Response:`, JSON.stringify(numericSenderData, null, 2));

    if (numericSenderData.message_id) {
      console.log(`\n✅ SUCCESS! SMS sent with numeric sender ID!`);
      console.log(`  This means your account IS active for Nigeria.`);
      console.log(`  The issue is with your sender ID "${TERMII_SENDER_ID}" not being approved.`);
      console.log(`\n💡 Solution: Either use "Termii" as sender ID or register "${TERMII_SENDER_ID}" in your dashboard.`);
    }

    // Test 4: Check if API key is in test mode
    console.log('\n🔑 Test 4: API Key Information...');
    console.log(`  API Key: ${TERMII_API_KEY.substring(0, 15)}...`);
    console.log(`  API Key Type: ${TERMII_API_KEY.startsWith('TSK') ? 'Live Key' : 'Test Key?'}`);
    console.log(`  ⚠️  If this is a TEST key, it may not have full SMS sending capabilities.`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

diagnoseAccount();
