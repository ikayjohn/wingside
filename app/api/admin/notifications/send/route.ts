import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { sendNotification, sendBroadcastPush } from '@/lib/notifications';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Get user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { type, recipients, notification, channels } = body;

    if (!type || !recipients || !notification) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    let results;

    if (type === 'broadcast') {
      // Send to all users or specific segment
      const payload = {
        title: notification.title,
        body: notification.message,
        icon: notification.icon || '/logo.png',
        badge: '/badge-icon.png',
        url: notification.url || '/',
        requireInteraction: false,
      };

      results = await sendBroadcastPush(payload, {
        includeUsers: recipients.userIds,
      });

      return NextResponse.json({
        success: true,
        sent: results.success,
        failed: results.failed,
      });
    } else if (type === 'individual') {
      // Send to specific users
      results = await Promise.all(
        recipients.map((recipient: any) =>
          sendNotification({
            channels: channels || ['email', 'push'],
            userId: recipient.userId,
            userEmail: recipient.email,
            userName: recipient.name,
            type: notification.type || 'promotion',
            data: notification.data || {},
          })
        )
      );

      return NextResponse.json({
        success: true,
        results,
      });
    } else {
      return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Send notification error:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}
