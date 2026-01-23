# Tier Downgrade System - Quick Setup Guide

## Step-by-Step Implementation

### 1. Run Database Migrations

Apply the migrations in order:

```bash
# 1. Add last_activity_date column and functions
supabase migration up 20250128_add_tier_activity_tracking

# 2. Update points functions to track activity
supabase migration up 20250128_update_points_functions_activity_tracking

# 3. Add tier_downgrade type to points_history
supabase migration up 20250128_add_tier_downgrade_type
```

Or apply all at once:
```bash
supabase db push
```

### 2. Set Environment Variables

Add to `.env.production` and Vercel:

```bash
# Generate a secure secret
CRON_SECRET=$(openssl rand -base64 32)

# Add to .env.production
echo "CRON_SECRET=$CRON_SECRET" >> .env.production
```

In **Vercel Dashboard**:
1. Go to Project Settings → Environment Variables
2. Add `CRON_SECRET` with the same value
3. Set for all environments (Production, Preview, Development)

### 3. Deploy to Vercel

The `vercel.json` file is already configured with the cron job:

```json
{
  "crons": [
    {
      "path": "/api/cron/tier-downgrades",
      "schedule": "0 2 * * 0"
    }
  ]
}
```

Deploy:
```bash
git add .
git commit -m "feat: Add tier downgrade system"
git push origin main
```

Vercel will automatically set up the cron job.

### 4. Verify Cron Job Setup

In Vercel Dashboard:
1. Go to Project → Settings → Cron Jobs
2. Verify the job is listed
3. Check schedule: "Every Sunday at 2:00 AM UTC"

### 5. Test the System

#### Test 1: Preview Downgrades (Dry Run)

```bash
curl -X GET https://yoursite.com/api/cron/tier-downgrades \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Expected response:
```json
{
  "total_affected": 0,
  "users": []
}
```

#### Test 2: Manual Trigger

```bash
curl -X POST https://yoursite.com/api/cron/tier-downgrades \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Expected response:
```json
{
  "success": true,
  "downgrades_processed": 0,
  "downgrades": []
}
```

#### Test 3: Verify Activity Tracking

Check that `last_activity_date` is being updated:

```sql
-- Should show recent dates for active users
SELECT email, last_activity_date, total_points
FROM profiles
WHERE total_points > 0
ORDER BY last_activity_date DESC
LIMIT 10;
```

### 6. Create Test Scenario (Optional)

To test the downgrade logic:

```sql
-- 1. Find a test user
SELECT id, email, total_points FROM profiles
WHERE email = 'test@example.com';

-- 2. Set their points to Wing Leader tier
UPDATE profiles
SET total_points = 10000
WHERE email = 'test@example.com';

-- 3. Set last_activity_date to 7 months ago
UPDATE profiles
SET last_activity_date = NOW() - INTERVAL '7 months'
WHERE email = 'test@example.com';

-- 4. Run downgrade function
SELECT * FROM process_tier_downgrades();

-- 5. Verify the downgrade
SELECT email, total_points, last_activity_date
FROM profiles
WHERE email = 'test@example.com';
-- Should show: total_points = 5001 (Wing Member minimum)

-- 6. Check points_history
SELECT * FROM points_history
WHERE user_id = (SELECT id FROM profiles WHERE email = 'test@example.com')
  AND type = 'tier_downgrade'
ORDER BY created_at DESC
LIMIT 1;
```

### 7. Monitoring Setup

#### Daily Check (First Week)

Monitor the system daily for the first week:

```bash
# Check cron execution logs in Vercel
vercel logs --follow

# Check database for downgrades
SELECT COUNT(*) FROM points_history WHERE type = 'tier_downgrade';
```

#### Weekly Reports

Set up a weekly report query:

```sql
-- Downgrades this week
SELECT
  DATE(created_at) as downgrade_date,
  COUNT(*) as downgrades,
  SUM((metadata->>'old_points')::integer - (metadata->>'new_points')::integer) as total_points_lost
FROM points_history
WHERE type = 'tier_downgrade'
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY downgrade_date DESC;
```

### 8. User Communication (Optional)

Consider adding email notifications:

1. **Create email template** in `lib/emails/tier-downgrade-warning.ts`
2. **Add cron job** for 30-day warnings
3. **Send notification** after downgrade occurs

Example template structure:
```typescript
export async function sendTierDowngradeWarning(userEmail: string, daysUntilDowngrade: number) {
  // Send email via your email service
}
```

## Troubleshooting

### Cron Job Not Running

**Check:**
1. Vercel project has cron jobs enabled (requires Pro plan or Hobby with verification)
2. `CRON_SECRET` environment variable is set
3. `vercel.json` is in project root and committed to git

**Solution:**
- Upgrade Vercel plan if needed
- Use external cron service (EasyCron, cron-job.org)

### Activity Not Being Tracked

**Check:**
```sql
-- Verify column exists
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'last_activity_date';

-- Check if values are updating
SELECT email, last_activity_date, updated_at
FROM profiles
WHERE total_points > 0
ORDER BY last_activity_date DESC;
```

**Solution:**
- Re-run migration: `20250128_add_tier_activity_tracking.sql`
- Verify `award_points` and `claim_reward` functions updated

### Downgrades Not Processing

**Check:**
```sql
-- Find users who should be downgraded
SELECT email, total_points, last_activity_date,
  EXTRACT(DAY FROM (NOW() - last_activity_date)) as days_inactive
FROM profiles
WHERE last_activity_date < (NOW() - INTERVAL '6 months')
  AND total_points > 0;
```

**Solution:**
- Manually run: `SELECT * FROM process_tier_downgrades();`
- Check function exists: `\df process_tier_downgrades` in psql
- Re-run migration if needed

## Rollback Instructions

If you need to remove the tier downgrade system:

```sql
-- 1. Drop functions
DROP FUNCTION IF EXISTS process_tier_downgrades();
DROP FUNCTION IF EXISTS update_last_activity(UUID);

-- 2. Remove column (optional, may want to keep for historical data)
ALTER TABLE profiles DROP COLUMN IF EXISTS last_activity_date;

-- 3. Revert points_history constraint
ALTER TABLE points_history DROP CONSTRAINT IF EXISTS points_history_type_check;
ALTER TABLE points_history
ADD CONSTRAINT points_history_type_check
CHECK (type IN ('earned', 'redeemed', 'expired'));
```

Then remove from `vercel.json`:
```json
{
  "crons": []
}
```

## Next Steps

1. ✅ Deploy to production
2. ✅ Monitor for one week
3. ⏳ Add email notifications (optional)
4. ⏳ Create admin dashboard for tier management
5. ⏳ Add in-app warnings for users at risk of downgrade

## Support

For questions or issues:
- Check full documentation: `docs/TIER_DOWNGRADE_SYSTEM.md`
- Review database logs: `SELECT * FROM points_history WHERE type = 'tier_downgrade'`
- Test endpoint: `GET /api/cron/tier-downgrades` (with proper auth header)
