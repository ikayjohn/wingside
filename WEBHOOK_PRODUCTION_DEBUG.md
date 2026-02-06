# Webhook Production Testing & Debugging Guide

**Issue:** Callback page gives "verification error"
**Cause:** Verify endpoint can't find transaction in Nomba (various reasons)
**Solution:** Step-by-step debugging and testing below

---

## 🔍 Understanding the Problem

When a customer completes payment and returns to your callback page, this happens:

1. **Callback page loads** with `?order_id=xxx`
2. **Fetches order** from database
3. **Checks payment status** - if not "paid", it tries to verify with Nomba
4. **Calls verify endpoint** → `/api/payment/nomba/verify`
5. **Verify endpoint calls Nomba API** to check transaction status
6. **If transaction not found** → Shows "verification error"

### Why Transaction Might Not Be Found:

❌ **Payment not completed** - Customer abandoned checkout
❌ **Webhook not received yet** - Timing issue (webhook delayed)
❌ **Wrong payment reference** - Mismatch between order and transaction
❌ **Nomba API credentials** - Using sandbox credentials for production
❌ **Transaction still processing** - Nomba hasn't finalized it yet

---

## 🧪 Step 1: Test Webhook Delivery

### A. Check if Nomba can reach your webhook

```bash
# Test if webhook endpoint is accessible from internet
curl -X POST https://www.wingside.ng/api/payment/nomba/webhook \
  -H "Content-Type: application/json" \
  -d '{"event_type":"test","requestId":"manual-test","data":{}}'

# Expected response: {"received":true}
# If error 404: Webhook endpoint not deployed
# If error 401: Signature verification enabled (good!)
# If error 500: Check server logs for error details
```

### B. Check Nomba Dashboard

1. Log into **Nomba Dashboard** → **Developers** → **Webhooks**
2. Check **Webhook Delivery Logs** (last 7 days)
3. Look for your recent transactions:
   - ✅ **200 OK** - Webhook delivered successfully
   - ❌ **Failed** - Nomba couldn't reach your server
   - ⏳ **Pending** - Webhook is being retried

### C. Common Webhook Delivery Issues

| Issue | Symptom | Solution |
|-------|---------|----------|
| **URL not registered** | No delivery attempts | Add `https://www.wingside.ng/api/payment/nomba/webhook` |
| **HTTPS required** | Delivery fails | Ensure URL uses HTTPS (not HTTP) |
| **Firewall blocking** | Timeout errors | Whitelist Nomba's IPs |
| **Wrong environment** | Sandbox payments don't trigger production webhook | Use matching credentials (sandbox ↔ sandbox, prod ↔ prod) |

---

## 🛠️ Step 2: Test Webhook Processing Manually

I've created a test endpoint to simulate webhook processing without waiting for Nomba.

### Use the Webhook Test Endpoint

```bash
# Test webhook processing for a specific order
curl -X POST https://www.wingside.ng/api/payment/nomba/webhook-test \
  -H "Content-Type: application/json" \
  -d '{
    "orderReference": "WS-WS202602040093-1770215087530"
  }'

# Replace with your actual payment_reference from the order
```

**This endpoint will:**
1. Find order by payment reference
2. Update order to "paid" status
3. Process rewards (points, bonuses)
4. Return detailed results

**Expected response:**
```json
{
  "success": true,
  "message": "Webhook test completed - order marked as paid",
  "order": {
    "order_number": "WS202602040093",
    "payment_status": "paid",
    "status": "confirmed"
  },
  "rewards": {
    "success": true,
    "points_awarded": 100
  }
}
```

### Check Webhook Status

```bash
# Check if webhook was received for an order
curl "https://www.wingside.ng/api/payment/nomba/webhook-test?orderNumber=WS202602040093"

# Response will tell you:
# - Whether webhook was received
# - How long ago order was created
# - Diagnosis of the issue
```

---

## 🔧 Step 3: Fix Verification Error in Callback

The callback page is calling the verify endpoint which then calls Nomba API. Let's debug this step-by-step.

### Debug Script for Specific Order

```bash
# Create this test script
node scripts/test-nomba-verification.js
```

