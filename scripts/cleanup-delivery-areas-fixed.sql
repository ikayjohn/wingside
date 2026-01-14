-- Clean up and fix delivery areas (Fixed for UUID IDs)

-- Delete duplicates using a different approach
WITH ranked_areas AS (
    SELECT
        id,
        name,
        ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at) as rn
    FROM delivery_areas
)
DELETE FROM delivery_areas
WHERE id IN (
    SELECT id FROM ranked_areas WHERE rn > 1
);

-- Update areas that didn't match (name differences)
UPDATE delivery_areas SET display_order = 9 WHERE name = 'Rumuokwuta' AND delivery_fee = 2000;
UPDATE delivery_areas SET display_order = 26 WHERE name = 'Rumuigbo' AND delivery_fee = 2500;

-- Fix names to match user's format
UPDATE delivery_areas SET name = 'Eleme junction/Trinity Estate' WHERE name = 'Eleme Junction/Trinity Estate';
UPDATE delivery_areas SET name = 'Omagwa/ Airport' WHERE name = 'Omagwa/Airport';

-- Delete the areas that were incorrectly added in the migration but aren't in the user's list
DELETE FROM delivery_areas WHERE name IN (
    'Rumuomoi',
    'Rumuikwr',
    'Rumuola/Park Lane',
    'Rumuola/NTA',
    'Rumuokwurusi',
    'Rumualogu',
    'Rumuoparali',
    'Rumuola/Station',
    'Rumuokuta',
    'Rumuekini',
    'Rumuokwuta/Aluu',
    'Rumuola/GRA',
    'Rumuokuta/Aluu',
    'Rumuewhara/Rumuduru',
    'Rumuigbo/Rumurolu',
    'Rumuola/Eagle Island',
    'Trans Amadi',
    'Rumuokwurusi/Igwuruta'
);

-- Now update any remaining areas with display_order = 0
UPDATE delivery_areas SET display_order = 71 WHERE name = 'Eleme' AND display_order = 0;
UPDATE delivery_areas SET display_order = 72 WHERE name = 'Igwuruta' AND display_order = 0;
UPDATE delivery_areas SET display_order = 73 WHERE name = 'Eleme junction/Trinity Estate' AND display_order = 0;
UPDATE delivery_areas SET display_order = 74 WHERE name = 'Atali' AND display_order = 0;
UPDATE delivery_areas SET display_order = 75 WHERE name = 'Aluu' AND display_order = 0;
UPDATE delivery_areas SET display_order = 76 WHERE name = 'Oyingbo' AND display_order = 0;
UPDATE delivery_areas SET display_order = 77 WHERE name = 'Omagwa/ Airport' AND display_order = 0;
UPDATE delivery_areas SET display_order = 78 WHERE name = 'Onne' AND display_order = 0;

-- Verify no areas have display_order = 0
SELECT name, delivery_fee, display_order
FROM delivery_areas
WHERE display_order = 0;

-- Verify the final order
SELECT name, delivery_fee, display_order
FROM delivery_areas
WHERE is_active = true
ORDER BY display_order ASC;
