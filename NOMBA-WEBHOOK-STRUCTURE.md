# Nomba Checkout Webhook Structure

## Request: Checkout Order Creation
```json
POST /v1/checkout/order
{
  "order": {
    "orderReference": "90e81e8a-bc14-4ebf-89c0-57**********",
    "customerId": "762878332454",
    "callbackUrl": "https://ip:port/merchant.com/callback",
    "customerEmail": "abcde@gmail.com",
    "amount": "10000.00",
    "currency": "NGN",
    "accountId": "01a10aeb-d989-460a-bbde-9**********"
  },
  "tokenizeCard": "true"
}
```

## Response: Checkout Created
```json
{
  "code": "00",
  "description": "Success",
  "data": {
    "checkoutLink": "https://ip:port/checkout/78388899***8",
    "orderReference": "fd3002af-d48b-40a0-adba-0b**********"
  }
}
```

## EXPECTED: Checkout Webhook Payload
**This is what we need to verify:**

```json
{
  "event_type": "payment_success", // or "payment_failed"
  "requestId": "uuid-here",
  "data": {
    "transaction": {
      "transactionId": "string",
      "type": "checkout", // ← This is key!
      "transactionAmount": 10000,
      "fee": 0,
      "time": "2025-05-26T12:34:24Z"
    },
    "order": { // ← Should be present for checkout payments
      "orderReference": "90e81e8a-bc14-4ebf-89c0-57**********",
      "customerEmail": "abcde@gmail.com",
      "amount": 10000,
      "currency": "NGN",
      "customerId": "762878332454",
      "callbackUrl": "https://ip:port/merchant.com/callback"
    },
    "merchant": {
      "userId": "string",
      "walletId": "string",
      "walletBalance": 100000
    }
  }
}
```

## NOT Checkout: Other Transaction Types
**Your earlier examples are these:**

### 1. Virtual Account Transfer (NOT checkout)
```json
{
  "event_type": "payment_success",
  "data": {
    "transaction": {
      "type": "vact_transfer" // ← Not checkout
    },
    "customer": {
      "accountNumber": "9035418377",
      "bankName": "Paycom (Opay)"
    }
    // NO "order" field
  }
}
```

### 2. POS Purchase (NOT checkout)
```json
{
  "event_type": "payment_failed",
  "data": {
    "transaction": {
      "type": "purchase" // ← Not checkout
    },
    "terminal": {
      "terminalLabel": "IKEJA MALL"
    },
    "customer": {
      "cardPan": "539983 **** **** 4297"
    }
    // NO "order" field
  }
}
```

### 3. Payout Transfer (NOT checkout)
```json
{
  "event_type": "payout_success",
  "data": {
    "transaction": {
      "type": "transfer", // ← Not checkout
      "merchantTxRef": "EG17IJXXXX"
    },
    "customer": {
      "senderName": "Faruk"
    }
    // NO "order" field
  }
}
```

---

## Key Difference

| Feature | Checkout Payments | Other Types |
|---------|------------------|-------------|
| `data.order` field | ✅ PRESENT | ❌ MISSING |
| `data.transaction.type` | `"checkout"` | `"purchase"`, `"vact_transfer"`, `"transfer"` |
| Customer info | In `order.customerEmail` | In `data.customer` object |
| Reference | `order.orderReference` | `transaction.merchantTxRef` |

---

## Our Implementation

✅ **Correct** - We handle checkout payments:
```typescript
interface NombaWebhookEvent {
  event_type: string
  requestId: string
  data: {
    transaction: {
      transactionId: string
      type: string
      transactionAmount: number
      fee: number
      time: string
    }
    order: { // ← Checkout payments have this
      orderReference: string
      customerEmail: string
      amount: number
      currency: string
      customerId: string
      callbackUrl: string
    }
    merchant?: {
      userId: string
      walletId: string
      walletBalance: number
    }
  }
}
```

---

## What to Test

### Option 1: Real Transaction
1. Create a test checkout payment via `/api/payment/nomba/initialize`
2. Complete payment in test mode
3. Capture actual webhook payload
4. Verify structure matches our interface

### Option 2: Test Webhook Generator
Use `/api/payment/nomba/test-webhook` to send test payload:
```bash
POST /api/payment/nomba/test-webhook
{
  "orderReference": "WS-TEST-123",
  "eventType": "payment_success"
}
```

This will show you the exact structure we expect.

---

## Questions to Answer

1. **Does Nomba send `data.order` for checkout webhooks?**
   - If YES → Our implementation is correct ✅
   - If NO → We need to update our interface

2. **What is `transaction.type` for checkout payments?**
   - We assume it's `"checkout"`
   - Need to verify actual value

3. **What field contains the order reference?**
   - We use `data.order.orderReference`
   - Other types use `data.transaction.merchantTxRef`
   - Need to confirm which one checkout uses
