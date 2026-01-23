-- ============================================================================
-- Add 'tier_downgrade' to points_history type constraint
-- ============================================================================

-- Drop the existing constraint
ALTER TABLE points_history
DROP CONSTRAINT IF EXISTS points_history_type_check;

-- Add new constraint with 'tier_downgrade' type
ALTER TABLE points_history
ADD CONSTRAINT points_history_type_check
CHECK (type IN ('earned', 'redeemed', 'expired', 'tier_downgrade'));
