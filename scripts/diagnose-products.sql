-- Diagnostic script to check products and flavors

-- Check if flavors exist
SELECT 'Flavors count:' as info, COUNT(*) as count FROM flavors;

-- Check if products exist
SELECT 'Products count:' as info, COUNT(*) as count FROM products WHERE is_active = true;

-- Check product_flavors links
SELECT 'Product-Flavor links:' as info, COUNT(*) as count FROM product_flavors;

-- Show all categories
SELECT 'Categories:' as info, id, name, slug FROM categories;

-- Show sample products with their info
SELECT 'Sample products:' as info, id, name, category_id, is_active, simple_flavors, max_flavors
FROM products
ORDER BY created_at DESC
LIMIT 5;

-- Check if any products have flavors linked
SELECT 'Products with flavors:' as info,
  p.name as product_name,
  COUNT(pf.flavor_id) as flavor_count
FROM products p
LEFT JOIN product_flavors pf ON p.id = pf.product_id
GROUP BY p.id, p.name
ORDER BY flavor_count DESC
LIMIT 10;
