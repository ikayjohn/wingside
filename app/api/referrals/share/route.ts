import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // Get the current user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { shareMethod, recipientEmail, customMessage } = await request.json();

    // Get user's referral code and info
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('referral_code, full_name, referral_count, total_referral_earnings')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile?.referral_code) {
      return NextResponse.json(
        { error: 'Referral code not found' },
        { status: 404 }
      );
    }

    // Log the share action for analytics
    const { error: logError } = await supabase
      .from('referral_shares')
      .insert({
        user_id: user.id,
        share_method: shareMethod, // 'email', 'whatsapp', 'twitter', 'facebook', 'copy_link'
        recipient_email: recipientEmail || null,
        custom_message: customMessage || null,
        referral_code_used: userProfile.referral_code,
        created_at: new Date().toISOString()
      });

    if (logError) {
      console.error('Failed to log referral share:', logError);
      // Don't fail the request if logging fails
    }

    // Generate share links and messages
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.wingside.ng';
    const referralLink = `${baseUrl}/signup?ref=${userProfile.referral_code}`;

    const shareMessages = {
      email: {
        subject: `Join Wingside and get ₦500 off your first order!`,
        body: `Hey! I've been enjoying Wingside's amazing chicken wings and thought you'd love them too. Use my referral code ${userProfile.referral_code} to get ₦500 off your first order.

${referralLink}

${customMessage || `I've already earned ₦${userProfile.total_referral_earnings || 0} from referrals - it's a great deal!`}

Enjoy the wings!
${userProfile.full_name}`
      },
      whatsapp: {
        message: `Hey! I've been enjoying Wingside's amazing chicken wings and thought you'd love them too. Use my referral code ${userProfile.referral_code} to get ₦500 off your first order: ${referralLink}

${customMessage || `I've already earned ₦${userProfile.total_referral_earnings || 0} from referrals - it's a great deal!`}`
      },
      twitter: {
        message: `Get ₦500 off your first order at Wingside! 🍗 Use my referral code ${userProfile.referral_code} to enjoy amazing chicken wings. ${referralLink} #Wingside #ChickenWings #FoodieNG`
      },
      facebook: {
        message: `Love chicken wings? Get ₦500 off your first order at Wingside using my referral code ${userProfile.referral_code}! 🍗✨ ${referralLink}

${customMessage || `I've been enjoying their amazing flavors and you can too!`}`
      }
    };

    // If sharing via email, you would integrate with an email service here
    if (shareMethod === 'email' && recipientEmail) {
      // TODO: Integrate with email service (SendGrid, etc.)
      console.log(`Would send referral email to ${recipientEmail}`);
    }

    return NextResponse.json({
      success: true,
      referralLink,
      referralCode: userProfile.referral_code,
      messages: shareMessages
    });

  } catch (error) {
    console.error('Referral share error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}