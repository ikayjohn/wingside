import { createAdminClient } from '@/lib/supabase/admin'

async function checkOrders() {
  const admin = createAdminClient()

  // Get recent orders
  const { data: orders, error } = await admin
    .from('orders')
    .select('id, order_number, payment_status, status, payment_reference, total, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) {
    console.error('Error fetching orders:', error)
    return
  }

  console.log('\n=== Recent Orders ===\n')
  orders.forEach((order, i) => {
    console.log(`${i + 1}. Order ID: ${order.id}`)
    console.log(`   Order Number: ${order.order_number}`)
    console.log(`   Payment Status: ${order.payment_status}`)
    console.log(`   Order Status: ${order.status}`)
    console.log(`   Payment Reference: ${order.payment_reference || 'None'}`)
    console.log(`   Total: ₦${order.total}`)
    console.log(`   Created: ${order.created_at}`)
    console.log('')
  })

  // Check for orders with payment_reference but not paid
  const { data: unpaidOrders } = await admin
    .from('orders')
    .select('id, order_number, payment_reference')
    .not('payment_reference', 'is', null)
    .eq('payment_status', 'pending')
    .limit(3)

  if (unpaidOrders && unpaidOrders.length > 0) {
    console.log('\n=== Orders with Payment Reference (but unpaid) ===\n')
    unpaidOrders.forEach((order, i) => {
      console.log(`${i + 1}. ${order.order_number}: ${order.id}`)
      console.log(`   Reference: ${order.payment_reference}`)
      console.log(`   Test URL: https://wingside.ng/payment/nomba/callback?order_id=${order.id}`)
      console.log('')
    })
  }
}

checkOrders()
  .then(() => {
    console.log('Done!')
    process.exit(0)
  })
  .catch((err) => {
    console.error('Error:', err)
    process.exit(1)
  })
