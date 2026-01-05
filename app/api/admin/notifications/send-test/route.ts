import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.RESEND_API_KEY!);
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
      .select('role, email')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { type, recipient } = body;

    if (type === 'email') {
      // Get email template
      const { data: template } = await supabaseAdmin
        .from('email_templates')
        .select('*')
        .eq('template_key', 'order_confirmation')
        .eq('is_active', true)
        .single();

      if (!template) {
        return NextResponse.json({ error: 'Email template not found' }, { status: 404 });
      }

      // Replace variables in template
      const htmlContent = template.html_content
        .replace(/\{\{customer_name\}\}/g, 'Admin User')
        .replace(/\{\{order_number\}\}/g, 'TEST-' + Date.now())
        .replace(/\{\{total_amount\}\}/g, '₦5,000')
        .replace(/\{\{payment_method\}\}/g, 'Test Payment')
        .replace(/\{\{estimated_time\}\}/g, '15')
        .replace(/\{\{order_tracking_url\}\}/g, 'https://wingside.ng/my-account/orders');

      const subject = template.subject;

      // Send email via Resend
      try {
        const result = await resend.emails.send({
          from: 'Wingside <notifications@wingside.ng>',
          to: recipient || profile.email,
          subject,
          html: htmlContent,
        });

        // Log the notification
        await supabaseAdmin.from('notification_logs').insert({
          user_id: user.id,
          notification_type: 'email',
          template_key: 'order_confirmation',
          channel: 'test_email',
          status: 'sent',
          metadata: {
            to: recipient || profile.email,
            messageId: result.data?.id,
          },
          sent_at: new Date().toISOString(),
        });

        return NextResponse.json({
          success: true,
          message: `Test email sent to ${recipient || profile.email}!`,
          messageId: result.data?.id,
        });
      } catch (resendError: any) {
        console.error('Resend error:', resendError);

        // Log the failed notification
        await supabaseAdmin.from('notification_logs').insert({
          user_id: user.id,
          notification_type: 'email',
          template_key: 'order_confirmation',
          channel: 'test_email',
          status: 'failed',
          error_message: resendError.message,
          metadata: { to: recipient || profile.email },
        });

        return NextResponse.json(
          { error: `Resend error: ${resendError.message}` },
          { status: 500 }
        );
      }
    }

    if (type === 'push') {
      // Send test push notification to all active subscriptions
      const { data: subscriptions } = await supabaseAdmin
        .from('push_subscriptions')
        .select('id, user_id, endpoint, p256dh_key, auth_key')
        .eq('is_active', true);

      if (!subscriptions || subscriptions.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'No active push subscriptions found. Users need to subscribe to push notifications first.',
          sent: 0,
        });
      }

      // For now, just return info about subscriptions
      // Full push notification requires web-push library which may have issues in serverless
      return NextResponse.json({
        success: true,
        message: `Found ${subscriptions.length} active push subscriptions. Push notifications require client-side service worker.`,
        sent: 0,
        subscriptionCount: subscriptions.length,
      });
    }

    return NextResponse.json(
      { error: 'Invalid notification type. Use "email" or "push"' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Send test notification error:', error);
    return NextResponse.json(
      { error: `Failed to send test notification: ${error.message}` },
      { status: 500 }
    );
  }
}
