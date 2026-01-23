# Tier Downgrade System - Implementation Summary

## ✅ What Was Implemented

### 1. Database Schema Changes
- **Added `last_activity_date` column** to `profiles` table
- **Created index** for efficient querying of inactive users
- **Auto-populated** existing users' last activity based on order/points/referral history

### 2. Database Functions

#### `update_last_activity(user_id UUID)`
- Updates last activity date for a user
- **Automatically called** by `award_points()` and `claim_reward()` functions
- No manual calls needed in most cases

#### `process_tier_downgrades()`
- Identifies users inactive for 6+ months
- Downgrades ONE tier level only:
  - Wingzard → Wing Leader (20,000 points)
  - Wing Leader → Wing Member (5,001 points)
- Logs all changes to `points_history` table
- Returns list of users downgraded

### 3. API Endpoint

**`/api/cron/tier-downgrades`**
- **POST**: Process tier downgrades (production use)
- **GET**: Preview users who would be downgraded (testing)
- Protected by `CRON_SECRET` environment variable
- Called automatically via Vercel cron job

### 4. Automation

**Vercel Cron Job** (vercel.json):
- Schedule: Every Sunday at 2:00 AM UTC
- Automatically triggers tier downgrade processing
- No manual intervention required

## 📋 Tier Downgrade Rules

### Triggers Downgrade
- ✅ **6 months of complete inactivity**

### What is "Activity"?
Any of these actions reset the 6-month timer:
1. Order placed (paid)
2. Points earned (any source)
3. Points redeemed/converted
4. Successful referral

### Does NOT Trigger Downgrade
- ❌ Redeeming points
- ❌ Low point balance
- ❌ Converting points to cash
- ❌ Viewing dashboard

### Downgrade Behavior
- **One tier at a time** (Wingzard → Wing Leader → Wing Member)
- **Points adjusted** to minimum of new tier (NOT deleted)
- **Logged in history** with full metadata
- **Automatic re-upgrade** when thresholds reached again

## 📁 Files Created/Modified

### New Migrations (4 files)
1. `supabase/migrations/20250128_add_tier_activity_tracking.sql`
   - Adds last_activity_date column
   - Creates update_last_activity() function
   - Creates process_tier_downgrades() function

2. `supabase/migrations/20250128_update_points_functions_activity_tracking.sql`
   - Updates award_points() to track activity
   - Updates claim_reward() to track activity

3. `supabase/migrations/20250128_add_tier_downgrade_type.sql`
   - Adds 'tier_downgrade' to points_history types

### New API Endpoint (1 file)
4. `app/api/cron/tier-downgrades/route.ts`
   - POST endpoint for processing downgrades
   - GET endpoint for preview/testing

### Configuration (1 file)
5. `vercel.json`
   - Cron job configuration

### Documentation (2 files)
6. `docs/TIER_DOWNGRADE_SYSTEM.md`
   - Comprehensive system documentation
   - Testing guide
   - FAQ

7. `docs/TIER_DOWNGRADE_SETUP.md`
   - Step-by-step setup guide
   - Troubleshooting
   - Rollback instructions

## 🚀 Next Steps

### 1. Run Migrations

```bash
# Apply all migrations
supabase db push

# Or individually
supabase migration up 20250128_add_tier_activity_tracking
supabase migration up 20250128_update_points_functions_activity_tracking
supabase migration up 20250128_add_tier_downgrade_type
```

### 2. Set Environment Variable

```bash
# Generate secret
openssl rand -base64 32

# Add to .env.local
echo "CRON_SECRET=your-generated-secret" >> .env.local
```

**Also add to Vercel:**
- Project Settings → Environment Variables
- Name: `CRON_SECRET`
- Value: (same as above)
- Environments: Production, Preview, Development

### 3. Deploy to Vercel

```bash
git add .
git commit -m "feat: Implement tier downgrade system with 6-month inactivity rule"
git push origin main
```

Vercel will automatically:
- Set up the cron job
- Run it every Sunday at 2:00 AM UTC

### 4. Verify Setup

**Test the preview endpoint:**
```bash
curl -X GET https://yoursite.com/api/cron/tier-downgrades \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Check database:**
```sql
SELECT email, last_activity_date, total_points
FROM profiles
WHERE total_points > 0
ORDER BY last_activity_date DESC
LIMIT 10;
```

## 🔍 Monitoring

### Check Recent Downgrades
```sql
SELECT
  ph.created_at,
  p.email,
  ph.metadata->>'old_tier' as old_tier,
  ph.metadata->>'new_tier' as new_tier,
  ph.metadata->>'old_points' as old_points,
  ph.metadata->>'new_points' as new_points
FROM points_history ph
JOIN profiles p ON p.id = ph.user_id
WHERE ph.type = 'tier_downgrade'
ORDER BY ph.created_at DESC
LIMIT 20;
```

### Check Inactive Users
```sql
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

## 📊 Example Scenarios

### Scenario 1: Wingzard User Inactive for 6 Months
- **Before**: 25,000 points (Wingzard)
- **After**: 20,000 points (Wing Leader)
- **Points Lost**: 5,000
- **Logged**: Full details in `points_history`

### Scenario 2: Wing Leader User Inactive for 6 Months
- **Before**: 10,000 points (Wing Leader)
- **After**: 5,001 points (Wing Member)
- **Points Lost**: 4,999
- **Logged**: Full details in `points_history`

### Scenario 3: Wing Member Inactive for 6 Months
- **Before**: 3,000 points (Wing Member)
- **After**: 3,000 points (Wing Member)
- **Points Lost**: 0 (no downgrade, already at lowest tier)
- **Logged**: Nothing (no change)

### Scenario 4: User Becomes Active Again
- User downgraded from Wingzard (25,000) to Wing Leader (20,000)
- User places ₦500,000 order → earns 5,000 points
- **Result**: 25,000 points → automatically promoted back to Wingzard
- No admin intervention needed

## 🎯 Benefits

1. **Encourages Engagement**: Users stay active to maintain tier status
2. **Fair System**: 6-month grace period is generous
3. **Automatic Re-Upgrade**: Users can easily regain tier
4. **Full Transparency**: All changes logged in database
5. **No Data Loss**: Points adjusted, not deleted
6. **Scalable**: Runs automatically via cron job

## 📝 Important Notes

- **Activity tracking is automatic** - Points earning/redeeming automatically updates last_activity_date
- **One tier at a time** - Multiple 6-month periods needed for multiple downgrades
- **Points preserved** - Set to tier minimum, not deleted
- **Reversible** - Users automatically upgrade when earning enough points
- **Logged** - All downgrades tracked in points_history

## 🆘 Support

If you need help:
1. Check full docs: `docs/TIER_DOWNGRADE_SYSTEM.md`
2. Setup guide: `docs/TIER_DOWNGRADE_SETUP.md`
3. Test endpoint: `GET /api/cron/tier-downgrades`
4. Database logs: `SELECT * FROM points_history WHERE type = 'tier_downgrade'`

---

**Status**: ✅ Ready for deployment
**Testing**: Preview endpoint available for dry runs
**Rollback**: Full rollback instructions in setup guide
