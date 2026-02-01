# Webhook Security Configuration

## Overview

Since Embedly **does not provide webhook signature verification**, this document outlines the multi-layered security approach implemented to protect webhook endpoints from unauthorized access.

## Security Layers

### 1. IP Allowlisting (Recommended)

Restrict webhook requests to only come from Embedly's known server IPs.

**Configuration:**
```bash
# .env.production
EMBEDLY_ALLOWED_IPS=1.2.3.4,5.6.7.8,9.10.11.12
```

**How to get Embedly IPs:**
1. Contact Embedly support to request their webhook server IP addresses
2. Check Embedly documentation for IP ranges
3. Monitor initial webhook logs to identify legitimate IPs

**Benefits:**
- Prevents requests from unknown sources
- Simple and effective first line of defense
- No performance overhead

### 2. Custom Webhook Token (Recommended)

Use a custom authentication token that you configure in both your app and Embedly's webhook settings.

**Configuration:**
```bash
# .env.production
EMBEDLY_WEBHOOK_TOKEN=your-secret-random-token-here
```

Generate a secure token:
```bash
# Linux/Mac
openssl rand -hex 32

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Output example: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

**Setup in Embedly:**
1. Go to Embedly webhook configuration
2. Look for "Custom Headers" or "Authentication" settings
3. Add header: `X-Webhook-Token: your-secret-random-token-here`

**Benefits:**
- Embedly will send your token with every webhook
- Your app verifies the token matches
- Easy to rotate if compromised

### 3. Idempotency Protection (Implemented)

All webhook handlers check for duplicate events using payment references.

**How it works:**
```typescript
// Check if webhook already processed
const { data: existingTransaction } = await supabase
  .from('wallet_transactions')
  .select('id, status')
  .eq('reference', paymentReference)
  .maybeSingle();

if (existingTransaction) {
  console.log('Webhook already processed - skipping duplicate');
  return; // Prevent duplicate processing
}
```

**Benefits:**
- Prevents replay attacks
- Handles Embedly retry mechanisms safely
- Protects against double-crediting/debiting

### 4. HTTPS/TLS (Required)

Always use HTTPS for webhook endpoints in production.

**Vercel/Hostinger:** HTTPS is automatic

**Custom VPS:**
```nginx
# nginx configuration
server {
    listen 443 ssl http2;
    server_name api.wingside.ng;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location /api/embedly/webhooks {
        proxy_pass http://localhost:3000;
    }
}
```

### 5. Rate Limiting (TODO)

Implement rate limiting to prevent webhook flooding attacks.

**Recommended configuration:**
```typescript
import { checkRateLimitByIp } from '@/lib/rate-limit';

// In webhook handler
const { rateLimit } = await checkRateLimitByIp({
  limit: 100,           // Max 100 webhooks
  window: 60 * 1000     // Per minute
});

if (!rateLimit.success) {
  return rateLimitErrorResponse(rateLimit);
}
```

### 6. Secret URL Path (Optional)

Use a hard-to-guess webhook URL instead of the obvious path.

**Instead of:**
```
https://wingside.ng/api/embedly/webhooks
```

**Use:**
```
https://wingside.ng/api/embedly/wh_a1b2c3d4e5f6
```

Generate secret path:
```bash
node -e "console.log('wh_' + require('crypto').randomBytes(8).toString('hex'))"
```

**Benefits:**
- Adds obscurity (not security, but helpful)
- Reduces automated attack attempts
- Easy to rotate if leaked

## Implementation Checklist

- [x] Idempotency checks implemented
- [x] Content-Type validation
- [x] IP address logging
- [x] Webhook validation function
- [ ] IP allowlisting configured (requires Embedly IPs)
- [ ] Custom webhook token configured
- [ ] HTTPS enabled in production
- [ ] Rate limiting added
- [ ] Monitoring and alerting set up

## Configuration Examples

### Minimal Setup (Development)
```bash
# No authentication - logs warnings but accepts all webhooks
# ⚠️ DO NOT USE IN PRODUCTION
```

### Basic Security (Production)
```bash
# .env.production
EMBEDLY_WEBHOOK_TOKEN=your-32-char-random-token
```

### Maximum Security (Recommended for Production)
```bash
# .env.production
EMBEDLY_WEBHOOK_TOKEN=your-32-char-random-token
EMBEDLY_ALLOWED_IPS=1.2.3.4,5.6.7.8
```

## Monitoring & Alerts

### Failed Webhook Attempts

All failed webhook validations are logged:
```typescript
console.error('[Embedly Webhook] Request validation failed:', {
  reason: validation.reason,
  ip: clientIp,
  userAgent: request.headers.get('user-agent'),
  timestamp: new Date().toISOString(),
});
```

**Set up alerts for:**
- Multiple failed attempts from same IP
- Webhooks from unexpected IPs
- Missing authentication tokens
- Unusual webhook patterns

### Webhook Error Tracking

All webhook processing errors are stored in `webhook_errors` table:
```sql
SELECT * FROM webhook_errors
WHERE severity = 'critical'
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

