#!/usr/bin/env node

/**
 * Debug Nomba Payment Issues
 *
 * Use this script when a customer reports payment problems.
 * It will check the order status, webhook logs, and identify the issue.
 *
 * Usage:
 *   node scripts/debug-nomba-payment.js <order_id>
 *   node scripts/debug-nomba-payment.js <order_number>
 *   node scripts/debug-nomba-payment.js <customer_email>
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

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

async function main() {
  const identifier = process.argv[2];

  if (!identifier) {
    console.log('\n❌ Error: Please provide an order ID, order number, or customer email\n');
    console.log('Usage:');
    console.log('  node scripts/debug-nomba-payment.js <order_id>');
    console.log('  node scripts/debug-nomba-payment.js <order_number>');
    console.log('  node scripts/debug-nomba-payment.js <customer_email>\n');
    process.exit(1);
  }

  logSection('Nomba Payment Debug Tool');

  // Initialize Supabase client with service role key
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    log('❌ Supabase credentials not found in environment', 'red');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Find order(s)
  log(`\n🔍 Looking for: ${identifier}`, 'blue');

  let query = supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  // Determine query type based on identifier format
  if (identifier.includes('@')) {
    // Email address
    log('Query type: Customer email', 'cyan');
    query = query.eq('customer_email', identifier);
  } else if (identifier.match(/^[0-9a-f]{8}-/i)) {
    // UUID format
    log('Query type: Order ID (UUID)', 'cyan');
    query = query.eq('id', identifier);
  } else if (identifier.match(/^WS-/i)) {
    // Order number format
    log('Query type: Order Number', 'cyan');
    query = query.eq('order_number', identifier);
  } else {
    // Try as order number
    log('Query type: Order Number (assumed)', 'cyan');
    query = query.eq('order_number', identifier);
  }

  const { data: orders, error } = await query;

  if (error) {
    log(`\n❌ Database error: ${error.message}`, 'red');
    process.exit(1);
  }

  if (!orders || orders.length === 0) {
    log('\n❌ No orders found matching the identifier', 'yellow');
    log('   Please check the identifier and try again', 'cyan');
    process.exit(0);
  }

  log(`\n✓ Found ${orders.length} order(s)\n`, 'green');

  // Display order(s)
  for (const order of orders) {
    logSection(`Order: ${order.order_number}`);
    
    log('\n📋 Order Details:', 'cyan');
    console.log(`  Order ID:        ${order.id}`);
    console.log(`  Order Number:    ${order.order_number}`);
    console.log(`  Customer:        ${order.customer_name} (${order.customer_email})`);
    console.log(`  Phone:           ${order.customer_phone}`);
    console.log(`  Total:           ₦${order.total}`);
    console.log(`  Created:         ${new Date(order.created_at).toLocaleString()}`);
    
    log('\n💳 Payment Details:', 'cyan');
    console.log(`  Payment Method:  ${order.payment_method || 'Not set'}`);
    console.log(`  Payment Gateway: ${order.payment_gateway || 'Not set'}`);
    console.log(`  Payment Status:  ${order.payment_status || 'pending'}`);
    console.log(`  Payment Ref:     ${order.payment_reference || 'Not set'}`);
    console.log(`  Paid At:         ${order.paid_at ? new Date(order.paid_at).toLocaleString() : 'Not paid'}`);
    console.log(`  Order Status:    ${order.status}`);

    // Diagnosis
    log('\n🔍 Diagnosis:', 'cyan');

    if (order.payment_gateway === 'nomba') {
      // Nomba-specific diagnosis
      if (!order.payment_reference) {
        log('  ❌ Payment reference missing', 'red');
        log('     Issue: Checkout initialization may have failed', 'yellow');
        log('     Action: Customer should try checkout again', 'yellow');
      } else if (order.payment_status === 'paid') {
        log('  ✅ Payment successful', 'green');
        log('     Webhook: Processed correctly', 'green');
      } else if (order.payment_status === 'pending') {
        const elapsed = Date.now() - new Date(order.created_at).getTime();
        const minutes = Math.floor(elapsed / 60000);
        
        log('  ⚠️  Payment pending', 'yellow');
        log(`     Order created ${minutes} minutes ago`, 'yellow');
        
        if (minutes > 5) {
          log('  ❌ Issue: Payment likely failed or webhook not received', 'red');
          log('     Action: Check Nomba dashboard for transaction status', 'yellow');
          log('     Action: Ask customer if they completed payment', 'yellow');
          log('     Action: If customer paid, process manually', 'yellow');
        } else {
          log('  ℹ️  Recent order - webhook may still be processing', 'cyan');
          log('     Action: Wait 2-3 minutes then check again', 'yellow');
        }
      } else if (order.payment_status === 'failed') {
        log('  ❌ Payment failed', 'red');
        log('     Issue: Payment was declined or cancelled', 'yellow');
        log('     Action: Customer should try again or use different payment method', 'yellow');
      }
    } else if (order.payment_gateway === 'paystack') {
      log('  ℹ️  This order used Paystack, not Nomba', 'cyan');
    } else {
      log('  ℹ️  Payment gateway not set or unknown', 'cyan');
    }

    // Check for order items
    if (order.order_items && order.order_items.length > 0) {
      log('\n🛒 Order Items:', 'cyan');
      order.order_items.forEach((item, i) => {
        console.log(`  ${i + 1}. ${item.product_name} - ${item.flavor} (${item.size}) x${item.quantity}`);
      });
    }
  }

  // Recommendations
  logSection('Recommendations');

  const failedPayments = orders.filter(o => o.payment_gateway === 'nomba' && o.payment_reference && o.payment_status !== 'paid');
  const recentOrders = orders.filter(o => {
    const elapsed = Date.now() - new Date(o.created_at).getTime();
    return elapsed < 300000; // 5 minutes
  });

  if (failedPayments.length > 0) {
    log('\n⚠️  Webhook issues detected:', 'yellow');
    log('   Some orders have payment references but are not marked as paid.', 'yellow');
    log('   This indicates the webhook may not be processing correctly.', 'yellow');
    log('\n   Action items:', 'cyan');
    log('   1. Check server logs for webhook errors', 'yellow');
    log('   2. Verify webhook URL in Nomba dashboard', 'yellow');
    log('   3. Test webhook: node scripts/test-nomba-webhook.js', 'yellow');
  }

  if (recentOrders.length > 0) {
    log('\nℹ️  Recent orders found:', 'cyan');
    log('   These orders were created very recently and may still be processing.', 'cyan');
    log('   Wait a few minutes before investigating further.', 'yellow');
  }

  log('\n✓ Debug complete', 'green');
  console.log('\n');
}

main().catch(error => {
  log(`\n❌ Error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
