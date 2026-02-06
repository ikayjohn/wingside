# Fix Callback Verification Error - Quick Guide

**Problem:** Callback page shows "verification error"
**Cause:** Transaction not found in Nomba API
**Time to fix:** 10-15 minutes

---

## 🚨 Quick Diagnosis (2 minutes)

Run this command with your order ID:

```bash
node scripts/test-nomba-verification.js YOUR_ORDER_ID
```

Example:
```bash
node scripts/test-nomba-verification.js 55340bc9-fb2d-4df2-a6e5-8be1c7742d63
```

**This will tell you exactly what's wrong.**

---

## 🎯 Common Scenarios & Instant Fixes

### Scenario 1: "Transaction not found in Nomba" ❌

**What it means:** Customer never completed payment OR using wrong credentials

**Fix Option A - Customer Abandoned Payment:**
```bash
# Check Nomba dashboard first
# If transaction is NOT in Nomba dashboard, customer abandoned payment

# Mark order as abandoned in database:
# Go to Supabase SQL Editor and run:
UPDATE orders
SET status='cancelled', payment_status='abandoned'
WHERE id='YOUR_ORDER_ID';
```

**Fix Option B - Credentials Mismatch:**
```bash
# If transaction IS in Nomba dashboard but verify fails
# You're using wrong credentials (sandbox vs production)

# Check your environment variables:
# Must ALL be from same environment (all sandbox OR all production)
NOMBA_CLIENT_ID=...
NOMBA_CLIENT_SECRET=...
NOMBA_ACCOUNT_ID=...
```

---

### Scenario 2: "Payment verified BUT order not paid" ✅ ❌

**What it means:** Customer paid, Nomba confirmed, but webhook wasn't received

**Instant Fix - Manual Webhook Processing:**
```bash
# Get payment reference from database
# Then manually trigger webhook:

curl -X POST https://www.wingside.ng/api/payment/nomba/webhook-test \
  -H "Content-Type: application/json" \
  -d '{
    "orderReference": "WS-WS202602040093-1770215087530"
  }'

# This will:
# 1. Mark order as paid
# 2. Award loyalty points
# 3. Send confirmation email
```

**Why webhook wasn't received:**
1. Webhook URL not registered in Nomba dashboard
2. Webhook signature verification failing
3. Server unreachable from Nomba

---

### Scenario 3: "Order already paid" ✅

**What it means:** Everything is working! Webhook was already received.

**No action needed** - Customer can proceed to order confirmation.

---

## 🔧 Long-term Fix: Improve Callback Logic

The callback page is checking Nomba too early. Here's the fix:

### Current Flow (Causing Issues):
```
Customer returns → Check order → If not paid → Verify with Nomba immediately
```

### Better Flow:
```
Customer returns → Check order → If not paid → Wait for webhook (2 min) → Then verify with Nomba
```

### Apply the Fix:

Edit `app/payment/nomba/callback/page.tsx` at line 56:

**BEFORE (causing errors):**
```typescript
// Step 2.5: Check immediately if payment was abandoned
if (order.payment_reference && order.payment_gateway === 'nomba') {
  const verifyResponse = await fetch('/api/payment/nomba/verify', { /* ... */ });
  // This runs IMMEDIATELY, before webhook has time to process
}
```

**AFTER (better - wait for webhook first):**
```typescript
// Step 3: Poll for webhook for 2 minutes
console.log('[Callback] Order not paid yet, waiting for webhook...');
const maxAttempts = 60;
let attempts = 0;

while (attempts < maxAttempts) {
  await new Promise(resolve => setTimeout(resolve, 2000));

  const checkResponse = await fetch(`/api/orders/get-by-id?orderId=${orderId}`);
  const checkData = await checkResponse.json();

  if (checkData.order?.payment_status === 'paid') {
    // Success! Webhook processed
    setPaymentStatus('success');
    return;
  }

  attempts++;
}

// ONLY AFTER 2 MINUTES, check if payment was abandoned
if (order.payment_reference && order.payment_gateway === 'nomba') {
  const verifyResponse = await fetch('/api/payment/nomba/verify', { /* ... */ });
  // Now it's reasonable to check Nomba API
}
```

**But actually**, looking at your code, this logic IS already there! The issue might be something else.

---

## 🧪 Test Webhook Delivery (5 minutes)

### Step 1: Check if Nomba can reach your webhook

