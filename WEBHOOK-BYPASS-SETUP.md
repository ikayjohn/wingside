# 🔓 Bypass Webhook Verification for Nomba Dashboard Setup

## The Problem

Nomba Dashboard won't let you save the webhook secret because your webhook returns 401.
But your webhook returns 401 because Nomba doesn't have the correct secret yet.

**Chicken-and-egg problem!**

## The Solution

Temporarily bypass signature verification, save the webhook in Nomba, then re-enable verification.

---

## Step-by-Step Instructions

### Step 1: Add Bypass Environment Variable

**If using Vercel:**
```bash
vercel env add NOMBA_WEBHOOK_BYPASS_VERIFICATION production
# When prompted, enter: true
```

**If using VPS/Hostinger:**
```bash
# SSH into your server
ssh user@your-server

# Edit environment file
nano /path/to/wingside/.env.production

# Add this line:
NOMBA_WEBHOOK_BYPASS_VERIFICATION=true

# Save and exit (Ctrl+X, then Y, then Enter)
```

**If using Docker:**
```bash
# Add to docker-compose.yml or .env file
echo "NOMBA_WEBHOOK_BYPASS_VERIFICATION=true" >> .env.production
```

### Step 2: Deploy Changes

**Vercel:**
```bash
git add .
git commit -m "Temporarily bypass webhook verification for setup"
git push

# Or trigger redeploy
vercel --prod
```

**VPS:**
```bash
# Build and restart
cd /path/to/wingside
npm run build
pm2 restart wingside
```

### Step 3: Verify Bypass is Active

```bash
curl -X POST "https://www.wingside.ng/api/payment/nomba/webhook/" \
  -H "Content-Type: application/json" \
  -d '{"event_type":"test","requestId":"test","data":{}}'
```

Expected response:
```json
{
  "received": true
}
```

Or check logs for:
```
⚠️  WEBHOOK SIGNATURE VERIFICATION BYPASSED - Set up mode only!
```

### Step 4: Save Webhook in Nomba Dashboard

1. Go to https://dashboard.nomba.com
2. Navigate to **Developer → Webhooks**
3. Add/Edit your webhook:
   - **Webhook URL**: `https://www.wingside.ng/api/payment/nomba/webhook`
   - **Webhook Secret**: `CxkskZhInDlJXpmqcuRAHxNFJrEuf8BfHLDHConyNU`
4. Click **Save** or **Test**
5. ✅ Should succeed now!

### Step 5: Remove Bypass (CRITICAL!)

**If using Vercel:**
```bash
# Remove the environment variable
vercel env rm NOMBA_WEBHOOK_BYPASS_VERIFICATION production
```

**If using VPS/Hostinger:**
```bash
# Edit environment file
nano /path/to/wingside/.env.production

# Remove this line:
# NOMBA_WEBHOOK_BYPASS_VERIFICATION=true

# Save and exit
```

### Step 6: Update Webhook Secret (If not done in Step 4)

**Also set the new secret in your environment:**

**Vercel:**
```bash
vercel env add NOMBA_WEBHOOK_SECRET production
# Paste: CxkskZhInDlJXpmqcuRAHxNFJrEuf8BfHLDHConyNU
```

**VPS:**
```bash
nano /path/to/wingside/.env.production

# Add/update:
NOMBA_WEBHOOK_SECRET=CxkskZhInDlJXpmqcuRAHxNFJrEuf8BfHLDHConyNU
```

### Step 7: Deploy Final Changes

**Vercel:**
```bash
git add .
git commit -m "Remove webhook bypass and set new secret"
git push
```

**VPS:**
```bash
npm run build
pm2 restart wingside
```

### Step 8: Verify Everything Works

```bash
curl -X POST "https://www.wingside.ng/api/payment/nomba/webhook/" \
  -H "Content-Type: application/json" \
  -H "nomba-signature: test" \
  -H "nomba-timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
  -H "nomba-signature-algorithm: HmacSHA256" \
  -H "nomba-signature-version: 1.0.0" \
  -d '{"event_type":"test","requestId":"test","data":{}}'
```

Expected response:
```json
{
  "error": "Invalid webhook signature"
}
```

This is **GOOD** - it means verification is back on!

### Step 9: Make a Real Test Payment

1. Go to your website
2. Make a small order (₦50-₦100)
3. Complete checkout with Nomba
4. Wait for webhook
5. Check if order is processed successfully

---

## ⚠️ IMPORTANT SECURITY NOTES

### NEVER Leave Bypass Enabled in Production!

The bypass flag is **ONLY for setup**. Leaving it enabled means:
- ❌ Anyone can send fake webhooks
- ❌ Orders can be marked as paid without payment
- ❌ Security is completely disabled

### Checklist

- [ ] Add `NOMBA_WEBHOOK_BYPASS_VERIFICATION=true`
- [ ] Deploy
- [ ] Save webhook in Nomba Dashboard with new secret
- [ ] **REMOVE** `NOMBA_WEBHOOK_BYPASS_VERIFICATION`
- [ ] Add/update `NOMBA_WEBHOOK_SECRET=CxkskZhInDlJXpmqcuRAHxNFJrEuf8BfHLDHConyNU`
- [ ] Deploy
- [ ] Test with real payment
- [ ] Verify bypass is removed (check logs)

---

## Quick Summary

```bash
# 1. Add bypass
vercel env add NOMBA_WEBHOOK_BYPASS_VERIFICATION production
# Value: true

# 2. Deploy
git push

# 3. Save webhook in Nomba Dashboard
# URL: https://www.wingside.ng/api/payment/nomba/webhook
# Secret: CxkskZhInDlJXpmqcuRAHxNFJrEuf8BfHLDHConyNU

# 4. Remove bypass
vercel env rm NOMBA_WEBHOOK_BYPASS_VERIFICATION production

# 5. Set new secret
vercel env add NOMBA_WEBHOOK_SECRET production
# Value: CxkskZhInDlJXpmqcuRAHxNFJrEuf8BfHLDHConyNU

# 6. Deploy final changes
git push

# 7. Test with real payment
```

---

## Troubleshooting

### Bypass not working?

Check environment variable is set:
```bash
# Vercel
vercel env ls | grep BYPASS

# VPS
cat .env.production | grep BYPASS
```

Check logs for bypass message:
```
⚠️  WEBHOOK SIGNATURE VERIFICATION BYPASSED
```

### Still getting 401 after removing bypass?

Make sure both secrets match:
- Production environment: `NOMBA_WEBHOOK_SECRET`
- Nomba Dashboard: Webhook Secret field

They must be **EXACTLY the same**.

### Nomba Dashboard still won't save?

1. Clear browser cache
2. Try different browser
3. Contact Nomba support

---

## After Setup

Once everything is working:

✅ Bypass removed
✅ New secret set in production
✅ New secret set in Nomba Dashboard
✅ Real payment test successful
✅ Orders being processed correctly

You're all set! 🎉

---

## Need Help?

If you get stuck:
1. Check logs: `vercel logs` or `pm2 logs wingside`
2. Test endpoint: `/api/payment/nomba/test`
3. Test debug endpoint: `/api/payment/nomba/webhook-debug` (after deploying it)
4. Check Nomba Dashboard for error messages

Remember: **Remove bypass immediately after setup!**
