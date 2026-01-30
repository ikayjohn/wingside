# Nomba Payment Gateway - Comprehensive Analysis & Fix

**Date:** January 30, 2026
**Status:** 🔧 IN PROGRESS

---

## 📊 Current State Analysis

### Payment Flow Diagram

```
1. Customer Checkout
   ↓
2. Initialize Payment (✅ WORKING)
   - Creates Nomba checkout order
   - Saves payment_reference to database
   - Returns checkout URL
   ↓
3. Customer Pays on Nomba (✅ WORKING)
   ↓
4. Nomba Sends Webhook (⚠️ PARTIAL)
   - Receives payment_success event ✅
   - Signature verification FAILS ❌
   - Marks order as paid ✅
   - Rewards processing FAILS ❌
   - Order gets ROLLED BACK ❌
   ↓
5. Customer Redirected to Callback (❌ BROKEN)
   - Checks if order is paid (it's not - rolled back)
   - Calls verify endpoint
   - Verify can't find transaction ❌
   - Cancels the order ❌
   ↓
6. Result: Payment successful but order cancelled ❌
```

---

## 🐛 Issues Identified

### Issue #1: Webhook Signature Verification Failing

**Symptom:**
```
Invalid Nomba webhook signature
Expected: TxcPbWULdUf5mx1L0xGJ6GsXtaPWY5I9TTyBuoUwx5Y=
Received: r8Mp6QDlzWsxzOHuoLLvbtpOLpsedvGxjbzxIqasxlM=
```

