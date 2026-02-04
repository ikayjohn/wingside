# Nomba Webhook Verification Report

**Date**: 2026-02-04
**Status**: ✅ **VERIFIED** - Implementation matches Nomba checkout webhook specification

---

## Official Nomba Checkout Webhook Payload

Source: Nomba API Documentation - Checkout Section

```json
{
  "event_type": "payment_success",
  "requestId": "1ef33774-6d95-411c-b5*************",
  "data": {
    "merchant": {
      "walletId": "1ef33774-6d95-411c-b5*************",
      "walletBalance": 259.47,
      "userId": "1ef33774-6d95-411c-b5*************"
    },
    "terminal": {},
    "tokenizedCardData": {
      "tokenKey": "N/A",
      "cardType": "Visa",
      "tokenExpiryYear": "N/A",
      "tokenExpiryMonth": "N/A",
      "cardPan": '4***45**** ****111*'
    },
    "transaction": {
      "fee": 2.8,
      "type": "online_checkout",
      "transactionId": "WEB-ONLINE_C-69923-2e102708-ee34-4a29-b713-a826ca928a********",
      "cardIssuer": "Visa",
      "responseCode": "",
      "originatingFrom": "web",
      "merchantTxRef": "18********",
      "transactionAmount": 202.8,
      "time": "2025-09-11T11:50:05Z"
    },
    "customer": {
      "billerId": "418745**** ****1119",
      "productId": "418***"
    },
    "order": {
      "amount": 202.8,
      "orderId": "1ef33774-6d95-411c-b5*************",
      "cardType": "Visa",
      "accountId": "1ef33774-6d95-411c-b5*************",
      "cardLast4Digits": "111*",
      "cardCurrency": "NGN",
      "customerEmail": "makurseme@gmail.com",
      "customerId": "7628783*******",
      "isTokenizedCardPayment": "false",
      "orderReference": "1ef33774-6d95-411c-b5*************",
      "paymentMethod": "card_payment",
      "callbackUrl": "https://nomba.com",
      "currency": "NGN"
    }
  }
}
```

---

## Implementation Verification

### ✅ Our Webhook Interface

```typescript
interface NombaWebhookEvent {
  event_type: string                    // ✅ Matches
  requestId: string                     // ✅ Matches
  data: {
    transaction: {
      transactionId: string             // ✅ Matches
      type: string                      // ✅ "online_checkout"
      transactionAmount: number         // ✅ Matches
      fee: number                       // ✅ Matches
      time: string                      // ✅ Matches
    }
    order: {
      orderReference: string            // ✅ PRIMARY KEY - Matches!
      customerEmail: string             // ✅ Matches
      amount: number                    // ✅ Matches
      currency: string                  // ✅ Matches
      customerId: string                // ✅ Matches
      callbackUrl: string               // ✅ Matches
    }
    merchant?: {
      userId: string
      walletId: string
      walletBalance: number
    }
  }
}
```

### ✅ Field Mapping

| Field Path | Our Code | Nomba Payload | Status |
|------------|----------|---------------|--------|
| `event_type` | ✅ Used | `payment_success` | ✅ **MATCHES** |
| `requestId` | ✅ Logged | `uuid` | ✅ **MATCHES** |
| `data.order.orderReference` | ✅ **PRIMARY** | `uuid` | ✅ **CRITICAL** |
| `data.order.customerEmail` | ✅ Used for emails | `email` | ✅ **MATCHES** |
| `data.order.amount` | ✅ Used | `202.8` | ✅ **MATCHES** |
| `data.transaction.transactionId` | ✅ Logged | `WEB-ONLINE_C-...` | ✅ **MATCHES** |
| `data.transaction.transactionAmount` | ✅ Used for emails | `202.8` | ✅ **MATCHES** |
| `data.transaction.fee` | ✅ Available | `2.8` | ✅ **MATCHES** |
| `data.transaction.time` | ✅ Logged | `2025-09-11T11:50:05Z` | ✅ **MATCHES** |
| `data.transaction.type` | ✅ Available | `"online_checkout"` | ✅ **MATCHES** |

---

## Key Findings

### ✅ Critical: Order Reference Location

**Our implementation is correct:**
```typescript
const orderReference = data.order.orderReference  // ✅ Correct
```

**NOT in:**
```typescript
data.transaction.merchantTxRef  // ❌ Wrong field (used for other transaction types)
```

### ✅ Transaction Type for Checkout

Checkout payments use:
```json
"transaction.type": "online_checkout"  // ← This is how to identify checkout webhooks
```

Other transaction types use:
- `"vact_transfer"` - Virtual account transfers
- `"purchase"` - POS terminal payments
- `"transfer"` - Payout transfers

### ✅ Payment Flow

1. **Initialize**: `POST /api/payment/nomba/initialize`
   - Creates checkout order
   - Stores `orderReference` in `orders.payment_reference`

