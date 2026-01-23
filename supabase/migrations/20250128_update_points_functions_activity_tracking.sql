-- ============================================================================
-- Update Points Functions to Track Activity
-- ============================================================================
-- Modifies award_points and claim_reward to automatically update last_activity_date
-- ============================================================================

-- Update award_points function to track activity
CREATE OR REPLACE FUNCTION award_points(
    p_user_id UUID,
    p_reward_type TEXT,
    p_points INTEGER,
    p_amount_spent NUMERIC DEFAULT 0,
    p_description TEXT DEFAULT '',
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS BOOLEAN AS $$
DECLARE
    v_points INTEGER;
BEGIN
    -- Validate parameters
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'user_id cannot be NULL';
    END IF;

    IF p_points IS NULL OR p_points <= 0 THEN
        RAISE EXCEPTION 'points must be a positive integer';
    END IF;

    -- Update user's total_points AND last_activity_date in profiles table
    UPDATE profiles
    SET
        total_points = COALESCE(total_points, 0) + p_points,
        last_activity_date = NOW(),
        updated_at = NOW()
    WHERE id = p_user_id;

    -- Check if points_history table exists
    BEGIN
        -- Log the transaction in points_history
        INSERT INTO points_history (
            user_id,
            points,
            type,
            source,
            description,
            metadata,
            created_at
        ) VALUES (
            p_user_id,
            p_points,
            'earned',
            p_reward_type,
            p_description,
            p_metadata,
            NOW()
        );
    EXCEPTION WHEN OTHERS THEN
        -- points_history table might not exist, continue without error
        RAISE NOTICE 'points_history table not available, skipping logging';
    END;

    -- Get updated points total
    SELECT total_points INTO v_points
    FROM profiles
    WHERE id = p_user_id;

    RAISE NOTICE 'Awarded % points to user %. New total: %', p_points, p_user_id, v_points;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update claim_reward function to track activity
CREATE OR REPLACE FUNCTION claim_reward(
    p_user_id UUID,
    p_reward_type TEXT,
    p_points INTEGER DEFAULT 0,
    p_description TEXT DEFAULT '',
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS BOOLEAN AS $$
DECLARE
    v_points INTEGER;
    v_claim_id UUID;
BEGIN
    -- Validate parameters
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'user_id cannot be NULL';
    END IF;

    IF p_points IS NULL OR p_points <= 0 THEN
        RAISE EXCEPTION 'points must be a positive integer';
    END IF;

    -- Check if reward has already been claimed
    IF EXISTS (
        SELECT 1 FROM reward_claims
        WHERE user_id = p_user_id
        AND reward_type = p_reward_type
    ) THEN
        RAISE NOTICE 'Reward % already claimed by user %', p_reward_type, p_user_id;
        RETURN FALSE;
    END IF;

    -- Update user's total_points AND last_activity_date in profiles table
    UPDATE profiles
    SET
        total_points = COALESCE(total_points, 0) + p_points,
        last_activity_date = NOW(),
        updated_at = NOW()
    WHERE id = p_user_id;

    -- Record the reward claim
    INSERT INTO reward_claims (
        user_id,
        reward_type,
        points,
        description,
        metadata,
        status,
        claimed_at
    ) VALUES (
        p_user_id,
        p_reward_type,
        p_points,
        p_description,
        p_metadata,
        'claimed',
        NOW()
    )
    RETURNING id INTO v_claim_id;

    -- Check if points_history table exists
    BEGIN
        -- Log the transaction in points_history
        INSERT INTO points_history (
            user_id,
            points,
            type,
            source,
            description,
            metadata,
            created_at
        ) VALUES (
            p_user_id,
            p_points,
            'earned',
            'reward',
            p_description,
            p_metadata,
            NOW()
        );
    EXCEPTION WHEN OTHERS THEN
        -- points_history table might not exist, continue without error
        RAISE NOTICE 'points_history table not available, skipping logging';
    END;

    -- Get updated points total
    SELECT total_points INTO v_points
    FROM profiles
    WHERE id = p_user_id;

    RAISE NOTICE 'User % claimed reward %. Awarded % points. New total: %', p_user_id, p_reward_type, p_points, v_points;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION award_points(UUID, TEXT, INTEGER, NUMERIC, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION claim_reward(UUID, TEXT, INTEGER, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION award_points(UUID, TEXT, INTEGER, NUMERIC, TEXT, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION claim_reward(UUID, TEXT, INTEGER, TEXT, JSONB) TO service_role;

-- Add comments
COMMENT ON FUNCTION award_points IS 'Awards loyalty points to a user, logs the transaction, and updates last_activity_date';
COMMENT ON FUNCTION claim_reward IS 'Claims a one-time reward, awards points, and updates last_activity_date';
