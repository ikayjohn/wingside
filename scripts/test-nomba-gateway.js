/**
 * Test Nomba Payment Gateway
 *
 * This script tests the Nomba payment gateway integration to ensure
 * all endpoints are working correctly.
 *
 * Usage:
 *   node scripts/test-nomba-gateway.js
 */

require('dotenv').config({ path: '.env.local' });

const NOMBA_CLIENT_ID = process.env.NOMBA_CLIENT_ID;
const NOMBA_CLIENT_SECRET = process.env.NOMBA_CLIENT_SECRET;
const NOMBA_ACCOUNT_ID = process.env.NOMBA_ACCOUNT_ID;

// ANSI color codes for console output
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

// Test 1: Check Environment Variables
async function testEnvironmentVariables() {
  logSection('Test 1: Environment Variables');

  const checks = [
    { name: 'NOMBA_CLIENT_ID', value: NOMBA_CLIENT_ID },
    { name: 'NOMBA_CLIENT_SECRET', value: NOMBA_CLIENT_SECRET },
    { name: 'NOMBA_ACCOUNT_ID', value: NOMBA_ACCOUNT_ID },
  ];

  let allPassed = true;

  checks.forEach(({ name, value }) => {
    const isSet = !!value;
    if (!isSet) allPassed = false;
    logTest(
      `${name} is ${isSet ? 'set' : 'missing'}`,
      isSet,
      isSet ? `Value: ${value.substring(0, 10)}...` : ''
    );
  });

  return allPassed;
}

// Test 2: Authentication
async function testAuthentication() {
  logSection('Test 2: Nomba Authentication');

  try {
    log('Requesting access token...', 'blue');

    const response = await fetch('https://api.nomba.com/v1/auth/token/issue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'accountId': NOMBA_ACCOUNT_ID,
      },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: NOMBA_CLIENT_ID,
        client_secret: NOMBA_CLIENT_SECRET,
      }),
    });

    const data = await response.json();

    log('Response Status:', 'yellow', response.status);
    log('Response:', 'yellow', JSON.stringify(data, null, 2));

    if (data.code === '00' && data.data?.access_token) {
      logTest('Authentication successful', true);
      log(`  Access Token: ${data.data.access_token.substring(0, 20)}...`, 'cyan');
      log(`  Expires At: ${data.data.expiresAt}`, 'cyan');
      return data.data.access_token;
    } else {
      logTest('Authentication failed', false, data.description);
      return null;
    }
  } catch (error) {
    logTest('Authentication error', false, error.message);
    return null;
  }
}

// Test 3: Create Checkout Order
async function testCreateCheckout(accessToken) {
  logSection('Test 3: Create Checkout Order');

  if (!accessToken) {
    logTest('Skipping - No access token', false);
    return null;
  }

  try {
    const testData = {
      order: {
        orderReference: `WS-TEST-${Date.now()}`,
        customerId: 'test-customer-123',
        callbackUrl: 'https://www.wingside.ng/payment/nomba/callback',
        customerEmail: 'test@example.com',
        amount: '100.00',
        currency: 'NGN',
      },
      tokenizeCard: false,
    };

    log('Creating checkout order...', 'blue');
    log('Request:', 'yellow', JSON.stringify(testData, null, 2));

    const response = await fetch('https://api.nomba.com/v1/checkout/order', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'accountId': NOMBA_ACCOUNT_ID,
      },
      body: JSON.stringify(testData),
    });

    const data = await response.json();

    log('Response Status:', 'yellow', response.status);
    log('Response:', 'yellow', JSON.stringify(data, null, 2));

    if (data.code === '00' && data.data?.checkoutLink) {
      logTest('Checkout order created', true);
      log(`  Checkout Link: ${data.data.checkoutLink}`, 'cyan');
      log(`  Order Reference: ${data.data.orderReference}`, 'cyan');
      return data.data.orderReference;
    } else {
      logTest('Checkout creation failed', false, data.description);
      return null;
    }
  } catch (error) {
    logTest('Checkout creation error', false, error.message);
    return null;
  }
}

