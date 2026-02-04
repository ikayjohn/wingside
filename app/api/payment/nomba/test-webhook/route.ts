import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// POST /api/payment/nomba/test-webhook - Test webhook signature generation and validation
export async function POST(request: NextRequest) {
  try {
    const webhookSecret = process.env.NOMBA_WEBHOOK_SECRET

    if (!webhookSecret) {
      return NextResponse.json({
        error: 'NOMBA_WEBHOOK_SECRET not configured',
        message: 'Set this environment variable to test webhooks'
      }, { status: 500 })
    }

    const body = await request.json()
    const { orderReference, eventType = 'payment_success' } = body

    if (!orderReference) {
      return NextResponse.json({
        error: 'orderReference is required'
      }, { status: 400 })
    }

    // Generate test webhook payload matching Nomba's structure
    const timestamp = new Date().toISOString()
    const requestId = `TEST-${Date.now()}`

    const testPayload = {
      event_type: eventType,
      requestId,
      data: {
        transaction: {
          transactionId: `TXN-${Date.now()}`,
          type: 'DEBIT',
          transactionAmount: 2500,
          fee: 50,
          time: timestamp
        },
        order: {
          orderReference,
          customerEmail: 'test@example.com',
          amount: 2500,
          currency: 'NGN',
          customerId: 'TEST-CUSTOMER',
          callbackUrl: 'https://www.wingside.ng/payment/nomba/callback'
        },
        merchant: {
          userId: 'TEST-MERCHANT',
          walletId: 'WALLET-123',
          walletBalance: 100000
        }
      }
    }

    const rawBody = JSON.stringify(testPayload)

    // Generate signature using the same method as the webhook
    // Nomba uses HMAC-SHA256 of raw body, base64 encoded
    const signature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('base64')

    // Return test webhook details
    return NextResponse.json({
      message: 'Test webhook payload generated',
      webhookUrl: '/api/payment/nomba/webhook',
      payload: testPayload,
      headers: {
        'nomba-signature': signature,
        'nomba-sig-value': signature,
        'nomba-signature-algorithm': 'HmacSHA256',
        'nomba-signature-version': '1.0.0',
        'nomba-timestamp': timestamp,
        'Content-Type': 'application/json'
      },
      curlCommand: `curl -X POST http://localhost:3000/api/payment/nomba/webhook \\
  -H 'nomba-signature: ${signature}' \\
  -H 'nomba-sig-value: ${signature}' \\
  -H 'nomba-signature-algorithm: HmacSHA256' \\
  -H 'nomba-signature-version: 1.0.0' \\
  -H 'nomba-timestamp: ${timestamp}' \\
  -H 'Content-Type: application/json' \\
  -d '${rawBody}'`
    })
  } catch (error) {
    console.error('Test webhook generation error:', error)
    return NextResponse.json({
      error: 'Failed to generate test webhook',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET /api/payment/nomba/test-webhook - Get instructions
export async function GET() {
  return NextResponse.json({
    message: 'Generate test Nomba webhook payloads',
    usage: {
      endpoint: 'POST /api/payment/nomba/test-webhook',
      body: {
        orderReference: 'WS-1234-1234567890',
        eventType: 'payment_success' // or 'payment_failed', 'payment_cancelled'
      },
      note: 'This generates a valid webhook payload with signature that you can send to /api/payment/nomba/webhook'
    },
    example: {
      orderReference: 'WS-ORD-001-1735084800000',
      eventType: 'payment_success'
    }
  })
}
