#!/usr/bin/env node

/**
 * Test Termii SMS Connection
 * Usage: node scripts/test-termii.js <phone_number>
 * Example: node scripts/test-termii.js +2348031234567
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const TERMII_API_KEY = process.env.TERMII_API_KEY;
const TERMII_SENDER_ID = process.env.TERMII_SENDER_ID || 'Wingside';
const TERMII_BASE_URL = process.env.TERMII_BASE_URL || 'https://v3.api.termii.com';
const SMS_PROVIDER = process.env.SMS_PROVIDER;

console.log('🔍 Termii Connection Test\n');
console.log('='.repeat(50));

// Check environment variables
console.log('\n📋 Environment Variables:');
console.log(`  SMS_PROVIDER: ${SMS_PROVIDER || '❌ Not set'}`);
console.log(`  TERMII_API_KEY: ${TERMII_API_KEY ? '✅ Set (' + TERMII_API_KEY.substring(0, 10) + '...)' : '❌ Not set'}`);
console.log(`  TERMII_SENDER_ID: ${TERMII_SENDER_ID}`);
console.log(`  TERMII_BASE_URL: ${TERMII_BASE_URL}`);

if (!TERMII_API_KEY) {
  console.error('\n❌ ERROR: TERMII_API_KEY is not set in your environment variables.');
  console.error('\nPlease add this to your .env file:');
  console.error('  TERMII_API_KEY=your_api_key_here');
  console.error('  SMS_PROVIDER=termii');
  console.error('  TERMII_BASE_URL=https://your-account-specific-base-url.termii.com\n');
  process.exit(1);
}

if (!process.env.TERMII_BASE_URL) {
  console.warn('\n⚠️  WARNING: TERMII_BASE_URL is not set.');
  console.warn('  Using default: https://v3.api.termii.com (sample URL from documentation)');
  console.warn('  For production, get your account-specific URL from: https://termii.com/dashboard > Settings > API Settings\n');
}

if (SMS_PROVIDER !== 'termii') {
  console.warn('\n⚠️  WARNING: SMS_PROVIDER is not set to "termii"');
  console.warn('  Current value: ' + (SMS_PROVIDER || 'not set'));
  console.warn('  Add this to your .env: SMS_PROVIDER=termii\n');
}

// Get phone number from command line
const phoneNumber = process.argv[2];

if (!phoneNumber) {
  console.error('\n❌ ERROR: Phone number not provided.');
  console.error('\nUsage: node scripts/test-termii.js <phone_number>');
  console.error('Example: node scripts/test-termii.js +2348031234567');
  console.error('Example: node scripts/test-termii.js 08031234567\n');
  process.exit(1);
}

// Format phone number to Termii format (international WITHOUT + prefix)
function formatPhoneNumber(phone) {
  let cleaned = phone.replace(/\D/g, '');

  // Convert 08031234567 to 2348031234567
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    return '234' + cleaned.substring(1);
  }

  // Already has 234 prefix (with or without +)
  if (cleaned.length === 13 && cleaned.startsWith('234')) {
    return cleaned;
  }

  // Already in correct format
  if (cleaned.startsWith('234') && cleaned.length === 13) {
    return cleaned;
  }

  // If it has +, remove it
  if (phone.startsWith('+')) {
    return phone.substring(1);
  }

  // Default: assume 11-digit Nigerian number
  if (cleaned.length === 11) {
    return '234' + cleaned;
  }

  return phone;
}

const formattedPhone = formatPhoneNumber(phoneNumber);
console.log(`\n📱 Phone Number:`);
console.log(`  Input: ${phoneNumber}`);
console.log(`  Formatted (Termii format): ${formattedPhone}`);
console.log(`  ⚠️  Note: Termii expects numbers WITHOUT + prefix`);

// Test sending SMS
async function testTermiiSMS() {
  console.log('\n🚀 Testing Termii SMS API...');
  console.log('='.repeat(50));

  const testMessage = `🎉 Wingside SMS Test Successful! Your Termii integration is working perfectly. Timestamp: ${new Date().toISOString()}`;

  try {
    const response = await fetch(`${TERMII_BASE_URL}/api/sms/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: TERMII_API_KEY,
        to: formattedPhone,
        from: TERMII_SENDER_ID,
        sms: testMessage,
        type: 'plain',
        channel: 'dnd',
      }),
    });

    const data = await response.json();

    console.log('\n📊 API Response:');
    console.log(`  Status Code: ${response.status}`);
    console.log(`  Status: ${response.ok ? '✅ Success' : '❌ Failed'}`);
    console.log(`  Response:`, JSON.stringify(data, null, 2));

    if (response.ok && data.message_id) {
      console.log('\n✅ SUCCESS! SMS sent successfully.');
      console.log(`  Message ID: ${data.message_id}`);
      console.log(`  Message: ${testMessage}`);
      console.log(`  To: ${formattedPhone}`);
      console.log(`  From: ${TERMII_SENDER_ID}\n`);

      console.log('💡 Tip: Check your phone for the test message!\n');
      process.exit(0);
    } else {
      console.error('\n❌ FAILED! Could not send SMS.');
      console.error(`  Error: ${data.message || data.error || 'Unknown error'}`);

      if (data.message === 'Invalid credentials') {
        console.error('\n💡 Your TERMII_API_KEY might be incorrect.');
        console.error('   Please verify it in your Termii dashboard.\n');
      } else if (data.message === 'Invalid phone number') {
        console.error('\n💡 The phone number might be invalid.');
        console.error(`   Formatted number: ${formattedPhone}\n`);
      }

      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nTroubleshooting:');
    console.error('  1. Check your internet connection');
    console.error('  2. Verify TERMII_API_KEY is correct');
    console.error('  3. Ensure Termii API is accessible');
    console.error(`  Error details: ${error.stack}\n`);
    process.exit(1);
  }
}

// Run the test
testTermiiSMS();
