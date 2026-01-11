-- Insert sample blog posts
-- Run this in your Supabase SQL Editor

INSERT INTO blog_posts (
  title,
  slug,
  excerpt,
  content,
  featured_image_url,
  author_name,
  category,
  tags,
  is_published,
  is_featured,
  published_at,
  view_count,
  meta_title,
  meta_description
) VALUES
(
  'Introducing Our New Spicy Garlic Parmesan Wings',
  'new-spicy-garlic-parmesan-wings',
  'Get ready to experience our most flavorful creation yet! The new Spicy Garlic Parmesan wings are here to ignite your taste buds.',
  '<h2>A Match Made in Flavor Heaven</h2><p>We''re thrilled to introduce our latest creation: <strong>Spicy Garlic Parmesan Wings</strong>. After months of perfecting the recipe, we''ve found the perfect balance between heat, garlic, and savory Parmesan cheese.</p><h3>What Makes Them Special?</h3><p>Our wings start with fresh, never-frozen chicken wings that are marinated for 24 hours in our signature garlic-infused sauce. Then they''re coated in a blend of crispy Parmesan and just the right amount of spicy seasoning.</p><h3>The Perfect Heat Level</h3><p>At a <strong>3 out of 5</strong> on our spice scale, these wings deliver a pleasant warmth that builds without overwhelming your palate.</p><p>Stop by any Wingside location today and try our new Spicy Garlic Parmesan wings. Trust us, your taste buds will thank you!</p>',
  '/blog-spicy-wings.jpg',
  'Chef Marcus',
  'Wingside Stories',
  ARRAY['new', 'spicy', 'garlic', 'featured', 'wings'],
  true,
  true,
  '2025-01-10 10:00:00+00',
  0,
  'New Spicy Garlic Parmesan Wings | Wingside',
  'Introducing our new Spicy Garlic Parmesan wings - the perfect balance of heat, garlic, and savory Parmesan cheese. Try them today!'
),
(
  'WingClub: How to Maximize Your Rewards Points',
  'how-to-maximize-wingclub-rewards',
  'Learn the insider tips and tricks to get the most out of your WingClub membership. From earning to redeeming, we''ve got you covered.',
  '<h2>Welcome to WingClub!</h2><p>As a WingClub member, you''re already earning points on every order. But did you know there are ways to maximize your rewards? Let''s dive in!</p><h3>1. Order During Happy Hour</h3><p>Orders placed during happy hour (3 PM - 6 PM, Monday through Thursday) earn you <strong>1.5x points</strong>.</p><h3>2. Try Our Monthly Specials</h3><p>Each month, we feature special flavors that earn <strong>double points</strong>.</p><h3>3. Refer Friends and Family</h3><p>For every friend who joins WingClub and makes their first purchase, you both earn <strong>500 bonus points</strong>.</p><p>Start maximizing your WingClub benefits today!</p>',
  '/blog-wingclub-rewards.jpg',
  'Wingside Team',
  'Community',
  ARRAY['wingclub', 'rewards', 'tips', 'savings'],
  true,
  false,
  '2025-01-08 10:00:00+00',
  0,
  'How to Maximize WingClub Rewards Points | Wingside',
  'Learn insider tips to maximize your WingClub rewards points. From happy hour bonuses to referral rewards, get the most value.'
),
(
  'Behind the Sauce: Creating Our Signature BBQ Recipe',
  'behind-the-sauce-signature-bbq-recipe',
  'Take a peek behind the curtain as we reveal the secrets behind our most popular wing sauce. Spoiler: It took 47 attempts to get it right!',
  '<h2>The Journey to Perfection</h2><p>Our Signature BBQ sauce is the heart and soul of Wingside. What started as a small experiment has become our most beloved flavor. But it wasn''t easy – it took <strong>47 different iterations</strong> to get it just right.</p><h3>The Secret Ingredient Balance</h3><p>Great BBQ sauce is all about balance. Here''s what makes ours special:</p><ul><li><strong>Tomato base:</strong> San Marzano tomatoes</li><li><strong>Molasses:</strong> For that rich, deep flavor</li><li><strong>Brown sugar:</strong> For caramelized coating</li><li><strong>Smoked paprika:</strong> Our secret to authentic BBQ taste</li></ul><p>Next time you''re at Wingside, ask for "extra Signature BBQ" on the side!</p>',
  '/blog-bbq-sauce.jpg',
  'Chef Marcus',
  'Behind the Scenes',
  ARRAY['bbq', 'sauce', 'recipe', 'behind-the-scenes'],
  true,
  true,
  '2025-01-05 10:00:00+00',
  0,
  'Behind the Sauce: Our Signature BBQ Recipe | Wingside',
  'Discover the secrets behind our most popular BBQ sauce. 47 iterations, 12 hours of smoking, and one amazing flavor.'
),
(
  'Wingside x Local Artists: Celebrating Nigerian Creativity',
  'wingside-local-artists-nigerian-creativity',
  'We''re proud to partner with amazing local artists to bring creativity to our spaces. Learn about our collaboration program and featured artists.',
  '<h2>Art Meets Flavor</h2><p>At Wingside, we believe food is art – and so is creativity in all its forms. That''s why we launched our <strong>Local Artists Collaboration Program</strong>.</p><h3>Featured Artists</h3><p>Let''s shine a spotlight on some of the amazing artists we''ve had the honor to work with:</p><h4>Tunde Adebayo - Visual Artist</h4><p>Tunde''s vibrant oil paintings capturing Lagos street life have been featured in our Ikeja location.</p><h4>Ngozi Okafor - Mixed Media</h4><p>Ngozi''s stunning mixed-media pieces incorporating traditional Ankara fabrics have been a conversation starter at our Lekki branch.</p><h3>Call for Artists</h3><p>Are you an artist interested in collaborating? Email us at art@wingside.ng with your portfolio.</p>',
  '/blog-local-artists.jpg',
  'Wingside Team',
  'Events',
  ARRAY['art', 'community', 'local', 'collaboration', 'nigeria'],
  true,
  false,
  '2025-01-03 10:00:00+00',
  0,
  'Wingside x Local Artists | Celebrating Nigerian Creativity',
  'Learn about our collaboration program with Nigerian artists. Featuring Tunde Adebayo, Ngozi Okafor, Chinedu Eze and more.'
),
(
  'The Ultimate Guide to Wing Flavors: Find Your Perfect Match',
  'ultimate-guide-to-wing-flavors',
  'From mild to wild, explore our complete guide to Wingside wing flavors. Discover your perfect match based on your spice tolerance.',
  '<h2>Find Your Perfect Wing</h2><p>With 20+ flavors across 6 categories, there''s a perfect wing for everyone at Wingside. Let us guide you!</p><h2>Understanding Our Spice Levels</h2><p>Our spice scale ranges from <strong>0 (No Heat)</strong> to <strong>4 (Extreme)</strong>.</p><h3>🔥 HOT CATEGORY</h3><p>For the heat seekers: Caribbean Fire (Level 3), Brave (Level 4), Lemon Pepper (Level 1)</p><h3>🍖 BBQ CATEGORY</h3><p>Signature BBQ (Level 0) - our classic customer favorite!</p><h3>🌿 DRY RUB CATEGORY</h3><p>Garlic Parmesan, Lemon Herb, Original Dry - all delicious!</p><h2>Pro Tips</h2><p>Order a <strong>flight</strong> to try 4 different flavors at once. Mix and match with half orders.</p><p><strong>Ready to find your wing soulmate? Order now!</strong></p>',
  '/blog-wing-flavors-guide.jpg',
  'Wingside Team',
  'Recipes',
  ARRAY['flavors', 'guide', 'spice', 'selection', 'tips'],
  true,
  true,
  '2025-01-01 10:00:00+00',
  0,
  'Ultimate Guide to Wing Flavors | Find Your Perfect Match',
  'Complete guide to all 20+ Wingside wing flavors. From mild to extreme heat, find your perfect wing based on spice tolerance and taste preferences.'
);

-- Verify insertion
SELECT COUNT(*) as total_posts FROM blog_posts;
