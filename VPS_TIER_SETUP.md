# Tier Downgrade System - Hostinger VPS Setup

Quick setup guide for the tier downgrade system on your Hostinger VPS.

## ✅ What's Already Done

1. **Database migrations applied** ✅
   - `last_activity_date` column added to profiles
   - `process_tier_downgrades()` function created
   - `update_last_activity()` function created

2. **CRON_SECRET generated and added to .env.production** ✅
   - Value: `pKk75dRVR+3FsS6kDXRNwasHLaoHBmjmiYJ4BUyeBpQ=`

3. **VPS-optimized scripts created** ✅
   - `setup-cron-vps.sh` - Automated cron setup
   - `deploy-vps.sh` - Deployment script
   - `ecosystem.config.js` - PM2 configuration (updated to use .env.production)

## 🚀 Deployment Steps

### 1. Push Changes to Git

On your local machine:

```bash
git add .
git commit -m "feat: Add tier downgrade system for VPS with cron job"
git push origin main
```

### 2. Pull on VPS

SSH into your Hostinger VPS:

```bash
ssh your-user@your-vps-ip

# Navigate to your app directory
cd /var/www/wingside  # or wherever your app is

# Pull latest changes
git pull origin main
```

### 3. Run Deployment Script

```bash
bash deploy-vps.sh
```

This will:
- ✅ Pull latest code
- ✅ Install dependencies
- ✅ Build Next.js app
- ✅ Restart PM2
- ✅ Health check

### 4. Setup Cron Job

```bash
bash setup-cron-vps.sh
```

When prompted:
- **Domain**: `wingside.ng`
- **Use HTTPS**: `y`
- **Cron schedule**: `0 2 * * 0` (Sunday 2:00 AM) - just press Enter for default

The script will:
- ✅ Create cron script: `/var/www/wingside/run-tier-downgrade-cron.sh`
- ✅ Add to crontab
- ✅ Create logs directory
- ✅ Test the endpoint

### 5. Verify Setup

Check cron job was added:
```bash
crontab -l | grep tier
```

Expected output:
```
0 2 * * 0 /var/www/wingside/run-tier-downgrade-cron.sh
```

Test manually:
```bash
bash /var/www/wingside/run-tier-downgrade-cron.sh
```

Check logs:
```bash
cat logs/tier-downgrades.log
```

Expected output:
```
HTTP Status: 200
[2026-01-23 20:30:00] Tier downgrade cron executed
```

### 6. Test the API Endpoint

```bash
curl -X GET "https://wingside.ng/api/cron/tier-downgrades" \
  -H "Authorization: Bearer pKk75dRVR+3FsS6kDXRNwasHLaoHBmjmiYJ4BUyeBpQ="
```

Expected response:
```json
{
  "total_affected": 0,
  "users": []
}
```

## 📊 How It Works

### Cron Job Schedule
- **Runs**: Every Sunday at 2:00 AM (server time)
- **Script**: `/var/www/wingside/run-tier-downgrade-cron.sh`
- **Logs**: `/var/www/wingside/logs/tier-downgrades.log`

### What Happens
1. Cron triggers script every Sunday
2. Script calls API endpoint with CRON_SECRET
3. API calls `process_tier_downgrades()` function
4. Function finds users inactive 6+ months
5. Downgrades users one tier level
6. Logs all changes to `points_history` table
7. Returns list of downgraded users

### Tier Downgrade Rules
- **Wingzard** (20,000+ pts) → **Wing Leader** (20,000 pts) after 6 months inactive
- **Wing Leader** (5,001-20,000 pts) → **Wing Member** (5,001 pts) after 6 months inactive
- **Wing Member** (0-5,000 pts) → No change

### Activity Tracking
Any of these actions reset the 6-month timer:
- ✅ Order placed (paid)
- ✅ Points earned (from any source)
- ✅ Points redeemed/converted
- ✅ Successful referral

## 📁 Files on VPS

```
/var/www/wingside/
├── .env.production                      # Environment variables (includes CRON_SECRET)
├── ecosystem.config.js                  # PM2 configuration
├── setup-cron-vps.sh                    # Cron setup script
├── deploy-vps.sh                        # Deployment script
├── run-tier-downgrade-cron.sh          # Created by setup script
└── logs/
    ├── tier-downgrades.log             # Cron execution logs
    ├── pm2-error.log                   # PM2 error logs
    ├── pm2-out.log                     # PM2 output logs
    └── pm2-combined.log                # PM2 combined logs
```

## 🔧 Maintenance

