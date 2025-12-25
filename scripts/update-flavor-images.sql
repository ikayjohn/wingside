-- Update flavor image URLs to match homepage
-- This script updates all flavor images with the paths used on the homepage

-- HOT Category
UPDATE flavors SET image_url = '/flavor-wingferno.png' WHERE name = 'Wingferno';
UPDATE flavors SET image_url = '/flavor-dragon.png' WHERE name = 'Dragon Breath';
UPDATE flavors SET image_url = '/flavor-brave.png' WHERE name = 'Braveheart';
UPDATE flavors SET image_url = '/flavor-mango.png' WHERE name = 'Mango Heat';

-- BBQ Category
UPDATE flavors SET image_url = '/flavor-bbqrush.png' WHERE name = 'BBQ Rush';
UPDATE flavors SET image_url = '/flavor-bbqfire.png' WHERE name = 'BBQ Fire';

-- DRY RUB Category
UPDATE flavors SET image_url = '/flavor-lemon.png' WHERE name = 'Lemon Pepper';
UPDATE flavors SET image_url = '/flavor-cameroon.png' WHERE name = 'Cameroon Pepper';
UPDATE flavors SET image_url = '/flavor-caribbean.png' WHERE name = 'Caribbean Jerk';
UPDATE flavors SET image_url = '/flavor-yaji.png' WHERE name = 'Yaji';

-- BOLD & FUN Category
UPDATE flavors SET image_url = '/flavor-italian.png' WHERE name = 'The Italian';
UPDATE flavors SET image_url = '/flavor-wingnorth.png' WHERE name = 'Wing of the North';
UPDATE flavors SET image_url = '/flavor-tokyo.png' WHERE name = 'Tokyo';
UPDATE flavors SET image_url = '/flavor-hotnuts.png' WHERE name = 'Hot Nuts';
UPDATE flavors SET image_url = '/flavor-slayer.png' WHERE name = 'The Slayer';

-- SWEET Category
UPDATE flavors SET image_url = '/flavor-sweetdreams.png' WHERE name = 'Sweet Dreams';
UPDATE flavors SET image_url = '/flavor-yellowgold.png' WHERE name = 'Yellow Gold';

-- BOOZY Category
UPDATE flavors SET image_url = '/flavor-whiskeyvibes.png' WHERE name = 'Whiskey Vibes';
UPDATE flavors SET image_url = '/flavor-tequila.png' WHERE name = 'Tequila Wingrise';
UPDATE flavors SET image_url = '/flavor-gustavo.png' WHERE name = 'Gustavo';

-- Verify updates
SELECT name, category, image_url FROM flavors ORDER BY category, display_order;
