# Fix: Failed to Fetch Points Details Error

## Error
```
Failed to fetch points details: "Failed to fetch user points details"
```

## Cause
The `get_user_points_details` database function has issues handling:
- Users with no points history
- NULL values in profile fields
- Empty aggregation results

## Solution

Run the following SQL in your **Supabase SQL Editor**:

```sql
-- ============================================================================
-- Fix get_user_points_details function to handle edge cases
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
    COALESCE(p.tier, 'bronze') as tier,
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
```

## Steps to Apply

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Paste the SQL above
5. Click **Run** or press `Ctrl+Enter`

## What This Fixes

✅ **Handles users with no points history** - Returns 0 instead of NULL
✅ **Handles missing profile fields** - Uses COALESCE for defaults
✅ **Returns empty array for no transactions** - Instead of NULL
✅ **Validates user exists** - Throws clear error if user not found
✅ **Separate subqueries** - Prevents aggregation issues

## Verify the Fix

After applying the SQL, test by:
1. Go to Admin → Customers
2. Click on any customer
3. The points details section should load without errors

## Alternative: Run Migration Script

If you prefer to use a script:

```bash
cd C:\Users\ikayj\Documents\wingside
node scripts/apply-points-fix.js
```

Note: This requires the migration to be properly set up in your local environment.
