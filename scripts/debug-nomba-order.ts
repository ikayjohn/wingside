import { createClient } from '@supabase/supabase-js'

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const nombaClientId = process.env.NOMBA_CLIENT_ID!
const nombaClientSecret = process.env.NOMBA_CLIENT_SECRET!
const nombaAccountId = process.env.NOMBA_ACCOUNT_ID!

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugNombaOrder(orderNumber: string) {
  console.log(`🔍 Debugging Nomba order: ${orderNumber}`)
  console.log('=' .repeat(60))

  // Step 1: Get order details
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('order_number', orderNumber)
    .single()

  if (orderError || !order) {
    console.error('❌ Order not found:', orderError)
    return
  }

  console.log('📋 Order Details:')
  console.log('  ID:', order.id)
  console.log('  Order Number:', order.order_number)
  console.log('  Payment Status:', order.payment_status)
  console.log('  Status:', order.status)
  console.log('  Payment Reference:', order.payment_reference)
  console.log('  Payment Gateway:', order.payment_gateway)
  console.log('  Total:', order.total)
  console.log('  Created At:', order.created_at)
  console.log('  Updated At:', order.updated_at)
  console.log('')

  // Step 2: Check Nomba transaction status
  if (order.payment_reference) {
    console.log('🔎 Checking Nomba transaction status...')

    try {
      // Get Nomba access token
      const authResponse = await fetch('https://api.nomba.com/v1/auth/token/issue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accountId': nombaAccountId,
        },
        body: JSON.stringify({
          grant_type: 'client_credentials',
          client_id: nombaClientId,
          client_secret: nombaClientSecret,
        }),
      })

      const authData = await authResponse.json()

      if (authData.code !== '00') {
        console.error('❌ Failed to authenticate with Nomba:', authData)
        return
      }

      const accessToken = authData.data.access_token
      console.log('✅ Authenticated with Nomba')

      // Verify transaction
      const verifyUrl = `https://api.nomba.com/v1/transactions/accounts/single?transactionRef=${encodeURIComponent(order.payment_reference)}`
      const verifyResponse = await fetch(verifyUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'accountId': nombaAccountId,
        },
      })

      const verifyData = await verifyResponse.json()

      console.log('📊 Nomba API Response:')
      console.log('  Code:', verifyData.code)
      console.log('  Description:', verifyData.description)
      console.log('  Transaction Status:', verifyData.data?.status)
      console.log('  Transaction Amount:', verifyData.data?.amount)
      console.log('  Transaction ID:', verifyData.data?.id)
      console.log('')

      // Step 3: Analyze the issue
      if (verifyData.code === '00' && verifyData.data) {
        const transaction = verifyData.data
        const SUCCESS_STATUSES = ['SUCCESS', 'PAYMENT_SUCCESSFUL']

        if (SUCCESS_STATUSES.includes(transaction.status.toUpperCase())) {
          console.log('✅ Transaction is SUCCESSFUL in Nomba!')
          console.log('')
          console.log('🔧 ISSUE: Payment succeeded but webhook did not update the order')
          console.log('')
          console.log('Possible causes:')
          console.log('  1. Webhook was not called by Nomba')
          console.log('  2. Webhook failed signature verification')
          console.log('  3. Webhook encountered an error during processing')
          console.log('  4. Webhook URL is misconfigured in Nomba dashboard')
          console.log('')
          console.log('🔧 FIX: Manually update order to paid status')

          // Update order
          const { error: updateError } = await supabase
            .from('orders')
            .update({
              payment_status: 'paid',
              status: 'confirmed',
              paid_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', order.id)

          if (updateError) {
            console.error('❌ Failed to update order:', updateError)
          } else {
            console.log('✅ Order updated successfully!')
            console.log(`   Order ${orderNumber} is now marked as PAID`)
          }
        } else if (transaction.status.toUpperCase() === 'PENDING') {
          console.log('⚠️  Transaction is still PENDING in Nomba')
          console.log('')
          console.log('This means:')
          console.log('  - Customer has not completed payment')
          console.log('  - Or payment is still being processed by Nomba')
          console.log('')
          console.log('🔧 RECOMMENDATION: Wait for webhook or contact Nomba support')
        } else {
          console.log('❌ Transaction failed with status:', transaction.status)
          console.log('')
          console.log('🔧 FIX: Update order to failed status')

          const { error: updateError } = await supabase
            .from('orders')
            .update({
              payment_status: 'failed',
              status: 'cancelled',
              updated_at: new Date().toISOString(),
            })
            .eq('id', order.id)

          if (updateError) {
            console.error('❌ Failed to update order:', updateError)
          } else {
            console.log('✅ Order marked as failed')
          }
        }
      } else if (verifyData.code === 'Transaction not found') {
        console.log('❌ Transaction not found in Nomba')
        console.log('')
        console.log('This means:')
        console.log('  - Payment reference may be incorrect')
        console.log('  - Transaction was never created')
        console.log('  - Transaction expired')
      }
    } catch (error) {
      console.error('❌ Error verifying transaction:', error)
    }
  } else {
    console.log('⚠️  No payment reference found - payment was not initialized properly')
  }

  console.log('')
  console.log('=' .repeat(60))
}

// Run with the order number
const orderNumber = process.argv[2] || 'WS202602040093'
debugNombaOrder(orderNumber)
