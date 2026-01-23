# Points Expiration Cron Job - VPS Setup Guide

## What This Does

Automatically expires points/rewards that have passed their expiration date:
- Finds rewards where `expires_at < NOW()` and `status = 'earned'`
- Updates reward status to `'expired'`
- Deducts expired points from user's `total_points`
- Logs expiration in `points_history`

## Step 1: Deploy to VPS

```bash
# SSH into your Hostinger VPS
cd /var/www/wingside

# Pull latest changes
git pull origin main

# Run the database migration
npx supabase db push

# Deploy the code
bash deploy-vps.sh
```

Expected output:
```
✅ Deployment successful
✅ Migration applied: 20250128_add_points_expiration.sql
```

## Step 2: Setup Cron Script

```bash
# Make the script executable
chmod +x /var/www/wingside/run-expire-points-cron.sh

# Test the script manually
bash /var/www/wingside/run-expire-points-cron.sh

# Check the log output
tail -20 /var/www/wingside/logs/expire-points.log
```

Expected output:
```
HTTP Status: 200
{"success":true,"expirations_processed":0,"expirations":[]}
[Thu Jan 23 03:00:00 WAT 2025] Points expiration cron executed - Exit: 0
```

## Step 3: Add to Crontab

```bash
# Edit crontab
crontab -e

# Add this line (runs daily at 3:00 AM)
0 3 * * * /var/www/wingside/run-expire-points-cron.sh

# Save and exit
# Verify it was added
crontab -l | grep expire-points
```

Expected output:
```
0 3 * * * /var/www/wingside/run-expire-points-cron.sh
```

## Step 4: Test the API Endpoint

### Preview what will expire (without processing)
```bash
cd /var/www/wingside
CRON_SECRET=$(grep "^CRON_SECRET=" .env.production | cut -d '=' -f 2- | tr -d '\r')

curl -L -X GET "https://www.wingside.ng/api/cron/expire-points" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json"
```

Expected response:
```json
{
  "total_affected": 0,
  "total_points_to_expire": 0,
  "rewards": []
}
```

### Actually process expirations
```bash
curl -L -X POST "https://www.wingside.ng/api/cron/expire-points" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json"
```

Expected response:
```json
{
  "success": true,
  "expirations_processed": 0,
  "expirations": []
}
```

## Monitoring

### View recent logs
```bash
tail -f /var/www/wingside/logs/expire-points.log
```

### View all cron jobs
```bash
crontab -l
```

Expected to see:
```
0 2 * * 0 /var/www/wingside/run-tier-downgrade-cron.sh
0 3 * * * /var/www/wingside/run-expire-points-cron.sh
```

## Database Functions Created

1. **process_points_expiration()** - Main expiration processor
   - Returns: user_id, email, points_expired, reward_type, expired_at
   - Automatically updates rewards, profiles, and points_history

2. **get_users_with_expiring_points(days_before)** - For warnings
   - Default: 30 days before expiration
   - Returns users who need warning notifications
   - Respects last_expiration_warning_sent to avoid spam

3. **mark_expiration_warning_sent(user_id)** - Track warnings
   - Updates last_expiration_warning_sent timestamp
   - Prevents duplicate warning emails

## Future Enhancement: Warning Emails

To send warning emails 30 days before expiration, create another cron job:

```bash
# Create: /var/www/wingside/run-expiration-warnings-cron.sh
# Schedule: 0 1 * * * (daily at 1:00 AM, before expiration runs)
```

This would call:
```typescript
const { data } = await supabase.rpc('get_users_with_expiring_points', { p_days_before: 30 })
// Send email to each user
// Call mark_expiration_warning_sent() for each
```

## Troubleshooting

### Issue: HTTP 401 Unauthorized
**Fix:** Check CRON_SECRET in .env.production matches

### Issue: HTTP 308 Redirect
**Fix:** Ensure using `https://www.wingside.ng` (with www) and `-L` flag in curl

### Issue: Script permission denied
**Fix:** `chmod +x /var/www/wingside/run-expire-points-cron.sh`

### Issue: No log file created
**Fix:** Ensure logs directory exists: `mkdir -p /var/www/wingside/logs`

## Status Check

After setup, verify:
- [ ] Migration applied successfully
- [ ] API endpoint returns HTTP 200
- [ ] Cron script runs without errors
- [ ] Log file is being written to
- [ ] Crontab entry exists

## Next Steps

Consider implementing:
1. **Birthday Bonuses** (Daily at midnight) - Priority #1 from MISSING_CRON_JOBS.md
2. **Expiration Warning Emails** (Daily at 1:00 AM)
3. **Promo Code Auto-Deactivation** (Daily at 4:00 AM)
