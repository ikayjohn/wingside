-- Atomic payment processing function with rollback on failure
-- This function processes all payment-related rewards in a single transaction

CREATE OR REPLACE FUNCTION process_payment_atomically(
    p_order_id UUID,
    p_user_id UUID,
    p_order_total DECIMAL
)
RETURNS TABLE(
    success BOOLEAN,
    points_awarded INTEGER,
    first_order_bonus_claimed BOOLEAN,
    referral_processed BOOLEAN,
    error_message TEXT
) AS $$
DECLARE
    v_points_awarded INTEGER := 0;
    v_bonus_claimed BOOLEAN := FALSE;
    v_referral_processed BOOLEAN := FALSE;
    v_error TEXT := NULL;
BEGIN
    -- Start transaction (implicit in function)

    -- 1. Award points for purchase (₦100 = 1 point)
    BEGIN
        v_points_awarded := FLOOR(p_order_total / 100);
        PERFORM award_points(
            p_user_id,
            'purchase',
            v_points_awarded,
            p_order_total,
            'Points earned from order',
            jsonb_build_object('order_id', p_order_id)
        );
    EXCEPTION WHEN OTHERS THEN
        v_error := 'Points award failed: ' || SQLERRM;
        RAISE EXCEPTION '%', v_error;
    END;

    -- 2. Check and claim first order bonus
    BEGIN
        SELECT COUNT(*) = 1 INTO v_bonus_claimed
        FROM reward_claims
        WHERE user_id = p_user_id AND reward_type = 'first_order' AND status = 'claimed';

        IF NOT v_bonus_claimed THEN
            PERFORM claim_first_order_reward(p_user_id, p_order_id);
            v_bonus_claimed := TRUE;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        v_error := 'First order bonus failed: ' || SQLERRM;
        RAISE EXCEPTION '%', v_error;
    END;

    -- 3. Process referral rewards if applicable (minimum ₦1,000 order)
    BEGIN
        IF p_order_total >= 1000 THEN
            v_referral_processed := process_referral_reward_after_first_order(p_user_id, p_order_total);
        END IF;
    EXCEPTION WHEN OTHERS THEN
        v_error := 'Referral processing failed: ' || SQLERRM;
        RAISE EXCEPTION '%', v_error;
    END;

    -- All succeeded
    RETURN QUERY SELECT
        TRUE,
        v_points_awarded,
        v_bonus_claimed,
        v_referral_processed,
        NULL::TEXT;

EXCEPTION WHEN OTHERS THEN
    -- Any error triggers automatic ROLLBACK
    RETURN QUERY SELECT
        FALSE,
        0,
        FALSE,
        FALSE,
        COALESCE(v_error, SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION process_payment_atomically(UUID, UUID, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION process_payment_atomically(UUID, UUID, DECIMAL) TO service_role;

COMMENT ON FUNCTION process_payment_atomically IS 'Atomically process all payment rewards (points, bonuses, referrals) with automatic rollback on any failure';
