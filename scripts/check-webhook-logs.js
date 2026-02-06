#!/usr/bin/env node

/**
 * Check webhook processing logs for recent Nomba orders
 * This helps identify if webhooks are being received but failing
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function checkWebhookLogs() {
  console.log('🔍 Checking recent Nomba webhook activity...\n');
  console.log('='.repeat(70));

  // Check recent Nomba orders
  console.log('\n📋 Recent Nomba orders (last 24 hours):\n');

  try {
    // Note: You'll need to implement a query endpoint or check directly in Supabase
    console.log('To check webhook logs, run this query in Supabase SQL Editor:\n');

    console.log(`
-- Check recent Nomba orders and their status
SELECT
  order_number,
  payment_reference,
  payment_status,
  status,
  paid_at,
  created_at,
  EXTRACT(EPOCH FROM (NOW() - created_at))/60 as minutes_since_creation,
  EXTRACT(EPOCH FROM (paid_at - created_at)) as seconds_to_payment
FROM orders
WHERE payment_gateway = 'nomba'
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 20;
    `);

    console.log('\n' + '='.repeat(70));
    console.log('\n📊 Analysis Guide:\n');
    console.log('✅ If paid_at exists: Webhook was received and processed');
    console.log('⏱️  If seconds_to_payment < 10: Webhook is fast (good!)');
    console.log('⏱️  If seconds_to_payment > 60: Webhook delayed (investigate)');
    console.log('❌ If payment_status = pending > 5 min: Webhook NOT received');

    console.log('\n' + '='.repeat(70));
    console.log('\n🔍 Check Server Logs:\n');

    console.log('Look for these patterns in your server logs:\n');

    console.log('✅ WEBHOOK RECEIVED:');
    console.log('   "Nomba webhook event: payment_success"');
    console.log('   "Order [ORDER_NUM] payment confirmed via Nomba webhook"\n');

    console.log('❌ SIGNATURE FAILED:');
    console.log('   "❌ Invalid Nomba webhook signature"');
    console.log('   "Invalid webhook signature"\n');

    console.log('❌ PROCESSING FAILED:');
    console.log('   "Error updating order from webhook"');
    console.log('   "Nomba webhook processing error"\n');

    console.log('⚠️  VALIDATION TEST:');
    console.log('   "🔍 Nomba webhook validation test detected"');
    console.log('   (This is OK - just Nomba testing the endpoint)\n');

    console.log('='.repeat(70));
    console.log('\n🛠️  Debugging Commands:\n');

    console.log('# Check if webhook endpoint is accessible:');
    console.log(`curl -X POST ${BASE_URL.replace('http://localhost:3000', 'https://www.wingside.ng')}/api/payment/nomba/webhook \\`);
    console.log('  -H "Content-Type: application/json" \\');
    console.log('  -d \'{"event_type":"test","requestId":"manual-test","data":{}}\'');
    console.log('');

    console.log('# Check environment variables (in server):');
    console.log('echo "NOMBA_WEBHOOK_SECRET set: $([ -n \\"$NOMBA_WEBHOOK_SECRET\\" ] && echo YES || echo NO)"');
    console.log('echo "NOMBA_WEBHOOK_BYPASS_VERIFICATION: $NOMBA_WEBHOOK_BYPASS_VERIFICATION"');
    console.log('');

    console.log('# View recent server logs (adjust path as needed):');
    console.log('tail -n 100 /var/log/your-app.log | grep -i "nomba\\|webhook"');
    console.log('# OR if using PM2:');
    console.log('pm2 logs --lines 100 | grep -i "nomba\\|webhook"');
    console.log('');

    console.log('='.repeat(70));
    console.log('\n🎯 Most Likely Issues (since webhook is registered):\n');

    console.log('1️⃣  SIGNATURE VERIFICATION FAILING');
    console.log('   Problem: Webhook arrives but signature doesn\'t match');
    console.log('   Symptoms: Server logs show "Invalid webhook signature"');
    console.log('   Solution: Check NOMBA_WEBHOOK_SECRET matches dashboard\n');

    console.log('2️⃣  WEBHOOK ARRIVES BUT PROCESSING FAILS');
    console.log('   Problem: Webhook received but order update fails');
    console.log('   Symptoms: Logs show webhook received but errors after');
    console.log('   Solution: Check database permissions, RLS policies\n');

    console.log('3️⃣  CALLBACK PAGE TIMING ISSUE');
    console.log('   Problem: Callback checks before webhook processes');
    console.log('   Symptoms: Order eventually becomes paid, but callback shows error');
    console.log('   Solution: Increase callback polling time or fix callback logic\n');

    console.log('4️⃣  WRONG WEBHOOK SECRET');
    console.log('   Problem: Production using .env.local secret instead of production');
    console.log('   Symptoms: Works locally, fails in production');
    console.log('   Solution: Verify production env vars\n');

    console.log('='.repeat(70));
    console.log('\n📝 Next Steps:\n');

    console.log('1. Run the Supabase query above to check order statuses');
    console.log('2. Check your server logs for webhook activity');
    console.log('3. Test webhook endpoint accessibility');
    console.log('4. Run: node scripts/test-webhook-signature.js (if issues with signature)');
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkWebhookLogs();
