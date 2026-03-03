-- Migration: Fix process_payment_atomically bugs
-- Date: 2026-03-02
-- Fixes:
--   1. Orders under ₦100 cause full rollback (award_points raises on 0 points)
--   2. first_order_bonus_claimed always reports TRUE even when not actually claimed

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
    -- 1. Award points for purchase (₦100 = 1 point)
    --    Skip if 0 points to avoid award_points raising an exception
    BEGIN
        v_points_awarded := FLOOR(p_order_total / 100);
        IF v_points_awarded > 0 THEN
            PERFORM award_points(
                p_user_id,
                'purchase',
                v_points_awarded,
                p_order_total,
                'Points earned from order',
                jsonb_build_object('order_id', p_order_id)
            );
        END IF;
    EXCEPTION WHEN OTHERS THEN
        v_error := 'Points award failed: ' || SQLERRM;
        RAISE EXCEPTION '%', v_error;
    END;

    -- 2. Check and claim first order bonus
    --    Use SELECT INTO to capture actual return value instead of PERFORM
    BEGIN
        SELECT EXISTS (
            SELECT 1 FROM reward_claims
            WHERE user_id = p_user_id AND reward_type = 'first_order'
        ) INTO v_bonus_claimed;

        IF NOT v_bonus_claimed THEN
            SELECT claim_first_order_reward(p_user_id, p_order_id) INTO v_bonus_claimed;
        ELSE
            -- Already claimed previously, keep v_bonus_claimed = FALSE for this run
            v_bonus_claimed := FALSE;
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

COMMENT ON FUNCTION process_payment_atomically IS 'Atomically process all payment rewards (points, bonuses, referrals) with automatic rollback on any failure. Fixed: handles 0-point orders, reports accurate bonus status.';
