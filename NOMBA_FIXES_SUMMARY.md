# Nomba Gateway API Fixes - Summary

**Date:** 2026-02-04  
**Issue:** Critical discrepancies between official Nomba API specification and implementation causing payment failures

---

## ✅ Fixes Applied

### **Fix #1: Amount Type Correction (CRITICAL)**

**File:** `app/api/payment/nomba/initialize/route.ts`  
**Lines:** 196, 214

**Problem:**
```typescript
// ❌ BEFORE: Sending amount as string
const amountInNaira = Number(order.total).toFixed(2)  // Returns "2500.00"
amount: amountInNaira  // String instead of number
```

**Solution:**
```typescript
// ✅ AFTER: Sending amount as number
const amountInNaira = Number(order.total)  // Returns 2500.00
amount: amountInNaira  // Number type
```

**Official API Spec:**
```json
"amount": {
  "type": "number",
  "format": "double",
  "description": "Amount to pay",
  "example": 10000.00
}
```

**Impact:** Prevents "Request validation failed" (400 Bad Request) errors during payment initialization.

---

### **Fix #2: Transaction Verification Endpoint (CRITICAL)**

**File:** `app/api/payment/nomba/verify/route.ts`  
**Lines:** 79-126

**Problem:**
```typescript
// ❌ BEFORE: Using POST with filter endpoint
const verifyResponse = await fetch('https://api.nomba.com/v1/transactions/accounts', {
  method: 'POST',
  body: JSON.stringify({ transactionRef }),
})

// Response structure:
{
  data: {
    results: [{ /* transaction */ }]  // Array of transactions
  }
}
```

**Solution:**
```typescript
// ✅ AFTER: Using GET with single transaction lookup
const verifyUrl = `https://api.nomba.com/v1/transactions/accounts/single?transactionRef=${encodeURIComponent(transactionRef)}`
const verifyResponse = await fetch(verifyUrl, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'accountId': accountId,
  },
})

// Response structure:
{
  data: {
    id: string,
    status: string,
    amount: number,
    timeCreated: string,
    type: string
  }  // Single transaction object
}
```

**Official API Endpoint:**
```
GET /v1/transactions/accounts/single
Query Parameters:
- transactionRef: Transaction ID/Reference
- merchantTxRef: Merchant transaction reference
- orderReference: Online checkout order reference
- orderId: Online checkout order id
```

**Impact:** Prevents transaction verification failures and incorrect payment status updates.

---

### **Fix #3: Transaction Status Values (HIGH)**

**File:** `app/api/payment/nomba/verify/route.ts`  
**Lines:** 135-170

**Problem:**
```typescript
// ❌ BEFORE: Incorrect primary status
const PRIMARY_SUCCESS_STATUS = 'SUCCESSFUL'  // ❌ NOT in official API
const FALLBACK_SUCCESS_STATUSES = ['SUCCESS', 'COMPLETED', 'APPROVED']

// This caused all successful payments to be flagged as "non-standard status"
```

**Solution:**
```typescript
// ✅ AFTER: Using official API statuses
const SUCCESS_STATUSES = ['SUCCESS', 'PAYMENT_SUCCESSFUL']
const FAILURE_STATUSES = ['FAILED', 'PAYMENT_FAILED', 'DECLINED', 'REJECTED', 'CANCELLED', 'EXPIRED']

