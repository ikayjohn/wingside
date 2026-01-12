import { NextRequest, NextResponse } from 'next/server';

/**
 * Verify hCaptcha token
 * POST /api/hcaptcha/verify
 * Body: { token: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    const secretKey = process.env.HCAPTCHA_SECRET_KEY;

    if (!secretKey) {
      console.error('HCAPTCHA_SECRET_KEY is not configured');
      return NextResponse.json(
        { error: 'Captcha configuration error' },
        { status: 500 }
      );
    }

    // Verify token with hCaptcha
    const verificationUrl = 'https://hcaptcha.com/siteverify';

    const response = await fetch(verificationUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
        remoteip: request.headers.get('x-forwarded-for') ||
                 request.headers.get('x-real-ip') ||
                 '',
      }),
    });

    const result = await response.json();

    if (result.success) {
      return NextResponse.json({
        success: true,
        challenge_ts: result.challenge_ts,
        hostname: result.hostname,
      });
    } else {
      console.error('hCaptcha verification failed:', result['error-codes']);
      return NextResponse.json(
        {
          success: false,
          error: 'Captcha verification failed',
          errorCodes: result['error-codes'],
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
