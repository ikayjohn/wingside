/**
 * Create Test Promo Codes
 *
 * This script creates test promo codes in the database for testing the coupon system.
 * Run this before running test-promo-codes.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

async function main() {
  console.clear();
  log('╔════════════════════════════════════════════════════════╗', 'cyan');
  log('║         Create Test Promo Codes for Wingside          ║', 'cyan');
  log('╚════════════════════════════════════════════════════════╝', 'cyan');

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    log('\n❌ Missing Supabase credentials. Check .env.local', 'red');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const testCodes = [
    {
      code: 'SAVE10',
      description: '10% off any order',
      discount_type: 'percentage',
      discount_value: 10,
      min_order_amount: 0,
      max_discount_amount: null,
      usage_limit: null,
      used_count: 0,
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
      used_count: 0,
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
      used_count: 0,
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
      used_count: 0,
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
      used_count: 0,
      valid_from: new Date().toISOString(),
      valid_until: null,
      is_active: false,
    },
  ];

  log('\n📝 Creating test promo codes...\n', 'blue');

  for (const codeData of testCodes) {
    try {
      // Check if code already exists
      const { data: existing } = await supabase
        .from('promo_codes')
        .select('code')
        .eq('code', codeData.code)
        .single();

      if (existing) {
        // Update existing code
        const { error } = await supabase
          .from('promo_codes')
          .update(codeData)
          .eq('code', codeData.code);

        if (error) {
          log(`❌ Error updating ${codeData.code}: ${error.message}`, 'red');
        } else {
          log(`♻️  Updated: ${codeData.code} - ${codeData.description}`, 'yellow');
        }
      } else {
        // Insert new code
        const { error } = await supabase
          .from('promo_codes')
          .insert(codeData);

        if (error) {
          log(`❌ Error creating ${codeData.code}: ${error.message}`, 'red');
        } else {
          log(`✅ Created: ${codeData.code} - ${codeData.description}`, 'green');
        }
      }

      // Show details
      log(`   Type: ${codeData.discount_type}`, 'reset');
      log(`   Value: ${codeData.discount_type === 'percentage' ? codeData.discount_value + '%' : '₦' + codeData.discount_value}`, 'reset');
      log(`   Min Order: ₦${codeData.min_order_amount.toLocaleString()}`, 'reset');
      if (codeData.max_discount_amount) {
        log(`   Max Discount: ₦${codeData.max_discount_amount.toLocaleString()}`, 'reset');
      }
      if (codeData.usage_limit) {
        log(`   Usage Limit: ${codeData.usage_limit}`, 'reset');
      }
      if (codeData.valid_until) {
        log(`   Valid Until: ${new Date(codeData.valid_until).toLocaleDateString()}`, 'reset');
      }
      log(`   Active: ${codeData.is_active}`, 'reset');
      console.log('');
    } catch (error) {
      log(`❌ Error processing ${codeData.code}: ${error.message}`, 'red');
    }
  }

  log('✅ Test promo codes created/updated successfully!', 'green');
  log('\nYou can now run: node scripts/test-promo-codes.js', 'cyan');
}

main();
