import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function insertSampleOrder() {
  console.log('Inserting sample order...\n')

  try {
    // Generate order number
    const orderNumber = `WS${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`

    // Get some products to use in the order
    const { data: products } = await supabase
      .from('products')
      .select('id, name')
      .in('name', ['Regular Pack', 'Bacon Coconut Rice', 'Café Latte'])
      .limit(3)

    if (!products || products.length === 0) {
      console.error('No products found. Please seed products first.')
      return
    }

    console.log(`Found ${products.length} products for the order\n`)

    // Create the order
    const orderData = {
      order_number: orderNumber,
      user_id: null, // Guest order
      customer_name: 'John Doe',
      customer_email: 'john.doe@example.com',
      customer_phone: '+234 801 234 5678',
      delivery_address_text: '123 Victoria Island, Lagos, Nigeria',
      status: 'pending',
      payment_status: 'pending',
      payment_method: 'card',
      subtotal: 23500,
      delivery_fee: 1500,
      tax: 0,
      total: 25000,
      notes: 'Please call when you arrive. Ring the bell twice.',
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single()

    if (orderError) {
      console.error('Error creating order:', orderError)
      return
    }

    console.log(`✅ Created order: ${order.order_number} (ID: ${order.id})`)

    // Create order items
    const orderItems = [
      {
        order_id: order.id,
        product_id: products.find(p => p.name === 'Regular Pack')?.id,
        product_name: 'Regular Pack',
        product_size: 'Regular',
        flavors: ['Buffalo', 'Lemon Pepper', 'Garlic Parmesan'],
        quantity: 2,
        unit_price: 8000,
        total_price: 16000,
      },
      {
        order_id: order.id,
        product_id: products.find(p => p.name === 'Bacon Coconut Rice')?.id,
        product_name: 'Bacon Coconut Rice',
        product_size: 'Regular',
        flavors: ['Regular'],
        quantity: 2,
        unit_price: 4000,
        total_price: 8000,
      },
      {
        order_id: order.id,
        product_id: products.find(p => p.name === 'Café Latte')?.id,
        product_name: 'Café Latte',
        product_size: 'Regular',
        flavors: ['Hot'],
        quantity: 1,
        unit_price: 4500,
        total_price: 4500,
      },
    ]

    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)
      .select()

    if (itemsError) {
      console.error('Error creating order items:', itemsError)
      return
    }

    console.log(`✅ Created ${items.length} order items:`)
    items.forEach((item: any) => {
      console.log(`   - ${item.quantity}x ${item.product_name} (${item.product_size}) - ₦${item.total_price.toLocaleString()}`)
      if (item.flavors && item.flavors.length > 0) {
        console.log(`     Flavors: ${item.flavors.join(', ')}`)
      }
    })

    console.log('\n--- Order Summary ---')
    console.log(`Order Number: ${order.order_number}`)
    console.log(`Customer: ${order.customer_name}`)
    console.log(`Phone: ${order.customer_phone}`)
    console.log(`Email: ${order.customer_email}`)
    console.log(`Address: ${order.delivery_address_text}`)
    console.log(`Status: ${order.status}`)
    console.log(`Payment: ${order.payment_status} (${order.payment_method})`)
    console.log(`Subtotal: ₦${order.subtotal.toLocaleString()}`)
    console.log(`Delivery Fee: ₦${order.delivery_fee.toLocaleString()}`)
    console.log(`Total: ₦${order.total.toLocaleString()}`)
    console.log(`Notes: ${order.notes}`)
    console.log('\n✅ Sample order inserted successfully!')

  } catch (error: any) {
    console.error('Unexpected error:', error.message)
  }
}

insertSampleOrder()
