-- Create Points and Rewards System
-- This migration creates the tables and RPC functions needed for the points/rewards system

-- Create points_history table if it doesn't exist
CREATE TABLE IF NOT EXISTS points_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('earned', 'redeemed', 'expired')),
    source TEXT NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reward_claims table if it doesn't exist
CREATE TABLE IF NOT EXISTS reward_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reward_type TEXT NOT NULL,
    points INTEGER DEFAULT 0,
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'claimed' CHECK (status IN ('pending', 'claimed', 'expired')),
    claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_points_history_user_id ON points_history(user_id);
CREATE INDEX IF NOT EXISTS idx_points_history_created_at ON points_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reward_claims_user_id ON reward_claims(user_id);
CREATE INDEX IF NOT EXISTS idx_reward_claims_reward_type ON reward_claims(reward_type);
CREATE INDEX IF NOT EXISTS idx_reward_claims_user_reward ON reward_claims(user_id, reward_type);

-- Enable RLS (idempotent)
DO $$
BEGIN
    -- Enable RLS on points_history if not already enabled
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables
        WHERE tablename = 'points_history'
        AND rowsecurity = true
    ) THEN
        ALTER TABLE points_history ENABLE ROW LEVEL SECURITY;
    END IF;

    -- Enable RLS on reward_claims if not already enabled
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables
        WHERE tablename = 'reward_claims'
        AND rowsecurity = true
    ) THEN
        ALTER TABLE reward_claims ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- RLS Policies for points_history
-- Drop policies if they exist
DROP POLICY IF EXISTS "Users can view own points history" ON points_history;
DROP POLICY IF EXISTS "Service role can manage points history" ON points_history;

-- Users can read their own points history
CREATE POLICY "Users can view own points history"
ON points_history FOR SELECT
USING (auth.uid() = user_id);

-- Service role can do everything
CREATE POLICY "Service role can manage points history"
ON points_history FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for reward_claims
-- Drop policies if they exist
DROP POLICY IF EXISTS "Users can view own reward claims" ON reward_claims;
DROP POLICY IF EXISTS "Service role can manage reward claims" ON reward_claims;

-- Users can read their own reward claims
CREATE POLICY "Users can view own reward claims"
ON reward_claims FOR SELECT
USING (auth.uid() = user_id);

-- Service role can do everything
CREATE POLICY "Service role can manage reward claims"
ON reward_claims FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS award_points(UUID, TEXT, INTEGER, NUMERIC, TEXT, JSONB);
DROP FUNCTION IF EXISTS claim_reward(UUID, TEXT, INTEGER, TEXT, JSONB);

-- Function to award points to users
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

    -- Update user's total_points in profiles table
    UPDATE profiles
    SET
        total_points = COALESCE(total_points, 0) + p_points,
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

-- Function to claim rewards
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

    -- Update user's total_points in profiles table
    UPDATE profiles
    SET
        total_points = COALESCE(total_points, 0) + p_points,
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

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION award_points(UUID, TEXT, INTEGER, NUMERIC, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION claim_reward(UUID, TEXT, INTEGER, TEXT, JSONB) TO authenticated;

-- Grant execute permissions to service role (for admin operations)
GRANT EXECUTE ON FUNCTION award_points(UUID, TEXT, INTEGER, NUMERIC, TEXT, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION claim_reward(UUID, TEXT, INTEGER, TEXT, JSONB) TO service_role;

-- Add comments for documentation
COMMENT ON FUNCTION award_points IS 'Aards loyalty points to a user and logs the transaction in points_history';
COMMENT ON FUNCTION claim_reward IS 'Claims a one-time reward (e.g., first order bonus) and awards points to user';
