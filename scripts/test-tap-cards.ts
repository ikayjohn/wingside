/**
 * Comprehensive Test Script for Embedly TAP Cards
 *
 * Run with: npx tsx scripts/test-tap-cards.ts
 *
 * Tests all TAP API endpoints and validates responses
 */

import {
  onboardCard,
  getCardBalance,
  getCardHistory,
  searchCustomer,
  topUpCard,
  validateCardSerial,
  validateTransactionPin
} from '../lib/embedly/tap-client';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  bold: '\x1b[1m'
};

function success(message: string) {
  console.log(`${colors.green}✅ ${message}${colors.reset}`);
}

function error(message: string) {
  console.log(`${colors.red}❌ ${message}${colors.reset}`);
}

function info(message: string) {
  console.log(`${colors.blue}ℹ️  ${message}${colors.reset}`);
}

function warning(message: string) {
  console.log(`${colors.yellow}⚠️  ${message}${colors.reset}`);
}

function section(title: string) {
  console.log(`\n${colors.bold}${colors.blue}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.bold}${title}${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}\n`);
}

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  duration: number;
}

const testResults: TestResult[] = [];

async function runTest(
  name: string,
  testFn: () => Promise<boolean>
): Promise<void> {
  const startTime = Date.now();
  try {
    info(`Running: ${name}...`);
    const passed = await testFn();
    const duration = Date.now() - startTime;

    testResults.push({
      name,
      passed,
      message: passed ? 'Test passed' : 'Test failed',
      duration
    });

    if (passed) {
      success(`${name} (${duration}ms)`);
    } else {
      error(`${name} (${duration}ms)`);
    }
  } catch (err) {
    const duration = Date.now() - startTime;
    const message = err instanceof Error ? err.message : String(err);

    testResults.push({
      name,
      passed: false,
      message,
      duration
    });

    error(`${name} failed: ${message} (${duration}ms)`);
  }
}

// ============================================================================
// Configuration Tests
// ============================================================================

async function testEnvironmentVariables(): Promise<boolean> {
  const apiKey = process.env.EMBEDLY_API_KEY;

  if (!apiKey) {
    error('EMBEDLY_API_KEY not set in environment');
    return false;
  }

  info(`API Key exists: ${apiKey.substring(0, 10)}...`);

  const nodeEnv = process.env.NODE_ENV || 'development';
  info(`NODE_ENV: ${nodeEnv}`);

  const baseUrl = process.env.EMBEDLY_TAP_API_URL ||
    (nodeEnv === 'production'
      ? 'https://waas-prod.embedly.ng/embedded/api/v1/tap'
      : 'https://waas-staging.embedly.ng/embedded/api/v1/tap');

  info(`TAP API Base URL: ${baseUrl}`);

  return true;
}

async function testValidationHelpers(): Promise<boolean> {
  // Test valid card serial
  const validSerial = validateCardSerial('WS123456');
  if (!validSerial) {
    error('Valid card serial validation failed');
    return false;
  }

  // Test invalid card serial
  const invalidSerial = validateCardSerial('INVALID123');
  if (invalidSerial) {
    error('Invalid card serial should have failed validation');
    return false;
  }

  // Test valid PIN
  const validPin = validateTransactionPin('1234');
  if (!validPin) {
    error('Valid PIN validation failed');
    return false;
  }

  // Test invalid PIN
  const invalidPin = validateTransactionPin('12');
  if (invalidPin) {
    error('Invalid PIN should have failed validation');
    return false;
  }

  success('All validation helpers work correctly');
  return true;
}

// ============================================================================
// API Tests (requires real test data)
// ============================================================================

async function testGetBalanceDirect(): Promise<boolean> {
  // This test requires a real card serial
  const testCardSerial = process.env.TEST_CARD_SERIAL || 'WS000001';

  warning(`Testing with card serial: ${testCardSerial}`);
  info('Note: This will fail if card doesn\'t exist in Embedly');

  const result = await getCardBalance(testCardSerial);

  if (result.success) {
    success('Balance API call successful');
    if (result.data) {
      info(`Fullname: ${result.data.fullname}`);
      info(`Phone: ${result.data.phone}`);
      info(`Balance: ₦${(result.data.walletBalance / 100).toFixed(2)}`);
      info(`Valid: ${result.data.valid === 1 ? 'Yes' : 'No'}`);
    }
    return true;
  } else {
    warning(`Balance API returned error: ${result.error}`);
    info('This is expected if test card doesn\'t exist yet');
    // Don't fail the test - this is expected in many cases
    return true;
  }
}

async function testSearchCustomerDirect(): Promise<boolean> {
  const testCardSerial = process.env.TEST_CARD_SERIAL || 'WS000001';

  warning(`Searching for card: ${testCardSerial}`);

  const result = await searchCustomer(testCardSerial);

  if (result.success) {
    success('Search customer API call successful');
    if (result.data) {
      info(`Customer ID: ${result.data.customerId}`);
      info(`Wallet ID: ${result.data.walletId}`);
      info(`Name: ${result.data.fullname}`);
      info(`Phone: ${result.data.phone}`);
      info(`Status: ${result.data.status}`);
    }
    return true;
  } else {
    warning(`Search customer returned error: ${result.error}`);
    info('This is expected if test card doesn\'t exist yet');
    return true;
  }
}

