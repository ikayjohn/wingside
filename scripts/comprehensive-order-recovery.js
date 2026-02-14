#!/usr/bin/env node
/**
 * Comprehensive Order Data Recovery Script
 * Searches ALL possible locations for order WS202602130138 notes
 *
 * Usage: node comprehensive-order-recovery.js WS202602130138
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const ORDER_NUMBER = process.argv[2] || 'WS202602130138';
const ORDER_EMAIL = 'prinxwill@gmail.com';
const ORDER_PHONE = '+2348037238781';

// Colors for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

function section(title) {
  console.log('\n' + '='.repeat(60));
  log(colors.bright + colors.cyan, `  ${title}`);
  console.log('='.repeat(60) + '\n');
}

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  log(colors.bright + colors.green, '\n🔍 COMPREHENSIVE ORDER DATA RECOVERY');
  log(colors.yellow, `Order Number: ${ORDER_NUMBER}`);
  log(colors.yellow, `Customer: Princewill NSIEGBE (${ORDER_EMAIL})`);
  console.log('');

  const results = {
    found: [],
    notFound: [],
    errors: []
  };

  // ============================================================
  // 1. DATABASE CHECKS
  // ============================================================
  section('1. DATABASE CHECKS');

  // 1.1 Main order and items
  try {
    log(colors.blue, '📊 Checking main orders table...');
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .eq('order_number', ORDER_NUMBER)
      .single();

    if (error) throw error;

    if (order) {
      log(colors.green, '✓ Order found in database');
      console.log('  Order ID:', order.id);
      console.log('  Created:', order.created_at);
      console.log('  Status:', order.status);
      console.log('  Payment:', order.payment_status);
      console.log('  Items:', order.order_items?.length || 0);

      if (order.notes) {
        log(colors.green, '  ✓ ORDER-LEVEL NOTES FOUND:');
        console.log('    ' + order.notes);
        results.found.push({ location: 'orders.notes', data: order.notes });
      } else {
        log(colors.yellow, '  ⚠ Order-level notes: NULL');
        results.notFound.push('orders.notes');
      }

      // Check each item
      order.order_items?.forEach((item, idx) => {
        console.log(`\n  Item ${idx + 1}: ${item.product_name}`);
        if (item.notes) {
          log(colors.green, `    ✓ ITEM NOTES FOUND:`);
          console.log(`      ${item.notes}`);
          results.found.push({
            location: `order_items[${idx}].notes`,
            product: item.product_name,
            data: item.notes
          });
        } else {
          console.log('    Notes: NULL');
        }
        if (item.delivery_date) {
          console.log(`    Delivery Date: ${item.delivery_date}`);
        }
        if (item.delivery_time) {
          console.log(`    Delivery Time: ${item.delivery_time}`);
        }
      });
    }
  } catch (error) {
    log(colors.red, '✗ Error checking orders: ' + error.message);
    results.errors.push({ check: 'orders table', error: error.message });
  }

  // 1.2 Check audit/history tables
  try {
    log(colors.blue, '\n📜 Checking for audit/history tables...');

    const tables = [
      'order_history',
      'order_audit',
      'orders_history',
      'audit_log',
      'change_log'
    ];

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .or(`order_number.eq.${ORDER_NUMBER},order_id.eq.${ORDER_NUMBER}`)
          .limit(10);

        if (!error && data && data.length > 0) {
          log(colors.green, `  ✓ Found ${data.length} records in ${table}`);
          console.log(JSON.stringify(data, null, 2));
          results.found.push({ location: table, data });
        }
      } catch (e) {
        // Table doesn't exist, skip
      }
    }
  } catch (error) {
    log(colors.yellow, '  ⚠ No audit tables found');
  }

  // 1.3 Check notification logs
  try {
    log(colors.blue, '\n📧 Checking notification logs...');
    const { data: notifications } = await supabase
      .from('notification_logs')
      .select('*')
      .or(`metadata->>order_number.eq.${ORDER_NUMBER}`)
      .order('created_at', { ascending: false });

    if (notifications && notifications.length > 0) {
      log(colors.green, `  ✓ Found ${notifications.length} notification log(s)`);
      notifications.forEach(notif => {
        console.log(`    ${notif.channel}: ${notif.notification_type}`);
        if (notif.metadata) {
          console.log('    Metadata:', JSON.stringify(notif.metadata, null, 2));
          results.found.push({ location: 'notification_logs', data: notif.metadata });
        }
      });
    } else {
      log(colors.yellow, '  ⚠ No notification logs found');
      results.notFound.push('notification_logs');
    }
  } catch (error) {
    log(colors.yellow, '  ⚠ notification_logs table not found or error');
  }

  // 1.4 Check Supabase realtime/logs
  try {
    log(colors.blue, '\n📡 Checking for Supabase query logs...');
    log(colors.yellow, '  ⚠ Supabase query logs require dashboard access');
    log(colors.yellow, '  → Go to: https://supabase.com/dashboard/project/[project-id]/logs');
    log(colors.yellow, '  → Filter by: "orders" or "WS202602130138"');
    log(colors.yellow, '  → Look for INSERT statements with full payload');
  } catch (error) {
    // Skip
  }

  // ============================================================
  // 2. REDIS CACHE CHECKS
  // ============================================================
  section('2. REDIS CACHE CHECKS');

  try {
    log(colors.blue, '💾 Checking Redis cache...');

    if (process.env.REDIS_URL) {
      const Redis = require('ioredis');
      const redis = new Redis(process.env.REDIS_URL);

      const cacheKeys = [
        `order:${ORDER_NUMBER}`,
        `orders:${ORDER_NUMBER}`,
        `cart:${ORDER_EMAIL}`,
        `checkout:${ORDER_EMAIL}`,
      ];

      for (const key of cacheKeys) {
        const cached = await redis.get(key);
        if (cached) {
          log(colors.green, `  ✓ Found cache: ${key}`);
          const data = JSON.parse(cached);
          console.log(JSON.stringify(data, null, 2));
          results.found.push({ location: `redis:${key}`, data });
        }
      }

      // Search all keys
      const allKeys = await redis.keys('*');
      const matches = allKeys.filter(k =>
        k.includes(ORDER_NUMBER) ||
        k.includes(ORDER_EMAIL) ||
        k.includes('cart') ||
        k.includes('order')
      );

      if (matches.length > 0) {
        log(colors.green, `  ✓ Found ${matches.length} potentially relevant cache keys:`);
        for (const key of matches) {
          console.log(`    - ${key}`);
          const value = await redis.get(key);
          if (value && value.includes('notes')) {
            log(colors.green, `      ✓ Contains "notes" keyword!`);
            console.log(value);
            results.found.push({ location: `redis:${key}`, data: value });
          }
        }
      }

      await redis.quit();
    } else {
      log(colors.yellow, '  ⚠ Redis not configured (REDIS_URL not set)');
      results.notFound.push('redis cache');
    }
  } catch (error) {
    log(colors.red, '  ✗ Redis error: ' + error.message);
    results.errors.push({ check: 'redis', error: error.message });
  }

  // ============================================================
  // 3. PAYMENT GATEWAY METADATA
  // ============================================================
  section('3. PAYMENT GATEWAY METADATA');

  // 3.1 Paystack
  try {
    log(colors.blue, '💳 Checking Paystack transaction metadata...');

    if (process.env.PAYSTACK_SECRET_KEY) {
      const { data: order } = await supabase
        .from('orders')
        .select('payment_reference, payment_gateway')
        .eq('order_number', ORDER_NUMBER)
        .single();

      if (order?.payment_reference) {
        log(colors.yellow, `  Payment Reference: ${order.payment_reference}`);
        log(colors.yellow, `  Gateway: ${order.payment_gateway || 'paystack'}`);

        if (order.payment_gateway === 'paystack' || !order.payment_gateway) {
          const response = await fetch(
            `https://api.paystack.co/transaction/verify/${order.payment_reference}`,
            {
              headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
              }
            }
          );

          const paystackData = await response.json();

          if (paystackData.status && paystackData.data) {
            log(colors.green, '  ✓ Paystack transaction found');

            if (paystackData.data.metadata) {
              console.log('  Metadata:', JSON.stringify(paystackData.data.metadata, null, 2));

              if (paystackData.data.metadata.items ||
                  paystackData.data.metadata.cart ||
                  paystackData.data.metadata.order_items) {
                log(colors.green, '  ✓ TRANSACTION METADATA CONTAINS ORDER ITEMS!');
                results.found.push({
                  location: 'paystack transaction metadata',
                  data: paystackData.data.metadata
                });
              } else {
                log(colors.yellow, '  ⚠ Metadata does not contain cart/items data');
                results.notFound.push('paystack metadata items');
              }
            }
          }
        }
      } else {
        log(colors.yellow, '  ⚠ No payment reference found for order');
      }
    } else {
      log(colors.yellow, '  ⚠ Paystack secret key not configured');
    }
  } catch (error) {
    log(colors.red, '  ✗ Paystack check error: ' + error.message);
    results.errors.push({ check: 'paystack', error: error.message });
  }

  // 3.2 Embedly
  try {
    log(colors.blue, '\n💰 Checking Embedly checkout wallet...');

    const { data: order } = await supabase
      .from('orders')
      .select('checkout_ref, payment_gateway')
      .eq('order_number', ORDER_NUMBER)
      .single();

    if (order?.checkout_ref && order.payment_gateway === 'embedly') {
      log(colors.yellow, `  Checkout Ref: ${order.checkout_ref}`);
      log(colors.yellow, '  → Check Embedly dashboard for transaction details');
      log(colors.yellow, '  → May contain order metadata');
    }
  } catch (error) {
    // Skip
  }

  // ============================================================
  // 4. EMAIL SERVICE LOGS
  // ============================================================
  section('4. EMAIL SERVICE LOGS (Resend)');

  try {
    log(colors.blue, '📨 Checking email service...');
    log(colors.yellow, '  Manual check required:');
    log(colors.yellow, '  1. Go to: https://resend.com/emails');
    log(colors.yellow, `  2. Search for: ${ORDER_EMAIL}`);
    log(colors.yellow, `  3. Look for order confirmation email sent on 2026-02-13`);
    log(colors.yellow, '  4. Check if email body includes cart items with notes');
    log(colors.yellow, '\n  Note: Current email template does NOT include cart items');
    log(colors.yellow, '  But check anyway in case it was changed or customized');
  } catch (error) {
    // Skip
  }

  // ============================================================
  // 5. SMS SERVICE LOGS
  // ============================================================
  section('5. SMS SERVICE LOGS (Termii)');

  try {
    log(colors.blue, '📱 Checking SMS service...');
    log(colors.yellow, '  Manual check required:');
    log(colors.yellow, '  1. Go to Termii dashboard');
    log(colors.yellow, `  2. Search for messages to: ${ORDER_PHONE}`);
    log(colors.yellow, '  3. Check message content for order details');
    log(colors.yellow, '\n  Note: SMS usually only contains basic info');
    log(colors.yellow, '  Unlikely to have notes, but worth checking');
  } catch (error) {
    // Skip
  }

  // ============================================================
  // 6. WEBHOOK RECEIVER LOGS
  // ============================================================
  section('6. WEBHOOK RECEIVER LOGS (n8n)');

  try {
    log(colors.blue, '🔗 Checking webhook logs...');
    log(colors.yellow, '  Manual check required:');
    log(colors.yellow, '  1. Access n8n dashboard if configured');
    log(colors.yellow, '  2. Check workflow execution history for 2026-02-13');
    log(colors.yellow, '  3. Look for order creation webhooks');
    log(colors.yellow, '  4. Check payload data for cart items');
  } catch (error) {
    // Skip
  }

  // ============================================================
  // 7. DATABASE BACKUPS
  // ============================================================
  section('7. DATABASE BACKUPS');

  try {
    log(colors.blue, '💾 Database backup check...');
    log(colors.yellow, '  Manual check required:');
    log(colors.yellow, '  1. Check if Supabase automatic backups are enabled');
    log(colors.yellow, '  2. Go to Supabase Dashboard → Database → Backups');
    log(colors.yellow, '  3. Look for backup from 2026-02-13 10:11:03 (before order)');
    log(colors.yellow, '  4. Restore to temporary database and query');
    log(colors.yellow, '\n  Note: Backups won\'t help - bug existed before order');
  } catch (error) {
    // Skip
  }

  // ============================================================
  // 8. BROWSER SOURCES (Customer-side)
  // ============================================================
  section('8. BROWSER-SIDE DATA (Customer Must Check)');

  log(colors.yellow, '  Customer must check on their device:');
  console.log('');
  log(colors.cyan, '  Option 1: Check localStorage');
  log(colors.yellow, '    → Visit: https://www.wingside.ng/check-cart.html');
  log(colors.yellow, '    → In the SAME browser used for order');
  console.log('');
  log(colors.cyan, '  Option 2: Check sessionStorage');
  log(colors.yellow, '    → Press F12 → Application tab');
  log(colors.yellow, '    → Session Storage → wingside.ng');
  log(colors.yellow, '    → Look for: wingside-cart, checkout-data, etc.');
  console.log('');
  log(colors.cyan, '  Option 3: Check IndexedDB');
  log(colors.yellow, '    → Press F12 → Application tab');
  log(colors.yellow, '    → IndexedDB → Check for any Wingside databases');
  console.log('');
  log(colors.cyan, '  Option 4: Browser Network History');
  log(colors.yellow, '    → If DevTools was open during order:');
  log(colors.yellow, '    → F12 → Network tab → Look for POST to /api/orders');
  log(colors.yellow, '    → Check request payload for notes');
  console.log('');
  log(colors.cyan, '  Option 5: Browser History/Cache');
  log(colors.yellow, '    → Check browser history for checkout page');
  log(colors.yellow, '    → If cached, may contain form data');

  // ============================================================
  // 9. ANALYTICS TOOLS
  // ============================================================
  section('9. ANALYTICS TOOLS');

  try {
    log(colors.blue, '📊 Analytics data...');
    log(colors.yellow, '  Manual check required:');
    log(colors.yellow, '  1. Google Analytics (if configured)');
    log(colors.yellow, '  2. Check events for "purchase" or "checkout"');
    log(colors.yellow, '  3. Custom dimensions may include order data');
    log(colors.yellow, '\n  Note: Unlikely to have notes, but check custom events');
  } catch (error) {
    // Skip
  }

  // ============================================================
  // 10. CDN/PROXY LOGS
  // ============================================================
  section('10. CDN/PROXY LOGS');

  try {
    log(colors.blue, '🌐 CDN/Proxy logs...');
    log(colors.yellow, '  Manual check required:');
    log(colors.yellow, '  1. Cloudflare logs (if using Cloudflare)');
    log(colors.yellow, '  2. Vercel logs (if deployed on Vercel)');
    log(colors.yellow, '  3. Search for POST to /api/orders on 2026-02-13');
    log(colors.yellow, '  4. Check if request body is logged');
    log(colors.yellow, '\n  Note: Most CDNs don\'t log POST bodies for privacy');
  } catch (error) {
    // Skip
  }

  // ============================================================
  // SUMMARY
  // ============================================================
  section('RECOVERY SUMMARY');

  if (results.found.length > 0) {
    log(colors.green, `✓ Found ${results.found.length} potential data source(s):\n`);
    results.found.forEach((item, idx) => {
      console.log(`  ${idx + 1}. ${item.location}`);
      if (item.product) console.log(`     Product: ${item.product}`);
      if (typeof item.data === 'string') {
        console.log(`     Data: ${item.data.substring(0, 100)}...`);
      }
    });
  } else {
    log(colors.red, '✗ No notes found in automated checks');
  }

  if (results.notFound.length > 0) {
    log(colors.yellow, `\n⚠ Checked but not found in:\n`);
    results.notFound.forEach(location => {
      console.log(`  - ${location}`);
    });
  }

  if (results.errors.length > 0) {
    log(colors.red, `\n✗ Errors encountered:\n`);
    results.errors.forEach(err => {
      console.log(`  ${err.check}: ${err.error}`);
    });
  }

  console.log('\n' + '='.repeat(60));
  log(colors.bright + colors.magenta, '  NEXT STEPS');
  console.log('='.repeat(60) + '\n');

  log(colors.cyan, '1. Contact customer immediately:');
  log(colors.yellow, `   → Call/WhatsApp: ${ORDER_PHONE}`);
  log(colors.yellow, `   → Email: ${ORDER_EMAIL}`);
  log(colors.yellow, '   → Ask them to visit: https://www.wingside.ng/check-cart.html');

  log(colors.cyan, '\n2. Check manual sources:');
  log(colors.yellow, '   → Resend dashboard for email logs');
  log(colors.yellow, '   → Termii dashboard for SMS logs');
  log(colors.yellow, '   → Supabase dashboard query logs');
  log(colors.yellow, '   → Vercel/hosting logs if applicable');

  log(colors.cyan, '\n3. If all fails:');
  log(colors.yellow, '   → Fulfill order without card');
  log(colors.yellow, '   → Contact customer for message');
  log(colors.yellow, '   → Offer refund for card (₦3,000)');
  log(colors.yellow, '   → Apologize and offer discount on next order');

  console.log('\n');
}

main().catch(console.error);
