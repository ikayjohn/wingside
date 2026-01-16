-- Migrate Existing Referrals from Points to Naira
-- This updates existing referral records that were created under the old points system

-- Step 1: Update existing referral records to use the new naira amount
UPDATE referrals
SET reward_amount = 1000,
    updated_at = NOW()
WHERE reward_amount = 200; -- Old points-based amount

-- Step 2: Update existing referral rewards to reflect naira instead of points
-- For referrer bonuses (where points were awarded)
UPDATE referral_rewards
SET amount = 1000, -- Convert to naira amount
    points = 0, -- Clear points since we now use naira
    description = REGEXP_REPLACE(description, '200 points', '₦1,000')
WHERE reward_type = 'referrer_bonus'
  AND amount = 0
  AND points = 200;

-- For referred user bonuses (where points were awarded)
UPDATE referral_rewards
SET amount = 1000, -- Convert to naira amount
    points = 0, -- Clear points since we now use naira
    description = REGEXP_REPLACE(description, '200 points', '₦1,000')
WHERE reward_type = 'referred_bonus'
  AND amount = 0
  AND points = 200;

-- Step 3: Update total_referral_earnings in profiles (from points to naira)
-- This assumes the old system tracked points in total_referral_earnings
-- We need to convert to naira value
UPDATE profiles
SET total_referral_earnings = total_referral_earnings * 5, -- 200 points = ₦1,000, so multiply by 5
    updated_at = NOW()
WHERE total_referral_earnings > 0;

-- Step 4: Update points history if needed - add a note about conversion
-- This adds a descriptive entry to track the migration
INSERT INTO points_history (user_id, points, type, source, description, created_at)
SELECT
    user_id,
    0, -- Setting to 0 since we converted to naira
    'converted',
    'referral',
    'Converted from points-based to naira-based referral system',
    NOW()
FROM (
    SELECT DISTINCT user_id
    FROM referral_rewards
    WHERE points > 0
) AS unique_users
ON CONFLICT (user_id, type, source, description) DO NOTHING;

-- Verification queries (run these to check the migration):

-- Check updated referrals
-- SELECT id, referral_code_used, reward_amount, status, created_at
-- FROM referrals
-- ORDER BY created_at DESC
-- LIMIT 10;

-- Check updated rewards
-- SELECT id, reward_type, amount, points, description, created_at
-- FROM referral_rewards
-- ORDER BY created_at DESC
-- LIMIT 10;

-- Check updated profiles
-- SELECT id, full_name, email, total_referral_earnings, total_points
-- FROM profiles
-- WHERE total_referral_earnings > 0
-- ORDER BY total_referral_earnings DESC
-- LIMIT 10;