```javascript
// scripts/test-nomba-verification.js
const ORDER_ID = 'your-order-id-here'; // Get from URL or database

async function testVerification() {
  console.log('Testing Nomba verification for order:', ORDER_ID);

  // Step 1: Get order details
  const orderRes = await fetch(`https://www.wingside.ng/api/orders/${ORDER_ID}`);
  const orderData = await orderRes.json();

  if (!orderData.order) {
    console.error('❌ Order not found');
    return;
  }

  const order = orderData.order;
  console.log('✅ Order found:', {
    order_number: order.order_number,
    payment_reference: order.payment_reference,
    payment_status: order.payment_status,
    payment_gateway: order.payment_gateway
  });

  // Step 2: Check if payment reference exists
  if (!order.payment_reference) {
    console.error('❌ No payment reference - payment was never initialized');
    console.log('Possible causes:');
    console.log('- Payment initialization failed');
    console.log('- Order was created but payment not started');
    return;
  }

  // Step 3: Try to verify with Nomba
  console.log('\n🔍 Verifying with Nomba API...');
  const verifyRes = await fetch('https://www.wingside.ng/api/payment/nomba/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transactionRef: order.payment_reference })
  });

  const verifyData = await verifyRes.json();
  console.log('Nomba verification response:', verifyData);

  // Step 4: Interpret results
  if (verifyData.success) {
    console.log('✅ Payment verified in Nomba');
    console.log('Status:', verifyData.status);
    console.log('Amount:', verifyData.amount);

    if (order.payment_status !== 'paid') {
      console.log('⚠️  BUT order is not marked as paid yet!');
      console.log('This means webhook was not received.');
      console.log('\nSolution: Use the webhook-test endpoint to manually process it.');
    }
  } else {
    console.error('❌ Verification failed:', verifyData.error);

    if (verifyData.error?.includes('not found') || verifyData.code === '404') {
      console.log('\n📋 DIAGNOSIS: Transaction not found in Nomba');
      console.log('\nPossible causes:');
      console.log('1. Customer abandoned payment (never completed on Nomba page)');
      console.log('2. Using wrong credentials (sandbox vs production mismatch)');
      console.log('3. Payment reference format incorrect');
      console.log('\nRecommended action:');
      console.log('- Check Nomba dashboard for this transaction');
      console.log('- If not there: Customer abandoned payment → Mark order as abandoned');
      console.log('- If there: Credentials mismatch → Check environment variables');
    } else {
      console.error('\n📋 DIAGNOSIS: API error');
      console.log('Check server logs for more details');
      console.log('Error:', verifyData.error);
    }
  }
}

testVerification().catch(console.error);
```

---

## 🎯 Step 4: Common Scenarios & Solutions

### Scenario A: Customer Completed Payment, Webhook Not Received

**Symptoms:**
- Customer says they paid
- Nomba dashboard shows successful transaction
- Order still shows "pending" in your database

**Solution:**
```bash
# 1. Get payment reference from order
# 2. Manually trigger webhook processing
curl -X POST https://www.wingside.ng/api/payment/nomba/webhook-test \
  -H "Content-Type: application/json" \
  -d '{"orderReference": "WS-ORDER123-1234567890"}'

# 3. Verify order updated
curl "https://www.wingside.ng/api/orders/ORDER_ID"
```

---

### Scenario B: Customer Abandoned Payment

**Symptoms:**
- Customer closed Nomba checkout page
- Order stuck in "pending"
- Nomba API returns "transaction not found"

**Solution:**
```sql
-- Mark order as abandoned
UPDATE orders
SET
  status = 'cancelled',
  payment_status = 'abandoned',
  updated_at = NOW()
WHERE id = 'ORDER_ID';
```

Or use the callback page - it should automatically detect this!

---

### Scenario C: Credentials Mismatch

**Symptoms:**
- Verify endpoint returns "not found"
- But customer says they paid
- Nomba dashboard shows transaction

**Diagnosis:**
```bash
# Check if using correct environment
# Your .env should have EITHER sandbox OR production credentials, not mixed

# Production credentials:
NOMBA_CLIENT_ID=prod_client_id
NOMBA_CLIENT_SECRET=prod_secret
NOMBA_ACCOUNT_ID=prod_account_id

# Webhook receives production events
# But verify endpoint uses sandbox credentials
# → Transaction not found!
```

**Solution:**
Ensure ALL Nomba credentials are from the same environment (production).

---

### Scenario D: Webhook Signature Verification Failing

**Symptoms:**
- Nomba dashboard shows "200 OK" delivered
- But order not updated
- Server logs show "Invalid webhook signature"

**Temporary Fix:**
```bash
# Add to environment variables (ONLY FOR TESTING)
NOMBA_WEBHOOK_BYPASS_VERIFICATION=true
```

**Permanent Fix:**
1. Check `NOMBA_WEBHOOK_SECRET` matches Nomba dashboard
2. Contact Nomba support to confirm webhook header names
3. Check webhook logs for exact signature received

---

## 📊 Step 5: Monitor Webhook Health

### Database Queries

```sql
-- Check recent Nomba orders and webhook status
SELECT
  order_number,
  payment_reference,
  payment_status,
  status,
  paid_at,
  created_at,
  EXTRACT(EPOCH FROM (COALESCE(paid_at, NOW()) - created_at)) as seconds_to_payment
