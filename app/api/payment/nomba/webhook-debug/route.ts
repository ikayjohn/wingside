import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

interface DebugInfo {
  timestamp: string
  headers: Record<string, string | null>
  body: string | null
  validation: Record<string, any>
  signatureComparison: Record<string, any>
  recommendation: string
  error?: string
  allPassed?: boolean
}

// POST /api/payment/nomba/webhook-debug - Debug webhook issues
export async function POST(request: NextRequest) {
  const debugInfo: DebugInfo = {
    timestamp: new Date().toISOString(),
    headers: {},
    body: null,
    validation: {},
    signatureComparison: {},
    recommendation: ''
  }

  try {
    // Capture all headers
    debugInfo.headers = {
      'nomba-signature': request.headers.get('nomba-signature'),
      'nomba-sig-value': request.headers.get('nomba-sig-value'),
      'nomba-timestamp': request.headers.get('nomba-timestamp'),
      'nomba-signature-algorithm': request.headers.get('nomba-signature-algorithm'),
      'nomba-signature-version': request.headers.get('nomba-signature-version'),
      'content-type': request.headers.get('content-type'),
      'user-agent': request.headers.get('user-agent'),
      'x-forwarded-for': request.headers.get('x-forwarded-for'),
    } as Record<string, string | null>

    // Get raw body
    const rawBody = await request.text()
    debugInfo.body = rawBody.substring(0, 1000) // First 1000 chars

    const webhookSecret = process.env.NOMBA_WEBHOOK_SECRET
    debugInfo.validation.webhookSecretSet = !!webhookSecret
    debugInfo.validation.webhookSecretLength = webhookSecret?.length
    debugInfo.validation.webhookSecretPreview = webhookSecret ? `${webhookSecret.substring(0, 10)}...` : 'NOT_SET'

    // Check 1: Signature header
    const signature = request.headers.get('nomba-signature') || request.headers.get('nomba-sig-value')
    debugInfo.validation.signaturePresent = !!signature
    if (!signature) {
      debugInfo.recommendation = '❌ No signature headers found. Nomba should send nomba-signature or nomba-sig-value'
      return NextResponse.json(debugInfo)
    }
    debugInfo.validation.signatureReceived = signature.substring(0, 20) + '...'

    // Check 2: Algorithm
    const algorithm = request.headers.get('nomba-signature-algorithm')
    debugInfo.validation.algorithmReceived = algorithm
    debugInfo.validation.algorithmValid = algorithm === 'HmacSHA256'
    if (algorithm !== 'HmacSHA256' && algorithm !== null) {
      debugInfo.recommendation = `❌ Wrong algorithm: "${algorithm}". Expected "HmacSHA256"`
      return NextResponse.json(debugInfo)
    }

    // Check 3: Version
    const version = request.headers.get('nomba-signature-version')
    debugInfo.validation.versionReceived = version
    debugInfo.validation.versionValid = version === '1.0.0'
    if (version !== '1.0.0' && version !== null) {
      debugInfo.recommendation = `❌ Wrong version: "${version}". Expected "1.0.0"`
      return NextResponse.json(debugInfo)
    }

    // Check 4: Timestamp
    const timestamp = request.headers.get('nomba-timestamp')
    debugInfo.validation.timestampPresent = !!timestamp
    debugInfo.validation.timestampReceived = timestamp

    if (!timestamp) {
      debugInfo.recommendation = '❌ Missing nomba-timestamp header'
      return NextResponse.json(debugInfo)
    }

    const webhookTime = new Date(timestamp).getTime()
    const now = Date.now()
    const timeDiff = Math.abs(now - webhookTime)
    debugInfo.validation.timestampValid = !isNaN(webhookTime) && timeDiff <= 5 * 60 * 1000
    debugInfo.validation.timestampAge = `${Math.round(timeDiff / 1000)}s`

    if (isNaN(webhookTime)) {
      debugInfo.recommendation = `❌ Invalid timestamp format: "${timestamp}"`
      return NextResponse.json(debugInfo)
    }

    if (timeDiff > 5 * 60 * 1000) {
      debugInfo.recommendation = `❌ Timestamp too old: ${timeDiff}ms (max 300000ms allowed)`
      return NextResponse.json(debugInfo)
    }

    // Check 5: Signature calculation
    if (!webhookSecret) {
      debugInfo.recommendation = '❌ NOMBA_WEBHOOK_SECRET not set in environment'
      return NextResponse.json(debugInfo)
    }

    // Calculate expected signatures
    const expectedRawBody = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('base64')

    const expectedRawBodyHex = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex')

    debugInfo.signatureComparison = {
      received: signature,
      expectedRawBody: expectedRawBody,
      expectedRawBodyHex: expectedRawBodyHex,
      rawBodyMatches: signature === expectedRawBody,
      hexMatches: signature === expectedRawBodyHex,
    }

    // Timing-safe comparison
    const rawBodyMatch = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedRawBody)
    )

    debugInfo.validation.signatureValid = rawBodyMatch

    if (!rawBodyMatch) {
      debugInfo.recommendation = '❌ Signature mismatch! Check that NOMBA_WEBHOOK_SECRET matches exactly in both places:'
      debugInfo.recommendation += '\n1. Your application environment variables (.env.production or Vercel env)'
      debugInfo.recommendation += '\n2. Nomba Dashboard → Developer → Webhooks → Webhook Secret field'
      return NextResponse.json(debugInfo)
    }

    debugInfo.recommendation = '✅ All validations passed! Webhook is working correctly.'
    debugInfo.validation.allPassed = true

    return NextResponse.json(debugInfo)

  } catch (error) {
    debugInfo.error = error instanceof Error ? error.message : 'Unknown error'
    debugInfo.recommendation = `❌ Exception: ${debugInfo.error}`
    return NextResponse.json(debugInfo, { status: 500 })
  }
}

// GET /api/payment/nomba/webhook-debug - Get instructions
export async function GET() {
  return NextResponse.json({
    message: 'Nomba Webhook Debug Endpoint',
    usage: {
      endpoint: 'POST /api/payment/nomba/webhook-debug',
      purpose: 'Identify why webhook returns 401',
      whatItDoes: [
        'Logs all received headers',
        'Validates signature format',
        'Calculates expected signature',
        'Compares signatures',
        'Provides specific recommendations'
      ]
    },
    nextSteps: [
      '1. Check this endpoint from Nomba dashboard or with curl',
      '2. Review the "recommendation" field for specific issue',
      '3. Fix the issue',
      '4. Test again with main webhook endpoint'
    ],
    commonIssues: [
      {
        issue: 'Missing signature',
        fix: 'Nomba should send nomba-signature header'
      },
      {
        issue: 'Signature mismatch',
        fix: 'Ensure NOMBA_WEBHOOK_SECRET matches in both app and Nomba dashboard'
      },
      {
        issue: 'Missing timestamp',
        fix: 'Nomba should send nomba-timestamp header'
      },
      {
        issue: 'Secret not set',
        fix: 'Set NOMBA_WEBHOOK_SECRET in production environment'
      }
    ]
  })
}
