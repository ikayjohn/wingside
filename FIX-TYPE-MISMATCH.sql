-- ============================================================================
-- Fix get_user_points_details - Type Mismatch Fix
-- ============================================================================
-- Cast email to TEXT to match function signature
-- ============================================================================

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
  -- Check if user exists first
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'User not found: %', p_user_id;
  END IF;

  RETURN QUERY
  SELECT
    p.id as user_id,
    COALESCE(p.email::TEXT, '') as email,
    COALESCE(p.full_name::TEXT, 'Unknown') as full_name,
    COALESCE(p.total_points, 0) as total_points,
    -- Calculate tier based on actual wingclub tiers
    CASE
      WHEN COALESCE(p.total_points, 0) >= 20000 THEN 'Wingzard'
      WHEN COALESCE(p.total_points, 0) >= 5001 THEN 'Wing Leader'
      ELSE 'Wing Member'
    END as tier,
    -- Total points earned
    COALESCE((
      SELECT SUM(ph.points)
      FROM points_history ph
      WHERE ph.user_id = p.id AND ph.type = 'earned'
    ), 0) as points_earned_total,
    -- Total points redeemed (absolute value)
    COALESCE(ABS((
      SELECT SUM(ph.points)
      FROM points_history ph
      WHERE ph.user_id = p.id AND ph.type = 'redeemed'
    )), 0) as points_redeemed_total,
    -- Total points expired (absolute value)
    COALESCE(ABS((
      SELECT SUM(ph.points)
      FROM points_history ph
      WHERE ph.user_id = p.id AND ph.type = 'expired'
    )), 0) as points_expired_total,
    -- Recent 10 transactions as JSON
    COALESCE((
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
        SELECT ph3.id, ph3.points, ph3.type, ph3.source, ph3.description, ph3.created_at
        FROM points_history ph3
        WHERE ph3.user_id = p.id
        ORDER BY ph3.created_at DESC
        LIMIT 10
      ) ph2
    ), '[]'::jsonb) as recent_transactions
  FROM profiles p
  WHERE p.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permission to service role
GRANT EXECUTE ON FUNCTION get_user_points_details(UUID) TO service_role;
