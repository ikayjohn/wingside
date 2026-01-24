# Referral Fraud Detection - Quick Setup Guide

## What This Does

Automatically detects and flags suspicious referral patterns:
- ✅ Email pattern fraud (john1@, john2@, john3@...)
- ✅ Rapid referral velocity (too many too fast)
- ✅ No purchase activity (fake accounts)
- ✅ Self-referral detection (same person, different account)

## VPS Deployment

### Step 1: Pull Latest Code

```bash
cd /var/www/wingside
git pull origin main
```

### Step 2: Run Database Migration

**Option A: Supabase Dashboard (Recommended)**
```bash
# Get migration SQL
cat /var/www/wingside/supabase/migrations/20250128_add_referral_fraud_detection.sql
```

Then:
1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste the migration
3. Click **Run**

**Option B: Direct psql**
```bash
psql "your-connection-string" \
  -f /var/www/wingside/supabase/migrations/20250128_add_referral_fraud_detection.sql
```

Expected result:
```
✅ Table created: referral_fraud_flags
✅ Functions created: 5 fraud detection functions
✅ Extension enabled: pg_trgm
```

### Step 3: Deploy Application

```bash
bash deploy-vps.sh
```

### Step 4: Test Fraud Detection

```bash
# Run fraud scan manually
curl -X POST "https://www.wingside.ng/api/admin/referral-fraud/scan" \
  -H "Cookie: YOUR_SESSION_COOKIE"
```

Expected response:
```json
{
  "success": true,
  "flagsCreated": 5,
  "summary": {
    "total_flags": 5,
    "email_pattern_flags": 2,
    "rapid_referral_flags": 1,
    "no_purchase_flags": 2,
    "self_referral_flags": 0
  }
}
```

### Step 5: Setup Automated Daily Scan (Optional)

Create cron script:
```bash
cat > /var/www/wingside/run-fraud-detection-cron.sh << 'EOF'
#!/bin/bash
cd /var/www/wingside

CRON_SECRET=$(grep "^CRON_SECRET=" .env.production | cut -d '=' -f 2- | tr -d '\r')

curl -L -X POST "https://www.wingside.ng/api/admin/referral-fraud/scan" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -s -w "\nHTTP Status: %{http_code}\n" \
  >> /var/www/wingside/logs/fraud-detection.log 2>&1

echo "[$(date)] Fraud detection scan executed - Exit: $?" >> /var/www/wingside/logs/fraud-detection.log
EOF

chmod +x /var/www/wingside/run-fraud-detection-cron.sh
```

Add to crontab:
```bash
crontab -e
# Add this line (runs daily at 2:00 AM):
0 2 * * * /var/www/wingside/run-fraud-detection-cron.sh
```

## API Endpoints Created

1. **`POST /api/admin/referral-fraud/scan`**
   - Runs fraud detection on all referrals
   - Returns number of flags created

2. **`GET /api/admin/referral-fraud/flags`**
   - Lists all fraud flags
   - Supports filtering by status, severity, type

3. **`POST /api/admin/referral-fraud/review`**
   - Update flag status (confirmed fraud, false positive, etc.)
   - Adds admin notes

4. **`GET /api/admin/referral-fraud/stats`**
   - Dashboard statistics
   - Counts by severity and type

## Fraud Types Detected

### 1. Email Pattern Fraud
**Detects:** `john1@email.com`, `john2@email.com`, `john3@email.com`
- **Threshold:** 3+ similar emails
- **Severity:** Medium to Critical

### 2. Rapid Referral Velocity
**Detects:** Too many referrals too quickly
- **Thresholds:**
  - 10+ referrals in 24 hours
  - 5+ referrals in 1 hour
- **Severity:** Medium to Critical

### 3. No Purchase Activity
**Detects:** Referred users who never order (fake accounts)
- **Threshold:** 30+ days with zero orders
- **Severity:** Low to High

### 4. Self-Referral
**Detects:** Users referring themselves
- **Checks:**
  - Same email domain
  - Similar names (fuzzy matching)
- **Severity:** Medium to Critical

## Usage Examples

### View Fraud Statistics

```bash
curl "https://www.wingside.ng/api/admin/referral-fraud/stats" \
  -H "Cookie: YOUR_SESSION_COOKIE"
```

