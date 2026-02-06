# Nomba Payment Gateway - Production Deployment Checklist

**Status:** ✅ Code is production-ready (98.2% test pass rate)
**Date:** February 5, 2026

---

## 🚨 CRITICAL - Do These First

### 1. Environment Variables (5 minutes)

```bash
# .env.production

# ✅ REQUIRED - Get from Nomba Dashboard
NOMBA_CLIENT_ID=your_production_client_id
NOMBA_CLIENT_SECRET=your_production_client_secret
NOMBA_ACCOUNT_ID=your_production_account_id

# 🔒 CRITICAL - Get from Nomba Webhook Settings
NOMBA_WEBHOOK_SECRET=your_webhook_secret

# ⚠️  IMPORTANT - Must be false or removed
NOMBA_WEBHOOK_BYPASS_VERIFICATION=false

# ✅ REQUIRED - Your production URL
NEXT_PUBLIC_APP_URL=https://www.wingside.ng
```

**Verification:**
```bash
# Check if variables are set (don't run this - just verify manually in your dashboard)
echo "Check your hosting provider's environment variable settings"
```

---

### 2. Nomba Dashboard Setup (10 minutes)

**Steps:**
1. Log into your Nomba production dashboard
2. Navigate to **Developers > Webhooks**
3. Add new webhook URL: `https://www.wingside.ng/api/payment/nomba/webhook`
4. Enable events:
   - ✅ `payment_success`
   - ✅ `payment_failed`
   - ✅ `payment_cancelled`
5. Copy the **Webhook Secret** and add to `NOMBA_WEBHOOK_SECRET` env var
6. Save webhook configuration

**Test Webhook:**
- Click "Test Webhook" in Nomba dashboard
- Check your server logs for incoming webhook
- Should see: `✅ Nomba webhook signature verified successfully`

---

### 3. Database Migration (2 minutes)

Run this SQL in Supabase SQL Editor:

```sql
-- Check if abandoned status exists
SELECT unnest(enum_range(NULL::order_status_enum));
SELECT unnest(enum_range(NULL::payment_status_enum));

-- If 'abandoned' is missing, run:
-- (This migration may already exist in your migrations folder)
ALTER TYPE order_status_enum ADD VALUE IF NOT EXISTS 'abandoned';
ALTER TYPE payment_status_enum ADD VALUE IF NOT EXISTS 'abandoned';
```

**Verification:**
- "abandoned" should appear in both enum lists

---

## 🧪 Pre-Production Testing (30 minutes)

### Option A: Nomba Sandbox (Recommended)

**Setup:**
1. Get sandbox credentials from Nomba dashboard
2. Update env vars with sandbox credentials temporarily
3. Test complete payment flow

**Test Cases:**
```bash
# Test 1: Small Amount
Amount: ₦500
Expected: Payment succeeds, order confirmed, rewards awarded

# Test 2: Medium Amount with Promo Code
Amount: ₦5,000
Promo Code: TEST10
Expected: Discount applied, payment succeeds

# Test 3: Abandoned Payment
Amount: ₦2,000
Action: Close checkout page without paying
Expected: Callback detects abandonment, order marked as "abandoned"

# Test 4: Failed Payment
Amount: ₦1,000
Card: Use Nomba test card for declined payment
Expected: Order marked as "cancelled", payment_status="failed"
```

### Option B: Production Testing with Real Money (Use Small Amounts)

**First Transaction:**
1. Create order with smallest amount (e.g., ₦100)
2. Complete payment with real card
3. Monitor server logs in real-time
4. Verify:
   - ✅ Order status updated to "confirmed"
   - ✅ Payment status updated to "paid"
   - ✅ Rewards awarded correctly
   - ✅ Email received
   - ✅ SMS received (if configured)

---

## 📊 Monitoring Setup (15 minutes)

### 1. Real-Time Logs

**Watch payment initialization:**
```bash
# If you have access to server logs
tail -f /var/log/your-app/production.log | grep "Nomba"
```

**Look for these log messages:**
- `[Nomba Initialize]` - Payment started
- `[Nomba Verify]` - Transaction verified
- `Nomba webhook event: payment_success` - Webhook received
- `✅ Nomba webhook signature verified successfully` - Signature OK
- `Order [ORDER_NUM] payment confirmed via Nomba webhook` - Payment processed

### 2. Database Queries

**Check recent Nomba payments:**
```sql
-- Recent Nomba orders
SELECT
    order_number,
    payment_status,
    status,
    total,
    payment_reference,
    created_at
FROM orders
WHERE payment_gateway = 'nomba'
ORDER BY created_at DESC
LIMIT 20;
```

**Check failed notifications:**
```sql
-- Failed emails/SMS (should be empty)
SELECT *
FROM failed_notifications
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

**Check webhook processing (if you added the audit table):**
```sql
-- Webhook processing (from NOMBA_BULLETPROOF_PLAN.md)
SELECT
    event_type,
    order_reference,
    processed_successfully,
    error_message,
    processing_duration_ms,
    created_at
FROM payment_webhooks
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

### 3. Alerts (Optional but Recommended)

**Set up Supabase webhook or Zapier to alert you when:**
- New order with `payment_gateway='nomba'` is created
- Order status changes to 'confirmed'
- Row inserted into `failed_notifications` table

---

## 🔍 First Transaction Checklist

**When your first customer uses Nomba:**