if (SUCCESS_STATUSES.includes(statusUpper)) {
  console.log('[Nomba Verify] ✅ Payment successful')
}
```

**Official API Status Values:**
```json
"status": {
  "type": "string",
  "enum": [
    "NEW",                // Initial state
    "PENDING_PAYMENT",    // Payment in progress
    "PAYMENT_SUCCESSFUL", // ✅ Success (primary)
    "PAYMENT_FAILED",     // ❌ Failed
    "PENDING_BILLING",    // Being processed
    "SUCCESS",            // ✅ Success (alternative)
    "REFUND"              // Refunded
  ]
}
```

**Impact:** Prevents successful payments from being rejected or flagged for manual review.

---

### **Fix #4: Account ID in Order Creation (MEDIUM)**

**File:** `app/api/payment/nomba/initialize/route.ts`  
**Line:** 216

**Problem:**
```typescript
// ❌ BEFORE: Missing accountId in order
order: {
  orderReference,
  customerId,
  callbackUrl,
  customerEmail: email,
  amount: amountInNaira,
  currency: 'NGN',
  // Missing: accountId
}
```

**Solution:**
```typescript
// ✅ AFTER: Added accountId to specify target account
order: {
  orderReference,
  customerId,
  callbackUrl,
  customerEmail: email,
  amount: amountInNaira,
  currency: 'NGN',
  accountId: accountId,  // Specify where funds should be deposited
}
```

**Official API Spec:**
```json
"accountId": {
  "type": "string",
  "description": "If specified, this is the account where the funds will be deposited.",
  "example": "01a10aeb-d989-460a-bbde-9842f2b4320f"
}
```

**Impact:** Ensures funds are deposited to the correct account (useful for multi-account setups).

---

## ⚠️ Issues Requiring Further Investigation

### **Issue #1: Webhook Signature Verification**

**File:** `app/api/payment/nomba/webhook/route.ts`  
**Lines:** 50

**Current Implementation:**
```typescript
const signature = request.headers.get('nomba-signature') || request.headers.get('nomba-sig-value')
```

**Problem:** The OpenAPI specification provided does NOT document webhook signature headers. The correct header names are unknown.

**Potential Headers to Test:**
- `nomba-signature`
- `x-nomba-signature`
- `nomba-signature-sha256`
- `webhook-signature`

**Action Required:** 
1. Contact Nomba support for correct webhook header names
2. Test with actual webhooks to identify correct headers
3. Update code with verified header names

---

### **Issue #2: Missing Split Payment Support**

**File:** `app/api/payment/nomba/initialize/route.ts`

**Official API Capability:**
```json
"splitRequest": {
  "type": "object",
  "properties": {
    "splitType": {"enum": ["PERCENTAGE", "AMOUNT"]},
    "splitList": {
      "items": {
        "properties": {
          "accountId": {"type": "string"},
          "value": {"type": "number"}
        }
      }
    }
  }
}
```

**Current Implementation:** No support for payment splitting

**Action Required:** 
Implement split payment if needed for your business model (e.g., marketplace, commission splitting)

---

## 📋 Testing Checklist

After these fixes, test the following scenarios:

### **Payment Initialization:**
- [ ] Small amount (< ₦1,000)
- [ ] Medium amount (₦1,000 - ₦10,000)
- [ ] Large amount (> ₦10,000)
- [ ] Decimal amounts (e.g., ₦2,500.50)

### **Transaction Verification:**
- [ ] Successful payment (status: SUCCESS)
- [ ] Successful payment (status: PAYMENT_SUCCESSFUL)
- [ ] Failed payment (status: PAYMENT_FAILED)
- [ ] Pending payment (status: PENDING_PAYMENT)

### **Webhook Handling:**
- [ ] Payment success webhook
- [ ] Payment failure webhook
- [ ] Invalid signature (should reject with 401)
- [ ] Duplicate webhook (idempotency)

---

## 🔐 Environment Variables Required

Ensure these are set in your `.env` file:

```bash
# Nomba API Credentials
NOMBA_CLIENT_ID=your_client_id
NOMBA_CLIENT_SECRET=your_client_secret
NOMBA_ACCOUNT_ID=your_account_id
NOMBA_WEBHOOK_SECRET=your_webhook_secret

# Application URL (for callback)
NEXT_PUBLIC_APP_URL=https://www.wingside.ng
```

---

## 📚 Official API Documentation

Based on the provided OpenAPI specification:

**Base URLs:**
- Production: `https://api.nomba.com`
- Sandbox: `https://sandbox.nomba.com`

**Key Endpoints Used:**
1. `POST /v1/auth/token/issue` - Get access token
2. `POST /v1/checkout/order` - Create checkout order
3. `GET /v1/transactions/accounts/single` - Verify transaction

**Authentication:**
- OAuth 2.0 Client Credentials flow
- Bearer token in Authorization header
- accountId header required for all requests

---

## 🚨 What These Fixes Were Causing

Before these fixes, your system likely experienced:

1. **Payment Initialization Failures:**
   - 400 Bad Request errors
   - "Request validation failed" messages
   - Customers unable to complete payment

2. **Transaction Verification Failures:**
   - Unable to confirm payment status
   - Orders not marked as paid
   - Manual intervention required

3. **False Payment Status Warnings:**
   - Successful payments flagged as "non-standard status"
   - Unnecessary admin notifications
   - Customer confusion

---

## ✨ Next Steps

1. **Test thoroughly in Sandbox:**
   ```bash
   # Use Nomba sandbox environment
   NOMBA_BASE_URL=https://sandbox.nomba.com
   ```

2. **Monitor webhook logs:**
   - Check for signature verification failures
   - Identify correct header names
   - Update webhook handler once confirmed

3. **Add integration tests:**
   - Test all payment flows
   - Verify transaction status handling
   - Validate webhook processing

4. **Update API documentation:**
   - Document the corrected implementation
   - Add troubleshooting guide
   - Create webhook testing guide

---

**Last Updated:** 2026-02-04  
**Fixed By:** Claude Code Assistant  
**Status:** ✅ All critical fixes applied
