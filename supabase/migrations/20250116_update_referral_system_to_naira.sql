-- Update Referral System from Points to Naira (₦1000)
-- This migration converts the referral system from points-based (200 points) to naira-based (₦1000)

-- Update referral settings to use naira instead of points
UPDATE referral_settings
SET setting_value = '1000',
    description = 'Reward amount for referrer in naira (₦1000)'
WHERE setting_key = 'referrer_reward_amount' AND is_active = TRUE;

UPDATE referral_settings
SET setting_value = '1000',
    description = 'Reward amount for referred user in naira (₦1000)'
WHERE setting_key = 'referred_reward_amount' AND is_active = TRUE;

-- Drop the existing points-based function
DROP FUNCTION IF EXISTS process_referral_reward_after_first_order(UUID, NUMERIC);

-- Create a new function to process referral rewards and award naira to wallet
CREATE OR REPLACE FUNCTION process_referral_reward_after_first_order(
    user_id UUID,
    order_amount NUMERIC
)
RETURNS BOOLEAN AS $$
DECLARE
    referral_record RECORD;
    min_order_amount NUMERIC;
    referrer_reward NUMERIC;
    referred_reward NUMERIC;
    reward_id UUID;
    wallet_id UUID;
BEGIN
    -- Get referral settings
    SELECT CAST(setting_value AS NUMERIC) INTO min_order_amount
    FROM referral_settings
    WHERE setting_key = 'min_order_amount_for_reward' AND is_active = TRUE;

    SELECT CAST(setting_value AS NUMERIC) INTO referrer_reward
    FROM referral_settings
    WHERE setting_key = 'referrer_reward_amount' AND is_active = TRUE;

    SELECT CAST(setting_value AS NUMERIC) INTO referred_reward
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

    -- Award naira to referrer's wallet (using Embedly wallet_transactions table)
    BEGIN
        -- Get or create referrer's wallet
        SELECT id INTO wallet_id
        FROM wallets
        WHERE user_id = referral_record.referrer_id
        LIMIT 1;

        -- If wallet doesn't exist, we'll skip the wallet credit
        -- The Embedly system will handle wallet creation separately

        IF wallet_id IS NOT NULL THEN
            -- Credit referrer's wallet
            UPDATE wallets
            SET balance = balance + referrer_reward,
                updated_at = NOW()
            WHERE id = wallet_id;

            -- Log referrer wallet transaction
            INSERT INTO wallet_transactions (
                wallet_id,
                amount,
                transaction_type,
                status,
                description,
                metadata,
                created_at
            ) VALUES (
                wallet_id,
                referrer_reward,
                'credit',
                'completed',
                'Referral bonus from ' || referral_record.referred_email,
                jsonb_build_object(
                    'source', 'referral',
                    'referral_id', referral_record.id,
                    'referred_user_id', user_id
                ),
                NOW()
            );
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error crediting referrer wallet: %', SQLERRM;
    END;

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
        referrer_reward,
        0, -- points is now 0 since we use naira
        'Referral bonus from ' || referral_record.referred_email,
        'credited'
    );

    -- Award naira to referred user's wallet
    BEGIN
        -- Get or create referred user's wallet
        SELECT id INTO wallet_id
        FROM wallets
        WHERE user_id = user_id
        LIMIT 1;

        IF wallet_id IS NOT NULL THEN
            -- Credit referred user's wallet
            UPDATE wallets
            SET balance = balance + referred_reward,
                updated_at = NOW()
            WHERE id = wallet_id;

            -- Log referred user wallet transaction
            INSERT INTO wallet_transactions (
                wallet_id,
                amount,
                transaction_type,
                status,
                description,
                metadata,
                created_at
            ) VALUES (
                wallet_id,
                referred_reward,
                'credit',
                'completed',
                'Welcome bonus for using referral code',
                jsonb_build_object(
                    'source', 'referral',
                    'referral_id', referral_record.id
                ),
                NOW()
            );
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error crediting referred user wallet: %', SQLERRM;
    END;

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
        referred_reward,
        0, -- points is now 0 since we use naira
        'Welcome bonus for using referral code',
        'credited'
    );

    -- Update total_referral_earnings in profiles (now tracking naira instead of points)
    UPDATE profiles
    SET total_referral_earnings = COALESCE(total_referral_earnings, 0) + referrer_reward
    WHERE id = referral_record.referrer_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Add a comment to document the change
COMMENT ON FUNCTION process_referral_reward_after_first_order IS 'Awards ₦1000 naira to both referrer and referred user after first order completion';
