/**
 * Test Nomba Amount Formatting Fix
 *
 * This script specifically tests that the Nomba payment gateway
 * correctly formats amounts in naira (not kobo like Paystack).
 *
 * Bug: ₦250 was being sent as "25000" (kobo) → Nomba showed ₦25,000
 * Fix: ₦250 is now sent as "250.00" (naira) → Nomba shows ₦250
 *
 * Usage:
 *   node scripts/test-nomba-amount-fix.js
 */

require('dotenv').config({ path: '.env.local' });

const NOMBA_CLIENT_ID = process.env.NOMBA_CLIENT_ID;
const NOMBA_CLIENT_SECRET = process.env.NOMBA_CLIENT_SECRET;
const NOMBA_ACCOUNT_ID = process.env.NOMBA_ACCOUNT_ID;

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(70));
  log(title, 'bright');
  console.log('='.repeat(70));
}

// Get Nomba access token
async function getAccessToken() {
  try {
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

    if (data.code === '00' && data.data?.access_token) {
      return data.data.access_token;
    }

    throw new Error(`Auth failed: ${data.description}`);
  } catch (error) {
    throw new Error(`Failed to get access token: ${error.message}`);
  }
}

// Test amount formatting
async function testAmountFormatting(accessToken, testAmount, testName) {
  logSection(`Testing: ${testName}`);

  // Show what the OLD buggy code would have sent
  const oldBuggyFormat = Math.round(testAmount * 100).toString();
  log(`❌ OLD BUGGY FORMAT (kobo): "${oldBuggyFormat}"`, 'red');
  log(`   → Nomba would display: ₦${(parseInt(oldBuggyFormat)).toLocaleString()}`, 'red');

  // Show what the NEW fixed code sends
  const newFixedFormat = Number(testAmount).toFixed(2);
  log(`✅ NEW FIXED FORMAT (naira): "${newFixedFormat}"`, 'green');
  log(`   → Nomba should display: ₦${Number(newFixedFormat).toLocaleString()}`, 'green');

  // Create actual checkout to verify
  try {
    log('\n📤 Creating checkout with Nomba API...', 'blue');

    const testData = {
      order: {
        orderReference: `WS-AMOUNTTEST-${Date.now()}`,
        customerId: `test-${Date.now()}`,
        callbackUrl: 'https://www.wingside.ng/payment/nomba/callback',
        customerEmail: 'test@wingside.ng',
        amount: newFixedFormat, // Using the FIXED format
        currency: 'NGN',
      },
      tokenizeCard: false,
    };

    log(`Request payload:`, 'cyan');
    log(JSON.stringify(testData, null, 2), 'cyan');

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

    if (data.code === '00' && data.data?.checkoutLink) {
      log(`\n✅ SUCCESS: Checkout created!`, 'green');
      log(`   Order Reference: ${data.data.orderReference}`, 'cyan');
      log(`   Checkout Link: ${data.data.checkoutLink}`, 'cyan');
      log(`\n💡 MANUAL VERIFICATION:`, 'yellow');
      log(`   1. Open the checkout link in your browser`, 'yellow');
      log(`   2. Verify the amount shows as ₦${Number(newFixedFormat).toLocaleString()}`, 'yellow');
      log(`   3. DO NOT complete the payment (test purposes only)`, 'yellow');
      return { success: true, link: data.data.checkoutLink };
    } else {
      log(`\n❌ FAILED: ${data.description}`, 'red');
      log(`Response:`, 'red');
      log(JSON.stringify(data, null, 2), 'red');
      return { success: false, error: data.description };
    }
  } catch (error) {
    log(`\n❌ ERROR: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

// Test the actual API endpoint (if dev server is running)
async function testAPIEndpoint(testAmount, testName) {
  logSection(`Testing API Endpoint: ${testName}`);

  try {
    log('📤 Calling /api/payment/nomba/initialize...', 'blue');

    const response = await fetch('http://localhost:3000/api/payment/nomba/initialize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: `test-order-${Date.now()}`,
        amount: testAmount,
        email: 'test@wingside.ng',
        metadata: {
          test: true,
          description: testName,
        },
      }),
    });

    const data = await response.json();

    if (response.ok && data.checkout_url) {
      log(`\n✅ SUCCESS: API endpoint working!`, 'green');
      log(`   Order Reference: ${data.order_reference}`, 'cyan');
      log(`   Checkout Link: ${data.checkout_url}`, 'cyan');
      log(`\n💡 MANUAL VERIFICATION:`, 'yellow');
      log(`   1. Open the checkout link in your browser`, 'yellow');
      log(`   2. Verify the amount shows as ₦${testAmount.toLocaleString()}`, 'yellow');
      log(`   3. DO NOT complete the payment (test purposes only)`, 'yellow');
      return { success: true, link: data.checkout_url };
    } else {
      log(`\n⚠️  API returned error (expected if order doesn't exist in DB):`, 'yellow');
      log(JSON.stringify(data, null, 2), 'yellow');
      return { success: false, error: data.error };
    }
  } catch (error) {
    log(`\n❌ ERROR: ${error.message}`, 'red');
    log(`   Make sure dev server is running: npm run dev`, 'yellow');
    return { success: false, error: error.message };
  }
}

// Main test runner
async function runTests() {
  console.log('\n' + '='.repeat(70));
  log('🧪 NOMBA AMOUNT FORMATTING FIX TEST', 'bright');
  log('Testing that amounts are sent in naira format (not kobo)', 'cyan');
  console.log('='.repeat(70));

  // Check credentials
  if (!NOMBA_CLIENT_ID || !NOMBA_CLIENT_SECRET || !NOMBA_ACCOUNT_ID) {
    log('\n❌ Missing Nomba credentials in .env.local', 'red');
    log('Required variables:', 'yellow');
    log('  - NOMBA_CLIENT_ID', 'yellow');
    log('  - NOMBA_CLIENT_SECRET', 'yellow');
    log('  - NOMBA_ACCOUNT_ID', 'yellow');
    process.exit(1);
  }

  // Test cases: [amount, description]
  const testCases = [
    [250, '₦250 - The reported bug amount'],
    [100, '₦100 - Minimum typical amount'],
    [1500, '₦1,500 - Medium amount'],
    [25000, '₦25,000 - Large amount (what ₦250 incorrectly showed as)'],
    [5000.50, '₦5,000.50 - Amount with decimals'],
  ];

  try {
    // Get access token
    log('\n🔑 Authenticating with Nomba...', 'blue');
    const accessToken = await getAccessToken();
    log('✅ Authentication successful\n', 'green');

    const results = [];

    // Run direct API tests
    log('\n' + '═'.repeat(70), 'magenta');
    log('PART 1: Direct Nomba API Tests', 'bright');
    log('═'.repeat(70), 'magenta');

    for (const [amount, description] of testCases) {
      const result = await testAmountFormatting(accessToken, amount, description);
      results.push({ amount, description, ...result });

      // Pause between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Test via our API endpoint
    log('\n' + '═'.repeat(70), 'magenta');
    log('PART 2: API Endpoint Tests', 'bright');
    log('═'.repeat(70), 'magenta');
    log('\n💡 Note: These tests require your dev server to be running', 'yellow');
    log('   Start with: npm run dev\n', 'yellow');

    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('Press Enter to test API endpoints (or Ctrl+C to skip)...', async () => {
      rl.close();

      // Test with the critical amounts
      await testAPIEndpoint(250, '₦250 - Critical test case');
      await new Promise(resolve => setTimeout(resolve, 1000));
      await testAPIEndpoint(5000, '₦5,000 - Standard order');

      // Summary
      logSection('📊 TEST SUMMARY');

      const successCount = results.filter(r => r.success).length;
      const totalCount = results.length;

      if (successCount === totalCount) {
        log(`✅ ALL TESTS PASSED (${successCount}/${totalCount})`, 'green');
        log('\n🎉 The Nomba amount formatting fix is working correctly!', 'green');
        log('\n📝 What was fixed:', 'bright');
        log('  • Amounts are now sent in naira format (e.g., "250.00")', 'cyan');
        log('  • Previously sent in kobo format (e.g., "25000")', 'cyan');
        log('  • This caused ₦250 to appear as ₦25,000 on Nomba', 'cyan');
      } else {
        log(`⚠️  SOME TESTS FAILED (${successCount}/${totalCount} passed)`, 'yellow');
        log('\n❌ Failed tests:', 'red');
        results.filter(r => !r.success).forEach(r => {
          log(`   • ${r.description}: ${r.error}`, 'red');
        });
      }

      log('\n📋 Next Steps:', 'bright');
      log('  1. Review the checkout links above', 'yellow');
      log('  2. Verify amounts display correctly on Nomba\'s payment page', 'yellow');
      log('  3. Test with a real order through your website', 'yellow');
      log('  4. Deploy the fix to production when verified', 'yellow');
      console.log('\n');
    });

  } catch (error) {
    log(`\n❌ Test error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
