/**
 * Test Nomba Webhook
 *
 * This script simulates sending a webhook event from Nomba to your endpoint
 * to verify the webhook is correctly configured and receiving events.
 *
 * Usage:
 *   node scripts/test-nomba-webhook.js
 */

require('dotenv').config({ path: '.env.local' });

const crypto = require('crypto');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bright');
  console.log('='.repeat(60));
}

function logTest(name, passed, details = '') {
  const icon = passed ? '✓' : '✗';
  const color = passed ? 'green' : 'red';
  log(`${icon} ${name}`, color);
  if (details) {
    log(`  ${details}`, 'cyan');
  }
}

// Generate a signature if webhook secret is set
function generateSignature(payload, secret) {
  if (!secret) return null;
  return crypto
    .createHmac('sha512', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
}

// Create a test webhook event
function createTestWebhookEvent() {
  return {
    event_type: 'payment_success',
    requestId: `test_req_${Date.now()}`,
    data: {
      transaction: {
        transactionId: `test_txn_${Date.now()}`,
        type: 'PAYMENT',
        transactionAmount: 2500.00,
        fee: 75.00,
        time: new Date().toISOString()
      },
      order: {
        orderReference: `WS-TEST-${Date.now()}`,
        customerEmail: 'test@example.com',
        amount: 2500.00,
        currency: 'NGN',
        customerId: 'test_customer_123',
        callbackUrl: 'https://www.wingside.ng/payment/nomba/callback'
      },
      merchant: {
        userId: 'merchant_123',
        walletId: 'wallet_123',
        walletBalance: 50000.00
      }
    }
  };
}

// Test webhook endpoint
async function testWebhookEndpoint() {
  logSection('Nomba Webhook Endpoint Test');

  const webhookUrl = process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/nomba/webhook`
    : 'https://www.wingside.ng/api/payment/nomba/webhook';

  const webhookSecret = process.env.NOMBA_WEBHOOK_SECRET;

  log('Target URL:', 'yellow');
  log(`  ${webhookUrl}`, 'cyan');

  log('\nWebhook Secret:', webhookSecret ? 'Set ✓' : 'Not set ⚠️', webhookSecret ? 'green' : 'yellow');
  if (!webhookSecret) {
    log('  Signature verification will be skipped', 'yellow');
  }

  // Create test webhook event
  const testEvent = createTestWebhookEvent();

  log('\n📤 Test Webhook Event:', 'blue');
  log(JSON.stringify(testEvent, null, 2), 'cyan');

  // Generate signature if secret is set
  let signature = null;
  if (webhookSecret) {
    signature = generateSignature(testEvent, webhookSecret);
    log('\n🔐 Generated Signature:', 'yellow');
    log(`  ${signature.substring(0, 20)}...`, 'cyan');
  }

  // Send webhook
  log('\n🚀 Sending webhook...', 'blue');

  const headers = {
    'Content-Type': 'application/json',
  };

  if (signature) {
    headers['x-nomba-signature'] = signature;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(testEvent),
    });

    const responseText = await response.text();
    let responseData;

    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    log('\n📥 Response Status:', 'yellow', response.status);
    log('Response Headers:', 'yellow', JSON.stringify(Object.fromEntries(response.headers), null, 2));
    log('Response Body:', 'yellow', typeof responseData === 'object' ? JSON.stringify(responseData, null, 2) : responseData);

    if (response.ok) {
      logTest('Webhook endpoint is accessible', true, `Status: ${response.status}`);

      // Check if response is as expected
      if (responseData && responseData.received === true) {
        logTest('Webhook processed successfully', true);
      } else {
        logTest('Webhook received but response unexpected', false, 'Expected: { received: true }');
      }
    } else {
      logTest('Webhook endpoint returned error', false, `Status: ${response.status}`);
    }

    return {
      success: response.ok,
      status: response.status,
      data: responseData
    };

  } catch (error) {
    logTest('Webhook request failed', false, error.message);

    // Check if it's a connection error
    if (error.code === 'ECONNREFUSED' || error.message.includes('ECONNREFUSED')) {
      log('\n💡 Hint: Make sure your application is running!', 'yellow');
      log('   Development: npm run dev', 'cyan');
      log('   Production:  Check if server is online', 'cyan');
    }

    return {
      success: false,
      error: error.message
    };
  }
}

// Test local webhook endpoint
async function testLocalWebhook() {
  logSection('Local Webhook Test (Development)');

  const localUrl = 'http://localhost:3000/api/payment/nomba/webhook';

  log('Target URL:', 'yellow');
  log(`  ${localUrl}`, 'cyan');

  log('\n⚠️  Note: This test requires your dev server to be running on port 3000', 'yellow');

  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('\nPress Enter to test local webhook (or Ctrl+C to skip)...', async () => {
      rl.close();

      const testEvent = createTestWebhookEvent();
      const webhookSecret = process.env.NOMBA_WEBHOOK_SECRET;
      let signature = null;

      if (webhookSecret) {
        signature = generateSignature(testEvent, webhookSecret);
      }

      const headers = {
        'Content-Type': 'application/json',
      };

      if (signature) {
        headers['x-nomba-signature'] = signature;
      }

      try {
        log('\n🚀 Sending webhook to local server...', 'blue');

        const response = await fetch(localUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(testEvent),
        });

        const responseData = await response.json();

        log('\n📥 Response Status:', 'yellow', response.status);
        log('Response Body:', 'yellow', JSON.stringify(responseData, null, 2));

        if (response.ok && responseData.received === true) {
          logTest('Local webhook working', true);
        } else {
          logTest('Local webhook issue', false, `Status: ${response.status}`);
        }

        resolve({ success: response.ok });
      } catch (error) {
        logTest('Local webhook failed', false, error.message);

        if (error.code === 'ECONNREFUSED') {
          log('\n💡 Dev server not running. Start with: npm run dev', 'yellow');
        }

        resolve({ success: false, error: error.message });
      }
    });
  });
}

// Main test runner
async function runTests() {
  console.log('\n' + '='.repeat(60));
  log('NOMBA WEBHOOK TEST', 'bright');
  console.log('='.repeat(60));

  log('\nThis will test your Nomba webhook endpoint by sending a simulated', 'yellow');
  log('payment_success event to verify everything is working.', 'yellow');

  // Test production webhook
  const prodResult = await testWebhookEndpoint();

  // Test local webhook (if desired)
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('\nDo you want to test the local webhook (localhost:3000)? (y/n): ', async (answer) => {
    rl.close();

    if (answer.toLowerCase() === 'y') {
      await testLocalWebhook();
    }

    // Summary
    logSection('Test Summary');

    if (prodResult.success) {
      log('\n✅ Production webhook is working!', 'green');
      log('   Your webhook endpoint is ready to receive real payment events.', 'cyan');
    } else {
      log('\n❌ Production webhook has issues', 'red');
      log('   Check the error messages above for details.', 'yellow');
    }

    log('\n📋 Next Steps:', 'bright');
    log('\n1. If webhook failed:', 'yellow');
    log('   • Check your server logs for errors', 'cyan');
    log('   • Verify the webhook URL is correct in Nomba dashboard', 'cyan');
    log('   • Ensure your application is deployed and running', 'cyan');
    log('\n2. If webhook succeeded:', 'green');
    log('   • Place a real test order through the checkout', 'cyan');
    log('   • Verify the webhook is called after payment', 'cyan');
    log('   • Check that order status updates to "paid"', 'cyan');
    log('\n3. Monitor your logs:', 'yellow');
    log('   • Watch for "Nomba webhook event: payment_success"', 'cyan');
    log('   • Confirm points are awarded correctly', 'cyan');
    log('   • Check emails are sent', 'cyan');

    console.log('\n');
  });
}

// Run tests
runTests().catch(error => {
  log(`\n❌ Test runner error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
