import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/notifications/email';
import { sendPushNotification } from '@/lib/notifications/push';

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

    // Verify admin user
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
    const { logId } = body;

    if (!logId) {
      return NextResponse.json(
        { error: 'Log ID is required' },
        { status: 400 }
      );
    }

    // Get the original notification log
    const { data: log, error: logError } = await supabase
      .from('notification_logs')
      .select('*')
      .eq('id', logId)
      .single();

    if (logError || !log) {
      return NextResponse.json(
        { error: 'Notification log not found' },
        { status: 404 }
      );
    }

    // Resend based on type
    let result;
    if (log.notification_type === 'email' && log.metadata?.to) {
      result = await sendEmail({
        to: log.metadata.to,
        template_key: log.template_key,
        variables: log.metadata?.variables || {},
      });
    } else if (log.notification_type === 'push' && log.user_id) {
      result = await sendPushNotification(log.user_id, {
        title: log.channel,
        body: log.metadata?.body || 'Notification',
        ...log.metadata,
      });
    } else {
      return NextResponse.json(
        { error: 'Unable to resend notification' },
        { status: 400 }
      );
    }

    if (result?.success || result?.sent) {
      return NextResponse.json({
        success: true,
        message: 'Notification resent successfully',
      });
    } else {
      return NextResponse.json(
        { error: result?.error || 'Failed to resend notification' },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error('Resend notification error:', error);
    return NextResponse.json(
      { error: 'Failed to resend notification' },
      { status: 500 }
    );
  }
}
