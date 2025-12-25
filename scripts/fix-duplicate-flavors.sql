-- Fix duplicate flavor links in product_flavors table

-- First, let's see the duplicates
SELECT
  product_id,
  flavor_id,
  COUNT(*) as duplicate_count
FROM product_flavors
GROUP BY product_id, flavor_id
HAVING COUNT(*) > 1;

-- Remove duplicates by deleting and recreating unique entries
-- Step 1: Create a temporary table with unique entries
CREATE TEMP TABLE product_flavors_unique AS
SELECT DISTINCT product_id, flavor_id
FROM product_flavors;

-- Step 2: Delete all entries from product_flavors
DELETE FROM product_flavors;

-- Step 3: Re-insert unique entries
INSERT INTO product_flavors (product_id, flavor_id)
SELECT product_id, flavor_id
FROM product_flavors_unique;

-- Step 4: Drop the temp table
DROP TABLE product_flavors_unique;

-- Verify the fix - each product should now have max 20 flavors
SELECT
  p.name as product_name,
  COUNT(pf.flavor_id) as flavor_count
FROM products p
LEFT JOIN product_flavors pf ON p.id = pf.product_id
WHERE p.is_active = true
GROUP BY p.id, p.name
ORDER BY p.name;
