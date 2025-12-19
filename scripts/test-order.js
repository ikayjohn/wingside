const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function testOrder() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  console.log('🧪 Testing order creation...\n')

  // Test order data
  const orderData = {
    order_number: `TEST-${Date.now()}`,
    user_id: null, // Guest order
    customer_name: 'Test User',
    customer_email: 'test@example.com',
    customer_phone: '+234XXXXXXXXXX',
    delivery_address_text: 'Test Address, Port Harcourt',
    status: 'pending',
    payment_status: 'pending',
    payment_method: 'card',
    subtotal: 5000,
    delivery_fee: 1000,
    tax: 375,
    total: 6375
  }

  // Create test order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert(orderData)
    .select()
    .single()

  if (orderError) {
    console.error('❌ Failed to create order:', orderError.message)
    return
  }

  console.log('✅ Order created:', order.id)

  // Test order items
  const orderItems = [{
    order_id: order.id,
    product_id: null,
    product_name: 'Test Wings',
    product_size: 'Regular',
    flavors: ['BBQ Rush'],
    addons: null,
    quantity: 1,
    unit_price: 5000,
    total_price: 5000
  }]

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems)

  if (itemsError) {
    console.error('❌ Failed to create order items:', itemsError.message)
    console.error('   Code:', itemsError.code)
    console.error('   Details:', itemsError.details)

    // Clean up failed order
    await supabase.from('orders').delete().eq('id', order.id)
    return
  }

  console.log('✅ Order items created successfully!')
  console.log('\n🎉 Order creation test PASSED!')
  console.log('   The RLS policy fix is working correctly.\n')

  // Clean up test order
  console.log('🧹 Cleaning up test order...')
  await supabase.from('orders').delete().eq('id', order.id)
  console.log('✅ Test order cleaned up\n')
}

testOrder().catch(console.error)
