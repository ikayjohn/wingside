# Payment Cancellation Fix

**Date:** January 30, 2026
**Status:** ✅ Fixed

## The Problem

When customers cancelled payments on payment gateway popups (Nomba or Paystack), the orders remained as "pending" in both the customer dashboard and admin orders page indefinitely.

### User Impact
- ❌ Admins saw fake "pending" orders that would never be completed
- ❌ Customers saw orders stuck in "pending" status in their dashboard
- ❌ No way to distinguish between abandoned orders and legitimately pending orders
- ❌ Confusing for both customers and admin staff

## Root Cause

The payment callback pages were showing "Payment Failed" UI to users but never updating the order status in the database.

### Previous Flow (Broken)
```
1. User creates order → status: "pending", payment_status: "pending"
2. User redirected to payment gateway (Nomba/Paystack)
3. User cancels payment or payment fails
4. User redirected back to callback page
5. Callback verifies payment → verification fails
6. Callback shows "Payment Failed" UI ✅
7. Order status remains "pending" in database ❌ ← THE BUG
```

## The Fix

Now when payment fails or is cancelled, the order status is automatically updated to `cancelled` with `payment_status: 'failed'`.

### New Flow (Fixed)
```
1. User creates order → status: "pending", payment_status: "pending"
2. User redirected to payment gateway (Nomba/Paystack)
3. User cancels payment or payment fails
4. User redirected back to callback page
5. Callback verifies payment → verification fails
6. Callback calls /api/orders/[id]/cancel ✅
7. Order status updated to "cancelled" ✅
8. Callback shows "Payment Failed" UI ✅
```

## Files Changed

### New Files Created
1. **`app/api/orders/[id]/cancel/route.ts`** - New API endpoint to cancel orders
   - Validates order exists and isn't already paid
   - Updates status to "cancelled" and payment_status to "failed"
   - Prevents cancelling already-paid orders

### Modified Files

1. **`app/payment/nomba/callback/page.tsx`** (lines 69-95)
   - Added call to `/api/orders/[id]/cancel` when payment verification fails
   - Better error message for users

2. **`app/api/payment/nomba/webhook/route.ts`** (lines 80-118)
   - Added handlers for `payment_failed` and `payment_cancelled` webhook events
   - Updates order status when Nomba sends failure notifications

3. **`app/payment/callback/page.tsx`** (lines 31-66)
   - Added call to `/api/orders/[id]/cancel` when Paystack payment fails
   - Consistent with Nomba behavior

4. **`app/api/payment/verify/route.ts`** (lines 51-75)
   - Now updates order status to cancelled when Paystack verification fails
   - Only updates orders that are still "pending"

## Order Status Flow

### Before Fix
```
pending → paid (success only, failures ignored)
```

### After Fix
```
pending → paid (on success)
       → cancelled (on failure/cancellation)
```

## Testing

### Manual Testing

1. **Test Nomba Cancellation:**
   ```bash
   # Start dev server
   npm run dev

   # Create an order and select Nomba payment
   # On Nomba popup, click "Cancel" or close the popup
   # Return to site - order should show as "cancelled"
   ```

2. **Test Paystack Cancellation:**
   ```bash
   # Create an order and select Paystack payment
   # On Paystack popup, click "Cancel" or close the popup
   # Return to site - order should show as "cancelled"
   ```

3. **Verify in Admin:**
   ```
   # Go to /admin/orders
   # Cancelled orders should show status: "cancelled"
   # Should not appear in "pending" list
   ```

4. **Verify in Customer Dashboard:**
   ```
   # Log in as customer
   # Go to orders/dashboard
   # Cancelled orders should show as "cancelled", not "pending"
   ```

### Database Check

```sql
-- Check cancelled orders
SELECT id, order_number, status, payment_status, created_at, updated_at
FROM orders
WHERE status = 'cancelled'
ORDER BY created_at DESC
LIMIT 10;

-- Verify no old stuck pending orders (adjust date as needed)
SELECT COUNT(*)
FROM orders
WHERE status = 'pending'
AND created_at < NOW() - INTERVAL '1 hour';
```

## API Endpoint Details

### POST /api/orders/[id]/cancel

**Purpose:** Cancel an order due to payment failure

**Request Body:**
```json
{
  "reason": "payment_failed",
  "source": "nomba_callback" | "paystack_callback"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Order cancelled",
  "order_number": "WS-12345"
}
```

**Response (Already Paid):**
```json
{
  "error": "Cannot cancel paid order"
}
```

**Behavior:**
- ✅ Cancels orders with `payment_status: 'pending'`
- ✅ Prevents cancelling already-paid orders
- ✅ Idempotent - safe to call multiple times
- ✅ Logs all cancellation attempts

## Webhook Support

### Nomba Webhooks

Now handles these event types:
- `payment_success` - Marks order as paid ✅
- `payment_failed` - Marks order as cancelled ✅ (NEW)
- `payment_cancelled` - Marks order as cancelled ✅ (NEW)

### Paystack Webhooks

The verify endpoint now handles:
- `status: 'success'` - Marks order as paid ✅
- `status: 'failed'` - Marks order as cancelled ✅ (NEW)
- `status: 'abandoned'` - Marks order as cancelled ✅ (NEW)

## Optional: Clean Up Old Pending Orders

You may want to add a scheduled job to automatically cancel very old pending orders:

```sql
-- Find orders pending for more than 1 hour
UPDATE orders
SET status = 'cancelled',
    payment_status = 'failed',
    updated_at = NOW()
WHERE status = 'pending'
AND payment_status = 'pending'
AND created_at < NOW() - INTERVAL '1 hour';
```

This could be run as:
- A daily cron job
- A Supabase Edge Function on a schedule
- A background worker process

## Monitoring

Watch for these metrics:
- **Cancellation rate:** Orders cancelled / Orders created
- **Payment success rate:** Paid orders / Orders created
- **Stuck orders:** Orders pending > 1 hour (should be near 0)

## Benefits

✅ **Cleaner admin view** - Only see genuine pending orders
✅ **Better customer experience** - Clear status in dashboard
✅ **Accurate analytics** - Distinguish failed vs pending payments
✅ **No manual cleanup** - Automatic status updates
✅ **Consistent behavior** - Works for both Nomba and Paystack

## Related Issues

- Original Nomba amount bug: `NOMBA_AMOUNT_FIX.md`
- Nomba integration: `docs/NOMBA_GATEWAY_TEST_REPORT.md`
- Payment webhooks: `docs/NOMBA_WEBHOOK_DEPLOYMENT_ISSUE.md`

## Support

If orders still show as pending after cancellation:

1. Check server logs for cancellation API calls
2. Verify the callback pages are calling `/api/orders/[id]/cancel`
3. Check database for order status updates
4. Test webhook delivery (for gateway-initiated cancellations)
5. Ensure Supabase permissions allow order updates
