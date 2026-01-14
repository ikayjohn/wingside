-- Check total count including inactive areas
SELECT
  COUNT(*) FILTER (WHERE is_active = true) as active_count,
  COUNT(*) FILTER (WHERE is_active = false) as inactive_count,
  COUNT(*) as total_count
FROM delivery_areas;

-- Find all duplicates (same name)
SELECT name, COUNT(*) as count
FROM delivery_areas
GROUP BY name
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- Show ALL areas (both active and inactive) ordered by display_order
SELECT name, is_active, delivery_fee, display_order
FROM delivery_areas
ORDER BY display_order ASC;
