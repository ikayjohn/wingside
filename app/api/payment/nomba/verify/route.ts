import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendPaymentConfirmation } from '@/lib/emails/service'

interface NombaVerifyResponse {
  code: string
  description: string
  data?: {
    id: string
    status: string
    amount: number
    timeCreated: string
    type: string
    merchantTxRef?: string
    gatewayMessage?: string
  }
}

// POST /api/payment/nomba/verify - Verify Nomba transaction
export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.error('JSON parse error:', error);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    const { transactionRef } = body

    if (!transactionRef) {
      return NextResponse.json(
        { error: 'Transaction reference is required' },
        { status: 400 }
      )
    }

    // Get Nomba credentials
    const clientId = process.env.NOMBA_CLIENT_ID
    const clientSecret = process.env.NOMBA_CLIENT_SECRET
    const accountId = process.env.NOMBA_ACCOUNT_ID

    if (!clientId || !clientSecret || !accountId) {
      console.error('Nomba credentials not configured')
      return NextResponse.json(
        { error: 'Payment gateway not configured' },
        { status: 500 }
      )
    }

    // Get access token
    const authResponse = await fetch('https://api.nomba.com/v1/auth/token/issue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'accountId': accountId,
      },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      }),
    })

    const authData = await authResponse.json()

    if (authData.code !== '00' || !authData.data?.access_token) {
      return NextResponse.json(
        { error: 'Failed to authenticate with payment gateway' },
        { status: 500 }
      )
    }

    const accessToken = authData.data.access_token

    // Verify transaction using GET endpoint for single transaction lookup
    // Official API: GET /v1/transactions/accounts/single?transactionRef={ref}
    const verifyUrl = `https://api.nomba.com/v1/transactions/accounts/single?transactionRef=${encodeURIComponent(transactionRef)}`
    console.log('[Nomba Verify] Fetching transaction from:', verifyUrl)

    const verifyResponse = await fetch(verifyUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'accountId': accountId,
      },
    })

    const verifyData: NombaVerifyResponse = await verifyResponse.json()

    console.log('[Nomba Verify] API Response:', {
      code: verifyData.code,
      description: verifyData.description,
      transactionRef,
      hasData: !!verifyData.data
    })

    if (verifyData.code !== '00') {
      console.error('[Nomba Verify] ❌ Verification failed:', verifyData)
      return NextResponse.json(
        {
          success: false,
          error: verifyData.description || 'Failed to verify transaction',
          details: verifyData
        },
        { status: 500 }
      )
    }

    const transaction = verifyData.data

    if (!transaction) {
      console.error('[Nomba Verify] ❌ Transaction not found for ref:', transactionRef)
      return NextResponse.json(
        {
          success: false,
          error: 'Transaction not found',
          message: 'Payment verification failed. The transaction may still be processing. Please contact support if you were charged.',
        },
        { status: 404 }
      )
    }

    console.log('[Nomba Verify] Transaction found:', {
      id: transaction.id,
      status: transaction.status,
      amount: transaction.amount,
      type: transaction.type
    })

    // Validate transaction status based on official Nomba API specification
    // Official statuses: NEW, PENDING_PAYMENT, PAYMENT_SUCCESSFUL, PAYMENT_FAILED, PENDING_BILLING, SUCCESS, REFUND
    const statusUpper = transaction.status.toUpperCase()

    // Success statuses per official API specification
    const SUCCESS_STATUSES = ['SUCCESS', 'PAYMENT_SUCCESSFUL']

    // Known failure statuses
    const FAILURE_STATUSES = ['FAILED', 'PAYMENT_FAILED', 'DECLINED', 'REJECTED', 'CANCELLED', 'EXPIRED']

    // Check success statuses
    if (SUCCESS_STATUSES.includes(statusUpper)) {
      console.log('[Nomba Verify] ✅ Payment successful')
    }
    // Check known failure statuses
    else if (FAILURE_STATUSES.includes(statusUpper)) {
      console.log(`[Nomba Verify] ❌ Payment failed with status: ${transaction.status}`)
      return NextResponse.json({
        success: false,
        status: transaction.status,
        message: `Payment ${transaction.status.toLowerCase()}. Please try again or contact support.`,
      })
    }
    // Unknown or pending status
    else {
      console.error(`[Nomba Verify] ⚠️  UNKNOWN STATUS: "${transaction.status}"`)
      console.error(`[Nomba Verify] Transaction ID: ${transaction.id}`)
      console.error(`[Nomba Verify] Reference: ${transactionRef}`)
      console.error(`[Nomba Verify] This status is not in our known list - manual review required`)

      // Don't mark as successful for unknown statuses
      return NextResponse.json({
        success: false,
        status: transaction.status,
        message: `Payment status unclear: ${transaction.status}. Please contact support with reference ${transactionRef}`,
        warning: 'Unknown payment status received from payment gateway',
      }, { status: 202 }) // 202 Accepted - needs manual verification
    }

    // Update order payment status in database
    const supabase = await createClient()

    // Find order by payment reference
    const { data: order } = await supabase
      .from('orders')
      .select('*')
      .eq('payment_reference', transactionRef)
      .single()

    if (order) {
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          status: 'confirmed',
          payment_reference: transactionRef,
          paid_at: new Date().toISOString(),
        })
        .eq('id', order.id)

      if (updateError) {
        console.error('Error updating order payment status:', updateError)
      }

      // Send payment confirmation email to customer
      try {
        const emailResult = await sendPaymentConfirmation({
          orderNumber: order.order_number,
          customerName: order.customer_name,
          customerEmail: order.customer_email,
          amount: transaction.amount,
          paymentMethod: order.payment_method || 'nomba',
          transactionReference: transactionRef,
        });

        if (!emailResult.success) {
          console.error('Failed to send payment confirmation email:', emailResult.error);
          // Don't fail the request if email fails
        } else {
          console.log('Payment confirmation email sent successfully to', order.customer_email);
        }
      } catch (emailError) {
        console.error('Error sending payment confirmation email:', emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      status: transaction.status,
      amount: transaction.amount,
      reference: transactionRef,
      order_id: order?.id,
      message: 'Payment verified successfully',
    })
  } catch (error: unknown) {
    console.error('Nomba payment verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
