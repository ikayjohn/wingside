import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimitByIp, rateLimitErrorResponse } from '@/lib/rate-limit';

/**
 * Verify Cloudflare Turnstile token
 * POST /api/captcha/verify
 * Body: { token: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Check rate limit (20 verifications per minute)
    const { rateLimit } = await checkRateLimitByIp({ limit: 20, window: 60 * 1000 });
    if (!rateLimit.success) {
      return rateLimitErrorResponse(rateLimit);
    }

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
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    const secretKey = process.env.TURNSTILE_SECRET_KEY;

    if (!secretKey) {
      console.error('TURNSTILE_SECRET_KEY is not configured');
      return NextResponse.json(
        { error: 'Captcha configuration error' },
        { status: 500 }
      );
    }

    // Verify token with Cloudflare
    const verificationUrl = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

    const response = await fetch(verificationUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        secret: secretKey,
        response: token,
        remoteip: request.headers.get('x-forwarded-for') ||
                 request.headers.get('x-real-ip') ||
                 undefined,
      }),
    });

    const result = await response.json();

    // Log for debugging
    console.log('Turnstile verification result:', {
      success: result.success,
      hostname: result.hostname,
      errorCodes: result['error-codes'],
      challenge_ts: result.challenge_ts,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        challenge_ts: result.challenge_ts,
        hostname: result.hostname,
      });
    } else {
      console.error('Turnstile verification failed:', result['error-codes']);
      return NextResponse.json(
        {
          success: false,
          error: 'Captcha verification failed',
          errorCodes: result['error-codes'],
          details: result,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Captcha verification error:', error);
    return NextResponse.json(
      { error: 'Captcha verification failed' },
      { status: 500 }
    );
  }
}