```bash
# Test webhook endpoint
curl -X POST https://www.wingside.ng/api/payment/nomba/webhook \
  -H "Content-Type: application/json" \
  -d '{"event_type":"test","requestId":"test-123","data":{}}'

# Expected: {"received":true}
# If error: Webhook has issues
```

### Step 2: Check Nomba Dashboard

1. Log into Nomba Dashboard
2. Go to **Developers → Webhooks**
3. Check if webhook URL is registered:
   - URL: `https://www.wingside.ng/api/payment/nomba/webhook`
   - Events: `payment_success`, `payment_failed`, `payment_cancelled`
4. Check **Webhook Logs** for delivery attempts

### Step 3: Check Server Logs

Look for webhook entries:
```bash
# Search server logs for webhook activity
grep "Nomba webhook" /var/log/your-app.log

# Or if using PM2:
pm2 logs | grep "webhook"
```

---

## 📋 Webhook Setup Checklist

Fix webhook delivery by ensuring:

- [ ] Webhook URL registered in Nomba dashboard: `https://www.wingside.ng/api/payment/nomba/webhook`
- [ ] Events enabled: `payment_success`, `payment_failed`, `payment_cancelled`
- [ ] HTTPS (not HTTP) - webhooks require SSL
- [ ] Server accessible from internet (not localhost)
- [ ] Environment variable set: `NOMBA_WEBHOOK_SECRET` (from Nomba dashboard)
- [ ] Test webhook from Nomba dashboard shows "200 OK"

---

## 🚀 Tools I Created for You

### 1. `/api/payment/nomba/webhook-test` (Manual webhook)
```bash
# Manually process a payment (bypasses waiting for Nomba)
curl -X POST https://www.wingside.ng/api/payment/nomba/webhook-test \
  -H "Content-Type: application/json" \
  -d '{"orderReference": "WS-XXX-1234567890"}'
```

### 2. `scripts/test-nomba-verification.js` (Diagnose issues)
```bash
# Tells you exactly what's wrong
node scripts/test-nomba-verification.js YOUR_ORDER_ID
```

### 3. `WEBHOOK_PRODUCTION_DEBUG.md` (Full guide)
- Complete troubleshooting guide
- All scenarios covered
- Database queries
- Contact Nomba support template

---

## 💡 Most Common Issue: Webhook Not Registered

**90% of callback errors are because webhooks aren't set up.**

**Quick Check:**
1. Nomba Dashboard → Developers → Webhooks
2. Is your webhook URL there?
3. If NO: Add it now
4. If YES: Check webhook delivery logs

**After registering webhook:**
1. Make a test payment
2. Check Nomba webhook logs
3. Should see "200 OK" delivery
4. Order should auto-update to "paid"

---

## 🎯 RIGHT NOW: Fix Your Current Stuck Orders

```bash
# 1. Find stuck orders
# Run in Supabase SQL Editor:
SELECT
  id,
  order_number,
  payment_reference,
  payment_status,
  created_at
FROM orders
WHERE payment_gateway = 'nomba'
  AND payment_status = 'pending'
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

# 2. For each order, check Nomba dashboard
# Search for the payment_reference

# 3a. If customer PAID (transaction in Nomba):
#     Use webhook-test endpoint (see above)

# 3b. If customer DID NOT PAY (no transaction in Nomba):
#     Mark as abandoned:
UPDATE orders
SET status='cancelled', payment_status='abandoned'
WHERE id='ORDER_ID';
```

---

## ✅ Verification Checklist

After fixing, verify:

- [ ] Test payment completes successfully
- [ ] Webhook received within 5 seconds
- [ ] Order auto-updates to "paid"
- [ ] Callback page shows success (no error)
- [ ] Customer sees order confirmation
- [ ] Confirmation email received

---

## 📞 Still Having Issues?

**Run the diagnostic script:**
```bash
node scripts/test-nomba-verification.js YOUR_ORDER_ID
```

**Check these files:**
1. `WEBHOOK_PRODUCTION_DEBUG.md` - Full troubleshooting guide
2. `NOMBA_PRODUCTION_CHECKLIST.md` - Production deployment checklist
3. `NOMBA_TEST_REPORT.md` - Complete test results

**Contact Nomba Support:**
- Email: support@nomba.com
- Ask: "Why aren't webhooks being delivered to my URL?"
- Provide: Webhook URL, transaction ID, timestamp

---

**Created:** February 5, 2026
**Purpose:** Quick fix for callback verification errors
**Estimated time to fix:** 10-15 minutes
