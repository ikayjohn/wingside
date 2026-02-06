import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import embedlyClient from '@/lib/embedly/client'

/**
 * POST /api/payment/embedly/initialize
 *
 * Initialize Embedly checkout wallet payment
 * Creates a temporary bank account for customer to transfer payment
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { order_id, customer_email, customer_name } = body

    // Validation
    if (!order_id) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Get order details
    const admin = createAdminClient()
    const { data: order, error: orderError } = await admin
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .single()

    if (orderError || !order) {
      console.error('[Embedly Initialize] Order not found:', order_id)
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    console.log('[Embedly Initialize] Processing order:', {
      orderNumber: order.order_number,
      total: order.total,
      customerEmail: order.customer_email,
    })

    // Check if order already has a checkout wallet
    if (order.payment_reference && order.payment_gateway === 'embedly') {
      console.log('[Embedly Initialize] Order already has checkout wallet:', order.payment_reference)

      // Verify if wallet is still active
      try {
        const walletStatus = await embedlyClient.checkCheckoutWalletStatus(order.payment_reference)

        if (walletStatus.status === 'Active') {
          console.log('[Embedly Initialize] Existing wallet still active')
          return NextResponse.json({
            success: true,
            alreadyCreated: true,
            walletId: order.payment_reference,
            checkoutRef: order.checkout_ref,
            message: 'Checkout wallet already exists and is active',
          })
        } else if (walletStatus.hasPayment) {
          console.log('[Embedly Initialize] Wallet already paid')
          return NextResponse.json({
            success: true,
            alreadyPaid: true,
            message: 'Payment already received for this order',
          })
        } else {
          console.log('[Embedly Initialize] Existing wallet expired, creating new one')
        }
      } catch (error) {
        console.error('[Embedly Initialize] Error checking existing wallet:', error)
        // Continue to create new wallet
      }
    }

    // Get organization prefix mapping
    console.log('[Embedly Initialize] Fetching organization prefix mappings...')
    const prefixMappings = await embedlyClient.getCheckoutWallets()

    // Find Wingside's prefix mapping
    // In production, you would cache this or get it from environment variables
    const orgPrefixMappingId = process.env.EMBEDLY_PREFIX_MAPPING_ID

    if (!orgPrefixMappingId) {
      console.error('[Embedly Initialize] EMBEDLY_PREFIX_MAPPING_ID not configured')
      return NextResponse.json(
        { error: 'Payment gateway not properly configured' },
        { status: 500 }
      )
    }

    // Convert amount to kobo (from naira)
    // order.total is in naira, multiply by 100 to get kobo
    const amountInKobo = Math.round(Number(order.total) * 100)

    console.log('[Embedly Initialize] Creating checkout wallet:', {
      amountInNaira: order.total,
      amountInKobo,
      orderNumber: order.order_number,
    })

    // Create checkout wallet
    const wallet = await embedlyClient.createCheckoutWallet({
      organizationId: process.env.EMBEDLY_ORG_ID!,
      expectedAmount: amountInKobo,
      organizationPrefixMappingId: orgPrefixMappingId,
      expiryDurationMinutes: 30, // 30 minutes expiry
      invoiceReference: order.order_number,
      description: `Wingside Order - ${order.order_number}`,
      currencyCode: 'NGN',
      customerEmail: order.customer_email,
      customerName: order.customer_name,
      metadata: JSON.stringify({
        orderId: order.id,
        orderNumber: order.order_number,
        customerEmail: order.customer_email,
      }),
    })

    console.log('[Embedly Initialize] ✅ Checkout wallet created:', {
      walletId: wallet.id,
      walletNumber: wallet.walletNumber,
      checkoutRef: wallet.checkoutRef,
      expiresAt: wallet.expiresAt,
    })

    // Update order with payment reference
    const { error: updateError } = await admin
      .from('orders')
      .update({
        payment_reference: wallet.id, // Use wallet ID as reference
        checkout_ref: wallet.checkoutRef,
        payment_gateway: 'embedly',
        payment_method: 'bank_transfer',
        updated_at: new Date().toISOString(),
      })
      .eq('id', order_id)

    if (updateError) {
      console.error('[Embedly Initialize] ❌ Failed to update order:', updateError)
      return NextResponse.json(
        { error: 'Failed to update order with payment details' },
        { status: 500 }
      )
    }

    console.log('[Embedly Initialize] ✅ Order updated with checkout wallet')

    return NextResponse.json({
      success: true,
      wallet: {
        id: wallet.id,
        walletNumber: wallet.walletNumber,
        accountNumber: wallet.walletNumber,
        bankName: 'Embedly',
        checkoutRef: wallet.checkoutRef,
        expectedAmount: Number(order.total),
        expiresAt: wallet.expiresAt,
        createdAt: wallet.createdAt,
        status: wallet.status,
      },
      order: {
        id: order.id,
        orderNumber: order.order_number,
        total: order.total,
      },
      instructions: {
        message: 'Transfer the exact amount to the account number below',
        accountNumber: wallet.walletNumber,
        bankName: 'Embedly',
        amount: `₦${Number(order.total).toLocaleString()}`,
        expiry: new Date(wallet.expiresAt).toLocaleTimeString('en-NG', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      },
    })
  } catch (error: unknown) {
    console.error('[Embedly Initialize] Error:', error)

    if (error instanceof Error) {
      // Check for specific error messages
      if (error.message.includes('401') || error.message.includes('403')) {
        return NextResponse.json(
          { error: 'Payment gateway authentication failed' },
          { status: 401 }
        )
      }

      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'Payment gateway configuration error' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      {
        error: 'Failed to initialize payment',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
