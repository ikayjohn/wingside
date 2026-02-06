#!/usr/bin/env node

/**
 * Test script to verify Nomba callback fixes
 *
 * This script tests:
 * 1. Abandoned payment detection in callback
 * 2. Order status update API
 * 3. Nomba verify endpoint behavior
 */

const testOrderId = '55340bc9-fb2d-4df2-a6e5-8be1c7742d63'; // Order WS202602040093

async function runTests() {
  console.log('🧪 Testing Nomba Callback Fixes\n');
  console.log('='.repeat(60));

  // Test 1: Get order details
  console.log('\n📋 Test 1: Fetch order details');
  const orderResponse = await fetch(`http://localhost:3000/api/orders/${testOrderId}`);
  const orderData = await orderResponse.json();

  if (orderData.order) {
    console.log('✅ Order found:', {
      orderNumber: orderData.order.order_number,
      paymentStatus: orderData.order.payment_status,
      status: orderData.order.status,
    });
  } else {
    console.log('❌ Order not found');
  }

  // Test 2: Update order to abandoned status
  console.log('\n🔧 Test 2: Mark order as abandoned');
  const patchResponse = await fetch(`http://localhost:3000/api/orders/${testOrderId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: 'cancelled',
      payment_status: 'abandoned'
    })
  });
  const patchData = await patchResponse.json();

  if (patchResponse.ok) {
    console.log('✅ Order updated to abandoned:', {
      orderNumber: patchData.order.order_number,
      paymentStatus: patchData.order.payment_status,
      status: patchData.order.status,
    });
  } else {
    console.log('❌ Failed to update order:', patchData);
  }

  // Test 3: Verify Nomba transaction (should return "not found")
  console.log('\n🔍 Test 3: Verify Nomba transaction');
  const verifyResponse = await fetch('http://localhost:3000/api/payment/nomba/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      transactionRef: 'WS-WS202602040093-1770215087530'
    })
  });
  const verifyData = await verifyResponse.json();

  if (verifyData.error?.includes('not found')) {
    console.log('✅ Correctly detects abandoned payment:', verifyData.error);
  } else {
    console.log('⚠️  Unexpected verify response:', verifyData);
  }

  // Test 4: Get debug info
  console.log('\n🔍 Test 4: Get debug info');
  const debugResponse = await fetch(`http://localhost:3000/api/debug/nomba-order?orderId=${testOrderId}`);
  const debugData = await debugResponse.json();

  if (debugData.success) {
    console.log('✅ Debug info retrieved');
    console.log('   Recommendation:', debugData.diagnostics.recommendation);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ All tests completed!\n');

  console.log('Next steps:');
  console.log('1. Run the SQL migration to add "abandoned" status');
  console.log('2. Test the callback page with a real abandoned payment');
  console.log('3. Set up order expiration cron job (optional)\n');
}

runTests().catch(console.error);
