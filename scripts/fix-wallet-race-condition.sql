-- Fix race condition in wallet transactions using atomic database operations

-- Function to atomically credit wallet
CREATE OR REPLACE FUNCTION atomic_credit_wallet(
    p_user_id UUID,
    p_amount DECIMAL,
    p_transaction_type VARCHAR,
    p_description TEXT,
    p_referral_reward_id UUID DEFAULT NULL,
    p_reward_claim_id UUID DEFAULT NULL,
    p_promo_code_id UUID DEFAULT NULL,
    p_order_id UUID DEFAULT NULL,
    p_reference VARCHAR DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE(transaction_id UUID, new_balance DECIMAL) AS $$
DECLARE
    v_current_balance DECIMAL := 0;
    v_new_balance DECIMAL;
    v_transaction_id UUID;
BEGIN
    -- Lock the user's profile row to prevent concurrent balance updates
    PERFORM 1 FROM profiles WHERE id = p_user_id FOR UPDATE;

    -- Get current balance from latest transaction (with row lock)
    SELECT COALESCE(balance_after, 0) INTO v_current_balance
    FROM wallet_transactions
    WHERE user_id = p_user_id AND status = 'completed'
    ORDER BY created_at DESC
    LIMIT 1
    FOR UPDATE SKIP LOCKED;

    -- If no transactions exist, get from profiles table
    IF v_current_balance IS NULL THEN
        SELECT COALESCE(wallet_balance, 0) INTO v_current_balance
        FROM profiles
        WHERE id = p_user_id;
    END IF;

    -- Calculate new balance
    v_new_balance := v_current_balance + p_amount;

    -- Insert transaction
    INSERT INTO wallet_transactions (
        user_id, type, amount, balance_after, transaction_type,
        description, referral_reward_id, reward_claim_id, promo_code_id,
        order_id, reference, metadata, status, created_at
    ) VALUES (
        p_user_id, 'credit', p_amount, v_new_balance, p_transaction_type,
        p_description, p_referral_reward_id, p_reward_claim_id, p_promo_code_id,
        p_order_id, p_reference, p_metadata, 'completed', NOW()
    ) RETURNING id INTO v_transaction_id;

    -- Update profile balance
    UPDATE profiles
    SET wallet_balance = v_new_balance, updated_at = NOW()
    WHERE id = p_user_id;

    -- Return result
    RETURN QUERY SELECT v_transaction_id, v_new_balance;
END;
$$ LANGUAGE plpgsql;

-- Function to atomically debit wallet
CREATE OR REPLACE FUNCTION atomic_debit_wallet(
    p_user_id UUID,
    p_amount DECIMAL,
    p_transaction_type VARCHAR,
    p_description TEXT,
    p_order_id UUID DEFAULT NULL,
    p_reference VARCHAR DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE(transaction_id UUID, new_balance DECIMAL, success BOOLEAN, error_message TEXT) AS $$
DECLARE
    v_current_balance DECIMAL := 0;
    v_new_balance DECIMAL;
    v_transaction_id UUID;
BEGIN
    -- Lock the user's profile row to prevent concurrent balance updates
    PERFORM 1 FROM profiles WHERE id = p_user_id FOR UPDATE;

    -- Get current balance from latest transaction (with row lock)
    SELECT COALESCE(balance_after, 0) INTO v_current_balance
    FROM wallet_transactions
    WHERE user_id = p_user_id AND status = 'completed'
    ORDER BY created_at DESC
    LIMIT 1
    FOR UPDATE SKIP LOCKED;

    -- If no transactions exist, get from profiles table
    IF v_current_balance IS NULL THEN
        SELECT COALESCE(wallet_balance, 0) INTO v_current_balance
        FROM profiles
        WHERE id = p_user_id;
    END IF;

    -- Check sufficient balance
    IF v_current_balance < p_amount THEN
        RETURN QUERY SELECT NULL::UUID, v_current_balance, FALSE,
            'Insufficient balance. Current: ' || v_current_balance::TEXT || ', Required: ' || p_amount::TEXT;
        RETURN;
    END IF;

    -- Calculate new balance
    v_new_balance := v_current_balance - p_amount;

    -- Insert transaction
    INSERT INTO wallet_transactions (
        user_id, type, amount, balance_after, transaction_type,
        description, order_id, reference, metadata, status, created_at
    ) VALUES (
        p_user_id, 'debit', p_amount, v_new_balance, p_transaction_type,
        p_description, p_order_id, p_reference, p_metadata, 'completed', NOW()
    ) RETURNING id INTO v_transaction_id;

    -- Update profile balance
    UPDATE profiles
    SET wallet_balance = v_new_balance, updated_at = NOW()
    WHERE id = p_user_id;

    -- Return result
    RETURN QUERY SELECT v_transaction_id, v_new_balance, TRUE, NULL::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON FUNCTION atomic_credit_wallet IS 'Atomically credit wallet with row-level locking to prevent race conditions';
COMMENT ON FUNCTION atomic_debit_wallet IS 'Atomically debit wallet with row-level locking to prevent race conditions';
