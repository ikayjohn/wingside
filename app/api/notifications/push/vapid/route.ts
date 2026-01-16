import { NextResponse } from 'next/server';
import { getVapidPublicKey } from '@/lib/notifications/push';

export async function GET() {
  try {
    const publicKey = getVapidPublicKey();

    if (!publicKey) {
      return NextResponse.json(
        { error: 'VAPID public key not configured' },
        { status: 500 }
      );
    }

    return NextResponse.json({ publicKey });
  } catch (error: unknown) {
    console.error('Get VAPID key error:', error);
    return NextResponse.json(
      { error: 'Failed to get VAPID public key' },
      { status: 500 }
    );
  }
}
