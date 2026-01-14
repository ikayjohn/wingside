-- Final cleanup: Remove the 3 remaining areas from migration that aren't in your list
DELETE FROM delivery_areas WHERE name IN (
    'Rumualogu/Airport Road',
    'Rumuola',
    'Rumuodomaya'
);

-- Verify we have exactly 78 areas and no display_order = 0
SELECT COUNT(*) as total_areas,
       COUNT(CASE WHEN display_order = 0 THEN 1 END) as areas_with_order_zero
FROM delivery_areas
WHERE is_active = true;

-- Show the final complete list
SELECT name, delivery_fee, display_order
FROM delivery_areas
WHERE is_active = true
ORDER BY display_order ASC;
