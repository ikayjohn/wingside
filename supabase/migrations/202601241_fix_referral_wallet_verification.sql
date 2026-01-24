-- Fix Referral Wallet Credit Verification
-- Ensures rewards are only marked as "credited" if wallet transactions succeed
-- Adds proper error handling and status tracking

-- Drop and recreate the function with proper wallet verification
DROP FUNCTION IF EXISTS process_referral_reward_after_first_order(UUID, NUMERIC);

CREATE OR REPLACE FUNCTION process_referral_reward_after_first_order(
    user_id UUID,
    order_amount NUMERIC
)
RETURNS TABLE(
    success BOOLEAN,
    referrer_credited BOOLEAN,
    referred_credited BOOLEAN,
    referrer_reward_id UUID,
    referred_reward_id UUID,
    error_message TEXT
) AS $$
DECLARE
    referral_record RECORD;
    referrer_reward NUMERIC := 1000; -- ₦1000 for referrer
    referred_reward NUMERIC := 1000; -- ₦1000 for referred user
    referrer_wallet_id UUID;
    referred_wallet_id UUID;
    referrer_txn_id UUID;
    referred_txn_id UUID;
    referrer_reward_status TEXT;
    referred_reward_status TEXT;
    v_referrer_reward_id UUID;
    v_referred_reward_id UUID;
    v_referrer_credited BOOLEAN := FALSE;
    v_referred_credited BOOLEAN := FALSE;
    v_error_message TEXT := NULL;
BEGIN
    -- Check if minimum order amount met
    IF order_amount < 1000 THEN
        RETURN QUERY SELECT FALSE, FALSE, FALSE, NULL::UUID, NULL::UUID, 'Order amount below minimum (₦1,000)'::TEXT;
        RETURN;
    END IF;

    -- Find referral record where user was referred
    SELECT * INTO referral_record
    FROM referrals
    WHERE referred_user_id = user_id
      AND status = 'signed_up'
    LIMIT 1;

    -- If no referral found, return early
    IF referral_record IS NULL THEN
        RETURN QUERY SELECT FALSE, FALSE, FALSE, NULL::UUID, NULL::UUID, 'No referral record found'::TEXT;
        RETURN;
    END IF;

    -- Check if rewards already processed
    IF EXISTS (
        SELECT 1 FROM referral_rewards
        WHERE referral_id = referral_record.id
          AND user_id = referral_record.referrer_id
          AND reward_type = 'referrer_bonus'
    ) THEN
        RETURN QUERY SELECT FALSE, FALSE, FALSE, NULL::UUID, NULL::UUID, 'Rewards already processed'::TEXT;
        RETURN;
    END IF;

    -- Update referral status
    UPDATE referrals
    SET status = 'first_order_completed',
        completed_at = NOW(),
        updated_at = NOW()
    WHERE id = referral_record.id;

    -- ========================================
    -- REFERRER WALLET CREDIT (with verification)
    -- ========================================
    BEGIN
        -- Get referrer wallet
        SELECT id INTO referrer_wallet_id
        FROM wallets
        WHERE wallets.user_id = referral_record.referrer_id
        LIMIT 1;

        IF referrer_wallet_id IS NULL THEN
            -- Wallet does not exist - mark as pending for retry
            referrer_reward_status := 'pending';
            v_error_message := 'Referrer wallet not found';
            RAISE NOTICE 'Referrer wallet not found for user %', referral_record.referrer_id;
        ELSE
            -- Credit referrer wallet
            UPDATE wallets
            SET balance = balance + referrer_reward,
                updated_at = NOW()
            WHERE id = referrer_wallet_id;

            -- Create wallet transaction and verify it succeeded
            INSERT INTO wallet_transactions (
                wallet_id,
                amount,
                transaction_type,
                status,
                description,
                metadata,
                created_at
            ) VALUES (
                referrer_wallet_id,
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
            ) RETURNING id INTO referrer_txn_id;

            -- Verify transaction was created
            IF referrer_txn_id IS NOT NULL THEN
                referrer_reward_status := 'credited';
                v_referrer_credited := TRUE;
                RAISE NOTICE 'Successfully credited ₦% to referrer wallet %', referrer_reward, referrer_wallet_id;
            ELSE
                referrer_reward_status := 'failed';
                v_error_message := COALESCE(v_error_message || '; ', '') || 'Referrer transaction insert failed';
                RAISE WARNING 'Failed to create wallet transaction for referrer';
            END IF;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        referrer_reward_status := 'failed';
        v_error_message := COALESCE(v_error_message || '; ', '') || 'Referrer wallet error: ' || SQLERRM;
        RAISE WARNING 'Error crediting referrer wallet: %', SQLERRM;
    END;

    -- Create referrer reward record with ACTUAL status
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
        0,
        'Referral bonus from ' || referral_record.referred_email,
        referrer_reward_status -- 'credited', 'pending', or 'failed'
    ) RETURNING id INTO v_referrer_reward_id;

    -- ========================================
    -- REFERRED USER WALLET CREDIT (with verification)
    -- ========================================
    BEGIN
        -- Get referred user wallet
        SELECT id INTO referred_wallet_id
        FROM wallets
        WHERE wallets.user_id = user_id
        LIMIT 1;

        IF referred_wallet_id IS NULL THEN
            -- Wallet does not exist - mark as pending for retry
            referred_reward_status := 'pending';
            v_error_message := COALESCE(v_error_message || '; ', '') || 'Referred user wallet not found';
            RAISE NOTICE 'Referred user wallet not found for user %', user_id;
        ELSE
            -- Credit referred user wallet
            UPDATE wallets
            SET balance = balance + referred_reward,
                updated_at = NOW()
            WHERE id = referred_wallet_id;

            -- Create wallet transaction and verify it succeeded
            INSERT INTO wallet_transactions (
                wallet_id,
                amount,
                transaction_type,
                status,
                description,
                metadata,
                created_at
            ) VALUES (
                referred_wallet_id,
                referred_reward,
                'credit',
                'completed',
                'Welcome bonus for using referral code',
                jsonb_build_object(
                    'source', 'referral',
                    'referral_id', referral_record.id
                ),
                NOW()
            ) RETURNING id INTO referred_txn_id;

            -- Verify transaction was created
            IF referred_txn_id IS NOT NULL THEN
                referred_reward_status := 'credited';
                v_referred_credited := TRUE;
                RAISE NOTICE 'Successfully credited ₦% to referred user wallet %', referred_reward, referred_wallet_id;
            ELSE
                referred_reward_status := 'failed';
                v_error_message := COALESCE(v_error_message || '; ', '') || 'Referred user transaction insert failed';
                RAISE WARNING 'Failed to create wallet transaction for referred user';
            END IF;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        referred_reward_status := 'failed';
        v_error_message := COALESCE(v_error_message || '; ', '') || 'Referred user wallet error: ' || SQLERRM;
        RAISE WARNING 'Error crediting referred user wallet: %', SQLERRM;
    END;

    -- Create referred user reward record with ACTUAL status
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
        0,
        'Welcome bonus for using referral code',
        referred_reward_status -- 'credited', 'pending', or 'failed'
    ) RETURNING id INTO v_referred_reward_id;

    -- Update total_referral_earnings ONLY if referrer was actually credited
    IF v_referrer_credited THEN
        UPDATE profiles
        SET total_referral_earnings = COALESCE(total_referral_earnings, 0) + referrer_reward
        WHERE id = referral_record.referrer_id;
    END IF;

    -- Return detailed status
    RETURN QUERY SELECT
        TRUE, -- success (function executed)
        v_referrer_credited,
        v_referred_credited,
        v_referrer_reward_id,
        v_referred_reward_id,
        v_error_message;
