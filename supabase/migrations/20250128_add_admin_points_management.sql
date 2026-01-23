-- ============================================================================
-- Admin Points Management Functions
-- ============================================================================
-- Allows admin to manually adjust user points (award or deduct)
-- ============================================================================

-- ============================================================================
-- Function: Admin Award Points
-- ============================================================================
-- Manually awards points to a user (admin action)
-- Logs the transaction with 'admin_award' type

CREATE OR REPLACE FUNCTION admin_award_points(
  p_user_id UUID,
  p_points INTEGER,
  p_reason TEXT,
  p_admin_id UUID,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE(
  success BOOLEAN,
  new_total_points INTEGER,
  transaction_id UUID
) AS $$
DECLARE
  v_new_total INTEGER;
  v_transaction_id UUID;
BEGIN
  -- Validate parameters
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id cannot be NULL';
  END IF;

  IF p_points IS NULL OR p_points <= 0 THEN
    RAISE EXCEPTION 'points must be a positive integer';
  END IF;

  IF p_admin_id IS NULL THEN
    RAISE EXCEPTION 'admin_id cannot be NULL';
  END IF;

  -- Update user's total_points in profiles table
  UPDATE profiles
  SET
    total_points = COALESCE(total_points, 0) + p_points,
    updated_at = NOW()
  WHERE id = p_user_id
  RETURNING total_points INTO v_new_total;

  -- Check if user exists
  IF v_new_total IS NULL THEN
    RAISE EXCEPTION 'User not found: %', p_user_id;
  END IF;

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
    'admin_award',
    p_reason,
    jsonb_build_object(
      'admin_id', p_admin_id,
      'action_type', 'manual_award',
      'original_metadata', p_metadata
    ),
    NOW()
  ) RETURNING id INTO v_transaction_id;

  RETURN QUERY SELECT TRUE, v_new_total, v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Function: Admin Deduct Points
-- ============================================================================
-- Manually deducts points from a user (admin action)
-- Logs the transaction with 'admin_deduct' type

CREATE OR REPLACE FUNCTION admin_deduct_points(
  p_user_id UUID,
  p_points INTEGER,
  p_reason TEXT,
  p_admin_id UUID,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE(
  success BOOLEAN,
  new_total_points INTEGER,
  transaction_id UUID
) AS $$
DECLARE
  v_current_points INTEGER;
  v_new_total INTEGER;
  v_transaction_id UUID;
BEGIN
  -- Validate parameters
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id cannot be NULL';
  END IF;

  IF p_points IS NULL OR p_points <= 0 THEN
    RAISE EXCEPTION 'points must be a positive integer';
  END IF;

  IF p_admin_id IS NULL THEN
    RAISE EXCEPTION 'admin_id cannot be NULL';
  END IF;

  -- Get current points
  SELECT total_points INTO v_current_points
  FROM profiles
  WHERE id = p_user_id;

  -- Check if user exists
  IF v_current_points IS NULL THEN
    RAISE EXCEPTION 'User not found: %', p_user_id;
  END IF;

  -- Deduct points (allow negative balance if needed, or use GREATEST(0, ...) to prevent negative)
  UPDATE profiles
  SET
    total_points = GREATEST(0, COALESCE(total_points, 0) - p_points),
    updated_at = NOW()
  WHERE id = p_user_id
  RETURNING total_points INTO v_new_total;

  -- Log the transaction in points_history (negative value)
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
    -p_points,  -- Negative value for deduction
    'redeemed',
    'admin_deduct',
    p_reason,
    jsonb_build_object(
      'admin_id', p_admin_id,
      'action_type', 'manual_deduct',
      'previous_balance', v_current_points,
      'original_metadata', p_metadata
    ),
    NOW()
  ) RETURNING id INTO v_transaction_id;

  RETURN QUERY SELECT TRUE, v_new_total, v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Function: Admin Adjust Points
-- ============================================================================
-- Flexible function to either add or deduct points based on signed integer
-- Positive = add, Negative = deduct