// Test 4: Verify Transaction
async function testVerifyTransaction(accessToken, orderRef) {
  logSection('Test 4: Verify Transaction');

  if (!accessToken || !orderRef) {
    logTest('Skipping - Missing access token or order reference', false);
    return;
  }

  try {
    log('Verifying transaction...', 'blue');
    log('Transaction Reference:', 'yellow', orderRef);

    const response = await fetch('https://api.nomba.com/v1/transactions/accounts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'accountId': NOMBA_ACCOUNT_ID,
      },
      body: JSON.stringify({
        transactionRef: orderRef,
      }),
    });

    const data = await response.json();

    log('Response Status:', 'yellow', response.status);
    log('Response:', 'yellow', JSON.stringify(data, null, 2));

    if (data.code === '00') {
      const transaction = data.data?.results?.[0];
      if (transaction) {
        logTest('Transaction verification successful', true);
        log(`  Status: ${transaction.status}`, 'cyan');
        log(`  Amount: ${transaction.amount}`, 'cyan');
        log(`  Transaction ID: ${transaction.transactionId}`, 'cyan');
      } else {
        logTest('Transaction not found (expected for test order)', true, 'No transactions found for test reference');
      }
    } else {
      logTest('Transaction verification failed', false, data.description);
    }
  } catch (error) {
    logTest('Transaction verification error', false, error.message);
  }
}

// Test 5: Test API Routes
async function testAPIRoutes() {
  logSection('Test 5: Test API Routes');

  const baseUrl = 'http://localhost:3000';

  // Test initialize endpoint
  try {
    log('Testing /api/payment/nomba/initialize...', 'blue');

    const response = await fetch(`${baseUrl}/api/payment/nomba/initialize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: 'test-order-123',
        amount: 100,
        email: 'test@example.com',
      }),
    });

    const data = await response.json();

    log('Response Status:', 'yellow', response.status);
    log('Response:', 'yellow', JSON.stringify(data, null, 2));

    if (response.ok) {
      logTest('Initialize endpoint working', true);
    } else {
      logTest('Initialize endpoint error', false, data.error || 'Unknown error');
    }
  } catch (error) {
    logTest('Initialize endpoint unreachable', false, error.message);
  }

  // Test verify endpoint
  try {
    log('Testing /api/payment/nomba/verify...', 'blue');

    const response = await fetch(`${baseUrl}/api/payment/nomba/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transactionRef: 'test-ref-123',
      }),
    });

    const data = await response.json();

    log('Response Status:', 'yellow', response.status);
    log('Response:', 'yellow', JSON.stringify(data, null, 2));

    if (response.ok || data.error) {
      logTest('Verify endpoint reachable', true, data.error || 'Working');
    } else {
      logTest('Verify endpoint error', false, 'Unknown error');
    }
  } catch (error) {
    logTest('Verify endpoint unreachable', false, error.message);
  }
}

// Main Test Runner
async function runTests() {
  console.log('\n' + '='.repeat(60));
  log('NOMBA PAYMENT GATEWAY TEST', 'bright');
  console.log('='.repeat(60));

  // Run tests in sequence
  const envOk = await testEnvironmentVariables();

  if (!envOk) {
    log('\n❌ Environment variables not configured. Exiting.', 'red');
    process.exit(1);
  }

  const accessToken = await testAuthentication();
  const orderRef = await testCreateCheckout(accessToken);
  await testVerifyTransaction(accessToken, orderRef);

  // Test API routes (requires dev server to be running)
  logSection('Test 5: API Routes (Dev Server)');
  log('Note: This test requires the dev server to be running on http://localhost:3000', 'yellow');
  log('Start the server with: npm run dev', 'yellow');

  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('\nPress Enter to test API routes (or Ctrl+C to skip)...', () => {
    testAPIRoutes();
    rl.close();

    // Summary
    logSection('Test Summary');
    log('✓ Tests completed. Check results above.', 'green');
    log('\nNext Steps:', 'bright');
    log('1. If authentication failed: Check your credentials', 'yellow');
    log('2. If checkout failed: Check order format and required fields', 'yellow');
    log('3. If API routes failed: Ensure dev server is running', 'yellow');
    log('4. Check Supabase logs for webhook delivery issues', 'yellow');
    console.log('\n');
  });
}

// Run tests
runTests().catch(error => {
  log(`\n❌ Test runner error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
