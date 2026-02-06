# Embedly Checkout Integration Guide

## Overview

Embedly Checkout has been integrated as a secondary payment gateway (supplementing Nomba). This allows customers to pay via bank transfer to a temporary account number.

---

## How It Works

```
Customer → Clicks "Pay with Bank Transfer"
    ↓
Backend → Creates Embedly checkout wallet
    ↓
Customer → Sees account number (e.g., 2225657965)
    ↓
Customer → Transfers money via banking app/USSD
    ↓
Embedly → Detects payment → Sends webhook
    ↓
Backend → Confirms order → Sends email/SMS
```

---

## Environment Variables

Add these to your `.env.local`:

```bash
# Embedly Checkout Configuration
EMBEDLY_API_KEY=your-api-key-here
EMBEDLY_ORG_ID=49849c1d-7845-11f0-8d44-4af84d9ff6f1
EMBEDLY_SETTLEMENT_ACCOUNT_ID=1a190c66-028b-11f1-9999-0214de0002b0
EMBEDLY_ALIAS=Wingside
EMBEDLY_PREFIX_MAPPING_ID=your-prefix-mapping-id-here
EMBEDLY_WEBHOOK_SECRET=your-webhook-secret-here
```

### Getting the Values

1. **API Key**: From Embedly dashboard
2. **Org ID**: Provided by Embedly (`49849c1d-7845-11f0-8d44-4af84d9ff6f1`)
3. **Settlement Account ID**: Provided by Embedly (`1a190c66-028b-11f1-9999-0214de0002b0`)
4. **Prefix Mapping ID**: Call `/api/v1/organization-prefix-mappings` with your API key to get this

---

## API Endpoints

### 1. Initialize Checkout Wallet
```bash
POST /api/payment/embedly/initialize
{
  "order_id": "uuid",
  "customer_email": "customer@email.com",
  "customer_name": "John Doe"
}

Response:
{
  "success": true,
  "wallet": {
    "id": "wallet-uuid",
    "accountNumber": "2225657965",
    "bankName": "Embedly",
    "checkoutRef": "CHK2025...",
    "expectedAmount": 5000,
    "expiresAt": "2025-02-04T15:30:00Z"
  }
}
```

### 2. Webhook Handler
```bash
POST /api/payment/embedly/webhook

Event: checkout.wallet.payment_received
{
  "event": "checkout.wallet.payment_received",
  "data": {
    "walletId": "wallet-uuid",
    "amount": 500000,
    "transactionId": "txn-uuid",
    "senderAccountNumber": "1234567890",
    "senderName": "Customer Name"
  }
}
```

### 3. Check Wallet Status
```bash
GET /api/payment/embedly/check-wallet?walletId=xxx
```

---

## Database Schema Updates

### New Column for Orders Table

```sql
-- Add checkout_ref column if it doesn't exist
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS checkout_ref TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_checkout_ref
ON orders(checkout_ref);

-- Add index for payment_gateway lookups
CREATE INDEX IF NOT EXISTS idx_orders_payment_gateway
ON orders(payment_gateway);
```

### New Payment Status Value

```sql
-- Add 'abandoned' to payment_status_enum if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'abandoned'
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'payment_status_enum')
    ) THEN
        ALTER TYPE payment_status_enum ADD VALUE 'abandoned';
    END IF;
END $$;
```

---

## Webhook Configuration

### In Embedly Dashboard

1. Log into Embedly dashboard
2. Navigate to **Webhooks** section
3. Add webhook URL: `https://www.wingside.ng/api/payment/embedly/webhook`
4. Subscribe to events:
   - ✅ `checkout.wallet.payment_received`
   - ✅ `checkout.wallet.expired`
5. Set webhook secret (add to `.env.local`)

### Test Webhook

```bash
curl -X POST https://www.wingside.ng/api/payment/embedly/webhook \
  -H "Content-Type: application/json" \
  -H "x-embedly-signature: <signature>" \
  -d '{
    "event": "checkout.wallet.payment_received",
    "data": {
      "walletId": "test-wallet-id",
      "amount": 500000,
      "transactionId": "test-txn-id",
      "senderAccountNumber": "1234567890",
      "senderName": "Test Customer"
    }
  }'
```

---

## Frontend Integration

### Payment Method Selection

Update your checkout flow to show Embedly as an option:

