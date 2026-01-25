import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdminClient();
    const { cardNumber, pin } = await request.json();

    // Validate inputs
    if (!cardNumber || !pin) {
      return NextResponse.json(
        { error: 'Card number and PIN are required' },
        { status: 400 }
      );
    }

    // Validate card number format (16 digits)
    if (!/^\d{16}$/.test(cardNumber.replace(/\s/g, ''))) {
      return NextResponse.json(
        { error: 'Invalid card number format. Must be 16 digits.' },
        { status: 400 }
      );
    }

    // Validate PIN format (4 digits)
    if (!/^\d{4}$/.test(pin)) {
      return NextResponse.json(
        { error: 'Invalid PIN format. Must be 4 digits.' },
        { status: 400 }
      );
    }

    // Clean card number (remove spaces)
    const cleanCardNumber = cardNumber.replace(/\s/g, '');

    // Call the validate_gift_card function
    const { data, error } = await supabaseAdmin.rpc('validate_gift_card', {
      p_card_number: cleanCardNumber,
      p_pin: pin,
    });

    if (error) {
      console.error('Gift card validation error:', error);
      return NextResponse.json(
        { error: 'Failed to validate gift card' },
        { status: 500 }
      );
    }

    // The function returns an array with one row
    const result = data[0];

    if (!result.is_valid) {
      return NextResponse.json(
        {
          success: false,
          error: result.error_message || 'Invalid gift card',
        },
        { status: 400 }
      );
    }

    // Return successful validation with balance
    return NextResponse.json({
      success: true,
      cardNumber: cleanCardNumber.replace(/(\d{4})/g, '$1 ').trim(), // Format with spaces
      balance: parseFloat(result.current_balance),
      currency: result.currency || 'NGN',
      isActive: result.is_active,
      expiresAt: result.expires_at,
    });
  } catch (error) {
    console.error('Gift card balance check error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