**Monitor for:**
- Handler failures
- Database errors
- Idempotency violations
- Data inconsistencies

## Testing Webhooks

### Local Testing

1. Use ngrok to expose local server:
```bash
ngrok http 3000
```

2. Configure Embedly webhook URL:
```
https://abc123.ngrok.io/api/embedly/webhooks
```

3. Add custom header in Embedly:
```
X-Webhook-Token: your-test-token
```

4. Set local environment:
```bash
# .env.local
EMBEDLY_WEBHOOK_TOKEN=your-test-token
```

### Manual Testing

Send test webhook with curl:
```bash
curl -X POST https://wingside.ng/api/embedly/webhooks \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Token: your-token" \
  -d '{
    "event": "nip",
    "data": {
      "accountNumber": "0123456789",
      "reference": "TEST_REF_123",
      "amount": 1000,
      "senderName": "Test User",
      "dateOfTransaction": "2024-01-01T00:00:00Z"
    }
  }'
```

Expected response if configured correctly:
```json
{
  "received": true,
  "processed": true
}
```

## Security Best Practices

1. **Never log sensitive data**
   - ❌ Don't log: Full payment data, account numbers, card details
   - ✅ Do log: References, timestamps, event types

2. **Rotate tokens regularly**
   - Change `EMBEDLY_WEBHOOK_TOKEN` every 90 days
   - Update in both environment variables and Embedly dashboard

3. **Monitor webhook activity**
   - Set up daily reports of webhook volumes
   - Alert on unusual patterns or spikes

4. **Test disaster recovery**
   - Practice manual webhook replay from logs
   - Document recovery procedures

5. **Keep dependencies updated**
   - Regularly update Node.js and packages
   - Monitor security advisories

## Troubleshooting

### Webhooks Being Rejected

**Check logs for:**
```
[Embedly Webhook] Request validation failed: IP not allowlisted
```

**Solutions:**
1. Verify IP is in `EMBEDLY_ALLOWED_IPS`
2. Check if Embedly changed their IPs
3. Temporarily disable IP allowlisting to test

### Missing Webhooks

**Verify:**
1. Webhook URL is correct in Embedly dashboard
2. HTTPS certificate is valid
3. Server is responding (check uptime)
4. No firewall blocking Embedly IPs

**Check Embedly logs:**
- Failed webhook attempts
- HTTP status codes returned
- Response times

### Duplicate Transactions

**If idempotency is working:**
- You'll see: "Webhook already processed - skipping duplicate"
- No duplicate wallet transactions created
- Safe to ignore

**If duplicates occur:**
1. Check idempotency logic in webhook handlers
2. Verify `reference` field is unique per transaction
3. Review database transactions table

## Contact & Support

**For Embedly issues:**
- Support: support@embedly.com
- Documentation: https://docs.embedly.com

**For urgent webhook issues:**
1. Check `webhook_errors` table for details
2. Review application logs
3. Check Embedly webhook delivery logs
4. Contact Embedly support if needed

## Version History

- **2024-02-01**: Removed signature verification (Embedly doesn't provide signatures)
- **2024-02-01**: Added IP allowlisting and custom token authentication
- **2024-01-31**: Initial webhook implementation with signature verification
