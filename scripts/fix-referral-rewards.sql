-- Fix: Actually credit referral rewards to wallet
-- This replaces the process_referral_reward_after_first_order function to actually credit wallets

-- Drop existing function first
DROP FUNCTION IF EXISTS process_referral_reward_after_first_order(uuid, numeric);

CREATE OR REPLACE FUNCTION process_referral_reward_after_first_order(
    user_id UUID,
    order_amount DECIMAL
)
RETURNS BOOLEAN AS $$
DECLARE
    referral_record RECORD;
    min_order_amount DECIMAL;
    referrer_reward DECIMAL;
    referred_reward DECIMAL;
    referrer_current_balance DECIMAL;
    referred_current_balance DECIMAL;
    referrer_reward_id UUID;
    referred_reward_id UUID;
BEGIN
    -- Get referral settings
    SELECT CAST(setting_value AS DECIMAL) INTO min_order_amount
    FROM referral_settings
    WHERE setting_key = 'min_order_amount_for_reward' AND is_active = TRUE;

    SELECT CAST(setting_value AS DECIMAL) INTO referrer_reward
    FROM referral_settings
    WHERE setting_key = 'referrer_reward_amount' AND is_active = TRUE;

    SELECT CAST(setting_value AS DECIMAL) INTO referred_reward
    FROM referral_settings
    WHERE setting_key = 'referred_reward_amount' AND is_active = TRUE;

    -- Find the referral record for this user
    SELECT * INTO referral_record
    FROM referrals
    WHERE referred_user_id = user_id AND status = 'signed_up';

    IF NOT FOUND THEN
        RETURN FALSE;
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

    -- Create reward records
    INSERT INTO referral_rewards (
        referral_id, user_id, reward_type, amount, description, status
    ) VALUES (
        referral_record.id, referral_record.referrer_id, 'referrer_bonus',
        referrer_reward, 'Referral bonus from ' || referral_record.referred_email, 'pending'
    ) RETURNING id INTO referrer_reward_id;

    INSERT INTO referral_rewards (
        referral_id, user_id, reward_type, amount, description, status
    ) VALUES (
        referral_record.id, user_id, 'referred_bonus',
        referred_reward, 'Welcome bonus for using referral code', 'pending'
    ) RETURNING id INTO referred_reward_id;

    -- Get current balances
    SELECT COALESCE(wallet_balance, 0) INTO referrer_current_balance
    FROM profiles WHERE id = referral_record.referrer_id;

    SELECT COALESCE(wallet_balance, 0) INTO referred_current_balance
    FROM profiles WHERE id = user_id;

    -- Credit referrer wallet
    INSERT INTO wallet_transactions (
        user_id, type, amount, balance_after, description, status, reference, created_at
    ) VALUES (
        referral_record.referrer_id, 'credit', referrer_reward,
        referrer_current_balance + referrer_reward,
        'Referral bonus from ' || referral_record.referred_email,
        'completed', 'REF-' || referrer_reward_id::TEXT, NOW()
    );

    -- Credit referred user wallet
    INSERT INTO wallet_transactions (
        user_id, type, amount, balance_after, description, status, reference, created_at
    ) VALUES (
        user_id, 'credit', referred_reward,
        referred_current_balance + referred_reward,
        'Welcome bonus for using referral code',
        'completed', 'REF-' || referred_reward_id::TEXT, NOW()
    );

    -- Update wallet balances in profiles
    UPDATE profiles
    SET wallet_balance = referrer_current_balance + referrer_reward,
        total_referral_earnings = COALESCE(total_referral_earnings, 0) + referrer_reward
    WHERE id = referral_record.referrer_id;

    UPDATE profiles
    SET wallet_balance = referred_current_balance + referred_reward
    WHERE id = user_id;

    -- Mark rewards as credited
    UPDATE referral_rewards
    SET status = 'credited', credited_at = NOW(), credited_to_wallet = TRUE
    WHERE id IN (referrer_reward_id, referred_reward_id);

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