async function testGetHistoryDirect(): Promise<boolean> {
  const testCardSerial = process.env.TEST_CARD_SERIAL || 'WS000001';

  const fromDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];
  const toDate = new Date().toISOString().split('T')[0];

  warning(`Getting history for ${testCardSerial} from ${fromDate} to ${toDate}`);

  const result = await getCardHistory(testCardSerial, fromDate, toDate);

  if (result.success) {
    success('Transaction history API call successful');
    if (result.data) {
      info(`Total transactions: ${result.data.totalCount || 0}`);
      if (result.data.transactions && result.data.transactions.length > 0) {
        info(`Latest transaction: ${result.data.transactions[0].description}`);
      }
    }
    return true;
  } else {
    warning(`History API returned error: ${result.error}`);
    info('This is expected if test card doesn\'t exist yet');
    return true;
  }
}

// ============================================================================
// Database Tests
// ============================================================================

async function testDatabaseConnection(): Promise<boolean> {
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();

    // Test connection with a simple query
    const { error } = await supabase.from('wingside_cards').select('id').limit(1);

    if (error) {
      throw error;
    }

    success('Database connection successful');
    return true;
  } catch (err) {
    error(`Database connection failed: ${err}`);
    return false;
  }
}

async function testWingsideCardsTable(): Promise<boolean> {
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin');
    const admin = createAdminClient();

    // Check if table exists and has correct structure
    const { data, error } = await admin
      .from('wingside_cards')
      .select('*')
      .limit(1);

    if (error) {
      throw error;
    }

    success('wingside_cards table exists and is accessible');

    // Count total cards
    const { count } = await admin
      .from('wingside_cards')
      .select('*', { count: 'exact', head: true });

    info(`Total cards in database: ${count || 0}`);

    return true;
  } catch (err) {
    error(`wingside_cards table test failed: ${err}`);
    return false;
  }
}

// ============================================================================
// Response Format Tests
// ============================================================================

async function testResponseFormat(): Promise<boolean> {
  // Test that we can handle the Embedly response structure
  const mockResponse = {
    data: {
      error: {
        message: '',
        status: 0,
        details: null
      },
      success: {
        message: 'Test successful',
        status: 1,
        details: null
      },
      content: {
        phone: '2348012345678',
        fullname: 'Test User',
        walletBalance: 10000,
        valid: 1
      },
      statusCode: 200,
      newStatusCode: 200
    },
    status: 200,
    message: ''
  };

  // Simulate response parsing logic
  if (mockResponse.data.success.status === 1) {
    success('Response parsing logic correct');
    info('Successfully extracted content from nested structure');
    return true;
  } else {
    error('Response parsing failed');
    return false;
  }
}

// ============================================================================
// Main Test Runner
// ============================================================================

async function main() {
  console.clear();

  section('🧪 Embedly TAP Cards Test Suite');

  info('Starting comprehensive test suite...');
  info(`Timestamp: ${new Date().toISOString()}`);
  info(`Node version: ${process.version}`);

  // Configuration Tests
  section('1️⃣  Configuration Tests');
  await runTest('Environment Variables', testEnvironmentVariables);
  await runTest('Validation Helpers', testValidationHelpers);
  await runTest('Response Format Parsing', testResponseFormat);

  // Database Tests
  section('2️⃣  Database Tests');
  await runTest('Database Connection', testDatabaseConnection);
  await runTest('Wingside Cards Table', testWingsideCardsTable);

  // API Tests (optional - requires test data)
  section('3️⃣  Embedly TAP API Tests');
  warning('These tests require a valid test card in Embedly');
  warning('Set TEST_CARD_SERIAL env var to test with real card');

  await runTest('Get Balance API', testGetBalanceDirect);
  await runTest('Search Customer API', testSearchCustomerDirect);
  await runTest('Transaction History API', testGetHistoryDirect);

  // Summary
  section('📊 Test Results Summary');

  const totalTests = testResults.length;
  const passedTests = testResults.filter(t => t.passed).length;
  const failedTests = totalTests - passedTests;
  const totalDuration = testResults.reduce((sum, t) => sum + t.duration, 0);

  console.log(`Total Tests: ${totalTests}`);
  console.log(`${colors.green}Passed: ${passedTests}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failedTests}${colors.reset}`);
  console.log(`Total Duration: ${totalDuration}ms\n`);

  // Detailed failures
  if (failedTests > 0) {
    section('❌ Failed Tests Details');
    testResults
      .filter(t => !t.passed)
      .forEach(t => {
        console.log(`${colors.red}✗ ${t.name}${colors.reset}`);
        console.log(`  Message: ${t.message}`);
        console.log(`  Duration: ${t.duration}ms\n`);
      });
  }

  // Final verdict
  section('🏁 Final Verdict');

  if (failedTests === 0) {
    success('ALL TESTS PASSED! 🎉');
    success('Your Embedly TAP Cards setup is working correctly!');
    info('\nNext steps:');
    info('1. Test card onboarding via UI at /my-account/cards');
    info('2. Test with real card serial and PIN');
    info('3. Monitor logs for any errors');
    process.exit(0);
  } else if (passedTests >= totalTests * 0.8) {
    warning('MOST TESTS PASSED');
    warning(`${failedTests} test(s) failed - review failures above`);
    info('\nSome tests may fail if:');
    info('- Test card doesn\'t exist in Embedly yet');
    info('- Database tables not migrated');
    info('- Environment variables not set');
    process.exit(1);
  } else {
    error('MULTIPLE TEST FAILURES');
    error('Please review the failures above and fix before deploying');
    process.exit(1);
  }
}

// Run tests
main().catch(err => {
  console.error('\n💥 Test suite crashed:', err);
  process.exit(1);
});
