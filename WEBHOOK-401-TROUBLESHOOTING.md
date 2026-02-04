# 🔧 Nomba Webhook 401 Error - Troubleshooting Guide

## Issue
Webhook URL `https://www.wingside.ng/api/payment/nomba/webhook/` returns **401 Unauthorized**

## Quick Diagnosis

Run this command to identify the exact issue:

```bash
curl -X POST https://www.wingside.ng/api/payment/nomba/webhook-debug \
  -H "Content-Type: application/json" \
  -H "nomba-signature: test" \
  -H "nomba-timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
  -H "nomba-signature-algorithm: HmacSHA256" \
  -H "nomba-signature-version: 1.0.0" \
  -d '{"event_type":"test","requestId":"test","data":{}}'
```

Look at the `recommendation` field in the response - it will tell you exactly what's wrong.

---

## Common Issues & Solutions

### Issue 1: NOMBA_WEBHOOK_SECRET Not Set in Production

**Symptoms:**
```json
{
  "validation": {
    "webhookSecretSet": false
  },
  "recommendation": "❌ NOMBA_WEBHOOK_SECRET not set in environment"
}
```

**Solution:**

#### If using Vercel:
```bash
# Install Vercel CLI
npm i -g vercel

# Add environment variable
vercel env add NOMBA_WEBHOOK_SECRET production

# Paste your secret when prompted:
# CxkskZhInDlJXpmqcuRAHxNFJrEuf8BfHLDHConyNU

# Redeploy
vercel --prod
```

#### If using VPS/Hostinger:
```bash
# SSH into your server
ssh user@your-server

# Edit production environment file
cd /path/to/wingside
nano .env.production

# Add this line:
NOMBA_WEBHOOK_SECRET=CxkskZhInDlJXpmqcuRAHxNFJrEuf8BfHLDHConyNU

# Save (Ctrl+X, then Y, then Enter)

# Restart the application
pm2 restart wingside
# or
npm run build && npm start
```

---

### Issue 2: Secret Mismatch Between App and Nomba Dashboard

**Symptoms:**
```json
{
  "validation": {
    "webhookSecretSet": true,
    "signatureValid": false
  },
  "recommendation": "❌ Signature mismatch! Check that NOMBA_WEBHOOK_SECRET matches exactly..."
}
```

**Solution:**

The secret must be **EXACTLY THE SAME** in both places:

1. **Your Application Environment** (Check current value):
   ```bash
   # On Vercel
   vercel env ls

   # On VPS
   cat .env.production | grep NOMBA_WEBHOOK_SECRET
   ```

2. **Nomba Dashboard**:
   - Log into https://dashboard.nomba.com
   - Go to **Settings → Developer → Webhooks**
   - Find your webhook URL
   - Check the **Webhook Secret** field

**To Fix:**
```bash
# Option A: Update Nomba Dashboard to match your app
# Copy the secret from your app and paste it in Nomba Dashboard

# Option B: Update your app to match Nomba Dashboard
# Copy the secret from Nomba Dashboard and update your environment
```

**⚠️ IMPORTANT:**
- No extra spaces
- Exact same casing
- No extra quotes
- Copy-paste entire secret

---

### Issue 3: Nomba Not Sending Required Headers

**Symptoms:**
```json
{
  "validation": {
    "signaturePresent": false,
    "timestampPresent": false
  },
  "recommendation": "❌ No signature headers found..."
}
```

**Solution:**

This might be Nomba's test endpoint behavior. **Real payment webhooks** will include all required headers:

- ✅ `nomba-signature`
- ✅ `nomba-sig-value`
- ✅ `nomba-timestamp`
- ✅ `nomba-signature-algorithm: HmacSHA256`
- ✅ `nomba-signature-version: 1.0.0`

**To verify:**
1. Make a small test payment (₦50) through Nomba checkout
2. Wait for webhook to be sent
3. Check application logs:
   ```bash
   # On Vercel
   vercel logs

   # On VPS
   pm2 logs wingside
   tail -f /var/log/wingside/app.log
   ```

---

### Issue 4: Timestamp Validation Issues

**Symptoms:**
```json
{
  "validation": {
    "timestampValid": false,
    "timestampAge": "350s"
  },
  "recommendation": "❌ Timestamp too old: 350000ms (max 300000ms allowed)"
}
```

**Solution:**

This usually means:
- Your server clock is out of sync
- Webhook was delayed > 5 minutes

**Fix: Sync server time:**

```bash
# On Ubuntu/Debian
sudo apt-get install ntp
sudo service ntp restart

# On CentOS/RHEL
sudo yum install ntp
sudo systemctl start ntpd
sudo systemctl enable ntpd

# Verify sync
timedatectl
```

---

## Step-by-Step Resolution

### Step 1: Verify Secret is Set

```bash
# Test debug endpoint
curl -s https://www.wingside.ng/api/payment/nomba/webhook-debug | python -m json.tool
```

Look for:
```json
{
  "validation": {
    "webhookSecretSet": true,
    "webhookSecretLength": 43
  }
}
```

### Step 2: Check Nomba Dashboard Configuration

