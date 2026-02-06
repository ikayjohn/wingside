#!/usr/bin/env node

/**
 * Test Nomba verification for a specific order
 * Helps diagnose callback verification errors
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// CHANGE THIS to your actual order ID that's having issues
const ORDER_ID = process.argv[2] || 'your-order-id-here';

async function testVerification() {
  console.log('🔍 Testing Nomba verification for order:', ORDER_ID);
  console.log('📍 Base URL:', BASE_URL);
  console.log('='.repeat(60));

  // Step 1: Get order details
  console.log('\n📋 Step 1: Fetching order details...');
  const orderRes = await fetch(`${BASE_URL}/api/orders/${ORDER_ID}`);

  if (!orderRes.ok) {
    console.error('❌ Failed to fetch order:', orderRes.status, orderRes.statusText);
    return;
  }

  const orderData = await orderRes.json();

  if (!orderData.order) {
    console.error('❌ Order not found in response');
    return;
  }

  const order = orderData.order;
  console.log('✅ Order found:', {
    order_number: order.order_number,
    payment_reference: order.payment_reference,
    payment_status: order.payment_status,
    payment_gateway: order.payment_gateway,
    status: order.status,
    total: order.total
  });

  // Step 2: Check if payment reference exists
  console.log('\n🔍 Step 2: Checking payment reference...');
  if (!order.payment_reference) {
    console.error('❌ No payment reference - payment was never initialized');
    console.log('\n📋 DIAGNOSIS:');
    console.log('- Payment initialization failed');
    console.log('- Order was created but payment not started');
    console.log('- Check logs for errors during payment initialization');
    return;
  }

  console.log('✅ Payment reference exists:', order.payment_reference);

  // Step 3: Check if already paid
  if (order.payment_status === 'paid') {
    console.log('\n✅ Order is already paid!');
    console.log('Paid at:', order.paid_at);
    console.log('No verification needed - webhook already processed.');
    return;
  }

  // Step 4: Try to verify with Nomba
  console.log('\n🔍 Step 3: Verifying with Nomba API...');
  console.log('Transaction reference:', order.payment_reference);

  const verifyRes = await fetch(`${BASE_URL}/api/payment/nomba/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transactionRef: order.payment_reference })
  });

  const verifyData = await verifyRes.json();

  console.log('Nomba verification response:', JSON.stringify(verifyData, null, 2));

  // Step 5: Interpret results
  console.log('\n📊 Step 4: Analysis...');
  console.log('='.repeat(60));

  if (verifyData.success) {
    console.log('✅ Payment verified in Nomba!');
    console.log('Status:', verifyData.status);
    console.log('Amount:', verifyData.amount);
    console.log('Reference:', verifyData.reference);

    if (order.payment_status !== 'paid') {
      console.log('\n⚠️  BUT order is not marked as paid in database!');
      console.log('\n📋 DIAGNOSIS: Webhook was not received');
      console.log('\nPossible causes:');
      console.log('1. Webhook URL not registered in Nomba dashboard');
      console.log('2. Webhook signature verification failing');
      console.log('3. Webhook endpoint unreachable from Nomba servers');
      console.log('4. Webhook processing had an error');

      console.log('\n💡 SOLUTION:');
      console.log('Use the webhook-test endpoint to manually process:');
      console.log(`\ncurl -X POST ${BASE_URL}/api/payment/nomba/webhook-test \\`);
      console.log(`  -H "Content-Type: application/json" \\`);
      console.log(`  -d '{"orderReference": "${order.payment_reference}"}'`);
    }
  } else {
    console.error('❌ Verification failed');
    console.error('Error:', verifyData.error);
    console.error('Code:', verifyData.code);

    if (verifyData.error?.includes('not found') || verifyData.code === '404') {
      console.log('\n📋 DIAGNOSIS: Transaction not found in Nomba');
      console.log('\nPossible causes:');
      console.log('1. ❌ Customer abandoned payment (never completed on Nomba page)');
      console.log('2. ❌ Using wrong credentials (sandbox vs production mismatch)');
      console.log('3. ❌ Payment reference format incorrect');
      console.log('4. ❌ Transaction ID mismatch');

      console.log('\n💡 RECOMMENDED ACTION:');
      console.log('1. Check Nomba dashboard for this payment reference');
      console.log('2. If NOT in dashboard:');
      console.log('   → Customer abandoned payment');
      console.log('   → Mark order as abandoned in database');
      console.log('\n3. If IN dashboard:');
      console.log('   → Credentials mismatch (check environment variables)');
      console.log('   → Ensure using same environment (sandbox or production)');

      console.log('\n🛠️  Quick fix - Mark as abandoned:');
      console.log(`UPDATE orders SET status='cancelled', payment_status='abandoned' WHERE id='${order.id}';`);

    } else if (verifyData.error?.includes('credentials') || verifyData.error?.includes('authentication')) {
      console.log('\n📋 DIAGNOSIS: Authentication error');
      console.log('\nPossible causes:');
      console.log('1. ❌ NOMBA_CLIENT_ID incorrect');
      console.log('2. ❌ NOMBA_CLIENT_SECRET incorrect');
      console.log('3. ❌ NOMBA_ACCOUNT_ID incorrect');
      console.log('4. ❌ Credentials expired');

      console.log('\n💡 SOLUTION:');
      console.log('Check your environment variables:');
      console.log('- NOMBA_CLIENT_ID');
      console.log('- NOMBA_CLIENT_SECRET');
      console.log('- NOMBA_ACCOUNT_ID');
      console.log('- Ensure they match your Nomba dashboard');

    } else {
      console.error('\n📋 DIAGNOSIS: API error');
      console.log('Check server logs for more details');
      console.log('Error message:', verifyData.error);
      console.log('Details:', verifyData.details || 'None');

      console.log('\n💡 NEXT STEPS:');
      console.log('1. Check server logs for detailed error');
      console.log('2. Verify Nomba API credentials');
      console.log('3. Contact Nomba support if issue persists');
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Verification test complete');
  console.log('\n📚 For more help, see: WEBHOOK_PRODUCTION_DEBUG.md\n');
}

// Run the test
testVerification().catch(error => {
  console.error('\n❌ Test failed with error:');
  console.error(error);
  process.exit(1);
});
