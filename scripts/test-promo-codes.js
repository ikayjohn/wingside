/**
 * Promo Code System Test Script
 *
 * This script tests the promo code/coupon functionality:
 * - Creating promo codes
 * - Validating promo codes
 * - Testing different discount types (percentage, fixed)
 * - Testing validation rules (min order, max discount, expiry, usage limits)
 */

require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
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
  log(title, 'cyan');
  console.log('='.repeat(60));
}

async function testPromoCodeValidation(testCase) {
  const { name, code, orderAmount, expectedResult } = testCase;

  log(`\nTesting: ${name}`, 'blue');
  log(`  Code: ${code}`, 'reset');
  log(`  Order Amount: ₦${orderAmount.toLocaleString()}`, 'reset');

  try {
    const response = await fetch(`${APP_URL}/api/promo-codes/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, orderAmount }),
    });

    const data = await response.json();

    if (expectedResult === 'success' && response.ok) {
      log(`  ✅ PASS - Promo code validated successfully`, 'green');
      log(`  💰 Discount: ₦${data.discountAmount.toLocaleString()}`, 'green');
      log(`  📝 Message: ${data.message}`, 'green');
      return { success: true, data };
    } else if (expectedResult === 'fail' && !response.ok) {
      log(`  ✅ PASS - Correctly rejected: ${data.error}`, 'green');
      return { success: true, error: data.error };
    } else if (expectedResult === 'success' && !response.ok) {
      log(`  ❌ FAIL - Expected success but got error: ${data.error}`, 'red');
      return { success: false, error: data.error };
    } else {
      log(`  ❌ FAIL - Expected failure but got success`, 'red');
      return { success: false, data };
    }
  } catch (error) {
    log(`  ❌ ERROR: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function createTestPromoCodes() {
  logSection('Creating Test Promo Codes');

  const testCodes = [
    {
      code: 'SAVE10',
      description: '10% off any order',
      discount_type: 'percentage',
      discount_value: 10,
      min_order_amount: 0,
      max_discount_amount: null,
      usage_limit: null,
      valid_from: new Date().toISOString(),
      valid_until: null,
      is_active: true,
    },
    {
      code: 'SAVE20MIN5K',
      description: '20% off orders above ₦5,000',
      discount_type: 'percentage',
      discount_value: 20,
      min_order_amount: 5000,
      max_discount_amount: 2000,
      usage_limit: 100,
      valid_from: new Date().toISOString(),
      valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      is_active: true,
    },
    {
      code: 'FLAT500',
      description: '₦500 off any order',
      discount_type: 'fixed',
      discount_value: 500,
      min_order_amount: 2000,
      max_discount_amount: null,
      usage_limit: null,
      valid_from: new Date().toISOString(),
      valid_until: null,
      is_active: true,
    },
    {
      code: 'EXPIRED',
      description: 'Expired promo code (for testing)',
      discount_type: 'percentage',
      discount_value: 50,
      min_order_amount: 0,
      max_discount_amount: null,
      usage_limit: null,
      valid_from: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days ago
      valid_until: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
      is_active: true,
    },
    {
      code: 'INACTIVE',
      description: 'Inactive promo code (for testing)',
      discount_type: 'percentage',
      discount_value: 25,
      min_order_amount: 0,
      max_discount_amount: null,
      usage_limit: null,
      valid_from: new Date().toISOString(),
      valid_until: null,
      is_active: false,
    },
  ];

  log('\nNote: Creating promo codes requires admin authentication.', 'yellow');
  log('You can create these codes manually in the admin panel or database.\n', 'yellow');

  for (const code of testCodes) {
    log(`Code: ${code.code}`, 'cyan');
    log(`  Description: ${code.description}`, 'reset');
    log(`  Type: ${code.discount_type}`, 'reset');
    log(`  Value: ${code.discount_type === 'percentage' ? code.discount_value + '%' : '₦' + code.discount_value}`, 'reset');
    log(`  Min Order: ₦${code.min_order_amount.toLocaleString()}`, 'reset');
    if (code.max_discount_amount) {
      log(`  Max Discount: ₦${code.max_discount_amount.toLocaleString()}`, 'reset');
    }
    if (code.usage_limit) {
      log(`  Usage Limit: ${code.usage_limit}`, 'reset');
    }
    if (code.valid_until) {
      log(`  Valid Until: ${new Date(code.valid_until).toLocaleDateString()}`, 'reset');
    }
    log(`  Active: ${code.is_active}`, 'reset');
    console.log('');
  }

  return testCodes;
}

async function runValidationTests() {
  logSection('Running Promo Code Validation Tests');

  const tests = [
    // Valid tests
    {
      name: '10% discount on ₦10,000 order',
      code: 'SAVE10',
      orderAmount: 10000,
      expectedResult: 'success',
    },
    {
      name: '20% discount on ₦10,000 order (above min ₦5,000)',
      code: 'SAVE20MIN5K',
      orderAmount: 10000,
      expectedResult: 'success',
    },
    {
      name: '₦500 fixed discount on ₦3,000 order',
      code: 'FLAT500',
      orderAmount: 3000,
      expectedResult: 'success',
    },
    {
      name: 'Max discount cap applied (20% of ₦15,000 = ₦3,000, capped at ₦2,000)',
      code: 'SAVE20MIN5K',
      orderAmount: 15000,
      expectedResult: 'success',
    },

    // Invalid tests
    {
      name: 'Below minimum order amount (₦3,000 < ₦5,000)',
      code: 'SAVE20MIN5K',
      orderAmount: 3000,
      expectedResult: 'fail',
    },
    {
      name: 'Below minimum order amount for FLAT500 (₦1,500 < ₦2,000)',
      code: 'FLAT500',
      orderAmount: 1500,
      expectedResult: 'fail',
    },
    {
      name: 'Expired promo code',
      code: 'EXPIRED',
      orderAmount: 5000,
      expectedResult: 'fail',
    },
    {
      name: 'Inactive promo code',
      code: 'INACTIVE',
      orderAmount: 5000,
      expectedResult: 'fail',
    },
    {
      name: 'Non-existent promo code',
      code: 'NONEXISTENT',
      orderAmount: 5000,
      expectedResult: 'fail',
    },
    {
      name: 'Invalid order amount (zero)',
      code: 'SAVE10',
      orderAmount: 0,
      expectedResult: 'fail',
    },
    {
      name: 'Invalid order amount (negative)',
      code: 'SAVE10',
      orderAmount: -100,
      expectedResult: 'fail',
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const result = await testPromoCodeValidation(test);
    if (result.success) {
      passed++;
    } else {
      failed++;
    }

    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  logSection('Test Results Summary');
  log(`Total Tests: ${tests.length}`, 'blue');
  log(`✅ Passed: ${passed}`, 'green');
  log(`❌ Failed: ${failed}`, 'red');
  log(`Success Rate: ${((passed / tests.length) * 100).toFixed(1)}%`, failed === 0 ? 'green' : 'yellow');
}

async function testDiscountCalculations() {
  logSection('Testing Discount Calculations');

  const calculations = [
    { code: 'SAVE10', amount: 1000, expected: 100 },
    { code: 'SAVE10', amount: 5000, expected: 500 },
    { code: 'SAVE10', amount: 10000, expected: 1000 },
    { code: 'SAVE20MIN5K', amount: 5000, expected: 1000 },
    { code: 'SAVE20MIN5K', amount: 10000, expected: 2000 }, // Capped at max
    { code: 'SAVE20MIN5K', amount: 15000, expected: 2000 }, // Capped at max
    { code: 'FLAT500', amount: 2000, expected: 500 },
    { code: 'FLAT500', amount: 5000, expected: 500 },
  ];

  let calculationsPassed = 0;
  let calculationsFailed = 0;

  for (const calc of calculations) {
    const response = await fetch(`${APP_URL}/api/promo-codes/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: calc.code, orderAmount: calc.amount }),
    });

    if (response.ok) {
      const data = await response.json();
      const actualDiscount = data.discountAmount;

      if (actualDiscount === calc.expected) {
        log(`✅ ${calc.code} on ₦${calc.amount.toLocaleString()}: Expected ₦${calc.expected}, Got ₦${actualDiscount}`, 'green');
        calculationsPassed++;
      } else {
        log(`❌ ${calc.code} on ₦${calc.amount.toLocaleString()}: Expected ₦${calc.expected}, Got ₦${actualDiscount}`, 'red');
        calculationsFailed++;
      }
    } else {
      const data = await response.json();
      log(`❌ ${calc.code} on ₦${calc.amount.toLocaleString()}: ${data.error}`, 'red');
      calculationsFailed++;
    }

    await new Promise(resolve => setTimeout(resolve, 300));
  }

  log(`\nCalculation Tests: ${calculationsPassed} passed, ${calculationsFailed} failed`, calculationsFailed === 0 ? 'green' : 'red');
}

async function main() {
  console.clear();
  log('╔════════════════════════════════════════════════════════╗', 'cyan');
  log('║        Wingside Promo Code System Test Suite          ║', 'cyan');
  log('╚════════════════════════════════════════════════════════╝', 'cyan');

  // Check environment
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    log('\n❌ Missing Supabase credentials. Please check .env.local', 'red');
    process.exit(1);
  }

  log(`\n🌐 Testing against: ${APP_URL}`, 'blue');
  log('⏱️  Starting tests...\n', 'blue');

  try {
    // Step 1: Show test promo codes to create
    await createTestPromoCodes();

    // Step 2: Run validation tests
    await runValidationTests();

    // Step 3: Test discount calculations
    await testDiscountCalculations();

    logSection('All Tests Complete!');
    log('✨ Promo code system testing completed', 'green');

  } catch (error) {
    log(`\n❌ Fatal Error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Run tests
main();
