const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkOrderStatus() {
  console.log('Checking order payment statuses...\n');

  // Get Mocha Badom's orders
  const { data: orders, error } = await supabase
    .from('orders')
    .select('order_number, total, payment_status, status, paid_at, created_at')
    .eq('user_id', '165d829b-a9b8-48ac-b82d-9d93bb2103c7')
    .order('created_at', { ascending: false });

  if (error) {
    console.log('Error:', error);
    return;
  }

  console.log(`=== Mocha Badom's Orders (${orders.length} total) ===\n`);

  let paidCount = 0;
  let confirmedNotPaidCount = 0;
  let pendingCount = 0;

  orders.forEach((order, i) => {
    const isPaid = order.payment_status === 'paid';
    const isConfirmed = order.status === 'confirmed';

    if (isPaid) paidCount++;
    else if (isConfirmed) confirmedNotPaidCount++;
    else pendingCount++;

    console.log(`${i + 1}. Order #${order.order_number}`);
    console.log(`   Total: ₦${Number(order.total).toLocaleString()}`);
    console.log(`   Status: ${order.status}`);
    console.log(`   Payment Status: ${order.payment_status}`);
    console.log(`   Paid At: ${order.paid_at || 'N/A'}`);
    console.log(`   ${isPaid ? '✅ PAID' : '❌ NOT PAID'}`);
    console.log();
  });

  console.log('=== Summary ===');
  console.log(`Total Orders: ${orders.length}`);
  console.log(`Paid (payment_status='paid'): ${paidCount}`);
  console.log(`Confirmed but not paid (status='confirmed'): ${confirmedNotPaidCount}`);
  console.log(`Pending: ${pendingCount}`);

  // Calculate totals
  const paidTotal = orders
    .filter(o => o.payment_status === 'paid')
    .reduce((sum, o) => sum + Number(o.total), 0);

  const confirmedTotal = orders
    .filter(o => o.status === 'confirmed')
    .reduce((sum, o) => sum + Number(o.total), 0);

  const allTotal = orders
    .reduce((sum, o) => sum + Number(o.total), 0);

  console.log(`\n=== Totals ===`);
  console.log(`Paid Orders Total: ₦${paidTotal.toLocaleString()}`);
  console.log(`Confirmed Orders Total: ₦${confirmedTotal.toLocaleString()}`);
  console.log(`All Orders Total: ₦${allTotal.toLocaleString()}`);
  console.log(`\nExpected Points (if all confirmed): ${Math.floor(confirmedTotal / 100)}`);
  console.log(`Expected Points (only paid): ${Math.floor(paidTotal / 100)}`);
}

checkOrderStatus().catch(err => {
  console.error('Error:', err);
});