```tsx
// In checkout/payment selection
<div className="payment-methods">
  <button onClick={() => selectPayment('nomba')}>
    Pay with Card (Nomba)
  </button>

  <button onClick={() => selectPayment('embedly')}>
    Pay with Bank Transfer
  </button>
</div>
```

### Redirect to Embedly Callback

When customer selects "Bank Transfer":

```tsx
const handleEmbedlyPayment = async () => {
  // Create order first
  const order = await createOrder()

  // Redirect to Embedly callback page
  router.push(
    `/payment/embedly/callback?order_id=${order.id}` +
    `&orderNumber=${order.orderNumber}` +
    `&amount=${order.total}` +
    `&customerEmail=${order.customerEmail}` +
    `&customerName=${order.customerName}`
  )
}
```

---

## Monitoring & Debugging

### Check Pending Orders

```sql
SELECT
  order_number,
  payment_reference,
  checkout_ref,
  payment_status,
  status,
  created_at,
  updated_at
FROM orders
WHERE payment_gateway = 'embedly'
  AND payment_status = 'pending'
  AND created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

### Check Expired Wallets

```bash
curl -s "https://checkout-prod.embedly.ng/api/v1/checkout-wallet" \
  -H "x-api-key: $EMBEDLY_API_KEY" \
  | jq '.data[] | select(.status == "Expired")'
```

### Manual Wallet Status Check

```bash
curl "http://localhost:3000/api/payment/embedly/check-wallet?walletId=xxx"
```

---

## Troubleshooting

### Issue: Wallet Not Created

**Symptoms**: API returns 403 or "Access denied"

**Solution**:
1. Verify `EMBEDLY_API_KEY` is correct
2. Verify `EMBEDLY_ORG_ID` matches your organization
3. Check `EMBEDLY_PREFIX_MAPPING_ID` is valid

### Issue: Payment Not Detected

**Symptoms**: Customer paid but order still pending

**Solutions**:
1. Check webhook logs: `grep "Embedly Webhook" logs/`
2. Manually check wallet: `GET /api/payment/embedly/check-wallet?walletId=xxx`
3. Trigger manual processing: `POST /api/payment/embedly/check-wallet` with walletId

### Issue: Amount Mismatch

**Symptoms**: Payment received but amount doesn't match

**Solution**:
- Check `notifications` table for `amount_mismatch` alerts
- Manually verify and update order if needed

---

## Testing

### 1. Test Wallet Creation

```bash
curl -X POST http://localhost:3000/api/payment/embedly/initialize \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "test-order-id",
    "customer_email": "test@email.com",
    "customer_name": "Test Customer"
  }'
```

### 2. Test Payment Flow (Staging)

If using staging environment:

```bash
# Use Embedly's staging simulate inflow
curl -X POST https://waas-staging.embedly.ng/api/v1/nip/inflow/simulate-inflow \
  -H "x-api-key: $EMBEDLY_API_KEY" \
  -d '{
    "beneficiaryAccountName": "Wingside",
    "beneficiaryAccountNumber": "2225657965",
    "amount": "5000",
    "narration": "Test payment"
  }'
```

### 3. Test Webhook Processing

```bash
curl -X POST http://localhost:3000/api/payment/embedly/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": "checkout.wallet.payment_received",
    "data": {
      "walletId": "wallet-uuid",
      "invoiceReference": "WS202602040093",
      "amount": 500000,
      "transactionId": "txn-123",
      "senderAccountNumber": "1234567890",
      "senderName": "Test Customer"
    }
  }'
```

---

## Advantages Over Nomba

✅ **No payment gateway fees** - Direct bank transfer  
✅ **Higher success rate** - No failed card transactions  
✅ **Instant settlement** - Money hits account immediately  
✅ **No chargebacks** - Bank transfers are final  
✅ **Works for all banks** - Universal acceptance  

## Limitations

⚠️ **Manual process** - Customer leaves site to pay  
⚠️ **Time-bound** - Wallet expires after 30 minutes  
⚠️ **Exact amount required** - Customer must pay exact amount  
⚠️ **No auto-retry** - Failed payments require new wallet  

---

## Production Checklist

- [ ] Environment variables configured
- [ ] Database schema updated
- [ ] Webhook configured in Embedly dashboard
- [ ] Webhook secret set and verified
- [ ] Frontend payment method selection updated
- [ ] Test payment completed successfully
- [ ] Error handling tested
- [ ] Monitoring/alerts configured
- [ ] Customer support documentation updated
- [ ] Order expiration cron job set up (optional)
