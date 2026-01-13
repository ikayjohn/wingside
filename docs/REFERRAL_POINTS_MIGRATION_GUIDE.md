# Referral System Migration Guide
## Converting from ₦500 Cash Rewards to 200 Points

**Date:** January 13, 2026
**Status:** Ready to Apply

---

## Problem

The referral system was using naira-based rewards (₦500), but needs to be converted to a points-based system (200 points).

### Error Encountered
```
ERROR: 42P13: cannot change name of input parameter "user_id_param"
HINT: Use DROP FUNCTION process_referral_reward_after_first_order(uuid,numeric) first.
```

```
ERROR: 42703: column p.total_points does not exist
```

---

## Solution

Two SQL migrations need to be run **in order**:

### Step 1: Add total_points Column
**File:** `supabase/migrations/20250113_add_total_points_column.sql`

**What it does:**
- Adds `total_points` column to `profiles` table
- Ensures `total_referral_earnings` column exists
- Creates index for performance
- Sets default values for existing records

**SQL:**
```sql
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0;
```

---

### Step 2: Update Referral System to Points
**File:** `supabase/migrations/20250113_update_referral_system_to_points.sql`

**What it does:**
- Updates referral settings from ₦500 to 200 points
- Adds `points` column to `referral_rewards` table
- Drops and recreates the referral function with correct parameter types
- Updates the function to award points instead of naira
- Creates views for tracking referral stats

**Key Changes:**
1. Function now uses `NUMERIC` instead of `DECIMAL`
2. Function awards points to `total_points` column
3. Points logged to `points_history` table
4. Both referrer and referred user get 200 points

---

## How to Apply

### Option 1: Use Helper Script (Recommended)
```bash
node scripts/fix-referral-function.js
```
This will:
- Open your Supabase SQL editor in your browser
- Show you which files to run and in what order

### Option 2: Manual Application
1. Open Supabase SQL Editor:
   https://supabase.com/dashboard/project/cxbqochxrhokdscgijxe/sql/new

2. **Step 1**: Copy and run the contents of:
   ```
   supabase/migrations/20250113_add_total_points_column.sql
   ```

3. **Step 2**: Copy and run the contents of:
   ```
   supabase/migrations/20250113_update_referral_system_to_points.sql
   ```

---

## After Migration

### What Changes
- ✅ Referral reward: ₦500 → **200 points**
- ✅ Both parties get points (referrer + referred friend)
- ✅ Points awarded after friend's first order (₦1,000+)
- ✅ Points automatically added to `total_points` in profiles

### Database Updates
- `profiles.total_points` - Tracks user's total points
- `referral_rewards.points` - Points awarded per referral
- `referral_settings` - Updated to 200 points
- `process_referral_reward_after_first_order()` - Updated function

### API Updates (Already Done)
- ✅ Validation API returns points
- ✅ My-referrals API calculates points
- ✅ ReferralSection displays points
- ✅ Share messages mention points
- ✅ Order processing awards points

---

## Testing After Migration

### Test Checklist
- [ ] Create a test user with a referral code
- [ ] Sign up a new user using that referral code
- [ ] Place a qualifying order (₦1,000+)
- [ ] Verify referrer gets 200 points
- [ ] Verify referred user gets 200 points
- [ ] Check points in user profile
- [ ] Verify referral stats display correctly

### SQL Verification Queries

**Check referral settings:**
```sql
SELECT * FROM referral_settings
WHERE setting_key IN ('referrer_reward_amount', 'referred_reward_amount');
```
Should show: `200`

**Check total_points column:**
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'total_points';
```

**Test the function:**
```sql
SELECT process_referral_reward_after_first_order(
  'user-uuid-here',
  1500.00
);
```

---

## Rollback Plan (If Needed)

If you need to revert to the old naira-based system:

```sql
-- Update settings back to naira
UPDATE referral_settings
SET setting_value = '500'
WHERE setting_key IN ('referrer_reward_amount', 'referred_reward_amount');

-- Note: You cannot easily revert points that were already awarded
-- Consider running a data migration script if rollback is needed
```

---

## Support

If you encounter issues:
1. Check Supabase logs for detailed error messages
2. Verify both migrations were run in the correct order
3. Ensure all referenced columns exist
4. Test with a small amount first before full rollout

---

## Files Modified

### SQL Files
- ✅ `supabase/migrations/20250113_add_total_points_column.sql` (NEW)
- ✅ `supabase/migrations/20250113_update_referral_system_to_points.sql` (UPDATED)

### Helper Scripts
- ✅ `scripts/fix-referral-function.js` (UPDATED)
- ✅ `scripts/apply-referral-points-migration.js` (UPDATED)

### API Files (Already Updated Earlier)
- ✅ `app/api/referrals/validate/route.ts`
- ✅ `app/api/referrals/my-referrals/route.ts`
- ✅ `app/api/orders/route.ts`
- ✅ `app/api/payment/nomba/webhook/route.ts`
- ✅ `components/ReferralSection.tsx`
- ✅ `app/my-account/referrals/page.tsx`

---

## Summary

**Before:** ₦500 cash reward per referral
**After:** 200 points per referral

Both referrer and referred friend receive 200 points after the friend completes their first order of ₦1,000 or more.
