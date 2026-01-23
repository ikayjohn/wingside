-- ============================================================================
-- Points Expiration System
-- ============================================================================
-- Automatically expires points and sends warnings to users
-- ============================================================================

-- Add expiration notification tracking to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS last_expiration_warning_sent TIMESTAMPTZ;

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_profiles_last_expiration_warning
ON profiles(last_expiration_warning_sent);

-- ============================================================================
-- Function: Process Points Expiration
-- ============================================================================
-- Finds and expires points that have passed their expiration date
-- Returns list of users whose points were expired

CREATE OR REPLACE FUNCTION process_points_expiration()
RETURNS TABLE(
  user_id UUID,
  email TEXT,
  points_expired INTEGER,
  reward_type TEXT,
  expired_at TIMESTAMPTZ
) AS $$
DECLARE
  v_reward RECORD;
  v_user_email TEXT;
BEGIN
  -- Find rewards with expired points
  FOR v_reward IN
    SELECT
      r.id,
      r.user_id,
      r.reward_type,
      r.points,
      r.expires_at,
      p.email
    FROM rewards r
    JOIN profiles p ON p.id = r.user_id
    WHERE r.expires_at IS NOT NULL
      AND r.expires_at < NOW()
      AND r.status = 'earned'  -- Only expire earned points
    ORDER BY r.expires_at ASC
  LOOP
    -- Update reward status to expired
    UPDATE rewards
    SET status = 'expired'
    WHERE id = v_reward.id;

    -- Deduct expired points from user's total
    UPDATE profiles
    SET total_points = GREATEST(0, COALESCE(total_points, 0) - v_reward.points),
        updated_at = NOW()
    WHERE id = v_reward.user_id;

    -- Log in points_history
    INSERT INTO points_history (
      user_id,
      points,
      type,
      source,
      description,
      metadata
    ) VALUES (
      v_reward.user_id,
      -v_reward.points,  -- Negative value for deduction
      'expired',
      v_reward.reward_type,
      FORMAT('Points expired on %s', v_reward.expires_at::DATE),
      jsonb_build_object(
        'reward_id', v_reward.id,
        'expired_at', v_reward.expires_at,
        'reward_type', v_reward.reward_type
      )
    );

    -- Return the result
    user_id := v_reward.user_id;
    email := v_reward.email;
    points_expired := v_reward.points;
    reward_type := v_reward.reward_type;
    expired_at := v_reward.expires_at;
    RETURN NEXT;
  END LOOP;

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Function: Get Users with Expiring Points (for warnings)
-- ============================================================================
-- Returns users who have points expiring within X days
-- Used to send warning notifications

CREATE OR REPLACE FUNCTION get_users_with_expiring_points(
  p_days_before INTEGER DEFAULT 30
)
RETURNS TABLE(
  user_id UUID,
  email TEXT,
  full_name TEXT,
  points_expiring INTEGER,
  expiring_on DATE,
  days_until_expiry INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id as user_id,
    p.email,
    p.full_name,
    r.points as points_expiring,
    r.expires_at::DATE as expiring_on,
    EXTRACT(DAY FROM (r.expires_at - NOW()))::INTEGER as days_until_expiry
  FROM rewards r
  JOIN profiles p ON p.id = r.user_id
  WHERE r.expires_at IS NOT NULL
    AND r.expires_at > NOW()
    AND r.expires_at <= NOW() + (p_days_before || ' days')::INTERVAL
    AND r.status = 'earned'
    AND (
      p.last_expiration_warning_sent IS NULL
      OR p.last_expiration_warning_sent < NOW() - INTERVAL '7 days'  -- Don't spam
    )
  ORDER BY r.expires_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Function: Mark Expiration Warning Sent
-- ============================================================================
-- Updates last_expiration_warning_sent for a user

CREATE OR REPLACE FUNCTION mark_expiration_warning_sent(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET last_expiration_warning_sent = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Grant permissions
-- ============================================================================

GRANT EXECUTE ON FUNCTION process_points_expiration() TO service_role;
GRANT EXECUTE ON FUNCTION get_users_with_expiring_points(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION mark_expiration_warning_sent(UUID) TO service_role;

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON FUNCTION process_points_expiration() IS
'Processes points expiration. Expires rewards past expiration date, deducts points from users, and logs to points_history. Should be run via cron job daily.';

COMMENT ON FUNCTION get_users_with_expiring_points(INTEGER) IS
'Returns users who have points expiring within specified days. Used to send warning notifications. Default 30 days before expiration.';

COMMENT ON FUNCTION mark_expiration_warning_sent(UUID) IS
'Marks that an expiration warning was sent to a user. Prevents spam by tracking when last warning was sent.';

COMMENT ON COLUMN profiles.last_expiration_warning_sent IS
'Last date an expiration warning notification was sent to this user. Used to prevent spamming warnings.';
