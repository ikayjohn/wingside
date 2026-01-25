import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { sendSMS, isSMSEnabled, formatPhoneNumber } from '@/lib/notifications/sms';

// Admin endpoint to send test SMS
export async function POST(request: NextRequest) {
  try {
    // Check authentication
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

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const { phoneNumber, message } = await request.json();

    // Validate inputs
    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'phoneNumber is required' },
        { status: 400 }
      );
    }

    // Check if SMS is enabled
    if (!isSMSEnabled()) {
      return NextResponse.json(
        {
          error: 'SMS service not configured',
          details: 'Please set SMS_PROVIDER and corresponding credentials in your environment variables'
        },
        { status: 500 }
      );
    }

    // Format phone number
    const formattedPhone = formatPhoneNumber(phoneNumber);

    // Default test message
    const testMessage = message ||
      `🎉 Wingside SMS Test! Your SMS integration is working perfectly. Sent at ${new Date().toLocaleTimeString()}`;

    console.log('📧 Sending test SMS...');
    console.log('To:', formattedPhone);
    console.log('Message:', testMessage);

    // Send SMS
    const smsResult = await sendSMS(formattedPhone, testMessage);

    if (!smsResult.success) {
      console.error('❌ Failed to send SMS:', smsResult.error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to send SMS',
          details: smsResult.error
        },
        { status: 500 }
      );
    }

    console.log('✅ Test SMS sent successfully!');
    console.log('Message ID:', smsResult.messageId);

    return NextResponse.json({
      success: true,
      message: 'SMS sent successfully',
      messageId: smsResult.messageId,
      phoneNumber: formattedPhone,
      provider: process.env.SMS_PROVIDER || 'auto-detected',
    });

  } catch (error) {
    console.error('❌ Error in SMS test endpoint:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
