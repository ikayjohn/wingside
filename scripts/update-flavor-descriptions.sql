-- Update flavor descriptions to match homepage
-- This script updates all flavor descriptions with the creative copy from the homepage

-- HOT Category
UPDATE flavors SET description = 'Piping hot peppers. Something special for the insane…' WHERE name = 'Wingferno';
UPDATE flavors SET description = 'Hot peppers & more hot peppers. Draaaagon!!! Your mushroom clouds will come for all of us…' WHERE name = 'Dragon Breath';
UPDATE flavors SET description = 'Habaneros & hot chili. Feel the heat, feel the burn.' WHERE name = 'Braveheart';
UPDATE flavors SET description = 'Mango purée & hot peppers. All sweet, all heat…' WHERE name = 'Mango Heat';

-- BBQ Category
UPDATE flavors SET description = 'BBQ sauce & honey. Sweet ol BBQ' WHERE name = 'BBQ Rush';
UPDATE flavors SET description = 'BBQ sauce & hot peppers. A flavorful hot fire mix of sweet & spicy' WHERE name = 'BBQ Fire';

-- DRY RUB Category
UPDATE flavors SET description = 'Its all in the name. Tangy deliciousness' WHERE name = 'Lemon Pepper';
UPDATE flavors SET description = 'Cameroon pepper & herbs. Part dry, part spicy, whole lotta good' WHERE name = 'Cameroon Pepper';
UPDATE flavors SET description = 'Tropical spice mix. Mild peppers you love…' WHERE name = 'Caribbean Jerk';
UPDATE flavors SET description = 'Its in the name. Born and raised in Nigeria' WHERE name = 'Yaji';

-- BOLD & FUN Category
UPDATE flavors SET description = 'Garlic & cheese. The ideal choice for sophisticated palates' WHERE name = 'The Italian';
UPDATE flavors SET description = 'Spicy dates & dates. Dont ask, dont tell' WHERE name = 'Wing of the North';
UPDATE flavors SET description = 'Soy sauce & sweet chili. From Asia with love' WHERE name = 'Tokyo';
UPDATE flavors SET description = 'Peanuts & hot chili. Delicious amazingness' WHERE name = 'Hot Nuts';
UPDATE flavors SET description = 'Garlic & herbs. Keeps the vampires away…' WHERE name = 'The Slayer';

-- SWEET Category
UPDATE flavors SET description = 'Cola & garlic sauce. Sweet with heat on heat' WHERE name = 'Sweet Dreams';
UPDATE flavors SET description = 'Honey & mustard. Sweet & sassy with soothing buttery flavour' WHERE name = 'Yellow Gold';

-- BOOZY Category
UPDATE flavors SET description = 'Whiskey & hot sauce. Booze is intellectual' WHERE name = 'Whiskey Vibes';
UPDATE flavors SET description = 'Tequila & citrus. Now you can eat your tequila too' WHERE name = 'Tequila Wingrise';
UPDATE flavors SET description = 'Beer & barbecue sauce. Hot wings, cold dings' WHERE name = 'Gustavo';

-- Verify updates
SELECT name, category, description FROM flavors ORDER BY category, display_order;
