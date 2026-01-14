-- Fix Delivery Areas Display Order
-- This script reorders all delivery areas by delivery_fee (ascending), then by name alphabetically

-- Update display orders for all areas, ordered by delivery_fee and name
WITH ordered_areas AS (
  SELECT
    id,
    ROW_NUMBER() OVER (ORDER BY delivery_fee ASC, name ASC) as new_order
  FROM delivery_areas
  WHERE is_active = true
)
UPDATE delivery_areas
SET display_order = ordered_areas.new_order
FROM ordered_areas
WHERE delivery_areas.id = ordered_areas.id;

-- Verify the new order
SELECT
  id,
  name,
  delivery_fee,
  display_order,
  estimated_time
FROM delivery_areas
WHERE is_active = true
ORDER BY display_order ASC;
