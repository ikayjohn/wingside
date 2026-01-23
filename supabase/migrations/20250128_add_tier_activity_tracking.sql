-- ============================================================================
-- Add Activity Tracking for Tier Downgrade System
-- ============================================================================
-- Tracks user activity to determine tier downgrades after 6 months of inactivity
-- Activity includes: orders, points earned/redeemed, successful referrals
-- ============================================================================

-- Add last_activity_date column to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS last_activity_date TIMESTAMPTZ DEFAULT NOW();

-- Update existing profiles to set last_activity_date based on most recent activity
UPDATE profiles
SET last_activity_date = COALESCE(
  -- Most recent order
  (SELECT MAX(created_at) FROM orders WHERE user_id = profiles.id AND payment_status = 'paid'),
  -- Most recent points history
  (SELECT MAX(created_at) FROM points_history WHERE user_id = profiles.id),
  -- Most recent referral
  (SELECT MAX(created_at) FROM referrals WHERE referrer_id = profiles.id),
  -- Fallback to profile creation
  profiles.created_at
)
WHERE last_activity_date IS NULL;

-- Create index for efficient querying of inactive users
CREATE INDEX IF NOT EXISTS idx_profiles_last_activity_date
ON profiles(last_activity_date);

-- ============================================================================
-- Function: Update Last Activity Date
-- ============================================================================
-- Updates the last_activity_date for a user
-- Called from various activities: orders, points, referrals, redemptions

CREATE OR REPLACE FUNCTION update_last_activity(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET last_activity_date = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Function: Process Tier Downgrades for Inactive Users
-- ============================================================================
-- Checks for users inactive for 6+ months and downgrades tier by ONE level
-- Wingzard → Wing Leader (points set to 20,000)
-- Wing Leader → Wing Member (points set to 5,001)
-- Wing Member → remains Wing Member (no change)

CREATE OR REPLACE FUNCTION process_tier_downgrades()
RETURNS TABLE(
  user_id UUID,
  email TEXT,
  old_points INTEGER,
  new_points INTEGER,
  old_tier TEXT,
  new_tier TEXT,
  days_inactive INTEGER
) AS $$
DECLARE
  v_user RECORD;
  v_old_tier TEXT;
  v_new_tier TEXT;
  v_old_points INTEGER;
  v_new_points INTEGER;
  v_days_inactive INTEGER;
BEGIN
  -- Find users inactive for 6+ months
  FOR v_user IN
    SELECT
      p.id,
      p.email,
      p.total_points,
      p.last_activity_date,
      EXTRACT(DAY FROM (NOW() - p.last_activity_date))::INTEGER as days_inactive
    FROM profiles p
    WHERE p.last_activity_date < (NOW() - INTERVAL '6 months')
      AND p.total_points > 0  -- Only users with points
    ORDER BY p.total_points DESC
  LOOP
    v_old_points := v_user.total_points;
    v_days_inactive := v_user.days_inactive;

    -- Determine old tier
    IF v_old_points >= 20000 THEN
      v_old_tier := 'Wingzard';
      v_new_tier := 'Wing Leader';
      v_new_points := 20000;  -- Set to Wing Leader minimum
    ELSIF v_old_points >= 5001 THEN
      v_old_tier := 'Wing Leader';
      v_new_tier := 'Wing Member';
      v_new_points := 5001;  -- Set to Wing Member maximum (to avoid immediate re-upgrade)
    ELSE
      v_old_tier := 'Wing Member';
      v_new_tier := 'Wing Member';
      v_new_points := v_old_points;  -- No change
    END IF;

    -- Only downgrade if tier actually changes
    IF v_new_points != v_old_points THEN
      -- Update points
      UPDATE profiles
      SET total_points = v_new_points,
          updated_at = NOW()
      WHERE id = v_user.id;

      -- Log the downgrade in points_history
      INSERT INTO points_history (
        user_id,
        points,
        type,
        source,
        description,
        metadata
      ) VALUES (
        v_user.id,
        v_new_points - v_old_points,  -- Negative value
        'tier_downgrade',
        'system',
        FORMAT('Tier downgraded from %s to %s due to %s days of inactivity',
               v_old_tier, v_new_tier, v_days_inactive),
        jsonb_build_object(
          'old_tier', v_old_tier,
          'new_tier', v_new_tier,
          'old_points', v_old_points,
          'new_points', v_new_points,
          'days_inactive', v_days_inactive
        )
      );

      -- Return the result
      user_id := v_user.id;
      email := v_user.email;
      old_points := v_old_points;
      new_points := v_new_points;
      old_tier := v_old_tier;
      new_tier := v_new_tier;
      days_inactive := v_days_inactive;
      RETURN NEXT;
    END IF;
  END LOOP;

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Grant permissions
-- ============================================================================

GRANT EXECUTE ON FUNCTION update_last_activity(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION process_tier_downgrades() TO service_role;

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON COLUMN profiles.last_activity_date IS
'Last date of user activity (order, points earned/redeemed, referral). Used for tier downgrade after 6 months of inactivity.';

COMMENT ON FUNCTION update_last_activity(UUID) IS
'Updates last_activity_date for a user. Call this after: orders, points earned/redeemed, successful referrals.';

COMMENT ON FUNCTION process_tier_downgrades() IS
'Processes tier downgrades for users inactive for 6+ months. Should be run via cron job daily or weekly. Returns list of users whose tiers were downgraded.';