**Root Cause:**
According to [Nomba's official documentation](https://developer.nomba.com/products/webhooks/signature-verification-new), the signature string format is:

```
event_type:requestId:merchant.userId:merchant.walletId:transaction.transactionId:transaction.type:transaction.time:transaction.responseCode:timestamp
```

**Current Implementation (WRONG):**
```typescript
// webhook/route.ts line 67-77
const signatureString = [
  parsedEvent.event_type || '',
  parsedEvent.requestId || parsedEvent.request_id || '',
  parsedEvent.data?.merchant?.userId || '',
  parsedEvent.data?.merchant?.walletId || '',
  parsedEvent.data?.transaction?.transactionId || '',
  parsedEvent.data?.transaction?.type || '',
  parsedEvent.data?.transaction?.time || '',
  parsedEvent.data?.transaction?.responseCode || '00',
  timestamp || ''
].join(':')
```

**Issues:**
1. ✅ Using correct fields
2. ❌ But field names might be camelCase vs snake_case
3. ❌ Default responseCode to '00' might be wrong
4. ❌ Timestamp format might be different

**Fix:**
- Log the actual payload structure
- Match field names exactly as they appear in webhook
- Don't default responseCode if it's missing

---

### Issue #2: Verify Endpoint Can't Find Transactions

**Symptom:**
```
[Nomba Verify] API Response: {
  code: '00',
  description: 'SUCCESS',
  transactionRef: 'WS-WS202601300063-1769782676441',
  resultsCount: 0
}
[Nomba Verify] ❌ Transaction not found for ref: WS-WS202601300063-1769782676441
```

**Root Cause:**
The verify endpoint calls `POST https://api.nomba.com/v1/transactions/accounts` with our `orderReference` (e.g., `WS-WS202601300063-1769782676441`), but Nomba might not index transactions by this field.

**What We're Searching With:**
- `orderReference`: Our custom reference (what we generate)

**What Nomba Might Expect:**
- `transactionId`: Nomba's transaction ID (e.g., `WEB-ONLINE_C-DFB21-...`)
- Different endpoint or parameter

**Why This Matters:**
- The callback page relies on verification to confirm payment
- If verification fails, it cancels the order
- But the payment actually succeeded!

**Fix:**
- Check [Nomba's transaction verification docs](https://developer.nomba.com/products/checkout/verify-transactions)
- Use the correct transaction identifier
- OR remove verification from callback (rely on webhook only)

---

### Issue #3: Callback/Webhook Race Condition

**Symptom:**
Payment succeeds → Webhook processes → Rewards fail → Order rolled back → Callback cancels order

**Root Cause:**
Two different systems trying to confirm the same payment:

1. **Webhook** (server-to-server, reliable):
   - Receives payment_success from Nomba
   - Marks order as paid
   - Processes rewards
   - If rewards fail → rolls back order

2. **Callback** (browser redirect, unreliable):
   - User redirected after payment
   - Checks if order is paid
   - If not → tries to verify
   - If verify fails → cancels order

**The Problem:**
- Webhook is the source of truth
- Callback shouldn't cancel orders that webhook is processing
- Race condition: callback runs before webhook completes

**Fix:**
Callback should:
1. Check if order is already paid (webhook succeeded) → show success
2. If not paid yet → wait and poll order status (webhook might be processing)
3. Only call verify if webhook hasn't updated order after timeout
4. Never cancel orders - only webhook should do that

---

### Issue #4: Rewards Processing Failure

**Symptom:**
```
❌ Rewards processing failed: First order bonus failed: column "status" does not exist
```

**Root Cause:**
The `process_payment_atomically` function calls `claim_first_order_reward`, which doesn't exist.

**Current Code:**
```sql
-- Line 39 in process_payment_atomically
PERFORM claim_first_order_reward(p_user_id, p_order_id);
```

**Missing Function:**
`claim_first_order_reward` was never created.

**Fix:**
Create the missing function or modify the logic to use existing `claim_reward` function.

---

### Issue #5: Webhook Rollback on Failure

**Symptom:**
Any failure in rewards processing causes the entire payment to be rolled back.

**Current Logic:**
```typescript
// webhook/route.ts line 288-292
// Rollback order status since rewards failed
await admin.from('orders').update({
  payment_status: 'pending',
  status: 'pending'
}).eq('id', order.id)
```

**The Problem:**
- Customer paid successfully
- Money was transferred
- But we cancel the order because points failed?
- This creates discrepancy: payment succeeded, order cancelled

**Fix:**
- Don't rollback payment confirmation
- Log reward failures for manual processing
- Send admin notification
- Order stays paid, but rewards are pending

---

## 🔧 Comprehensive Fix Plan

### Fix #1: Correct Webhook Signature Verification

```typescript
// webhook/route.ts
// Step 1: Log the actual payload structure
console.log('Full webhook payload:', JSON.stringify(event, null, 2))

// Step 2: Build signature string exactly as Nomba expects
const signatureString = [
  event.event_type,
  event.requestId,
  event.data?.merchant?.userId ?? '',
  event.data?.merchant?.walletId ?? '',
  event.data?.transaction?.transactionId ?? '',
  event.data?.transaction?.type ?? '',
  event.data?.transaction?.time ?? '',
  event.data?.transaction?.responseCode ?? '',
  timestamp
].join(':')

console.log('Signature components:', {
  event_type: event.event_type,
  requestId: event.requestId,
  userId: event.data?.merchant?.userId,
  walletId: event.data?.merchant?.walletId,
  transactionId: event.data?.transaction?.transactionId,
  type: event.data?.transaction?.type,
  time: event.data?.transaction?.time,
  responseCode: event.data?.transaction?.responseCode,
  timestamp
})

// Step 3: Compare
console.log('Built signature string:', signatureString)
console.log('Expected signature:', expectedSignature)
console.log('Received signature:', signature)
```

### Fix #2: Remove Verify Endpoint from Callback Flow

**New Callback Logic:**
```typescript
// callback/page.tsx

const verifyPayment = async () => {
  try {
    // Step 1: Get order details
    const orderResponse = await fetch(`/api/orders/${orderId}`)
    const orderData = await orderResponse.json()

    if (!orderData.order) {
      throw new Error('Order not found')
    }

    const order = orderData.order

    // Step 2: Check if webhook already processed it
    if (order.payment_status === 'paid') {
      setPaymentStatus('success')
      setMessage('Payment successful!')
      // Redirect to confirmation
      return
    }

    // Step 3: If not paid yet, wait for webhook (poll for 30 seconds)
    let attempts = 0
    const maxAttempts = 15 // 15 attempts x 2 seconds = 30 seconds

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds

      const checkResponse = await fetch(`/api/orders/${orderId}`)
      const checkData = await checkResponse.json()

      if (checkData.order?.payment_status === 'paid') {
        setPaymentStatus('success')
        setMessage('Payment confirmed!')
        return
      }

      attempts++
    }

    // Step 4: After 30 seconds, show pending state
    setPaymentStatus('error')
    setMessage('Payment is being processed. Check your email for confirmation.')
    // DON'T cancel the order - webhook might still process it

  } catch (error) {
    setPaymentStatus('error')
    setMessage('Unable to verify payment status. Please contact support.')
  }
}
```

### Fix #3: Create Missing Database Functions

```sql
-- Create claim_first_order_reward function
CREATE OR REPLACE FUNCTION claim_first_order_reward(
    p_user_id UUID,
    p_order_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_bonus_points INTEGER := 50; -- First order bonus points
    v_already_claimed BOOLEAN;
BEGIN
    -- Check if user already claimed first order bonus
    SELECT EXISTS (
        SELECT 1 FROM reward_claims
        WHERE user_id = p_user_id
        AND reward_type = 'first_order'
    ) INTO v_already_claimed;

    IF v_already_claimed THEN
        RAISE NOTICE 'User % already claimed first order bonus', p_user_id;
        RETURN FALSE;
    END IF;

    -- Award the bonus using claim_reward
    RETURN claim_reward(
        p_user_id,
        'first_order',
        v_bonus_points,
        'First order bonus',
        jsonb_build_object('order_id', p_order_id)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION claim_first_order_reward(UUID, UUID) TO service_role;
```

### Fix #4: Don't Rollback Payments

```typescript
// webhook/route.ts - REMOVE the rollback logic

// OLD (WRONG):
if (paymentError) {
  // Rollback order status since rewards failed
  await admin.from('orders').update({
    payment_status: 'pending',
    status: 'pending'
  }).eq('id', order.id)

  return NextResponse.json({ error: 'Payment processing failed' }, { status: 500 })
}

// NEW (CORRECT):
if (paymentError || !paymentResult || paymentResult.length === 0) {
  console.error('❌ Payment processing failed:', paymentError)

  // Create admin notification (rewards failed, needs manual processing)
  await admin.from('notifications').insert({
    user_id: null,
    type: 'reward_processing_failed',
    title: 'Reward Processing Failed',
    message: `Order ${order.order_number} paid but rewards failed. Manual processing required.`,
    metadata: {
      user_id: profileId,
      order_id: order.id,
      order_number: order.order_number,
      error: paymentError?.message || 'Unknown error'
    }
  })

  // IMPORTANT: Don't rollback payment! Order stays paid.
  console.log('⚠️ Order paid but rewards pending manual processing')

  // Continue with email notifications
}
```

### Fix #5: Improve Error Handling

```typescript
// Add retry logic for external services
async function syncWithRetry(syncFn: () => Promise<any>, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await syncFn()
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
}

// Use it for external syncs
try {
  await syncWithRetry(() => syncNewCustomer({ ... }))
} catch (error) {
  console.error('Customer sync failed after retries:', error)
}
```

---

## 📋 Implementation Checklist

### Phase 1: Database Fixes
- [x] Create `process_payment_atomically` function
- [ ] Create `claim_first_order_reward` function
- [ ] Test database functions in Supabase SQL editor

### Phase 2: Webhook Fixes
- [ ] Add detailed payload logging
- [ ] Fix signature verification
- [ ] Remove payment rollback logic
- [ ] Add reward failure notifications
- [ ] Test with real webhook

### Phase 3: Callback Fixes
- [ ] Remove verify endpoint call
- [ ] Add polling logic
- [ ] Update UI messaging
- [ ] Test callback flow

### Phase 4: Testing
- [ ] Test full payment flow end-to-end
- [ ] Verify webhook signature passes
- [ ] Verify rewards process correctly
- [ ] Test failure scenarios
- [ ] Monitor logs for 24 hours

---

## 📚 Resources

- [Nomba Developer Docs](https://developer.nomba.com/docs/guides/introduction)
- [Webhook Signature Verification](https://developer.nomba.com/products/webhooks/signature-verification-new)
- [Transaction Verification](https://developer.nomba.com/products/checkout/verify-transactions)
- [Setting up Webhooks](https://developer.nomba.com/support/guides/setting-up-webhooks)

---

## 🎯 Success Criteria

Payment flow should:
1. ✅ Initialize checkout successfully
2. ✅ Webhook receives and verifies signature
3. ✅ Order marked as paid (even if rewards fail)
4. ✅ Callback shows success immediately
5. ✅ Rewards process or queue for manual handling
6. ✅ Customer receives confirmation email
7. ✅ No false cancellations

---

## 📊 Testing Plan

### Test Case 1: Successful Payment
```
1. Create order
2. Pay with Nomba test card
3. Verify webhook received
4. Verify signature passes
5. Verify order marked as paid
6. Verify callback shows success
7. Verify rewards awarded
```

### Test Case 2: Webhook Failure (Rewards)
```
1. Temporarily break rewards function
2. Create order and pay
3. Verify webhook received
4. Verify order STILL marked as paid
5. Verify admin notification created
6. Verify callback shows success
7. Verify no rollback occurred
```

### Test Case 3: Slow Webhook
```
1. Add artificial delay to webhook
2. Create order and pay
3. Verify callback polls and waits
4. Verify success shown after webhook completes
```

---

## 🚀 Next Steps

1. Review this document
2. Implement fixes in order (Database → Webhook → Callback)
3. Test each phase before moving to next
4. Deploy and monitor production
5. Document any additional findings
