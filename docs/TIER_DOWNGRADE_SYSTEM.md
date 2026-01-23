# Tier Downgrade System Documentation

## Overview

The tier downgrade system automatically demotes inactive users to lower loyalty tiers after 6 months of inactivity. This encourages continued engagement while being fair to inactive customers.

## Tier Structure

| Tier | Points Range | Status |
|------|-------------|--------|
| Wing Member | 0 - 5,000 | Entry tier |
| Wing Leader | 5,001 - 20,000 | Mid tier |
| Wingzard | 20,000+ | Top tier |

## Downgrade Rules

### What Does NOT Trigger Downgrades
- ❌ Redeeming points
- ❌ Low point balance
- ❌ Partial redemptions
- ❌ Points conversion to cash

### What TRIGGERS Downgrades
- ✅ **6 months of complete inactivity**

## Activity Definition

Any of the following actions reset the 6-month inactivity timer:

1. **Order Placed** - Any paid order
2. **Points Earned** - From any source (purchases, referrals, bonuses, social follows)
3. **Points Redeemed** - Converting points to wallet credit
4. **Successful Referral** - When a referred user completes their first order

## Downgrade Logic

### After 6 Months of Inactivity

Users are downgraded **ONE tier level only**:

| Current Tier | New Tier | New Points |
|-------------|----------|------------|
| Wingzard | Wing Leader | 20,000 points |
| Wing Leader | Wing Member | 5,001 points |
| Wing Member | Wing Member | No change |

### Points Adjustment

When downgraded, the user's points are **adjusted to the minimum of the new tier**, NOT deleted:

- **Wingzard → Wing Leader**: Points reset to **20,000**
  - Example: User with 25,000 points loses 5,000 points
- **Wing Leader → Wing Member**: Points reset to **5,001**
  - Example: User with 10,000 points loses 4,999 points

### Points History

All downgrades are logged in the `points_history` table with:
- Type: `tier_downgrade`
- Source: `system`
- Negative point value (points deducted)
- Metadata including old tier, new tier, days inactive

## Reactivation Logic

When an inactive user becomes active again:

1. ✅ They begin earning points normally
2. ✅ Tier upgrades automatically when point thresholds are reached
3. ✅ No admin or support intervention required
4. ✅ Seamless experience

**Example:**
- User downgraded from Wingzard (25,000 pts) to Wing Leader (20,000 pts)
- User places ₦500,000 order (earns 5,000 points)
- User now has 25,000 points → automatically promoted back to Wingzard

## Database Implementation

### Schema Changes

**New Column:**
```sql
ALTER TABLE profiles
ADD COLUMN last_activity_date TIMESTAMPTZ DEFAULT NOW();
```

**Index for Performance:**
```sql
CREATE INDEX idx_profiles_last_activity_date
ON profiles(last_activity_date);
```

### Database Functions

#### 1. `update_last_activity(user_id UUID)`

Updates the last activity date for a user. **Automatically called** by:
- `award_points()` - When points are earned
- `claim_reward()` - When rewards are claimed

You don't need to call this manually in most cases.

#### 2. `process_tier_downgrades()`

Processes all tier downgrades for inactive users.

**Returns:**
- `user_id` - UUID of affected user
- `email` - User's email
- `old_points` - Points before downgrade
- `new_points` - Points after downgrade
- `old_tier` - Previous tier
- `new_tier` - New tier
- `days_inactive` - Number of days inactive

**Example:**
```sql
SELECT * FROM process_tier_downgrades();
```

**Output:**
```
user_id | email              | old_points | new_points | old_tier  | new_tier    | days_inactive
--------|-------------------|------------|------------|-----------|-------------|---------------
abc123  | user@example.com  | 25000      | 20000      | Wingzard  | Wing Leader | 187
```

## Automation Setup

### Cron Job Configuration

The tier downgrade process should run automatically via cron job.

#### Option 1: Vercel Cron Jobs (Recommended)

Add to `vercel.json`:

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

This runs every Sunday at 2:00 AM UTC.

#### Option 2: External Cron Service

