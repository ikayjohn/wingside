import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendPaymentConfirmation } from '@/lib/emails/service'

interface NombaVerifyResponse {
  code: string
  description: string
  data?: {
    results: Array<{
      id: string
      status: string
      amount: number
      transactionId: string
    }>
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

    // Verify transaction
    const verifyResponse = await fetch('https://api.nomba.com/v1/transactions/accounts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'accountId': accountId,
      },
      body: JSON.stringify({
        transactionRef,
      }),
    })

    const verifyData: NombaVerifyResponse = await verifyResponse.json()

    console.log('[Nomba Verify] API Response:', {
      code: verifyData.code,
      description: verifyData.description,
      transactionRef,
      resultsCount: verifyData.data?.results?.length || 0
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

    const transaction = verifyData.data?.results?.[0]

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
      id: transaction.transactionId,
      status: transaction.status,
      amount: transaction.amount
    })

    // Validate transaction status with clear primary/fallback logic
    // Reference: Nomba API documentation specifies 'SUCCESSFUL' as primary success status
    const statusUpper = transaction.status.toUpperCase()

    // Primary success status (per Nomba documentation)
    const PRIMARY_SUCCESS_STATUS = 'SUCCESSFUL'

    // Known fallback statuses (variants observed in different environments/API versions)
    // These generate warnings to help identify if Nomba changes their API response
    const FALLBACK_SUCCESS_STATUSES = ['SUCCESS', 'COMPLETED', 'APPROVED']

    // Known failure statuses (explicit rejection)
    const FAILURE_STATUSES = ['FAILED', 'DECLINED', 'REJECTED', 'CANCELLED', 'EXPIRED']

    // Check primary success status
    if (statusUpper === PRIMARY_SUCCESS_STATUS) {
      console.log('[Nomba Verify] ✅ Payment successful (primary status)')
    }
    // Check fallback success statuses
    else if (FALLBACK_SUCCESS_STATUSES.includes(statusUpper)) {
      console.warn(`[Nomba Verify] ⚠️  Payment successful but using non-standard status: "${transaction.status}"`)
      console.warn(`[Nomba Verify] Expected: "${PRIMARY_SUCCESS_STATUS}", Got: "${transaction.status}"`)
      console.warn(`[Nomba Verify] Please verify Nomba API documentation - status format may have changed`)
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
    // Unknown status (pending, processing, or new status)
    else {
      console.error(`[Nomba Verify] ⚠️  UNKNOWN STATUS: "${transaction.status}"`)
      console.error(`[Nomba Verify] Transaction ID: ${transaction.transactionId}`)
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
