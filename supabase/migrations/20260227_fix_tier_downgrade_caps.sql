-- Migration: Fix tier downgrade point caps
-- Date: 2026-02-27
-- Issue: Wingzard downgrade capped at 20,000 which is still Wingzard threshold.
--        Wing Leader downgrade capped at 5,001 which is still Wing Leader threshold.
-- Fix: Cap at 19,999 (top of Wing Leader) and 5,000 (top of Wing Member) respectively.

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
      AND p.total_points > 0
    ORDER BY p.total_points DESC
  LOOP
    v_old_points := v_user.total_points;
    v_days_inactive := v_user.days_inactive;

    -- Determine old tier and cap points below the tier threshold
    IF v_old_points >= 20000 THEN
      v_old_tier := 'Wingzard';
      v_new_tier := 'Wing Leader';
      v_new_points := 19999;  -- Below Wingzard threshold (20,000)
    ELSIF v_old_points >= 5001 THEN
      v_old_tier := 'Wing Leader';
      v_new_tier := 'Wing Member';
      v_new_points := 5000;  -- Below Wing Leader threshold (5,001)
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