Use services like:
- **EasyCron** (https://www.easycron.com/)
- **Cron-job.org** (https://cron-job.org/)
- **AWS EventBridge**

**Configuration:**
- **URL:** `https://yoursite.com/api/cron/tier-downgrades`
- **Method:** POST
- **Header:** `Authorization: Bearer YOUR_CRON_SECRET`
- **Schedule:** Weekly (recommended: Sunday 2:00 AM)

#### Option 3: GitHub Actions

Create `.github/workflows/tier-downgrades.yml`:

```yaml
name: Process Tier Downgrades

on:
  schedule:
    - cron: '0 2 * * 0'  # Every Sunday at 2:00 AM UTC
  workflow_dispatch:  # Allow manual trigger

jobs:
  process-downgrades:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Tier Downgrade
        run: |
          curl -X POST https://yoursite.com/api/cron/tier-downgrades \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

### Environment Variables

Add to `.env.production` and Vercel environment variables:

```bash
CRON_SECRET=your-secure-random-string-here
```

Generate a secure secret:
```bash
openssl rand -base64 32
```

## API Endpoints

### POST /api/cron/tier-downgrades

Processes tier downgrades for all inactive users.

**Headers:**
```
Authorization: Bearer YOUR_CRON_SECRET
```

**Response:**
```json
{
  "success": true,
  "downgrades_processed": 5,
  "downgrades": [
    {
      "email": "user@example.com",
      "old_tier": "Wingzard",
      "new_tier": "Wing Leader",
      "old_points": 25000,
      "new_points": 20000,
      "days_inactive": 187
    }
  ]
}
```

### GET /api/cron/tier-downgrades

Preview users who would be downgraded (testing only).

**Headers:**
```
Authorization: Bearer YOUR_CRON_SECRET
```

**Response:**
```json
{
  "total_affected": 5,
  "users": [
    {
      "email": "user@example.com",
      "old_tier": "Wingzard",
      "new_tier": "Wing Leader",
      "old_points": 25000,
      "new_points": 20000,
      "points_lost": 5000,
      "days_inactive": 187,
      "last_activity": "2024-07-15T10:30:00Z"
    }
  ]
}
```

## Testing

### 1. Preview Downgrades (Dry Run)

Test without actually downgrading users:

```bash
curl -X GET https://yoursite.com/api/cron/tier-downgrades \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### 2. Manual Trigger

Manually process downgrades:

```bash
curl -X POST https://yoursite.com/api/cron/tier-downgrades \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### 3. Database Query

Check inactive users directly:

```sql
SELECT
  email,
  total_points,
  last_activity_date,
  EXTRACT(DAY FROM (NOW() - last_activity_date)) as days_inactive,
  CASE
    WHEN total_points >= 20000 THEN 'Wingzard'
    WHEN total_points >= 5001 THEN 'Wing Leader'
    ELSE 'Wing Member'
  END as current_tier
FROM profiles
WHERE last_activity_date < (NOW() - INTERVAL '6 months')
  AND total_points > 0
ORDER BY total_points DESC;
```

## Monitoring

### Check Downgrade History

View all past tier downgrades:

```sql
SELECT
  ph.created_at,
  p.email,
  ph.points as points_deducted,
  ph.description,
  ph.metadata->>'old_tier' as old_tier,
  ph.metadata->>'new_tier' as new_tier,
  ph.metadata->>'days_inactive' as days_inactive
FROM points_history ph
JOIN profiles p ON p.id = ph.user_id
WHERE ph.type = 'tier_downgrade'
ORDER BY ph.created_at DESC;
```

### Track Activity Updates

Monitor when users are active:

```sql
SELECT
  email,
  last_activity_date,
  total_points,
  CASE
    WHEN total_points >= 20000 THEN 'Wingzard'
    WHEN total_points >= 5001 THEN 'Wing Leader'
    ELSE 'Wing Member'
  END as tier
FROM profiles
ORDER BY last_activity_date DESC
LIMIT 20;
```

## User Communication

### Email Notifications (TODO)

Consider sending email notifications:

1. **90 Days Before Downgrade**
   - "Your tier will be downgraded in 90 days if no activity"
   - Encourage order placement

2. **30 Days Before Downgrade**
   - Final warning with call-to-action
   - Show what they'll lose

3. **After Downgrade**
   - Inform about tier change
   - Explain how to earn tier back

### In-App Notifications

Show inactivity warnings in dashboard when:
- Last activity > 120 days: "You're at risk of tier downgrade"
- Last activity > 150 days: "Your tier will be downgraded soon"

## FAQ

**Q: What happens to points when a user is downgraded?**
A: Points are adjusted to the minimum of the new tier, not deleted entirely.

**Q: Can a user be downgraded multiple tiers at once?**
A: No, only ONE tier level per downgrade. If still inactive after 6 more months, another downgrade occurs.

**Q: Does redeeming points affect tier?**
A: No, redeeming points counts as activity and resets the inactivity timer.

**Q: What if a user was inactive due to account issues?**
A: They can contact support for manual tier restoration (admin intervention).

**Q: How often should the cron job run?**
A: Weekly is recommended (e.g., every Sunday). Daily is acceptable but may be overkill.

## Rollback Plan

If you need to disable tier downgrades:

1. **Stop Cron Job** - Disable in Vercel or external service
2. **Restore Points** (if needed):

```sql
-- View recent downgrades
SELECT * FROM points_history
WHERE type = 'tier_downgrade'
AND created_at > NOW() - INTERVAL '7 days';

-- Restore specific user (example)
UPDATE profiles
SET total_points = 25000  -- Original points
WHERE id = 'user-uuid-here';
```

## Support

For issues or questions:
- Check `points_history` table for downgrade logs
- Review cron job execution logs
- Query `last_activity_date` to verify tracking
