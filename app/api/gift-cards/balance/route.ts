import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, getClientIp, rateLimitErrorResponse } from '@/lib/rate-limit';

function getSupabaseAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdminClient();

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

    // Rate limiting: 10 checks per minute per IP to prevent brute force
    const clientIp = await getClientIp();
    const rateLimitKey = `gift-card-balance:${clientIp}`;
    const rateLimit = await checkRateLimit(rateLimitKey, {
      limit: 10,
      window: 60 * 1000,
      blockDuration: 5 * 60 * 1000,
    });

    if (!rateLimit.success) {
      return rateLimitErrorResponse(rateLimit);
    }

    const { code, cardNumber, pin } = body;

    // Support two formats:
    // 1. New format: { code: "ABCD1234EFGH" } (12-char alphanumeric)
    // 2. Legacy format: { cardNumber: "1234567890123456", pin: "1234" }

    if (code) {
      // New format: lookup by 12-digit code
      const codeStr = String(code).trim().toUpperCase();

      if (!/^[A-Z0-9]{4,16}$/.test(codeStr)) {
        return NextResponse.json(
          { error: 'Invalid gift card code format' },
          { status: 400 }
        );
      }

      // Look up gift card by code
      const { data: giftCard, error: giftCardError } = await supabaseAdmin
        .from('gift_cards')
        .select('id, code, current_balance, currency, is_active, expires_at, recipient_name')
        .eq('code', codeStr)
        .single();

      if (giftCardError || !giftCard) {
        return NextResponse.json(
          { success: false, error: 'Invalid gift card code' },
          { status: 400 }
        );
      }

      // Check if active
      if (!giftCard.is_active) {
        return NextResponse.json(
          { success: false, error: 'Gift card is not active' },
          { status: 400 }
        );
      }

      // Check if expired
      if (giftCard.expires_at && new Date(giftCard.expires_at) < new Date()) {
        return NextResponse.json(
          { success: false, error: 'Gift card has expired' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        code: giftCard.code,
        balance: parseFloat(String(giftCard.current_balance)),
        currency: giftCard.currency || 'NGN',
        isActive: giftCard.is_active,
        expiresAt: giftCard.expires_at,
        recipientName: giftCard.recipient_name,
      });
    } else if (cardNumber) {
      // Legacy format: lookup by card_number + PIN
      if (!pin) {
        return NextResponse.json(
          { error: 'PIN is required for card number lookup' },
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

      const cleanCardNumber = cardNumber.replace(/\s/g, '');

      // Call the validate_gift_card function (legacy path)
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

      const result = Array.isArray(data) ? data[0] : data;

      if (!result || !result.is_valid) {
        return NextResponse.json(
          {
            success: false,
            error: result?.error_message || 'Invalid gift card',
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        cardNumber: cleanCardNumber.replace(/(\d{4})/g, '$1 ').trim(),
        balance: parseFloat(result.current_balance),
        currency: result.currency || 'NGN',
        isActive: result.is_active,
        expiresAt: result.expires_at,
      });
    } else {
      return NextResponse.json(
        { error: 'Either a gift card code or card number is required' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Gift card balance check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
