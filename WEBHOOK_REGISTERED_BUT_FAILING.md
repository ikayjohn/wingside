# Webhook Registered But Still Failing - Focused Debug

**Your Situation:**
- ✅ Webhook registered in Nomba dashboard
- ✅ NOMBA_WEBHOOK_SECRET in env vars (local & production)
- ❌ Callback page still shows "verification error"

**This means the issue is NOT setup, but something in the processing chain.**

---

## 🎯 Most Likely Issue: Signature Verification Failing

Even though you have the secret configured, the signature might not be matching. This is the #1 cause when webhook is registered.

### Quick Test: Bypass Signature Temporarily

**Add to your production environment variables:**
```bash
NOMBA_WEBHOOK_BYPASS_VERIFICATION=true
```

**Then make a test payment.**

### Result Interpretation:

**✅ If it works:** Problem is signature verification
- Secret is wrong
- Secret has extra whitespace
- Header name is different
- Signature algorithm mismatch

**❌ If it still fails:** Problem is elsewhere
- Database permissions (RLS)
- Order update logic
- Callback page logic

---

## 🔍 Step 1: Check What's Actually Happening

### A. Run SQL Query in Supabase

```sql
-- Check recent Nomba orders
SELECT
  order_number,
  payment_reference,
  payment_status,
  status,
  paid_at,
  created_at,
  CASE
    WHEN paid_at IS NOT NULL THEN 'Webhook processed ✅'
    WHEN created_at < NOW() - INTERVAL '5 minutes' THEN 'Webhook NOT received ❌'
    ELSE 'Still waiting ⏳'
  END as webhook_status,
  EXTRACT(EPOCH FROM (NOW() - created_at))/60 as minutes_pending
FROM orders
WHERE payment_gateway = 'nomba'
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 10;
```

**Analysis:**
- If `paid_at` exists → Webhook IS working! Problem is callback page logic
- If `paid_at` is NULL after 5+ min → Webhook is NOT being received/processed

### B. Check Server Logs

**If using Vercel:**
```bash
# In Vercel dashboard: Deployments → Your deployment → Logs
# Search for: "nomba" or "webhook"
```

**If using VPS/Hostinger:**
```bash
# View recent logs
pm2 logs --lines 200 | grep -i "nomba\|webhook"

# Or direct log file:
tail -n 200 /var/log/your-app.log | grep -i "nomba\|webhook"
```

**Look for these patterns:**

✅ **Working webhook:**
```
Nomba webhook event: payment_success
Order WS202602040093 payment confirmed via Nomba webhook
✅ Payment processed atomically
✅ Email sent to customer@email.com
```

❌ **Signature failing:**
```
❌ Invalid Nomba webhook signature
Invalid webhook signature
Signature verification failed
```

❌ **Processing failing:**
```
Nomba webhook event: payment_success
Error updating order from webhook
Failed to update order
```

---

## 🔧 Step 2: Fix Based on What You Found

### Scenario A: Webhook NOT in logs at all

**Problem:** Nomba can't reach your server OR webhook fails before logging

**Solutions:**

1. **Test endpoint accessibility from internet:**
```bash
# Run from a different machine/network (NOT your local dev)
curl -X POST https://www.wingside.ng/api/payment/nomba/webhook \
  -H "Content-Type: application/json" \
  -d '{"event_type":"test","requestId":"test-123","data":{}}'

# Should return: {"received":true}
```

2. **Check Nomba webhook delivery logs:**
   - Nomba Dashboard → Developers → Webhooks → Delivery History
   - Look for your webhook URL
   - Check status: Should show "200 OK" deliveries
   - If showing errors: Click to see error details

3. **Check firewall/security:**
   - Is your server blocking Nomba's IP?
   - Is rate limiting blocking webhook requests?
   - Is there a reverse proxy (Nginx/Apache) blocking POST requests?

---

### Scenario B: "Invalid webhook signature" in logs

**Problem:** Webhook arrives but signature doesn't match

