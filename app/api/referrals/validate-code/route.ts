import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { referralCode } = await request.json();

    if (!referralCode || typeof referralCode !== 'string') {
      return NextResponse.json(
        { error: 'Referral code is required' },
        { status: 400 }
      );
    }

    // Trim and convert to lowercase
    const searchCode = referralCode.trim().toLowerCase();

    // Look up referral code using service role key (bypasses RLS)
    const { data: referrerData, error: referrerError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('referral_code', searchCode)
      .single();

    if (referrerError) {
      console.error('Referral lookup error:', referrerError);
      return NextResponse.json(
        {
          error: 'Invalid referral ID',
          details: referrerError.message,
          code: searchCode
        },
        { status: 404 }
      );
    }

    if (!referrerData) {
      return NextResponse.json(
        {
          error: 'Referral code not found',
          code: searchCode
        },
        { status: 404 }
      );
    }

    // Success - only return validation status without exposing user data
    // SECURITY: Do not expose referrerId to prevent user enumeration attacks
    // The backend will look up the referrerId when processing the referral
    return NextResponse.json({
      valid: true,
      message: 'Referral code is valid'
    });

  } catch (error) {
    console.error('Referral validation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
