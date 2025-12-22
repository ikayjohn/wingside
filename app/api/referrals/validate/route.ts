import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { referralCode } = await request.json();

    if (!referralCode || typeof referralCode !== 'string') {
      return NextResponse.json(
        { error: 'Referral code is required' },
        { status: 400 }
      );
    }

    // Clean and normalize the referral code
    const cleanedCode = referralCode.trim().toUpperCase();

    // Check if referral code exists and get referrer info
    const { data: referrerData, error: referrerError } = await supabase
      .from('profiles')
      .select('id, full_name, email, referral_count')
      .eq('referral_code', cleanedCode)
      .single();

    if (referrerError || !referrerData) {
      return NextResponse.json(
        {
          valid: false,
          message: 'Invalid referral code'
        },
        { status: 404 }
      );
    }

    // Check if referral program is active
    const { data: settings } = await supabase
      .from('referral_settings')
      .select('setting_value')
      .eq('setting_key', 'referral_program_active')
      .eq('is_active', true)
      .single();

    if (!settings || settings.setting_value !== 'true') {
      return NextResponse.json(
        {
          valid: false,
          message: 'Referral program is currently inactive'
        },
        { status: 400 }
      );
    }

    // Get reward amounts
    const { data: rewardSettings } = await supabase
      .from('referral_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['referrer_reward_amount', 'referred_reward_amount'])
      .eq('is_active', true);

    const referrerReward = rewardSettings?.find(s => s.setting_key === 'referrer_reward_amount')?.setting_value || '0';
    const referredReward = rewardSettings?.find(s => s.setting_key === 'referred_reward_amount')?.setting_value || '0';

    return NextResponse.json({
      valid: true,
      referrerInfo: {
        name: referrerData.full_name,
        referralCount: referrerData.referral_count || 0
      },
      rewards: {
        referrerReward: parseFloat(referrerReward),
        referredReward: parseFloat(referredReward)
      },
      message: `Valid referral code! You'll get ₦${referredReward} off when you sign up.`
    });

  } catch (error) {
    console.error('Referral validation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}