**Solution 1: Verify Secret is Correct**

```bash
# Test signature generation
NOMBA_WEBHOOK_SECRET="your-secret-here" node scripts/test-webhook-signature.js
```

This will show you:
- If secret is loaded correctly
- What signature your server generates
- Common signature format issues

**Solution 2: Compare Secrets**

1. Nomba Dashboard → Developers → Webhooks → Your webhook → Copy secret
2. Your production env: Check NOMBA_WEBHOOK_SECRET
3. Compare character by character (look for extra spaces!)

**Solution 3: Check for Whitespace**

```bash
# Remove any whitespace
# In your env vars, ensure no spaces:
NOMBA_WEBHOOK_SECRET="abc123def456"  # ✅ Good
NOMBA_WEBHOOK_SECRET=" abc123def456" # ❌ Bad (space before)
NOMBA_WEBHOOK_SECRET="abc123def456 " # ❌ Bad (space after)
```

**Solution 4: Temporarily Bypass**

While diagnosing, bypass signature verification:

```bash
# Add to production env vars:
NOMBA_WEBHOOK_BYPASS_VERIFICATION=true
```

Test payment. If it works now:
- ✅ Confirms signature is the problem
- Contact Nomba support for correct signature format

---

### Scenario C: Webhook processes but callback shows error

**Problem:** Order becomes "paid" eventually, but customer sees error in callback

**Symptoms:**
- Query shows `paid_at` exists
- But customer reported seeing verification error
- Callback page shows error before webhook completes

**Root Cause:** Callback checks too early

**Current callback logic:**
1. Customer returns from Nomba
2. Callback checks order status
3. If not paid → Immediately tries to verify with Nomba API
4. **Problem:** This happens BEFORE webhook processes!

**Solution: Fix Callback Timing**

The callback SHOULD wait for webhook first. Check your callback page at line 92-94:

```typescript
// Step 3: Not paid yet - poll for webhook processing (2 minutes max)
console.log('[Callback] Order not paid yet, waiting for webhook...');
const maxAttempts = 60; // 60 attempts × 2 seconds = 2 minutes
```

**Verify this polling is happening BEFORE the verify API call at line 59.**

The flow should be:
1. Check if already paid (line 42) ✅
2. **WAIT for webhook (lines 92-121)** ← This should happen first
3. Only AFTER 2 minutes → Check Nomba API (lines 56-90)

**If they're in wrong order, the callback checks Nomba too early!**

---

### Scenario D: Database Update Failing

**Problem:** Webhook arrives, signature validates, but order update fails

**Symptoms in logs:**
```
Nomba webhook event: payment_success
Error updating order from webhook: {some error}
```

**Solution: Check RLS Policies**

```sql
-- Check if webhook can update orders
-- Run in Supabase SQL Editor:

-- Test update (as service role)
SELECT
  id,
  order_number,
  payment_status,
  status
FROM orders
WHERE payment_gateway = 'nomba'
  AND payment_status = 'pending'
LIMIT 1;

-- Try to update it
-- (This simulates what webhook does)
UPDATE orders
SET payment_status = 'paid', status = 'confirmed'
WHERE id = 'ORDER_ID_FROM_ABOVE';

-- If this fails: RLS is blocking it
-- If this works: Problem is elsewhere
```

**If RLS is blocking:**

Your webhook uses `createAdminClient()` which should bypass RLS. Check:

1. `lib/supabase/admin.ts` exists and exports `createAdminClient()`
2. Webhook imports: `import { createAdminClient } from '@/lib/supabase/admin'`
3. Uses admin client: `const admin = createAdminClient()`
4. Admin client has service role key (not anon key)

---

## 🎯 Step 3: Test the Fix

### Test With Real Transaction

1. **Make test payment** (use small amount like ₦100)
2. **Watch server logs in real-time:**
```bash
# In separate terminal:
pm2 logs --lines 0 # Then watch new entries

# Or:
tail -f /var/log/your-app.log
```

3. **Complete payment on Nomba page**

