-- ============================================================================
-- DEBUGGING SUBCATEGORY ISSUE - Run this in Supabase SQL Editor
-- ============================================================================

-- 1. CHECK: What subcategories exist?
SELECT * FROM subcategories ORDER BY name;

-- 2. CHECK: What products exist in "Wing Cafe" category?
SELECT
    p.id,
    p.name,
    c.name as category,
    p.subcategory,
    p.is_active
FROM products p
JOIN categories c ON p.category_id = c.id
WHERE c.name = 'Wing Cafe'
ORDER BY p.subcategory;

-- 3. CHECK: Products with "matcha" (any case) in subcategory?
SELECT
    id,
    name,
    subcategory,
    is_active
FROM products
WHERE LOWER(subcategory) LIKE LOWER('%atcha%');

-- 4. CHECK: Current subcategory values count
SELECT
    subcategory,
    COUNT(*) as product_count
FROM products
WHERE category_id = (SELECT id FROM categories WHERE name = 'Wing Cafe')
  AND subcategory IS NOT NULL
GROUP BY subcategory
ORDER BY product_count DESC;

-- 5. CHECK: The actual subcategory table
SELECT
    sc.id,
    sc.name as subcategory_name,
    c.name as category_name,
    sc.is_active
FROM subcategories sc
JOIN categories c ON sc.category_id = c.id
WHERE c.name = 'Wing Cafe'
ORDER BY sc.display_order;

-- ============================================================================
-- FIX: Update products with old subcategory name variations
-- ============================================================================

-- Update ALL variations of the old subcategory name
UPDATE products
SET subcategory = 'matchas'
WHERE subcategory IN (
    'Matcha Lattes',    -- Original name from migration
    'matcha lattes',     -- Lowercase version
    'Matcha',            -- Without "Lattes"
    'matchas',            -- Already correct
    'Matchas'            -- Capitalized
);

-- Verify the fix
SELECT
    subcategory,
    COUNT(*) as product_count
FROM products
WHERE category_id = (SELECT id FROM categories WHERE name = 'Wing Cafe')
  AND subcategory IS NOT NULL
GROUP BY subcategory
ORDER BY product_count DESC;
