const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function addSampleCustomer() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  // Use service role to bypass RLS
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  console.log('🧪 Creating sample customer...\n')

  try {
    // 1. Check if demo customer already exists
    let { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'demo.customer@wingside.ng')
      .single()

    let customerId

    if (profile) {
      console.log('⚠️  Demo customer already exists, updating...')
      // Update existing profile with integration data
      const { data: updatedProfile } = await supabase
        .from('profiles')
        .update({
          full_name: 'Chinedu Okafor',
          phone: '+234 803 456 7890',
          zoho_contact_id: '5847693000000123456',
          embedly_customer_id: 'emb_cust_abc123xyz',
          embedly_wallet_id: 'emb_wallet_xyz789',
          wallet_balance: 2500,
        })
        .eq('email', 'demo.customer@wingside.ng')
        .select()
        .single()

      customerId = updatedProfile?.id || profile.id
      console.log('✅ Sample customer updated:', updatedProfile?.email || profile.email)
    } else {
      // Create auth user first
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: 'demo.customer@wingside.ng',
        password: 'Demo123456!',
        email_confirm: true,
        user_metadata: {
          full_name: 'Chinedu Okafor',
        }
      })

      if (authError) {
        console.error('❌ Failed to create auth user:', authError.message)
        throw authError
      }

      customerId = authUser.user.id

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: customerId,
          email: 'demo.customer@wingside.ng',
          full_name: 'Chinedu Okafor',
          phone: '+234 803 456 7890',
          role: 'customer',
          zoho_contact_id: '5847693000000123456',
          embedly_customer_id: 'emb_cust_abc123xyz',
          embedly_wallet_id: 'emb_wallet_xyz789',
          wallet_balance: 2500,
        })

      if (profileError && profileError.code !== '23505') {
        console.error('❌ Failed to create profile:', profileError.message)
      } else {
        console.log('✅ Sample customer created: demo.customer@wingside.ng')
      }
    }

    // 2. Add default address
    const { error: addressError } = await supabase
      .from('addresses')
      .upsert({
        user_id: customerId,
        label: 'Home',
        street_address: '15 Ada George Road',
        city: 'Port Harcourt',
        state: 'Rivers',
        postal_code: '500001',
        is_default: true,
      }, {
        onConflict: 'user_id,label'
      })

    if (!addressError) {
      console.log('✅ Address added')
    }

    // 3. Create sample orders
    const sampleOrders = [
      {
        order_number: 'WS20251219001',
        user_id: customerId,
        customer_name: 'Chinedu Okafor',
        customer_email: 'demo.customer@wingside.ng',
        customer_phone: '+234 803 456 7890',
        delivery_address_text: '15 Ada George Road, Port Harcourt, Rivers',
        status: 'delivered',
        payment_status: 'paid',
        payment_method: 'card',
        payment_reference: 'pay_test_123456',
        subtotal: 15000,
        delivery_fee: 1000,
        tax: 1125,
        total: 17125,
        source: 'online',
        zoho_deal_id: '5847693000000987654',
        paid_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        order_number: 'WS20251219002',
        user_id: customerId,
        customer_name: 'Chinedu Okafor',
        customer_email: 'demo.customer@wingside.ng',
        customer_phone: '+234 803 456 7890',
        delivery_address_text: '15 Ada George Road, Port Harcourt, Rivers',
        status: 'confirmed',
        payment_status: 'paid',
        payment_method: 'card',
        payment_reference: 'pay_test_789012',
        subtotal: 8500,
        delivery_fee: 1000,
        tax: 637.5,
        total: 10137.5,
        source: 'online',
        zoho_deal_id: '5847693000000987655',
        paid_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        order_number: 'WS20251219003',
        user_id: customerId,
        customer_name: 'Chinedu Okafor',
        customer_email: 'demo.customer@wingside.ng',
        customer_phone: '+234 803 456 7890',
        delivery_address_text: 'Pickup – Wingside, Autograph Mall',
        status: 'pending',
        payment_status: 'paid',
        payment_method: 'card',
        payment_reference: 'pay_test_345678',
        subtotal: 12000,
        delivery_fee: 0,
        tax: 900,
        total: 12900,
        source: 'online',
        paid_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
    ]

    for (const order of sampleOrders) {
      const { data: createdOrder, error: orderError } = await supabase
        .from('orders')
        .insert(order)
        .select()
        .single()

      if (orderError) {
        if (orderError.code === '23505') {
          console.log(`⚠️  Order ${order.order_number} already exists`)
        } else {
          console.error(`Error creating order ${order.order_number}:`, orderError.message)
        }
      } else {
        console.log(`✅ Order created: ${createdOrder.order_number}`)

        // Add order items
        const items = [
          {
            order_id: createdOrder.id,
            product_name: '12 Wings Pack',
            product_size: 'Regular',
            flavors: ['BBQ Rush', 'Mango Heat'],
            quantity: 1,
            unit_price: order.subtotal / 2,
            total_price: order.subtotal / 2,
          },
          {
            order_id: createdOrder.id,
            product_name: 'Coleslaw',
            product_size: 'Regular',
            quantity: 2,
            unit_price: order.subtotal / 4,
            total_price: order.subtotal / 2,
          },
        ]

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(items)

        if (!itemsError) {
          console.log(`   ↳ Added ${items.length} items to order`)
        }
      }
    }

    console.log('\n🎉 Sample customer setup complete!')
    console.log('\n📊 Customer Details:')
    console.log('   Email: demo.customer@wingside.ng')
    console.log('   Name: Chinedu Okafor')
    console.log('   Phone: +234 803 456 7890')
    console.log('   Zoho Contact ID: 5847693000000123456')
    console.log('   Embedly Customer ID: emb_cust_abc123xyz')
    console.log('   Embedly Wallet ID: emb_wallet_xyz789')
    console.log('   Loyalty Points: 2,500 pts')
    console.log('   Total Orders: 3')
    console.log('   Total Spent: ₦40,162.50')
    console.log('\n🔗 View in Admin: http://localhost:3000/admin/customers')

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

addSampleCustomer()