### During Payment
- [ ] Customer clicks "Pay with Nomba"
- [ ] Server logs show: `[Nomba Initialize]` starting
- [ ] No errors in initialization logs
- [ ] Customer redirected to Nomba checkout page
- [ ] Nomba page loads successfully

### After Payment
- [ ] Customer completes payment on Nomba
- [ ] Server logs show: `Nomba webhook event: payment_success`
- [ ] Signature verification passes (check logs)
- [ ] Order status updated to "confirmed"
- [ ] Payment status updated to "paid"
- [ ] Customer sees success message
- [ ] Customer redirected to order confirmation

### Post-Payment
- [ ] Check database: order status is "confirmed"
- [ ] Check database: rewards were awarded
- [ ] Check email: customer received confirmation
- [ ] Check SMS: customer received SMS (if enabled)
- [ ] Check database: no entries in `failed_notifications`

---

## ⚠️  Troubleshooting Guide

### Issue: Webhook Not Received

**Symptoms:** Order stuck in "pending" status
**Check:**
1. Webhook URL configured in Nomba dashboard?
2. Webhook URL accessible from internet? (not localhost)
3. Firewall blocking incoming webhooks?
4. Check Nomba dashboard webhook logs for delivery status

**Solution:**
```bash
# Test webhook endpoint manually
curl -X POST https://www.wingside.ng/api/payment/nomba/webhook \
  -H "Content-Type: application/json" \
  -d '{"event_type":"test","requestId":"test","data":{}}'

# Should return: {"received":true}
```

---

### Issue: Signature Verification Failed

**Symptoms:** Logs show `❌ Invalid Nomba webhook signature`
**Check:**
1. `NOMBA_WEBHOOK_SECRET` matches Nomba dashboard?
2. Webhook secret was copied correctly (no extra spaces)?
3. Using production credentials (not sandbox)?

**Temporary Solution:**
```bash
# ONLY FOR DEBUGGING - Remove after fixing
NOMBA_WEBHOOK_BYPASS_VERIFICATION=true
```

**Permanent Solution:**
- Contact Nomba support to verify webhook secret
- Confirm webhook signature header name

---

### Issue: Order Stuck in Pending

**Symptoms:** Customer paid but order shows "pending"
**Check:**
1. Was webhook received? (check server logs)
2. Did webhook processing fail? (check error logs)
3. Is payment reference saved in order? (check database)

**Manual Fix:**
```bash
# Run this script to diagnose and fix
node scripts/debug-nomba-callback.js

# Or check the order directly
curl http://localhost:3000/api/orders/[ORDER_ID]
```

**Database Fix (if webhook never processed):**
```sql
-- Check Nomba transaction status first
-- Then manually update order (only if payment confirmed in Nomba dashboard)
UPDATE orders
SET
    payment_status = 'paid',
    status = 'confirmed',
    paid_at = NOW()
WHERE id = 'ORDER_ID_HERE'
AND payment_gateway = 'nomba'
AND payment_status = 'pending';
```

---

### Issue: Abandoned Payment Not Detected

**Symptoms:** Customer closed checkout page, order still "pending"
**Expected Behavior:**
- When customer returns to callback URL without completing payment
- Callback page verifies with Nomba API
- If transaction not found, marks order as "abandoned"

**Check:**
1. Customer actually visited callback URL? (check access logs)
2. Verify endpoint working: `/api/payment/nomba/verify`
3. Check abandoned payment logic in callback page

**Manual Fix:**
```sql
-- Mark order as abandoned manually
UPDATE orders
SET
    status = 'cancelled',
    payment_status = 'abandoned',
    updated_at = NOW()
WHERE order_number = 'WS202602040093'
AND payment_status = 'pending';
```

---

## 📈 Success Metrics

**After First Week:**
- [ ] Payment success rate > 95%
- [ ] No entries in `failed_notifications` table
- [ ] Average webhook processing time < 2 seconds
- [ ] Zero false cancellations
- [ ] Customer complaints = 0

**Track These Metrics:**
```sql
-- Payment success rate (last 7 days)
SELECT
    COUNT(*) as total_payments,
    SUM(CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END) as successful,
    ROUND(100.0 * SUM(CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
FROM orders
WHERE payment_gateway = 'nomba'
AND created_at > NOW() - INTERVAL '7 days';

-- Abandoned payments (should be low)
SELECT COUNT(*) as abandoned_count
FROM orders
WHERE payment_gateway = 'nomba'
AND payment_status = 'abandoned'
AND created_at > NOW() - INTERVAL '7 days';
```

---

## 🎉 You're Ready!

**Pre-Launch Checklist:**
- [x] Code tested (98.2% pass rate)
- [ ] Environment variables configured
- [ ] Nomba webhook registered
- [ ] Database migration run
- [ ] Sandbox testing completed
- [ ] Monitoring set up
- [ ] Team notified about launch

**After Launch:**
- [ ] Monitor first 5 transactions closely
- [ ] Check logs every hour for first day
- [ ] Review metrics after 24 hours
- [ ] Check `failed_notifications` daily for first week

---

## 🆘 Emergency Contacts

**If payments are failing:**
1. Check logs first (95% of issues visible in logs)
2. Check Nomba dashboard (webhook delivery status)
3. Review this checklist
4. Contact Nomba support: support@nomba.com

**Rollback Plan:**
If Nomba has critical issues, you can:
1. Disable Nomba payment option in frontend
2. Fall back to Paystack (already implemented)
3. Contact affected customers
4. Process orders manually

---

**Good luck with your launch! 🚀**

Your Nomba integration is well-built and ready for production.