FROM orders
WHERE payment_gateway = 'nomba'
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Find stuck orders (pending > 10 minutes)
SELECT
  order_number,
  payment_reference,
  payment_status,
  status,
  created_at,
  EXTRACT(EPOCH FROM (NOW() - created_at))/60 as minutes_pending
FROM orders
WHERE payment_gateway = 'nomba'
  AND payment_status = 'pending'
  AND created_at < NOW() - INTERVAL '10 minutes'
ORDER BY created_at DESC;
```

---

## 🚨 Step 6: Fix the Callback "Verification Error"

The verification error happens because the callback is too aggressive in checking Nomba. Here's the fix:

### Option A: Be More Lenient (Recommended)

The callback should wait longer for webhook before checking Nomba API.

**Current behavior:** Checks Nomba immediately if order not paid
**Problem:** Webhook might still be processing

**Fix:** Only check Nomba if webhook definitely hasn't fired (after 2 min timeout)

```typescript
// In callback page, modify the verification logic:

// BEFORE: Check Nomba immediately
if (order.payment_status !== 'paid') {
  // Verify with Nomba API
}

// AFTER: Wait for webhook first, then check Nomba
if (order.payment_status !== 'paid') {
  // Poll for webhook for 2 minutes first
  await pollForWebhook();

  // ONLY THEN check Nomba if still not paid
  if (order.payment_status !== 'paid') {
    // Now verify with Nomba API
  }
}
```

### Option B: Better Error Messages

Instead of showing "verification error", show specific messages:

```typescript
if (verifyData.error?.includes('not found')) {
  setMessage(
    'Payment not completed. If you closed the payment page, ' +
    'your order has been cancelled and no charge was made. ' +
    'You can start a new order.'
  );
} else if (verifyData.error?.includes('credentials')) {
  setMessage(
    'Payment verification in progress. ' +
    'Please check your email for confirmation or contact support.'
  );
} else {
  setMessage(
    'Payment verification delayed. ' +
    'If you completed payment, you will receive an email confirmation shortly. ' +
    'Order reference: ' + order.order_number
  );
}
```

---

## ✅ Step 7: Production Webhook Checklist

Before considering webhooks "working":

- [ ] Webhook URL registered in Nomba dashboard
- [ ] HTTPS enabled on your server
- [ ] Webhook endpoint returns 200 OK for test events
- [ ] `NOMBA_WEBHOOK_SECRET` set correctly
- [ ] Test transaction → webhook received within 5 seconds
- [ ] Order status updated to "paid" automatically
- [ ] Rewards awarded automatically
- [ ] Customer receives confirmation email
- [ ] No entries in `failed_notifications` table

---

## 🎯 Quick Fix for Current Issue

**If you have orders stuck right now:**

```bash
# 1. Find all stuck pending orders
curl "https://www.wingside.ng/api/orders?payment_gateway=nomba&payment_status=pending"

# 2. For each order, check if customer actually paid
# Check Nomba dashboard for the payment_reference

# 3a. If customer paid: Manually process webhook
curl -X POST https://www.wingside.ng/api/payment/nomba/webhook-test \
  -H "Content-Type: application/json" \
  -d '{"orderReference": "PAYMENT_REFERENCE"}'

# 3b. If customer didn't pay: Mark as abandoned
# Run SQL: UPDATE orders SET status='cancelled', payment_status='abandoned' WHERE id='...'
```

---

## 📞 When to Contact Nomba Support

Contact Nomba if:
- Webhook URL registered but no delivery attempts in dashboard
- Webhook deliveries show "200 OK" but your server logs show no requests
- Transaction exists in Nomba but verify API returns "not found"
- Webhook signature verification failing despite correct secret

**What to ask:**
1. "Can you check webhook delivery logs for my account?"
2. "What is the correct webhook signature header name?"
3. "Can you manually trigger a webhook for transaction ID: XXX?"

---

## 🎉 Testing Checklist

Once you've made fixes, test:

- [ ] Real transaction in sandbox environment
- [ ] Webhook received within 5 seconds
- [ ] Order automatically updated to "paid"
- [ ] Callback page shows success (not verification error)
- [ ] Customer can see order confirmation
- [ ] Abandoned payment properly detected
- [ ] Test with production credentials
- [ ] Monitor first 5 production transactions

---

**Created:** February 5, 2026
**Purpose:** Diagnose and fix webhook delivery and callback verification issues
**Status:** Ready to use immediately
