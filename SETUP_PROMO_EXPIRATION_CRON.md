# Promo Code Auto-Deactivation Cron Job - VPS Setup Guide

## What This Does

Automatically deactivates promo codes that have passed their `valid_until` date:
- Finds promo codes where `valid_until < NOW()` and `is_active = true`
- Sets `is_active = false`
- Prevents customers from using expired promo codes
- Logs all deactivations with days overdue

## Step 1: Deploy to VPS

```bash
# SSH into your Hostinger VPS
cd /var/www/wingside

# Pull latest changes
git pull origin main

# Deploy the code
bash deploy-vps.sh
```

Expected output:
```
✅ Deployment successful
```

## Step 2: Run Database Migration

### Option A: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run this command on VPS to get the migration:
```bash
cat /var/www/wingside/supabase/migrations/20250128_add_promo_expiration.sql
```
4. Copy the output and paste into SQL Editor
5. Click **Run**

### Option B: Direct psql (if you have database credentials)
```bash
psql "your-connection-string" \
  -f /var/www/wingside/supabase/migrations/20250128_add_promo_expiration.sql
```

Expected result:
```
✅ Functions created:
  - process_promo_expiration()
  - get_expiring_promo_codes()
```

## Step 3: Setup Cron Script

```bash
# Make the script executable
chmod +x /var/www/wingside/run-expire-promo-codes-cron.sh

# Test the script manually
bash /var/www/wingside/run-expire-promo-codes-cron.sh

# Check the log output
tail -20 /var/www/wingside/logs/expire-promo-codes.log
```

Expected output:
```
HTTP Status: 200
{"success":true,"codes_deactivated":0,"expirations":[]}
[Thu Jan 23 04:00:00 WAT 2025] Promo code expiration cron executed - Exit: 0
```

## Step 4: Add to Crontab

```bash
# Edit crontab
crontab -e

# Add this line (runs daily at 4:00 AM)
0 4 * * * /var/www/wingside/run-expire-promo-codes-cron.sh

# Save and exit
# Verify it was added
crontab -l | grep expire-promo
```

Expected output:
```
0 4 * * * /var/www/wingside/run-expire-promo-codes-cron.sh
```

## Step 5: Test the API Endpoint

### Preview what will be deactivated (without processing)
```bash
cd /var/www/wingside
CRON_SECRET=$(grep "^CRON_SECRET=" .env.production | cut -d '=' -f 2- | tr -d '\r')

curl -L -X GET "https://www.wingside.ng/api/cron/expire-promo-codes" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json"
```

Expected response:
```json
{
  "total_to_deactivate": 0,
  "codes": []
}
```

### Actually process expirations
```bash
curl -L -X POST "https://www.wingside.ng/api/cron/expire-promo-codes" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json"
```

Expected response:
```json
{
  "success": true,
  "codes_deactivated": 0,
  "expirations": []
}
```

If codes were deactivated, you'll see:
```json
{
  "success": true,
  "codes_deactivated": 2,
  "expirations": [
    {
      "code_id": "uuid-here",
      "code": "SAVE500",
      "valid_until": "2025-01-15T00:00:00Z",
      "days_overdue": 8
    }
  ]
}
```

## Monitoring

### View recent logs
```bash
tail -f /var/www/wingside/logs/expire-promo-codes.log
```

### View all cron jobs
```bash
crontab -l
```

Expected to see:
```
0 2 * * 0 /var/www/wingside/run-tier-downgrade-cron.sh
0 3 * * * /var/www/wingside/run-expire-points-cron.sh
0 4 * * * /var/www/wingside/run-expire-promo-codes-cron.sh
```

## Database Functions Created

1. **process_promo_expiration()** - Main expiration processor
   - Returns: code_id, code, valid_until, days_overdue
   - Automatically sets is_active = false for expired codes
   - Updates updated_at timestamp

2. **get_expiring_promo_codes(days_before)** - For warnings
   - Default: 7 days before expiration
   - Returns codes that will expire soon
   - Useful for admin notifications

## Admin Dashboard Integration

You can add a warning widget to your admin dashboard:

```typescript
// Example: Show promo codes expiring in 7 days
const { data } = await supabase.rpc('get_expiring_promo_codes', {
  p_days_before: 7
})

// Display warning banner
if (data && data.length > 0) {
  console.warn(`⚠️ ${data.length} promo codes expiring soon!`)
}
```

## Manual Deactivation

To manually deactivate a specific promo code:

```sql
UPDATE promo_codes
SET is_active = false
WHERE code = 'OLDCODE';
```

## Troubleshooting

### Issue: HTTP 401 Unauthorized
**Fix:** Check CRON_SECRET in .env.production matches

### Issue: HTTP 308 Redirect
**Fix:** Ensure using `https://www.wingside.ng` (with www) and `-L` flag in curl

### Issue: Script permission denied
**Fix:** `chmod +x /var/www/wingside/run-expire-promo-codes-cron.sh`

### Issue: No log file created
**Fix:** Ensure logs directory exists: `mkdir -p /var/www/wingside/logs`

### Issue: Codes not being deactivated
**Check:**
1. Is `valid_until` set on the promo code?
2. Is `valid_until` in the past?
3. Is `is_active` currently true?
4. Did the migration run successfully?

## Status Check

After setup, verify:
- [ ] Migration applied successfully
- [ ] API endpoint returns HTTP 200
- [ ] Cron script runs without errors
- [ ] Log file is being written to
- [ ] Crontab entry exists
- [ ] Test deactivation works (create test promo with past date)

## Next Steps

Consider implementing:
1. **Admin notifications** when promo codes are deactivated
2. **Email alerts** 7 days before expiration
3. **Auto-extend popular codes** based on usage stats
4. **Birthday Bonuses** - Next priority cron job
