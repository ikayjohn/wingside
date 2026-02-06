#!/usr/bin/env node

/**
 * Test webhook signature verification
 * Helps diagnose signature mismatch issues
 */

const crypto = require('crypto');

console.log('🔐 Webhook Signature Test\n');
console.log('='.repeat(70));

// Get webhook secret from environment
const webhookSecret = process.env.NOMBA_WEBHOOK_SECRET;

if (!webhookSecret) {
  console.error('\n❌ NOMBA_WEBHOOK_SECRET not found in environment');
  console.error('\nSet it first:');
  console.error('export NOMBA_WEBHOOK_SECRET="your-secret-here"');
  console.error('\nOr run:');
  console.error('NOMBA_WEBHOOK_SECRET="your-secret" node scripts/test-webhook-signature.js');
  process.exit(1);
}

console.log('✅ NOMBA_WEBHOOK_SECRET found');
console.log('Length:', webhookSecret.length, 'characters');
console.log('First 10 chars:', webhookSecret.substring(0, 10) + '...');
console.log('Last 10 chars:', '...' + webhookSecret.substring(webhookSecret.length - 10));

console.log('\n' + '='.repeat(70));
console.log('\n🧪 Testing Signature Generation\n');

// Sample webhook payload (from Nomba docs)
const samplePayload = {
  event_type: 'payment_success',
  requestId: 'req_test_123456',
  data: {
    transaction: {
      transactionId: 'txn_123456789',
      type: 'CHECKOUT',
      transactionAmount: 2500.00,
      fee: 50.00,
      time: new Date().toISOString(),
    },
    order: {
      orderReference: 'WS-TEST-1234567890',
      customerEmail: 'test@example.com',
      amount: 2500.00,
      currency: 'NGN',
      customerId: 'test-customer-id',
    }
  }
};

const rawBody = JSON.stringify(samplePayload);
const timestamp = new Date().toISOString();

console.log('Sample payload:', JSON.stringify(samplePayload, null, 2));
console.log('\nTimestamp:', timestamp);

console.log('\n' + '='.repeat(70));
console.log('\n🔨 Generating Signatures (3 methods)\n');

// Method 1: HMAC of raw body (base64)
const signature1 = crypto
  .createHmac('sha256', webhookSecret)
  .update(rawBody)
  .digest('base64');

console.log('Method 1 (rawBody base64):');
console.log('  ', signature1);

// Method 2: HMAC of raw body (hex)
const signature2 = crypto
  .createHmac('sha256', webhookSecret)
  .update(rawBody)
  .digest('hex');

console.log('\nMethod 2 (rawBody hex):');
console.log('  ', signature2);

// Method 3: Concatenated fields
const concatenated = [
  samplePayload.event_type,
  samplePayload.requestId,
  samplePayload.data.transaction.transactionId,
  timestamp
].join(':');

const signature3 = crypto
  .createHmac('sha256', webhookSecret)
  .update(concatenated)
  .digest('base64');

console.log('\nMethod 3 (concatenated fields base64):');
console.log('   String:', concatenated);
console.log('   Signature:', signature3);

console.log('\n' + '='.repeat(70));
console.log('\n📋 Headers Nomba Should Send:\n');

console.log('nomba-signature: [one of the signatures above]');
console.log('nomba-timestamp:', timestamp);
console.log('nomba-signature-algorithm: HmacSHA256');
console.log('nomba-signature-version: 1.0.0');
console.log('Content-Type: application/json');

console.log('\n' + '='.repeat(70));
console.log('\n🧪 Testing Signature Verification\n');

// Test timing-safe comparison
function testVerification(receivedSig, expectedSig, method) {
  try {
    const isValid = crypto.timingSafeEqual(
      Buffer.from(receivedSig),
      Buffer.from(expectedSig)
    );
    console.log(`✅ ${method}: Signatures match`);
    return true;
  } catch (error) {
    console.log(`❌ ${method}: Signatures don't match (${error.message})`);
    return false;
  }
}

// Test each signature against itself (should all pass)
testVerification(signature1, signature1, 'Method 1 self-test');
testVerification(signature2, signature2, 'Method 2 self-test');
testVerification(signature3, signature3, 'Method 3 self-test');

console.log('\n' + '='.repeat(70));
console.log('\n🔍 Debugging Checklist:\n');

console.log('If webhooks are failing signature verification:\n');

console.log('1️⃣  Check webhook secret matches Nomba dashboard');
console.log('   - Log into Nomba Dashboard → Developers → Webhooks');
console.log('   - Copy webhook secret');
console.log('   - Compare with your NOMBA_WEBHOOK_SECRET env var\n');

console.log('2️⃣  Check for whitespace in secret');
console.log('   - Secret should have NO spaces before/after');
console.log('   - Length should match what Nomba shows');
console.log('   - Your secret length:', webhookSecret.length, 'characters\n');

console.log('3️⃣  Verify production env vars');
console.log('   - .env.local secret might differ from production');
console.log('   - Check hosting provider\'s environment variables');
console.log('   - Ensure production is using production secret\n');

console.log('4️⃣  Check webhook headers in logs');
console.log('   - Look for "nomba-signature" header in server logs');
console.log('   - Compare received signature with expected (above)');
console.log('   - Header name might be different (check logs)\n');

console.log('5️⃣  Temporary bypass for testing');
console.log('   - Set: NOMBA_WEBHOOK_BYPASS_VERIFICATION=true');
console.log('   - Check if webhooks process successfully');
console.log('   - If YES: Problem is signature verification');
console.log('   - If NO: Problem is elsewhere in webhook processing\n');

console.log('='.repeat(70));
console.log('\n💡 Common Issues:\n');

console.log('❌ Wrong Secret');
console.log('   Fix: Copy exact secret from Nomba dashboard\n');

console.log('❌ Secret has extra whitespace');
console.log('   Fix: Trim spaces: NOMBA_WEBHOOK_SECRET="' + webhookSecret.trim() + '"\n');

console.log('❌ Production using .env.local secret');
console.log('   Fix: Update production env vars in hosting provider\n');

console.log('❌ Webhook header name different');
console.log('   Fix: Check logs for actual header name, update code\n');

console.log('='.repeat(70));
console.log('\n🎯 Next Steps:\n');

console.log('1. Compare your secret with Nomba dashboard (character by character)');
console.log('2. Check server logs for "Invalid webhook signature" errors');
console.log('3. If signature fails, temporarily bypass to test rest of flow');
console.log('4. Contact Nomba support to confirm:');
console.log('   - Correct webhook header names');
console.log('   - Signature generation method');
console.log('   - Expected signature format\n');

console.log('='.repeat(70));
