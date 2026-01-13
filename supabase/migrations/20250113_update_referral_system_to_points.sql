-- Update Referral System to Points-Based Rewards
-- This migration converts the referral system from naira-based (₦500) to points-based (200 points)

-- IMPORTANT: Run this AFTER the migration that adds total_points column to profiles table

-- Add total_points column to profiles table if it doesn't exist
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0;

-- Update referral settings to use points instead of naira
UPDATE referral_settings
SET setting_value = '200'
WHERE setting_key IN ('referrer_reward_amount', 'referred_reward_amount');

-- Add points column to referral_rewards table if it doesn't exist
ALTER TABLE referral_rewards
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;

-- Drop the existing function if it exists (to avoid parameter name conflicts)
DROP FUNCTION IF EXISTS process_referral_reward_after_first_order(UUID, NUMERIC);

-- Create a new function to process referral rewards and award points
CREATE OR REPLACE FUNCTION process_referral_reward_after_first_order(
    user_id UUID,
    order_amount NUMERIC
)
RETURNS BOOLEAN AS $$
DECLARE
    referral_record RECORD;
    min_order_amount NUMERIC;
    referrer_points INTEGER;
    referred_points INTEGER;
    reward_id UUID;
BEGIN
    -- Get referral settings
    SELECT CAST(setting_value AS NUMERIC) INTO min_order_amount
    FROM referral_settings
    WHERE setting_key = 'min_order_amount_for_reward' AND is_active = TRUE;

    SELECT CAST(setting_value AS INTEGER) INTO referrer_points
    FROM referral_settings
    WHERE setting_key = 'referrer_reward_amount' AND is_active = TRUE;

    SELECT CAST(setting_value AS INTEGER) INTO referred_points
    FROM referral_settings
    WHERE setting_key = 'referred_reward_amount' AND is_active = TRUE;

    -- Find the referral record for this user
    SELECT * INTO referral_record
    FROM referrals
    WHERE referred_user_id = user_id AND status = 'signed_up';

    IF NOT FOUND THEN
        RETURN FALSE; -- No pending referral found
    END IF;

    -- Check if order meets minimum amount
    IF order_amount < min_order_amount THEN
        RETURN FALSE;
    END IF;

    -- Update referral status
    UPDATE referrals
    SET status = 'first_order_completed',
        completed_at = NOW(),
        updated_at = NOW()
    WHERE id = referral_record.id;

    -- Award points to referrer
    UPDATE profiles
    SET total_points = COALESCE(total_points, 0) + referrer_points,
        total_referral_earnings = COALESCE(total_referral_earnings, 0) + referrer_points
    WHERE id = referral_record.referrer_id;

    -- Create reward record for referrer
    INSERT INTO referral_rewards (
        referral_id,
        user_id,
        reward_type,
        amount,
        points,
        description,
        status
    ) VALUES (
        referral_record.id,
        referral_record.referrer_id,
        'referrer_bonus',
        0, -- amount is now 0 since we use points
        referrer_points,
        'Referral bonus from ' || referral_record.referred_email,
        'credited'
    );

    -- Award points to referred user
    UPDATE profiles
    SET total_points = COALESCE(total_points, 0) + referred_points
    WHERE id = user_id;

    -- Create reward record for referred user
    INSERT INTO referral_rewards (
        referral_id,
        user_id,
        reward_type,
        amount,
        points,
        description,
        status
    ) VALUES (
        referral_record.id,
        user_id,
        'referred_bonus',
        0, -- amount is now 0 since we use points
        referred_points,
        'Welcome bonus for using referral code',
        'credited'
    );

    -- Log the transaction in points_history if it exists
    BEGIN
        -- Log referrer points
        INSERT INTO points_history (
            user_id,
            points,
            type,
            source,
            description,
            created_at
        ) VALUES (
            referral_record.referrer_id,
            referrer_points,
            'earned',
            'referral',
            'Referral bonus from ' || referral_record.referred_email,
            NOW()
        );

        -- Log referred user points
        INSERT INTO points_history (
            user_id,
            points,
            type,
            source,
            description,
            created_at
        ) VALUES (
            user_id,
            referred_points,
            'earned',
            'referral',
            'Welcome bonus for using referral code',
            NOW()
        );
    EXCEPTION WHEN OTHERS THEN
        -- points_history table might not exist, continue without error
        RAISE NOTICE 'points_history table not available, skipping logging';
    END;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Update the referral settings description
UPDATE referral_settings
SET description = 'Reward amount for referrer in points'
WHERE setting_key = 'referrer_reward_amount';

UPDATE referral_settings
SET description = 'Reward amount for referred user in points'
WHERE setting_key = 'referred_reward_amount';

-- Create a view for referral stats with points
CREATE OR REPLACE VIEW referral_points_stats AS
SELECT
    p.id,
    p.full_name,
    p.email,
    p.referral_code,
    COALESCE(p.referral_count, 0) as referral_count,
    COALESCE(p.total_points, 0) as total_points,
    COUNT(r.id) FILTER (WHERE r.status = 'first_order_completed') as completed_referrals,
    COALESCE(SUM(rr.points), 0) as total_referral_points_awarded
FROM profiles p
LEFT JOIN referrals r ON p.id = r.referrer_id
LEFT JOIN referral_rewards rr ON p.id = rr.user_id AND rr.status = 'credited'
GROUP BY p.id, p.full_name, p.email, p.referral_code, p.referral_count, p.total_points;