### View Cron Logs

```bash
# Real-time monitoring
tail -f /var/www/wingside/logs/tier-downgrades.log

# Last 50 lines
tail -50 /var/www/wingside/logs/tier-downgrades.log

# Search for errors
grep -i error /var/www/wingside/logs/tier-downgrades.log
```

### Test Cron Job Manually

```bash
cd /var/www/wingside
bash run-tier-downgrade-cron.sh
```

### Check Database

```sql
-- View recent downgrades
SELECT
  ph.created_at,
  p.email,
  ph.metadata->>'old_tier' as old_tier,
  ph.metadata->>'new_tier' as new_tier,
  (ph.metadata->>'old_points')::integer as old_points,
  (ph.metadata->>'new_points')::integer as new_points
FROM points_history ph
JOIN profiles p ON p.id = ph.user_id
WHERE ph.type = 'tier_downgrade'
ORDER BY ph.created_at DESC
LIMIT 10;

-- Check inactive users (at risk of downgrade)
SELECT
  email,
  total_points,
  last_activity_date,
  EXTRACT(DAY FROM (NOW() - last_activity_date))::INTEGER as days_inactive,
  CASE
    WHEN total_points >= 20000 THEN 'Wingzard'
    WHEN total_points >= 5001 THEN 'Wing Leader'
    ELSE 'Wing Member'
  END as current_tier
FROM profiles
WHERE last_activity_date < (NOW() - INTERVAL '5 months')
  AND total_points > 0
ORDER BY days_inactive DESC;
```

### Update Cron Schedule

```bash
# Edit crontab
crontab -e

# Common schedules:
# Every Sunday 2:00 AM:     0 2 * * 0
# Every day 3:00 AM:        0 3 * * *
# Every Monday 2:00 AM:     0 2 * * 1
# Twice a week (Wed, Sun):  0 2 * * 0,3
```

## 🐛 Troubleshooting

### Cron Not Running

```bash
# Check if cron service is running
sudo systemctl status cron

# Restart cron service
sudo systemctl restart cron

# Check cron logs
grep CRON /var/log/syslog | tail -20

# Verify cron job exists
crontab -l | grep tier

# Test script manually
bash /var/www/wingside/run-tier-downgrade-cron.sh
```

### Script Failing

```bash
# Check script exists and is executable
ls -l /var/www/wingside/run-tier-downgrade-cron.sh
# Should show: -rwxr-xr-x

# Make executable if needed
chmod +x /var/www/wingside/run-tier-downgrade-cron.sh

# Check .env.production exists
ls -la /var/www/wingside/.env.production

# Verify CRON_SECRET
grep CRON_SECRET /var/www/wingside/.env.production
```

### API Endpoint Not Responding

```bash
# Check app is running
pm2 status

# Restart app
pm2 restart wingside

# Check app logs
pm2 logs wingside --lines 50

# Test endpoint manually
curl -X GET "https://wingside.ng/api/cron/tier-downgrades" \
  -H "Authorization: Bearer pKk75dRVR+3FsS6kDXRNwasHLaoHBmjmiYJ4BUyeBpQ=" \
  -v
```

### No Users Being Downgraded

This is normal if:
- All users are active
- No users have been inactive for 6+ months
- Already downgraded users are at Wing Member tier

To verify the function works:
```bash
# Test preview endpoint
curl -X GET "https://wingside.ng/api/cron/tier-downgrades" \
  -H "Authorization: Bearer pKk75dRVR+3FsS6kDXRNwasHLaoHBmjmiYJ4BUyeBpQ="
```

## 📋 Quick Reference

```bash
# Deploy latest changes
cd /var/www/wingside && bash deploy-vps.sh

# View cron logs
tail -f logs/tier-downgrades.log

# Test cron manually
bash run-tier-downgrade-cron.sh

# Check PM2 status
pm2 status

# View app logs
pm2 logs wingside

# Restart app
pm2 restart wingside

# Edit cron schedule
crontab -e

# View all cron jobs
crontab -l
```

## 🎯 Success Indicators

After setup, you should have:
- [x] CRON_SECRET in .env.production
- [x] Cron job in crontab (`crontab -l`)
- [x] Cron script created and executable
- [x] Logs directory created
- [x] Test execution successful
- [x] API endpoint responding
- [x] PM2 running with updated config

---

**All set!** The tier downgrade system is now automated on your VPS. It will run every Sunday at 2:00 AM and automatically downgrade inactive users.

Monitor the logs for the first few weeks to ensure everything runs smoothly.
