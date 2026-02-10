import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET - List all gift cards
export async function GET(request: NextRequest) {
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

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabaseAdmin = getSupabaseAdminClient();

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status'); // 'active', 'inactive', 'expired'
    const search = searchParams.get('search'); // Search by card number

    let query = supabaseAdmin
      .from('gift_cards')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply filters
    const now = new Date().toISOString();
    if (status === 'active') {
      query = query.eq('is_active', true).gt('expires_at', now).gt('current_balance', 0);
    } else if (status === 'inactive') {
      query = query.eq('is_active', false);
    } else if (status === 'expired') {
      query = query.lte('expires_at', now);
    } else if (status === 'fully_used') {
      query = query.eq('current_balance', 0);
    }

    if (search) {
      // Search by card_number, code, or recipient_email
      query = query.or(`card_number.ilike.%${search}%,code.ilike.%${search}%,recipient_email.ilike.%${search}%`);
    }

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: giftCards, error, count } = await query;

    if (error) {
      console.error('Error fetching gift cards:', error);
      return NextResponse.json({ error: 'Failed to fetch gift cards' }, { status: 500 });
    }

    // Calculate summary statistics
    const { data: summary } = await supabaseAdmin
      .from('gift_cards')
      .select('initial_balance, current_balance, is_active, expires_at');

    const totalIssued = summary?.length || 0;
    const totalValue = summary?.reduce((sum, gc) => sum + Number(gc.initial_balance), 0) || 0;
    const remainingBalance = summary?.reduce((sum, gc) => sum + Number(gc.current_balance), 0) || 0;
    const redeemedValue = totalValue - remainingBalance;
    const redemptionRate = totalValue > 0 ? (redeemedValue / totalValue) * 100 : 0;

    return NextResponse.json({
      giftCards,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
      summary: {
        total_issued: totalIssued,
        total_value: totalValue,
        remaining_balance: remainingBalance,
        redeemed_value: redeemedValue,
        redemption_rate: Math.round(redemptionRate * 100) / 100,
      },
    });
  } catch (error) {
    console.error('Gift cards list error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create a new gift card
export async function POST(request: NextRequest) {
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

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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

    const {
      initialBalance,
      recipientEmail,
      recipientName,
      message,
      expiryMonths = 12,
    } = body;

    // Validate
    if (!initialBalance || initialBalance <= 0) {
      return NextResponse.json(
        { error: 'Initial balance must be greater than 0' },
        { status: 400 }
      );
    }

    // Generate card number (16 digits)
    const cardNumber = Array.from({ length: 16 }, () =>
      Math.floor(Math.random() * 10)
    ).join('');

    // Generate PIN (4 digits)
    const pin = Array.from({ length: 4 }, () =>
      Math.floor(Math.random() * 10)
    ).join('');

    // Calculate expiry date
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + expiryMonths);

    // Create gift card
    const { data: giftCard, error } = await supabaseAdmin
      .from('gift_cards')
      .insert({
        card_number: cardNumber,
        pin: pin,
        initial_balance: initialBalance,
        current_balance: initialBalance,
        currency: 'NGN',
        is_active: true,
        activated_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        recipient_email: recipientEmail,
        recipient_name: recipientName,
        message: message,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating gift card:', error);
      return NextResponse.json(
        { error: 'Failed to create gift card' },
        { status: 500 }
      );
    }

    // Create initial transaction
    await supabaseAdmin.from('gift_card_transactions').insert({
      gift_card_id: giftCard.id,
      transaction_type: 'purchase',
      amount: initialBalance,
      balance_before: 0,
      balance_after: initialBalance,
      description: 'Gift card created',
      created_by: user.id,
    });

    return NextResponse.json({
      success: true,
      giftCard: {
        ...giftCard,
        // Include card details for admin (masked in other contexts)
        cardNumber,
        pin,
      },
    });
  } catch (error) {
    console.error('Gift card creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
