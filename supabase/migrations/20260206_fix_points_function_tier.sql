-- ============================================================================
-- Fix get_user_points_details - Remove non-existent tier column
-- ============================================================================
-- The profiles table doesn't have a tier column
-- We'll calculate tier based on total_points
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
    COALESCE(p.email, '') as email,
    COALESCE(p.full_name, 'Unknown') as full_name,
    COALESCE(p.total_points, 0) as total_points,
    -- Calculate tier based on points (Bronze, Silver, Gold, Platinum)
    CASE
      WHEN COALESCE(p.total_points, 0) >= 10000 THEN 'Platinum'
      WHEN COALESCE(p.total_points, 0) >= 5000 THEN 'Gold'
      WHEN COALESCE(p.total_points, 0) >= 2000 THEN 'Silver'
      ELSE 'Bronze'
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
        SELECT * FROM points_history
        WHERE user_id = p.id
        ORDER BY created_at DESC
        LIMIT 10
      ) ph2
    ), '[]'::jsonb) as recent_transactions
  FROM profiles p
  WHERE p.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permission to service role
GRANT EXECUTE ON FUNCTION get_user_points_details(UUID) TO service_role;

-- Add comment
COMMENT ON FUNCTION get_user_points_details(UUID) IS
'Returns comprehensive points information for a user.
Tier is calculated dynamically based on total_points:
- Bronze: 0-1999 points
- Silver: 2000-4999 points
- Gold: 5000-9999 points
- Platinum: 10000+ points
Admin only.';