1. Log into Nomba Dashboard
2. Navigate to **Developer → Webhooks**
3. Verify these fields:
   - **Webhook URL**: `https://www.wingside.ng/api/payment/nomba/webhook`
   - **Webhook Secret**: Should match your `NOMBA_WEBHOOK_SECRET`

⚠️ **Important:** Don't include trailing slash in URL (Nomba handles this)

### Step 3: Match Secrets

Choose one approach:

**Option A: Use the new secure secret I generated**

1. Update your app's environment:
   ```bash
   NOMBA_WEBHOOK_SECRET=CxkskZhInDlJXpmqcuRAHxNFJrEuf8BfHLDHConyNU
   ```

2. Update Nomba Dashboard:
   - Paste the same secret: `CxkskZhInDlJXpmqcuRAHxNFJrEuf8BfHLDHConyNU`
   - Save

**Option B: Use your existing secret**

1. Get current secret from Nomba Dashboard
2. Update your app to match

### Step 4: Redeploy Application

**Vercel:**
```bash
# Push changes to trigger redeploy
git add .
git commit -m "Fix webhook secret"
git push

# Or manual redeploy
vercel --prod
```

**VPS:**
```bash
# Restart application
pm2 restart wingside
```

### Step 5: Test Again

```bash
curl -X POST https://www.wingside.ng/api/payment/nomba/webhook-debug \
  -H "Content-Type: application/json" \
  -H "nomba-signature: test" \
  -H "nomba-timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
  -H "nomba-signature-algorithm: HmacSHA256" \
  -H "nomba-signature-version: 1.0.0" \
  -d '{"event_type":"test","requestId":"test","data":{}}' | python -m json.tool
```

Expected response:
```json
{
  "recommendation": "❌ Signature mismatch! Check that NOMBA_WEBHOOK_SECRET matches..."
}
```

This is actually **good progress** - it means:
- ✅ Secret is set
- ✅ Headers are received
- ✅ Timestamp is valid
- ❌ Just need to match the secrets

### Step 6: Make Real Test Payment

Once debug endpoint shows:
```json
{
  "validation": {
    "allPassed": true
  },
  "recommendation": "✅ All validations passed! Webhook is working correctly."
}
```

Then:
1. Make a small test payment (₦50-₦100)
2. Complete checkout
3. Wait for webhook
4. Check logs for successful processing

---

## Verify Secrets Match

### Check Current Secret in App

**Vercel:**
```bash
vercel env ls | grep NOMBA_WEBHOOK_SECRET
```

**VPS:**
```bash
cat .env.production | grep NOMBA_WEBHOOK_SECRET
# or
pm2 env wingside | grep NOMBA_WEBHOOK_SECRET
```

### Check Secret in Nomba Dashboard

1. Log into Nomba Dashboard
2. Go to **Developer → Webhooks**
3. Click on your webhook
4. View **Webhook Secret** field

### Compare Visually

They should match **EXACTLY**:
```
App:     CxkskZhInDlJXpmqcuRAHxNFJrEuf8BfHLDHConyNU
Nomba:   CxkskZhInDlJXpmqcuRAHxNFJrEuf8BfHLDHConyNU
         ✅ MATCH
```

---

## Still Having Issues?

### Collect Diagnostic Information

```bash
# Run full diagnostic
curl -X POST https://www.wingside.ng/api/payment/nomba/webhook-debug \
  -H "Content-Type: application/json" \
  -H "nomba-signature: test" \
  -H "nomba-timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
  -H "nomba-signature-algorithm: HmacSHA256" \
  -H "nomba-signature-version: 1.0.0" \
  -d '{"event_type":"test","requestId":"test","data":{}}' > webhook-diagnostic.json

# View the file
cat webhook-diagnostic.json | python -m json.tool
```

### Check Application Logs

**Vercel:**
```bash
vercel logs -f
```

**VPS:**
```bash
pm2 logs wingside --lines 100
# or
journalctl -u wingside -f
```

Look for webhook-related logs:
```
Nomba webhook event: payment_success
✅ Nomba webhook signature verified successfully
✅ Timestamp validated
```

---

## Quick Reference: Recommended Secret

```
CxkskZhInDlJXpmqcuRAHxNFJrEuf8BfHLDHConyNU
```

Use this secret in:
1. ✅ `.env.production` file
2. ✅ Nomba Dashboard webhook configuration

---

## Contact Support

If after following this guide you still have issues:

1. Collect the diagnostic output from `/api/payment/nomba/webhook-debug`
2. Check application logs
3. Verify Nomba dashboard configuration
4. Contact Nomba support with the error details

---

## Prevention

**Best Practices:**
- ✅ Use environment variables for secrets (never hardcode)
- ✅ Never commit `.env` files to git
- ✅ Use different secrets for dev/staging/production
- ✅ Rotate secrets every 6-12 months
- ✅ Test webhooks after any deployment

**Security Checklist:**
- ✅ NOMBA_WEBHOOK_SECRET set in production
- ✅ Secret matches in Nomba dashboard
- ✅ Webhook endpoint accessible (not blocked by firewall)
- ✅ Server time synced via NTP
- ✅ HTTPS enabled (required for webhooks)
- ✅ Rate limiting enabled (prevents abuse)