### Get Pending Flags (High Severity)

```bash
curl "https://www.wingside.ng/api/admin/referral-fraud/flags?status=flagged&severity=high" \
  -H "Cookie: YOUR_SESSION_COOKIE"
```

### Mark as Confirmed Fraud

```bash
curl -X POST "https://www.wingside.ng/api/admin/referral-fraud/review" \
  -H "Cookie: YOUR_SESSION_COOKIE" \
  -H "Content-Type: application/json" \
  -d '{
    "flagId": "uuid-of-flag",
    "status": "confirmed_fraud",
    "adminNotes": "Verified multiple fake accounts - revoking all rewards"
  }'
```

### Mark as False Positive

```bash
curl -X POST "https://www.wingside.ng/api/admin/referral-fraud/review" \
  -H "Cookie: YOUR_SESSION_COOKIE" \
  -H "Content-Type: application/json" \
  -d '{
    "flagId": "uuid-of-flag",
    "status": "false_positive",
    "adminNotes": "Legitimate family members using different emails"
  }'
```

## Database Tables Created

### `referral_fraud_flags`
Stores detected fraud cases with:
- Fraud type and severity
- Fraud score (0-100)
- Evidence (JSON with proof)
- Status (flagged, investigating, confirmed, etc.)
- Admin review notes

## Admin Workflow

1. **Daily Review:**
   - Check fraud stats dashboard
   - View new flagged referrals

2. **Investigation:**
   - Examine high-severity flags first
   - Review evidence data
   - Check user's referral history

3. **Decision:**
   - **Confirmed Fraud:** Mark as fraud, revoke rewards
   - **False Positive:** Dismiss flag
   - **Needs Investigation:** Mark as investigating

4. **Action:**
   - Add admin notes for context
   - Update flag status
   - Monitor user for repeat behavior

## Evidence Data Examples

### Email Pattern Fraud
```json
{
  "similar_emails_count": 4,
  "base_pattern": "john@email.com",
  "referred_email": "john4@email.com"
}
```

### Rapid Velocity
```json
{
  "referrals_last_24h": 15,
  "referrals_last_1h": 6,
  "threshold_exceeded": true
}
```

### No Purchase Activity
```json
{
  "days_since_signup": 90,
  "order_count": 0,
  "referred_email": "inactive@email.com"
}
```

## Monitoring

### View Scan Logs

```bash
tail -f /var/www/wingside/logs/fraud-detection.log
```

### Check Cron Status

```bash
crontab -l | grep fraud-detection
```

### Database Queries

```sql
-- Get all flagged referrals
SELECT * FROM referral_fraud_flags WHERE status = 'flagged';

-- Count by severity
SELECT severity, COUNT(*) FROM referral_fraud_flags GROUP BY severity;

-- Recent high-severity flags
SELECT * FROM referral_fraud_flags
WHERE severity IN ('high', 'critical')
ORDER BY created_at DESC
LIMIT 10;
```

## Troubleshooting

### Issue: pg_trgm extension error
**Fix:**
```sql
-- Run in Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

### Issue: No flags created
**Check:**
1. Do you have referrals in the database?
2. Are referrals older than 30 days?
3. Are there any duplicate email patterns?

### Issue: Permission denied
**Fix:** Ensure migration granted execute permissions to service_role

### Issue: 401 Unauthorized
**Fix:** Make sure you're logged in as admin user

## Status Check

After deployment, verify:
- [ ] Migration ran successfully
- [ ] All 5 fraud detection functions exist
- [ ] Can run manual scan
- [ ] Fraud stats endpoint works
- [ ] Can review flags
- [ ] Cron job scheduled (if using)

## Next Steps

1. **Run initial scan** to see if there's existing fraud
2. **Review flagged cases** and mark false positives
3. **Set up daily cron** for automated scanning
4. **Monitor dashboard** regularly
5. **Adjust thresholds** if too many false positives

## Documentation

- **Full Guide:** `docs/REFERRAL_FRAUD_DETECTION.md`
- **API Reference:** See documentation for detailed API specs
- **Cron Jobs:** `MISSING_CRON_JOBS.md`

## Future Enhancements

Consider adding:
- IP address tracking
- Device fingerprinting
- Real-time fraud blocking
- Email alerts for critical flags
- ML-based fraud prediction
