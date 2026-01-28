-- Fix products subcategory names after renaming "Matcha Lattes" to "matchas"
-- Run this to update all products that still have the old subcategory name

-- Update products with old subcategory name variations
UPDATE products
SET subcategory = 'matchas'
WHERE subcategory IN ('Matcha Lattes', 'matcha lattes', 'Matcha', 'matchas', 'Matchas');

-- Verify the update
SELECT
    subcategory,
    COUNT(*) as product_count
FROM products
WHERE subcategory IS NOT NULL
GROUP BY subcategory
ORDER BY product_count DESC;
