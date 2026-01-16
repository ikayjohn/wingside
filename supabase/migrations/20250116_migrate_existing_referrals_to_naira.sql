-- Migrate Existing Referrals from Points to Naira
-- This updates existing referral records that were created under the old points system

-- Step 1: Update existing referral records to use the new naira amount
UPDATE referrals
SET reward_amount = 1000,
    updated_at = NOW()
WHERE reward_amount = 200;

-- Step 2: Update existing referral rewards to reflect naira instead of points
UPDATE referral_rewards
SET amount = 1000,
    points = 0,
    description = REGEXP_REPLACE(description, '200 points', '₦1,000')
WHERE reward_type = 'referrer_bonus'
  AND amount = 0
  AND points = 200;

UPDATE referral_rewards
SET amount = 1000,
    points = 0,
    description = REGEXP_REPLACE(description, '200 points', '₦1,000')
WHERE reward_type = 'referred_bonus'
  AND amount = 0
  AND points = 200;

-- Step 3: Update total_referral_earnings in profiles (from points to naira)
UPDATE profiles
SET total_referral_earnings = total_referral_earnings * 5,
    updated_at = NOW()
WHERE total_referral_earnings > 0;
