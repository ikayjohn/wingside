const orderNumber = 'WS202602040093';

async function debugAndFix() {
  // Step 1: Get order details
  console.log('Step 1: Fetching order details...');
  const orderResponse = await fetch(`http://localhost:3000/api/orders/by-number/${orderNumber}`);
  const orderData = await orderResponse.json();

  if (!orderData.orders || orderData.orders.length === 0) {
    console.error('Order not found');
    return;
  }

  const order = orderData.orders[0];
  console.log('Order found:', {
    id: order.id,
    orderNumber: order.order_number,
    paymentStatus: order.payment_status,
    paymentReference: order.payment_reference,
    paymentGateway: order.payment_gateway,
  });

  // Step 2: Verify Nomba transaction
  console.log('\nStep 2: Verifying Nomba transaction...');
  const verifyResponse = await fetch('http://localhost:3000/api/payment/nomba/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transactionRef: order.payment_reference })
  });
  const verifyData = await verifyResponse.json();
  console.log('Verify response:', verifyData);

  // Step 3: Check if we need to manually fix
  if (order.payment_status !== 'paid' && verifyData.success) {
    console.log('\n❌ ISSUE DETECTED: Payment successful in Nomba but order not updated!');
    console.log('This means the webhook did not process the payment.');

    // The verify endpoint should have already updated the order
    // Let's check if it worked
    const checkResponse = await fetch(`http://localhost:3000/api/orders/get-by-order-number?orderNumber=${orderNumber}`);
    const checkData = await checkResponse.json();

    if (checkData.order?.payment_status === 'paid') {
      console.log('✅ FIXED: Order has been updated to paid status!');
    } else {
      console.log('⚠️  Verify endpoint did not update the order. Manual intervention required.');
    }
  } else if (order.payment_status === 'paid') {
    console.log('\n✅ Order is already paid - no action needed');
  } else {
    console.log('\n⚠️  Payment verification failed. Manual check required.');
    console.log('Possible issues:');
    console.log('- Transaction is still pending in Nomba');
    console.log('- Transaction failed');
    console.log('- Invalid payment reference');
  }
}

debugAndFix().catch(console.error);
