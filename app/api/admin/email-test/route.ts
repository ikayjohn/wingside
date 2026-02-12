import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server'
import { canAccessAdmin, UserRole } from '@/lib/permissions';
import { sendReferralInvitation } from '@/lib/emails/service';

// Admin endpoint to send test emails
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      );
    }

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
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
    const { templateId, recipientEmail, referrerName, referralCode, customMessage } = body;

    // Validate inputs
    if (!recipientEmail) {
      return NextResponse.json(
        { error: 'recipientEmail is required' },
        { status: 400 }
      );
    }

    // Handle different template types
    if (templateId === 'referral_invitation') {
      if (!referralCode) {
        return NextResponse.json(
          { error: 'referralCode is required for referral invitation' },
          { status: 400 }
        );
      }

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.wingside.ng';
      const referralLink = `${baseUrl}/signup?ref=${referralCode}`;

      console.log('📧 Sending test referral email...');
      console.log('To:', recipientEmail);
      console.log('From:', referrerName);
      console.log('Code:', referralCode);

      const emailResult = await sendReferralInvitation({
        recipientEmail,
        referrerName: referrerName || 'Wingside Team',
        referralCode,
        referralLink,
        customMessage: customMessage || undefined,
      });

      if (!emailResult.success) {
        console.error('❌ Failed to send email:', emailResult.error);
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to send email',
            details: emailResult.error
          },
          { status: 500 }
        );
      }

      console.log('✅ Test email sent successfully!');
      return NextResponse.json({
        success: true,
        message: 'Email sent successfully',
        data: emailResult.data,
        recipientEmail,
        referralLink
      });
    }

    // Other template types can be added here
    return NextResponse.json(
      { error: 'Template not supported yet' },
      { status: 400 }
    );

  } catch (error) {
    console.error('❌ Error in email test endpoint:', error);
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
