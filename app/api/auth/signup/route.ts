import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Generate referral code based on first name, last name, and random numbers
function generateReferralCode(firstName: string, lastName: string): string {
  const cleanFirst = firstName.replace(/[^a-zA-Z]/g, '').toLowerCase();
  const cleanLast = lastName.replace(/[^a-zA-Z]/g, '').toLowerCase();

  const firstPart = cleanFirst.slice(0, 4).toLowerCase();
  const lastPart = cleanLast.slice(0, 4).toLowerCase();

  const randomDigits = Math.floor(Math.random() * 1000).toString().padStart(3, '0');

  let code = `${firstPart}${lastPart}${randomDigits}`;

  if (code.length < 5) {
    const extraRandom = Math.random().toString(36).substring(2, 4).toUpperCase();
    code = `${code}${extraRandom}`;
  }

  return code.slice(0, 15);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      referralId,
    } = body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate referral code if provided
    let referredByUserId = null;
    if (referralId && referralId.trim()) {
      const searchCode = referralId.trim().toLowerCase();

      const { data: referrerData, error: referrerError } = await supabase
        .from('profiles')
        .select('id')
        .eq('referral_code', searchCode)
        .single();

      if (referrerError || !referrerData) {
        return NextResponse.json(
          { error: `Invalid referral ID: "${searchCode}"` },
          { status: 404 }
        );
      }

      referredByUserId = referrerData.id;
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password,
      email_confirm: true, // Auto-confirm (no verification email)
      user_metadata: {
        full_name: `${firstName.trim()} ${lastName.trim()}`,
        phone: `+234${phone}`,
      },
    });

    if (authError) {
      console.error('Auth creation error:', authError);
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // Generate referral code for new user
    const referralCode = generateReferralCode(firstName, lastName);

    // Create profile
    const { error: profileError } = await supabase.from('profiles').insert({
      id: authData.user.id,
      email: authData.user.email,
      full_name: `${firstName.trim()} ${lastName.trim()}`,
      phone: `+234${phone}`,
      role: 'customer',
      referral_code: referralCode,
      referred_by: referredByUserId,
    });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Don't fail the entire signup if profile creation fails
      // But log it for debugging
    }

    // Create referral record if user was referred
    if (referredByUserId) {
      const { error: referralError } = await supabase.from('referrals').insert({
        referrer_id: referredByUserId,
        referred_user_id: authData.user.id,
        referral_code_used: referralId.trim().toUpperCase(),
        status: 'pending_signup',
        reward_amount: 200,
        referred_email: email.toLowerCase().trim(),
      });

      if (referralError) {
        console.error('Referral creation error:', referralError);
        // Don't fail signup if referral record creation fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        referralCode,
      },
    });

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