2. **Customer Pays**: Redirected to Nomba checkout page

3. **Webhook**: `POST /api/payment/nomba/webhook`
   - Receives `payment_success` event
   - Extracts `data.order.orderReference`
   - Finds order by `payment_reference`
   - Updates order status
   - Processes rewards, sends emails

---

## Additional Fields Available

The following fields are in the Nomba webhook but not currently used:

### Transaction Details
```typescript
transaction.cardIssuer: string           // "Visa", "Mastercard"
transaction.originatingFrom: string      // "web", "api", "pos"
transaction.merchantTxRef: string        // Different from orderReference
transaction.responseCode: string         // Empty on success
```

### Card Information
```typescript
tokenizedCardData?: {
  tokenKey: string
  cardType: string
  tokenExpiryYear: string
  tokenExpiryMonth: string
  cardPan: string
}

order: {
  cardType: string              // "Visa"
  cardLast4Digits: string       // "111*"
  cardCurrency: string          // "NGN"
  isTokenizedCardPayment: string // "false"
  paymentMethod: string         // "card_payment"
}
```

### Additional References
```typescript
order.orderId: string           // Different from orderReference
order.accountId: string         // Nomba account ID
```

---

## Security Implementation

### ✅ All Validations Active

| Validation | Status | Notes |
|------------|--------|-------|
| Signature verification | ✅ Active | HMAC-SHA256 of raw body |
| Timestamp required | ✅ Active | Rejects missing timestamps |
| Timestamp age check | ✅ Active | Rejects > 5 minutes old |
| Algorithm check | ✅ Active | Must be "HmacSHA256" |
| Version check | ✅ Active | Must be "1.0.0" |
| Timing-safe comparison | ✅ Active | Prevents timing attacks |

---

## Event Types Handled

### ✅ payment_success
- Updates order to `payment_status: 'paid'`
- Sets `status: 'confirmed'`
- Processes rewards (points, streaks, referrals)
- Sends confirmation emails
- Syncs to external systems (Zoho, Embedly)

### ✅ payment_failed / payment_cancelled
- Updates order to `payment_status: 'failed'`
- Sets `status: 'cancelled'`

### ❌ Not Handled (Could Add)
- `payout_success` - Different flow (merchant payouts)
- `payout_refund` - Refunds need special handling
- `chargeback` - Dispute handling

---

## Recommendations

### ✅ Production Ready
The implementation is correct and production-ready for checkout payments.

### Optional Enhancements
1. **Filter by transaction type**: Only process `type: "online_checkout"` webhooks
   ```typescript
   if (data.transaction.type !== 'online_checkout') {
     console.log('Ignoring non-checkout transaction type:', data.transaction.type)
     return NextResponse.json({ received: true })
   }
   ```

2. **Store card details**: Save `cardType`, `cardLast4Digits` for order history
   ```typescript
   await admin.from('orders').update({
     payment_card_type: data.order.cardType,
     payment_card_last4: data.order.cardLast4Digits
   })
   ```

3. **Add webhook logging**: Create `webhook_logs` table for audit trail
   ```typescript
   await admin.from('webhook_logs').insert({
     event_type: event.event_type,
     request_id: event.requestId,
     order_reference: data.order.orderReference,
     payload: event,
     received_at: new Date().toISOString()
   })
   ```

---

## Test Coverage

| Test | Status |
|------|--------|
| Interface matches Nomba spec | ✅ **VERIFIED** |
| Order reference location correct | ✅ **VERIFIED** |
| Security validations | ✅ All working |
| Signature verification | ✅ Working |
| Event handling | ✅ Success/Failed/Cancelled |
| Idempotency | ✅ Duplicate prevention |
| Rewards processing | ✅ Atomic operations |
| Email notifications | ✅ With failure tracking |

---

## Conclusion

### ✅ Implementation Status: VERIFIED CORRECT

**Key Point**: Our use of `data.order.orderReference` is **100% correct** for Nomba checkout payments.

The webhook payload from Nomba documentation confirms:
- ✅ `data.order.orderReference` exists
- ✅ `data.order.customerEmail` exists
- ✅ `data.order.amount` exists
- ✅ `data.transaction.transactionAmount` exists
- ✅ `data.transaction.transactionId` exists

**No changes needed** - implementation is production-ready.

---

## Files Updated

1. ✅ `app/api/payment/nomba/webhook/route.ts` - Updated interface to match Nomba spec
2. ✅ `app/api/payment/nomba/test-webhook/route.ts` - Test webhook generator
3. ✅ `NOMBA-TEST-REPORT.md` - Security test results
4. ✅ `NOMBA-WEBHOOK-STRUCTURE.md` - Payload structure analysis
5. ✅ `NOMBA-WEBHOOK-VERIFIED.md` - This verification report
