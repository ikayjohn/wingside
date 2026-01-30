# Nomba Payment Reference Bug

**Date:** January 30, 2026
**Severity:** CRITICAL
**Affected Order:** WS202601300056

## The Problem

Customer successfully paid via Nomba, but:
- ❌ Callback showed "Payment Failed"
- ❌ Order remained "pending" in database
- ❌ Payment reference was **null** in database
- ❌ Payment gateway showed "paystack" instead of "nomba"

## Root Cause

The Nomba payment initialization either:
1. Was never called (user bypassed normal flow)
2. Failed silently without updating the order
3. Updated the order but was overwritten by something else

Without a `payment_reference`, the callback cannot verify the payment with Nomba API.

## Database State (Before Fix)

```
Order Number: WS202601300056
Status: pending
Payment Status: pending
Payment Gateway: paystack  ← Should be 'nomba'
Payment Reference: null    ← CRITICAL: Should have order reference
Total: 250
```

## Expected Flow

```
1. User completes checkout with Nomba selected
2. POST /api/orders → Creates order with payment_method='nomba'
3. POST /api/payment/nomba/initialize →
   - Creates Nomba checkout
   - Updates order:
     * payment_reference = 'WS-{order_number}-{timestamp}'
     * payment_gateway = 'nomba'
   - Returns checkout_url
4. User redirected to Nomba payment page
5. User completes payment
6. Nomba redirects to /payment/nomba/callback?order_id={id}
7. Callback verifies payment using payment_reference
8. Order marked as paid
```

## What Actually Happened

```
1. ✅ User completed checkout
2. ✅ Order created (but payment_gateway='paystack')
3. ❌ Initialize endpoint either not called or failed
4. ❓ User somehow paid on Nomba
5. ✅ Redirected to callback
6. ❌ Callback verification failed (no payment_reference)
7. ❌ Order showed as "Payment Failed"
8. ✅ Order manually fixed by admin
```

## Potential Causes

### 1. Initialize Endpoint Not Called
- Frontend error before initialize call
- User closed page before redirect
- Network error during initialize request

### 2. Initialize Update Failed Silently
- Supabase RLS policy blocked update
- Database constraint violation
- Race condition

### 3. Payment Gateway Confusion
- Order created with wrong payment_gateway default
- Something overwriting payment_gateway back to 'paystack'

### 4. User Bypassed Normal Flow
- User had old Nomba link in browser history
- Direct link to Nomba checkout without going through our initialize

## Fixes Implemented

### 1. Improved Logging in Verify Endpoint
```typescript
// Now logs all verification attempts
console.log('[Nomba Verify] API Response:', {
  code, description, transactionRef, resultsCount
})

console.log('[Nomba Verify] Transaction found:', {
  id, status, amount
})
```

### 2. Multiple Success Status Handling
```typescript
// Handle variations in Nomba status values
const successStatuses = ['SUCCESSFUL', 'SUCCESS', 'COMPLETED', 'APPROVED']
const isSuccessful = successStatuses.includes(status.toUpperCase())
```

### 3. Better Error Messages
```typescript
// Inform users about missing transactions
{
  success: false,
  error: 'Transaction not found',
  message: 'Payment verification failed. The transaction may still be processing...'
}
```

## Recommended Additional Fixes

### 1. Add Failsafe in Initialize Endpoint
```typescript
// Return error if order update fails, don't proceed
if (updateError) {
  console.error('Failed to update order:', updateError)
  return NextResponse.json(
    { error: 'Failed to initialize payment. Please try again.' },
    { status: 500 }
  )
}
```

### 2. Verify Payment Reference Exists in Callback
```typescript
if (!order.payment_reference) {
  // Try to find transaction by order number/amount
  // Or show clear error to contact support
}
```

### 3. Add Initialize Logging to Database
Create `payment_initializations` table to track:
- order_id
- payment_gateway
- payment_reference
- initialization_attempt_at
- checkout_url_generated
- user_redirected (boolean)

### 4. Add Health Check Endpoint
```typescript
// GET /api/payment/nomba/health
// - Verify Nomba credentials
// - Test authentication
// - Return status
```

### 5. Webhook Fallback
Even if callback fails, the webhook should process successful payments:
- Webhook searches for order by order reference
- Updates order status even if callback never happened
- More reliable than callback alone

## Prevention

1. **Monitor payment_reference nulls:**
   ```sql
   SELECT COUNT(*) FROM orders
   WHERE payment_gateway IN ('nomba', 'paystack')
   AND payment_reference IS NULL
   AND created_at > NOW() - INTERVAL '24 hours'
   ```

2. **Alert on verification failures:**
   - Track failed verifications in logs
   - Alert if > 5% of verifications fail

3. **Add frontend validation:**
   - Don't allow user to leave page during initialization
   - Show loading state during redirect
   - Retry initialize if it fails

4. **Test flows regularly:**
   - Automated test for full payment flow
   - Monitor Nomba API status
   - Test both success and failure paths

## Manual Recovery Process

When this happens again:

1. **Confirm payment with customer/bank:**
   - Ask for transaction reference
   - Check Nomba dashboard

2. **Find the order:**
   ```sql
   SELECT * FROM orders
   WHERE customer_email = 'email@example.com'
   AND created_at > NOW() - INTERVAL '1 hour'
   ORDER BY created_at DESC
   LIMIT 5
   ```

3. **Manually update if payment confirmed:**
   ```sql
   UPDATE orders SET
     status = 'confirmed',
     payment_status = 'paid',
     payment_gateway = 'nomba',
     payment_reference = '[transaction_ref_from_nomba]',
     paid_at = NOW(),
     updated_at = NOW()
   WHERE order_number = 'WS202601300056'
   ```

4. **Send confirmation email manually**

5. **Investigate logs to find root cause**

## Related Issues

- Payment cancellation fix: `PAYMENT_CANCELLATION_FIX.md`
- Nomba amount format fix: `NOMBA_AMOUNT_FIX.md`
- Webhook deployment: `docs/NOMBA_WEBHOOK_DEPLOYMENT_ISSUE.md`

## Status

- ✅ Order WS202601300056 manually fixed
- ✅ Verify endpoint improved with logging
- ⏳ Need to add failsafe to initialize endpoint
- ⏳ Need to investigate exact cause via logs
- ⏳ Need to implement monitoring
