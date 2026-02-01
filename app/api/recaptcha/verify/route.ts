import { NextResponse } from 'next/server';

export async function POST(request: Request) {
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
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    if (!secretKey) {
      console.error('RECAPTCHA_SECRET_KEY not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Verify token with Google
    const verificationUrl = 'https://www.google.com/recaptcha/api/siteverify';
    const response = await fetch(verificationUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
      }),
    });

    const result = await response.json();

    if (!result.success) {
      console.error('reCAPTCHA verification failed:', result['error-codes']);
      return NextResponse.json(
        {
          error: 'reCAPTCHA verification failed',
          score: result.score,
          errorCodes: result['error-codes'],
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      score: result.score,
      action: result.action,
    });

  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