CREATE OR REPLACE FUNCTION admin_adjust_points(
  p_user_id UUID,
  p_points_change INTEGER,  -- Can be positive or negative
  p_reason TEXT,
  p_admin_id UUID,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE(
  success BOOLEAN,
  new_total_points INTEGER,
  transaction_id UUID,
  action_type TEXT
) AS $$
DECLARE
  v_current_points INTEGER;
  v_new_total INTEGER;
  v_transaction_id UUID;
  v_action_type TEXT;
  v_history_type TEXT;
BEGIN
  -- Validate parameters
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id cannot be NULL';
  END IF;

  IF p_points_change = 0 THEN
    RAISE EXCEPTION 'points_change cannot be zero';
  END IF;

  IF p_admin_id IS NULL THEN
    RAISE EXCEPTION 'admin_id cannot be NULL';
  END IF;

  -- Determine action type
  IF p_points_change > 0 THEN
    v_action_type := 'manual_award';
    v_history_type := 'earned';
  ELSE
    v_action_type := 'manual_deduct';
    v_history_type := 'redeemed';
  END IF;

  -- Get current points
  SELECT total_points INTO v_current_points
  FROM profiles
  WHERE id = p_user_id;

  -- Check if user exists
  IF v_current_points IS NULL THEN
    RAISE EXCEPTION 'User not found: %', p_user_id;
  END IF;

  -- Adjust points (prevent negative balance)
  UPDATE profiles
  SET
    total_points = GREATEST(0, COALESCE(total_points, 0) + p_points_change),
    updated_at = NOW()
  WHERE id = p_user_id
  RETURNING total_points INTO v_new_total;

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
    p_points_change,
    v_history_type,
    'admin_adjustment',
    p_reason,
    jsonb_build_object(
      'admin_id', p_admin_id,
      'action_type', v_action_type,
      'previous_balance', v_current_points,
      'points_change', p_points_change,
      'original_metadata', p_metadata
    ),
    NOW()
  ) RETURNING id INTO v_transaction_id;

  RETURN QUERY SELECT TRUE, v_new_total, v_transaction_id, v_action_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Function: Get User Points Details
-- ============================================================================
-- Returns detailed points information for a user (for admin view)

CREATE OR REPLACE FUNCTION get_user_points_details(p_user_id UUID)
RETURNS TABLE(
  user_id UUID,
  email TEXT,
  full_name TEXT,
  total_points INTEGER,
  tier TEXT,
  points_earned_total BIGINT,
  points_redeemed_total BIGINT,
  points_expired_total BIGINT,
  recent_transactions JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id as user_id,
    p.email,
    p.full_name,
    p.total_points,
    p.tier,
    -- Total points earned
    COALESCE(SUM(ph.points) FILTER (WHERE ph.type = 'earned'), 0) as points_earned_total,
    -- Total points redeemed (absolute value)
    COALESCE(ABS(SUM(ph.points) FILTER (WHERE ph.type = 'redeemed')), 0) as points_redeemed_total,
    -- Total points expired (absolute value)
    COALESCE(ABS(SUM(ph.points) FILTER (WHERE ph.type = 'expired')), 0) as points_expired_total,
    -- Recent 10 transactions as JSON
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', ph2.id,
          'points', ph2.points,
          'type', ph2.type,
          'source', ph2.source,
          'description', ph2.description,
          'created_at', ph2.created_at
        ) ORDER BY ph2.created_at DESC
      )
      FROM (
        SELECT * FROM points_history
        WHERE user_id = p.id
        ORDER BY created_at DESC
        LIMIT 10
      ) ph2
    ) as recent_transactions
  FROM profiles p
  LEFT JOIN points_history ph ON ph.user_id = p.id
  WHERE p.id = p_user_id
  GROUP BY p.id, p.email, p.full_name, p.total_points, p.tier;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Grant permissions
-- ============================================================================

GRANT EXECUTE ON FUNCTION admin_award_points(UUID, INTEGER, TEXT, UUID, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION admin_deduct_points(UUID, INTEGER, TEXT, UUID, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION admin_adjust_points(UUID, INTEGER, TEXT, UUID, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION get_user_points_details(UUID) TO service_role;

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON FUNCTION admin_award_points(UUID, INTEGER, TEXT, UUID, JSONB) IS
'Manually awards points to a user. Admin only. Logs transaction with admin_id for audit trail.';

COMMENT ON FUNCTION admin_deduct_points(UUID, INTEGER, TEXT, UUID, JSONB) IS
'Manually deducts points from a user. Admin only. Prevents negative balance. Logs transaction with admin_id for audit trail.';

COMMENT ON FUNCTION admin_adjust_points(UUID, INTEGER, TEXT, UUID, JSONB) IS
'Flexible points adjustment function. Positive values award points, negative values deduct. Admin only.';

COMMENT ON FUNCTION get_user_points_details(UUID) IS
'Returns comprehensive points information for a user including totals and recent transaction history. Admin only.';
