// Test script to check if order exists and debug lookup
// Run this in browser console on your VPS or locally

const orderNumber = 'WS202601180030';

// Test API directly
fetch(`https://wingside.ng/api/orders/${orderNumber}`)
  .then(res => {
    console.log('Status:', res.status);
    return res.json();
  })
  .then(data => {
    console.log('Response:', data);
    if (data.order) {
      console.log('✅ Order found!');
      console.log('Payment Status:', data.order.payment_status);
      console.log('Order Status:', data.order.status);
      console.log('Payment Reference:', data.order.payment_reference);
    } else {
      console.log('❌ Order not found or error:', data.error);
    }
  })
  .catch(err => {
    console.error('❌ Network error:', err);
  });
