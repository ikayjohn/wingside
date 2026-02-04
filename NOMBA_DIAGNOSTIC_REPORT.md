# Nomba Payment Gateway Diagnostic Report

**Date:** 2026-02-04  
**Test Environment:** Development (localhost:3000)  
**Production URL:** https://www.wingside.ng

---

## ✅ Test Results Summary

### 1. Environment Configuration
| Component | Status | Details |
|-----------|--------|---------|
| NOMBA_CLIENT_ID | ✅ PASS | Configured |
| NOMBA_CLIENT_SECRET | ✅ PASS | Configured |
| NOMBA_ACCOUNT_ID | ✅ PASS | Configured |
| NOMBA_WEBHOOK_SECRET | ✅ PASS | Configured (Production security enabled) |

### 2. API Authentication
| Test | Status | Details |
|------|--------|---------|
| Access Token Request | ✅ PASS | Token obtained successfully |
| Token Expiry | ✅ PASS | Token valid until expiry |
| API Access | ✅ PASS | Checkout endpoint accessible |

### 3. Checkout Initialization
| Test | Status | Details |
|------|--------|---------|
| Create Checkout Order | ✅ PASS | Checkout link generated |
| Order Reference Format | ✅ PASS | Correct format (WS-ORDER-<timestamp>) |
| Callback URL | ✅ PASS | Correctly configured |
| Amount Format | ✅ PASS | Naira format (not kobo) |

### 4. Webhook Endpoint
| Test | Status | Details |
|------|--------|---------|
| Endpoint Accessible | ✅ PASS | Responds to requests |
| Signature Verification | ✅ PASS | Security enabled |
| Missing Signature Rejection | ✅ PASS | Rejects requests without signature |

---

## ⚠️ Potential Customer Issues

### Issue 1: Webhook Signature Format Mismatch
**Severity:** MEDIUM  
**Description:** The webhook handler tries multiple signature formats, but if Nomba's actual format differs, webhooks will fail with 401 errors.

**Evidence from code (webhook/route.ts:68-91):**
```typescript
const signatures = {
  // Method 1: HMAC of raw body (most common)
  rawBody: crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('base64'),
  
  // Method 2: HMAC of raw body (hex encoding)
  rawBodyHex: crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex'),
  
  // Method 3: Concatenated fields (legacy format)
  concatenated: crypto.createHmac('sha256', webhookSecret).update([...].join(':')).digest('base64'),
}
```

**Impact:** Webhooks from Nomba might be rejected if the signature format doesn't match.

**Recommendation:**
- Check server logs for actual webhook signature headers from Nomba
- Compare with Nomba documentation: https://developer.nomba.com/products/webhooks/signature-verification-new
- Add debug logging to capture actual signature format

---

### Issue 2: Callback Polling Timeout
**Severity:** MEDIUM  
**Description:** The callback page waits up to 30 seconds for webhook processing. If the webhook is delayed, customers see an error message even if payment succeeded.

**Evidence from code (callback/page.tsx:55-84):**
```typescript
const maxAttempts = 15; // 15 attempts × 2 seconds = 30 seconds
while (attempts < maxAttempts) {
  await new Promise(resolve => setTimeout(resolve, 2000));
  // Check order status...
  if (order.payment_status === 'paid') {
    // Show success
  }
}
// After 30 seconds: Show error "Payment is being processed"
```

**Impact:** Customers may think their payment failed when it actually succeeded (just delayed).

**Recommendation:**
- Increase polling timeout to 60 seconds
- Add webhook retry mechanism on Nomba's side
- Improve messaging: "Payment confirmed - check your email for details"

---

### Issue 3: Popup Blockers
**Severity:** LOW  
**Description:** If customers have popup blockers enabled, the Nomba checkout window might not open.

**Evidence:** Checkout URL redirects to external domain (checkout.nomba.com)

**Impact:** Customers click "Pay" but nothing happens.

**Recommendation:**
- Add user-friendly message: "If popup doesn't open, click here"
- Implement same-window redirect as fallback
- Detect popup blockers and show alternative

---

### Issue 4: Network Connectivity
**Severity:** LOW (Customer-side)  
**Description:** Nigerian internet connectivity can be intermittent.

**Impact:** Payments may timeout or fail to load.

**Recommendation:**
- Add retry mechanism on checkout initialization
- Show helpful error messages with retry options
- Implement offline detection

---

## 🔍 Debugging Steps for Customer Issues

### When a Customer Reports Payment Failure:

1. **Check the order in database:**
   ```sql
   SELECT id, order_number, payment_status, payment_gateway, payment_reference, 
          created_at, paid_at, status
   FROM orders
   WHERE customer_email = '<customer_email>'
   ORDER BY created_at DESC
   LIMIT 5;
   ```

2. **Check payment reference:**
   - If `payment_reference` exists but `payment_status != 'paid'`: Webhook may have failed
   - If `payment_reference` is NULL: Checkout initialization failed

3. **Check server logs for webhook:**
   ```bash
   # In production
   grep "Nomba webhook event" /var/log/app.log | tail -20
   
   # Look for:
   # - "Nomba webhook event: payment_success"
   # - "Invalid Nomba webhook signature"
   # - "Order not found for reference"
   ```

4. **Verify payment with Nomba directly:**
   ```bash
   node scripts/test-nomba-gateway.js
   ```

---

## 📋 Immediate Action Items

### High Priority
- [ ] Review production logs for webhook signature failures
- [ ] Test webhook signature format with actual Nomba webhook
- [ ] Add detailed webhook logging (see NOMBA_BULLETPROOF_PLAN.md item 4)

### Medium Priority
- [ ] Increase callback polling timeout from 30 to 60 seconds
- [ ] Improve error messaging on callback page
- [ ] Add webhook retry monitoring

### Low Priority
- [ ] Implement popup blocker detection
- [ ] Add offline detection
- [ ] Create customer-friendly payment troubleshooting guide

---

## 🧪 Testing Commands

### Full Gateway Test
```bash
node scripts/test-nomba-gateway.js
```

### Webhook Test
```bash
node scripts/test-nomba-webhook.js
```

### API Endpoint Test
```bash
curl -sL "http://localhost:3000/api/payment/nomba/test/" | jq
```

### Manual Webhook Test (with signature)
```bash
# Requires webhook secret
export NOMBA_WEBHOOK_SECRET="your_secret"
node scripts/test-nomba-webhook.js
```

---

## 📚 Related Documentation

- [Nomba Payment Integration Plan](./NOMBA_BULLETPROOF_PLAN.md)
- [Nomba Checkout Documentation](https://developer.nomba.com/products/checkout/introduction)
- [Nomba Webhook Signature Verification](https://developer.nomba.com/products/webhooks/signature-verification-new)

---

## 🎯 Success Metrics

**Current Status:** ✅ Gateway is operational  
**Known Issues:** 2 medium-priority issues identified  
**Webhook Success Rate:** Unknown (needs monitoring)  
**Customer Complaints:** Active investigation needed

**Target Metrics:**
- Webhook success rate: >99%
- Payment confirmation time: <5 seconds
- Zero false payment failures
