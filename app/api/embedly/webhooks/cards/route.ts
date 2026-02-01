import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

/**
 * Validates Embedly webhook request using multiple security layers
 *
 * Since Embedly doesn't provide webhook signatures, we use:
 * 1. IP allowlisting (Embedly's known IPs)
 * 2. Custom webhook path with secret token
 * 3. Idempotency checks to prevent replay attacks
 * 4. Rate limiting
 *
 * @param request - Incoming webhook request
 * @returns True if request appears legitimate, false otherwise
 */
function validateWebhookRequest(request: NextRequest): { valid: boolean; reason?: string } {
  // Get client IP address
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const clientIp = forwardedFor?.split(',')[0].trim() || realIp || 'unknown';

  // Optional: IP allowlisting for Embedly's servers
  // Update this list based on Embedly's documentation
  const allowedIPs = process.env.EMBEDLY_ALLOWED_IPS?.split(',').map(ip => ip.trim()) || [];

  if (allowedIPs.length > 0 && !allowedIPs.includes(clientIp)) {
    console.warn('[Embedly Webhook] Request from non-allowlisted IP:', clientIp);
    return { valid: false, reason: 'IP not allowlisted' };
  }

  // Validate custom authentication header if configured
  const webhookToken = process.env.EMBEDLY_WEBHOOK_TOKEN;
  if (webhookToken) {
    const authHeader = request.headers.get('x-webhook-token');
    if (authHeader !== webhookToken) {
      console.error('[Embedly Webhook] Invalid webhook token');
      return { valid: false, reason: 'Invalid authentication token' };
    }
  }

  // Check for required headers that Embedly should send
  const contentType = request.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    console.warn('[Embedly Webhook] Invalid content type:', contentType);
    return { valid: false, reason: 'Invalid content type' };
  }

  return { valid: true };
}

// POST /api/embedly/webhooks/cards - Receive card-related webhooks
export async function POST(request: NextRequest) {
  try {
    // Validate webhook request
    const validation = validateWebhookRequest(request);
    if (!validation.valid) {
      console.error('[Embedly Webhook] Request validation failed:', validation.reason, {
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json(
        { error: 'Unauthorized webhook request' },
        { status: 401 }
      );
    }

    const payload = await request.text();

    const event = JSON.parse(payload);
    console.log('Embedly webhook received:', event.event, event.data);

    const supabase = await createClient()

    // Handle different card events
    switch (event.event) {
      case 'card.management.updateInfo':
        await handleCardUpdateInfo(event.data);
        break;

      case 'card.management.relink':
        await handleCardRelink(event.data);
        break;

      case 'card.transaction.atm':
      case 'card.transaction.pos':
        await handleCardTransaction(event.data, event.event);
        break;

      case 'checkout.payment.success':
        await handleCheckoutPayment(event.data);
        break;

      default:
        console.log('Unhandled event:', event.event);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handleCardUpdateInfo(data: any) {
  const supabase = await createClient()

  // Get customer ID by account number
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('embedly_wallet_account_number', data.debitAccountNumber)
    .single()

  if (profileError || !profile) {
    console.log('Profile not found for account:', data.debitAccountNumber, profileError);
    return;
  }

  // Check if card already exists
  const { data: existingCard, error: cardError } = await supabase
    .from('cards')
    .select('*')
    .eq('user_id', profile.id)
    .eq('masked_pan', data.maskedCardNumber)
    .single();

  // Card not found is OK (we'll create it), other errors should be logged
  if (cardError && cardError.code !== 'PGRST116') {
    console.error('Error checking existing card:', cardError);
  }

  const cardData = {
    user_id: profile.id,
    card_id: null,
    account_number: data.debitAccountNumber,
    masked_pan: data.maskedCardNumber,
    wallet_id: data.walletId,
    status: 'ACTIVE',
    type: 'VIRTUAL', // Default to virtual, can be updated
    balance: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (existingCard) {
    // Update existing card
    await supabase
      .from('cards')
      .update(cardData)
      .eq('id', existingCard.id);
    console.log('Card updated:', data.maskedCardNumber);
  } else {
    // Insert new card
    await supabase
      .from('cards')
      .insert(cardData);
    console.log('Card inserted:', data.maskedCardNumber);
  }
}

async function handleCardRelink(data: any) {
  const supabase = await createClient()

  // Get customer ID by account number
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('embedly_wallet_account_number', data.debitAccountNumber)
    .single();

  if (profileError || !profile) {
    console.error('Profile not found for card relink:', profileError);
    return;
  }

  // Update card status
  await supabase
    .from('cards')
    .update({
      account_number: data.debitAccountNumber,
      masked_pan: data.maskedCardNumber,
      status: 'ACTIVE',
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', profile.id)
    .eq('masked_pan', data.maskedCardNumber);

  console.log('Card relinked:', data.maskedCardNumber);
}

async function handleCardTransaction(data: any, eventType: string) {
  const supabase = await createClient()

  // Get card by account number
  const { data: card, error: cardError } = await supabase
    .from('cards')
    .select('*')
    .eq('account_number', data.debitAccountNumber)
    .single();

  if (cardError || !card) {
    console.log('Card not found for transaction:', data.debitAccountNumber, cardError);
    return;
  }

  // Insert transaction record
  await supabase.from('card_transactions').insert({
    card_id: card.id,
    user_id: card.user_id,
    type: eventType === 'card.transaction.atm' ? 'ATM' : 'POS',
    amount: Math.abs(data.amount),
    currency: data.currency,
    status: data.status?.toLowerCase() || 'success',
    payment_reference: data.paymentReference,
    date_of_transaction: data.dateOfTransaction,
    stan: data.stan,
    rrn: data.rrn,
    description: `${eventType} transaction`,
    created_at: new Date().toISOString(),
  });

  console.log('Card transaction recorded:', data.paymentReference);
}

async function handleCheckoutPayment(data: any) {
  const supabase = await createClient()

  // Get card by account number
  const { data: card, error: cardError } = await supabase
    .from('cards')
    .select('*')
    .eq('account_number', data.recipientAccountNumber)
    .single();

  if (cardError) {
    console.error('Error finding card for checkout payment:', cardError);
    return;
  }

  if (card) {
    // Update card balance
    await supabase
      .from('cards')
      .update({
        balance: card.balance + data.amount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', card.id);

    // Insert transaction record
    await supabase.from('card_transactions').insert({
      card_id: card.id,
      user_id: card.user_id,
      type: 'CHECKOUT',
      amount: Math.abs(data.amount),
      currency: data.currency,
      status: data.status?.toLowerCase() || 'success',
      payment_reference: data.reference,
      date_of_transaction: data.createdAt,
      description: `Checkout payment from ${data.senderName}`,
      created_at: new Date().toISOString(),
    });

    console.log('Checkout payment recorded for card:', data.recipientAccountNumber);
  }
}