END;
$$ LANGUAGE plpgsql;

-- Add comment
COMMENT ON FUNCTION process_referral_reward_after_first_order IS
'Awards ₦1000 naira to both referrer and referred user after first order completion. Verifies wallet transactions succeed before marking rewards as credited. Returns detailed status for each reward.';

-- Create function to retry failed/pending referral rewards
CREATE OR REPLACE FUNCTION retry_pending_referral_rewards()
RETURNS TABLE(
    reward_id UUID,
    user_id UUID,
    success BOOLEAN,
    message TEXT
) AS $$
DECLARE
    pending_reward RECORD;
    wallet_id UUID;
    txn_id UUID;
BEGIN
    -- Loop through pending or failed rewards
    FOR pending_reward IN
        SELECT rr.id, rr.user_id, rr.amount, rr.referral_id, rr.description
        FROM referral_rewards rr
        WHERE rr.status IN ('pending', 'failed')
        ORDER BY rr.created_at ASC
    LOOP
        BEGIN
            -- Try to find wallet
            SELECT id INTO wallet_id
            FROM wallets
            WHERE wallets.user_id = pending_reward.user_id
            LIMIT 1;

            IF wallet_id IS NULL THEN
                RETURN QUERY SELECT
                    pending_reward.id,
                    pending_reward.user_id,
                    FALSE,
                    'Wallet still not found'::TEXT;
                CONTINUE;
            END IF;

            -- Credit wallet
            UPDATE wallets
            SET balance = balance + pending_reward.amount,
                updated_at = NOW()
            WHERE id = wallet_id;

            -- Create transaction
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
                pending_reward.amount,
                'credit',
                'completed',
                pending_reward.description,
                jsonb_build_object(
                    'source', 'referral_retry',
                    'referral_id', pending_reward.referral_id,
                    'original_reward_id', pending_reward.id
                ),
                NOW()
            ) RETURNING id INTO txn_id;

            IF txn_id IS NOT NULL THEN
                -- Update reward status to credited
                UPDATE referral_rewards
                SET status = 'credited',
                    updated_at = NOW()
                WHERE id = pending_reward.id;

                RETURN QUERY SELECT
                    pending_reward.id,
                    pending_reward.user_id,
                    TRUE,
                    'Successfully credited'::TEXT;
            ELSE
                RETURN QUERY SELECT
                    pending_reward.id,
                    pending_reward.user_id,
                    FALSE,
                    'Transaction insert failed'::TEXT;
            END IF;

        EXCEPTION WHEN OTHERS THEN
            RETURN QUERY SELECT
                pending_reward.id,
                pending_reward.user_id,
                FALSE,
                ('Error: ' || SQLERRM)::TEXT;
        END;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Add comment
COMMENT ON FUNCTION retry_pending_referral_rewards IS
'Retries crediting wallet for pending or failed referral rewards. Run this periodically (e.g., daily cron) to process rewards that failed due to missing wallets.';
