## Nomba Callback Issue Analysis & Fix

### Problem
Order WS202602040093 has payment_status='pending' with payment_reference='WS-WS202602040093-1770215087530'.

When verifying the transaction with Nomba API, it returns:
```json
{
  "code": "404",
  "description": "Transaction matching query not found"
}
```

### Root Cause
1. **Checkout was created** (payment reference exists in database)
2. **Payment was NOT completed** by the customer
3. **Webhook was never called** (Nomba only sends webhook on successful payment)
4. **Order stuck in "pending"** status indefinitely

### Why This Happens
- Customer initiates payment → Redirected to Nomba checkout page
- Customer abandons payment (closes tab, doesn't complete)
- Or payment fails (insufficient funds, bank decline)
- Nomba API returns "Transaction not found" because no transaction exists
- Order remains "pending" forever

### Solutions

#### Option 1: Auto-expire Pending Orders (Recommended)
Add a database function or cron job to expire old pending orders:

```sql
-- Function to expire pending orders older than 30 minutes
CREATE OR REPLACE FUNCTION expire_pending_orders()
RETURNS void AS $$
BEGIN
  UPDATE orders
  SET status = 'cancelled',
      payment_status = 'expired',
      updated_at = now()
  WHERE payment_status = 'pending'
    AND status = 'pending'
    AND created_at < now() - interval '30 minutes'
    AND payment_gateway = 'nomba';
END;
$$ LANGUAGE plpgsql;
```

#### Option 2: Detect Abandoned Payments in Callback
Update the callback page to verify transaction status immediately:

```typescript
// In /payment/nomba/callback/page.tsx
const verifyResponse = await fetch('/api/payment/nomba/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ transactionRef: order.payment_reference })
});

const verifyData = await verifyResponse.json();

if (verifyData.success === false && verifyData.error?.includes('not found')) {
  // Transaction was never completed - mark order as cancelled
  await fetch(`/api/orders/${order.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: 'cancelled',
      payment_status: 'abandoned'
    })
  });

  // Show user-friendly message
  setPaymentStatus('failed');
  setMessage('Payment was not completed. Your order has been cancelled.');
}
```

#### Option 3: Add "Abandoned" Order Status
Create a new order status to track abandoned payments:

```sql
ALTER TYPE order_status_enum ADD VALUE IF NOT EXISTS 'abandoned';
ALTER TYPE payment_status_enum ADD VALUE IF NOT EXISTS 'abandoned';
```

### Immediate Fix for Order WS202602040093

Since the Nomba API confirms the transaction does not exist:

```sql
-- Mark the order as cancelled/abandoned
UPDATE orders
SET status = 'cancelled',
    payment_status = 'abandoned',
    updated_at = now()
WHERE order_number = 'WS202602040093';
```

### Prevention Strategy

1. **Set Nomba checkout timeout** to 15-30 minutes
2. **Implement order expiration** for pending orders > 30 minutes
3. **Add callback verification** to detect abandoned payments immediately
4. **Send abandoned cart emails** to customers who don't complete payment
5. **Show countdown timer** on checkout page

### Webhook Configuration Check

Also verify your Nomba webhook configuration:
1. Log into Nomba dashboard
2. Check webhook URL: `https://www.wingside.ng/api/payment/nomba/webhook`
3. Verify webhook is active and subscribed to `payment_success` events
4. Test webhook from Nomba dashboard

The webhook might not be firing if:
- URL is incorrect
- Webhook is not subscribed to events
- Signature verification is blocking webhooks

### Recommended Next Steps

1. ✅ **Immediate**: Mark order WS202602040093 as 'abandoned'
2. ✅ **Implement**: Auto-expire pending orders after 30 minutes
3. ✅ **Add**: Callback verification for abandoned payments
4. ✅ **Verify**: Nomba webhook configuration in dashboard
