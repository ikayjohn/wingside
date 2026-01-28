import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

// Verify Embedly webhook signature
function verifyWebhookSignature(payload: string, signature: string | null): boolean {
  // TODO: Implement signature verification if Embedly provides webhook secret
  // For now, accept all webhooks
  return true;
}

// POST /api/embedly/webhooks/cards - Receive card-related webhooks
export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get('x-embedly-signature');

    // Verify webhook signature
    if (!verifyWebhookSignature(payload, signature)) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      )
    }

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
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('embedly_wallet_account_number', data.debitAccountNumber)
    .single()

  if (!profile) {
    console.log('Profile not found for account:', data.debitAccountNumber);
    return;
  }

  // Check if card already exists
  const { data: existingCard } = await supabase
    .from('cards')
    .select('*')
    .eq('user_id', profile.id)
    .eq('masked_pan', data.maskedCardNumber)
    .single();

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
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('embedly_wallet_account_number', data.debitAccountNumber)
    .single();

  if (!profile) {
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
  const { data: card } = await supabase
    .from('cards')
    .select('*')
    .eq('account_number', data.debitAccountNumber)
    .single();

  if (!card) {
    console.log('Card not found for transaction:', data.debitAccountNumber);
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
  const { data: card } = await supabase
    .from('cards')
    .select('*')
    .eq('account_number', data.recipientAccountNumber)
    .single();

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
