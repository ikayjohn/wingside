# Webhook Secret Setup Guide

## Step 1: Update Your .env File

Replace your current webhook secret with the new secure one:

### ⭐ RECOMMENDED (Option 1)
```bash
NOMBA_WEBHOOK_SECRET=CxkskZhInDlJXpmqcuRAHxNFJrEuf8BfHLDHConyNU
```

### Alternative (Option 3 - Extra Secure)
```bash
NOMBA_WEBHOOK_SECRET=ceefa26e6ad6f532662519532435b2d319433ea91392c2d1e53903ab3366b449
```

## Step 2: Restart Your Development Server

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

## Step 3: Verify Secret is Loaded

```bash
curl http://localhost:3000/api/payment/nomba/test
```

Expected response:
```json
{
  "credentials": {
    "webhookSecret": "✅ Set"
  }
}
```

## Step 4: Update Nomba Dashboard

1. Log into [Nomba Dashboard](https://dashboard.nomba.com)
2. Go to **Settings → Developer → Webhooks**
3. Find your webhook endpoint
4. Update the **Webhook Secret** field to: `CxkskZhInDlJXpmqcuRAHxNFJrEuf8BfHLDHConyNU`
5. Click **Save**

## Step 5: Test Webhook Signature

Generate a test webhook:
```bash
curl -X POST http://localhost:3000/api/payment/nomba/test-webhook \
  -H "Content-Type: application/json" \
  -d '{"orderReference":"WS-TEST-NEW-SECRET"}'
```

Use the generated curl command to test:
```bash
curl -X POST http://localhost:3000/api/payment/nomba/webhook \
  -H 'nomba-signature: <from-test-response>' \
  -H 'nomba-sig-value: <from-test-response>' \
  -H 'nomba-signature-algorithm: HmacSHA256' \
  -H 'nomba-signature-version: 1.0.0' \
  -H 'nomba-timestamp: <from-test-response>' \
  -H 'Content-Type: application/json' \
  -d '<payload-from-test-response>'
```

Expected response: `{"error":"Order not found"}` (this is good - means signature verified!)

---

## Security Notes

### Why These Secrets Are Secure

1. **Cryptographically Random**: Generated using Node.js `crypto.randomBytes()`
2. **Sufficient Length**: 43-64 characters (industry standard is 32+)
3. **High Entropy**: Millions of billions of possible combinations
4. **Unpredictable**: Impossible to guess or brute-force

### Entropy Analysis

| Option | Length | Character Set | Possible Combinations | Entropy |
|--------|--------|---------------|----------------------|---------|
| Option 1 | 43 | Alphanumeric (62) | 62^43 | ~256 bits |
| Option 3 | 64 | Hex (16) | 16^64 | ~256 bits |

**Both exceed NIST recommendations for HMAC keys (256 bits)**

### Best Practices

✅ **DO**:
- Store in `.env.local` or `.env.production` (not in code)
- Never commit `.env` files to git
- Rotate secrets periodically (every 6-12 months)
- Use different secrets for development vs production
- Keep backups in secure password managers

❌ **DON'T**:
- Share secrets in chat/email/slack
- Commit secrets to version control
- Use the same secret across multiple services
- Use simple passwords like "password123"
- Share secrets publicly

### For Production

When deploying to production:

1. **Vercel**:
   ```bash
   vercel env add NOMBA_WEBHOOK_SECRET production
   # Paste: CxkskZhInDlJXpmqcuRAHxNFJrEuf8BfHLDHConyNU
   ```

2. **VPS/Hostinger**:
   ```bash
   # Edit environment file
   nano /var/www/wingside/.env.production
   # Add: NOMBA_WEBHOOK_SECRET=CxkskZhInDlJXpmqcuRAHxNFJrEuf8BfHLDHConyNU
   ```

3. **Docker**:
   ```bash
   docker run -e NOMBA_WEBHOOK_SECRET=CxkskZhInDlJXpmqcuRAHxNFJrEuf8BfHLDHConyNU ...
   ```

---

## Comparison: Old vs New Secret

| Aspect | Old Secret | New Secret |
|--------|-----------|-----------|
| Format | `@The0n3&Only` | `CxkskZhInDlJXpmqcuRAHxNFJrEuf8BfHLDHConyNU` |
| Length | 12 characters | 43 characters |
| Entropy | ~47 bits | ~256 bits |
| Special chars | `@`, `&` (risky) | None (safe) |
| Brute-force resistant | ❌ (seconds) | ✅ (billions of years) |
| Shell-safe | ⚠️ Needs quotes | ✅ No quotes needed |

---

## Migration Steps

1. ✅ Generate new secret (done above)
2. ⚠️ **CRITICAL**: Update Nomba dashboard FIRST (before updating app)
3. ⚠️ **CRITICAL**: Update app environment variables SECOND
4. ✅ Restart application
5. ✅ Test with new secret
6. ✅ Monitor webhooks for 24 hours
7. ✅ Remove old secret from Nomba dashboard after verification

**Why this order?** This prevents webhook failures during migration.

---

## Troubleshooting

### Webhook returns 401 "Invalid signature"
- ✅ Check secret matches exactly in Nomba dashboard
- ✅ Check for extra spaces or quotes
- ✅ Restart application after changing .env
- ✅ Verify with test endpoint: `/api/payment/nomba/test-webhook`

### Secret not loading
- ✅ Check .env file is in project root
- ✅ Ensure file is named `.env.local` (dev) or `.env.production` (prod)
- ✅ No spaces around `=` sign
- ✅ Restart server after changes

---

## Additional Security Measures

Consider these extra security layers:

1. **IP Whitelisting** (in Nomba dashboard):
   - Only accept webhooks from Nomba's IP ranges
   - Contact Nomba support for their IP list

2. **Rate Limiting**:
   - Already implemented in your webhook
   - Prevents brute-force attacks

3. **Webhook Logging**:
   - Log all webhook events with signatures
   - Helps detect suspicious activity

4. **Alerting**:
   - Set up alerts for repeated signature failures
   - Monitor for unusual patterns

---

## Generated Secrets Summary

```
Option 1 (RECOMMENDED): CxkskZhInDlJXpmqcuRAHxNFJrEuf8BfHLDHConyNU
Option 2: _y_lcOQVFoZOQEoC5DR4wRCQbRbZ4goyWyWsvjGlqkc
Option 3 (EXTRA SECURE): ceefa26e6ad6f532662519532435b2d319433ea91392c2d1e53903ab3366b449
Option 4: 8YfBLaEgGJj9RUDZRRVEEHU6V4&r8Gfc%w#gu@&K
```

**Pick ONE and use it consistently across both:**
1. Your application (`.env` file)
2. Nomba dashboard (webhook configuration)

---

## Need a New Secret?

Run this command to generate more:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 43))"
```

---

## Checklist

- [ ] Copy new secret to clipboard
- [ ] Update Nomba dashboard with new secret
- [ ] Update `.env` file with new secret
- [ ] Restart development server
- [ ] Test with `/api/payment/nomba/test-webhook`
- [ ] Verify signature verification works
- [ ] Monitor webhook logs for 24 hours
- [ ] Remove old secret from Nomba dashboard

---

**Your new secure webhook secret is ready to use! 🎉**
