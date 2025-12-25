-- Link existing wing products to all flavors
-- This script connects products that use flavors to the flavors table

-- First, let's see which products need flavors
-- Products with simple_flavors are things like coffee, drinks, etc.
-- Products without simple_flavors should use the flavors table (like wings)

-- Get all wing products and link them to all active flavors
INSERT INTO product_flavors (product_id, flavor_id)
SELECT DISTINCT
  p.id as product_id,
  f.id as flavor_id
FROM products p
CROSS JOIN flavors f
WHERE p.category_id IN (
  -- Assuming wings category has a specific ID or we check by name
  SELECT id FROM categories WHERE name = 'Wings'
)
AND p.is_active = true
AND f.is_active = true
AND p.simple_flavors IS NULL
-- Only insert if the combination doesn't exist
AND NOT EXISTS (
  SELECT 1 FROM product_flavors pf
  WHERE pf.product_id = p.id
  AND pf.flavor_id = f.id
);

-- Also need to set max_flavors on products if not set
UPDATE products
SET max_flavors = CASE
  WHEN name LIKE '%20%' THEN 20
  WHEN name LIKE '%15%' THEN 15
  WHEN name LIKE '%10%' THEN 10
  WHEN name LIKE '%6%' THEN 6
  ELSE 1
END
WHERE max_flavors IS NULL
AND category_id IN (SELECT id FROM categories WHERE name = 'Wings');

-- Check the results
SELECT
  p.name as product_name,
  p.max_flavors,
  COUNT(pf.flavor_id) as flavor_count
FROM products p
LEFT JOIN product_flavors pf ON p.id = pf.product_id
WHERE p.category_id IN (SELECT id FROM categories WHERE name = 'Wings')
GROUP BY p.id, p.name, p.max_flavors
ORDER BY p.name;