4. **What you should see (within 5 seconds):**
```
Nomba webhook event: payment_success
Order WS202602040XXX payment confirmed via Nomba webhook
✅ Rewards awarded
✅ Email sent
```

5. **Customer should see:** Success page (no verification error)

6. **Check database:**
```sql
SELECT payment_status, status, paid_at
FROM orders
WHERE order_number = 'WS202602040XXX';
-- Should show: paid, confirmed, and paid_at timestamp
```

---

## 🚨 Quick Fix for Current Stuck Orders

If you have orders stuck right now while debugging:

```bash
# For each stuck order with payment_reference:

# 1. Check if customer actually paid
#    Look in Nomba dashboard for the payment_reference

# 2a. If customer PAID:
curl -X POST https://www.wingside.ng/api/payment/nomba/webhook-test \
  -H "Content-Type: application/json" \
  -d '{"orderReference": "PAYMENT_REFERENCE_FROM_DB"}'

# 2b. If customer DID NOT PAY:
# Run in Supabase:
UPDATE orders
SET status='cancelled', payment_status='abandoned'
WHERE payment_reference='PAYMENT_REFERENCE_FROM_DB';
```

---

## 📊 Monitoring Dashboard (After Fix)

Add this to your daily routine:

```sql
-- Daily webhook health check
SELECT
  DATE(created_at) as date,
  COUNT(*) as total_nomba_orders,
  SUM(CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END) as paid_orders,
  SUM(CASE WHEN payment_status = 'pending' AND created_at < NOW() - INTERVAL '10 minutes' THEN 1 ELSE 0 END) as stuck_orders,
  ROUND(100.0 * SUM(CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END) / COUNT(*), 1) as success_rate
FROM orders
WHERE payment_gateway = 'nomba'
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

**Target:** Success rate > 95%, Stuck orders = 0

---

## 🆘 If Still Not Working

### Priority Order:

1. **Run:** `NOMBA_WEBHOOK_BYPASS_VERIFICATION=true` and test
   - If works: Problem is signature → Contact Nomba support
   - If fails: Problem is elsewhere → Continue below

2. **Check production env vars:**
   ```bash
   # SSH into server or check hosting dashboard
   env | grep NOMBA

   # Verify all are set:
   # NOMBA_CLIENT_ID
   # NOMBA_CLIENT_SECRET
   # NOMBA_ACCOUNT_ID
   # NOMBA_WEBHOOK_SECRET
   ```

3. **Test webhook endpoint:**
   ```bash
   curl -v -X POST https://www.wingside.ng/api/payment/nomba/webhook \
     -H "Content-Type: application/json" \
     -d '{"event_type":"test","requestId":"test","data":{}}'

   # Should return 200 OK with {"received":true}
   ```

4. **Check Nomba webhook logs:**
   - Dashboard → Developers → Webhooks → Delivery History
   - What status does it show?
   - Click on a failed delivery to see error details

5. **Contact Nomba Support:**
   - Email: support@nomba.com
   - Subject: "Webhook signature verification failing"
   - Include: Your webhook URL, merchant ID, example transaction ID
   - Ask: Confirm correct webhook signature header names and format

---

## ✅ Success Checklist

After fixing, verify:

- [ ] Test payment completes successfully
- [ ] Webhook appears in server logs within 5 seconds
- [ ] No "Invalid signature" errors in logs
- [ ] Order status updates to "paid" automatically
- [ ] Callback page shows success (no verification error)
- [ ] Customer receives confirmation email
- [ ] Rewards awarded correctly
- [ ] No entries in `failed_notifications` table

---

**What to do RIGHT NOW:**

1. Run the SQL query above to check recent orders
2. Check your server logs for webhook activity
3. If seeing "Invalid signature": Run `node scripts/test-webhook-signature.js`
4. If not seeing webhooks at all: Check Nomba dashboard delivery logs
5. Test with bypass enabled to isolate the issue

**Need help with a specific order? Give me the order_number and I'll help you debug it step by step.**
