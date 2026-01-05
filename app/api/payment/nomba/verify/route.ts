import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

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
    const body = await request.json()
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

    if (verifyData.code !== '00') {
      console.error('Nomba verification error:', verifyData)
      return NextResponse.json(
        { error: verifyData.description || 'Failed to verify transaction' },
        { status: 500 }
      )
    }

    const transaction = verifyData.data?.results?.[0]

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    // Check if transaction was successful
    if (transaction.status !== 'SUCCESSFUL') {
      return NextResponse.json({
        success: false,
        status: transaction.status,
        message: 'Payment was not successful',
      })
    }

    // Update order payment status in database
    const supabase = createClient()

    // Find order by payment reference
    const { data: order } = await supabase
      .from('orders')
      .select('id')
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
    }

    return NextResponse.json({
      success: true,
      status: transaction.status,
      amount: transaction.amount,
      reference: transactionRef,
      order_id: order?.id,
      message: 'Payment verified successfully',
    })
  } catch (error: any) {
    console.error('Nomba payment verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
