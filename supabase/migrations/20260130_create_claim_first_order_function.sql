-- Create function to claim first order bonus
-- This function is called by process_payment_atomically

CREATE OR REPLACE FUNCTION claim_first_order_reward(
    p_user_id UUID,
    p_order_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_bonus_points INTEGER := 50; -- First order bonus: 50 points
    v_already_claimed BOOLEAN;
    v_order_total NUMERIC;
BEGIN
    -- Validate parameters
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'user_id cannot be NULL';
    END IF;

    -- IMPORTANT: First order bonus only applies to orders >= ₦1,000
    SELECT total INTO v_order_total
    FROM orders
    WHERE id = p_order_id;

    IF v_order_total < 1000 THEN
        RAISE NOTICE 'Order #% total (₦%) is below ₦1,000 minimum for first order bonus', p_order_id, v_order_total;
        RETURN FALSE;
    END IF;

    -- Check if user already claimed first order bonus
    SELECT EXISTS (
        SELECT 1 FROM reward_claims
        WHERE user_id = p_user_id
        AND reward_type = 'first_order'
    ) INTO v_already_claimed;

    IF v_already_claimed THEN
        RAISE NOTICE 'User % already claimed first order bonus', p_user_id;
        RETURN FALSE;
    END IF;

    -- Award the bonus using existing claim_reward function
    RETURN claim_reward(
        p_user_id,
        'first_order',
        v_bonus_points,
        'First order bonus - thank you for your first order!',
        jsonb_build_object('order_id', p_order_id, 'order_total', v_order_total)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION claim_first_order_reward(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION claim_first_order_reward(UUID, UUID) TO service_role;

COMMENT ON FUNCTION claim_first_order_reward IS 'Claims first order bonus (50 points) for new customers';
