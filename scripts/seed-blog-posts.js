const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const blogPosts = [
  {
    title: 'Introducing Our New Spicy Garlic Parmesan Wings',
    slug: 'new-spicy-garlic-parmesan-wings',
    excerpt: 'Get ready to experience our most flavorful creation yet! The new Spicy Garlic Parmesan wings are here to ignite your taste buds.',
    content: `
      <h2>A Match Made in Flavor Heaven</h2>
      <p>We're thrilled to introduce our latest creation: <strong>Spicy Garlic Parmesan Wings</strong>. After months of perfecting the recipe, we've found the perfect balance between heat, garlic, and savory Parmesan cheese.</p>

      <h3>What Makes Them Special?</h3>
      <p>Our wings start with fresh, never-frozen chicken wings that are marinated for 24 hours in our signature garlic-infused sauce. Then they're coated in a blend of crispy Parmesan and just the right amount of spicy seasoning.</p>

      <h3>The Perfect Heat Level</h3>
      <p>At a <strong>3 out of 5</strong> on our spice scale, these wings deliver a pleasant warmth that builds without overwhelming your palate. It's the kind of heat that keeps you coming back for more.</p>

      <h3>How to Enjoy Them</h3>
      <ul>
        <li>As a quick snack during game day</li>
        <li>With our seasoned fries for a complete meal</li>
        <li>Pair with your favorite cold beverage</li>
        <li>Add extra ranch or blue cheese for dipping</li>
      </ul>

      <p>Stop by any Wingside location today and try our new Spicy Garlic Parmesan wings. Trust us, your taste buds will thank you!</p>

      <p><strong>Available now at all Wingside locations!</strong></p>
    `,
    featured_image_url: '/blog-spicy-wings.jpg',
    author_name: 'Chef Marcus',
    category: 'Wingside Stories',
    tags: ['new', 'spicy', 'garlic', 'featured', 'wings'],
    is_published: true,
    is_featured: true,
    published_at: new Date('2025-01-10').toISOString(),
    meta_title: 'New Spicy Garlic Parmesan Wings | Wingside',
    meta_description: 'Introducing our new Spicy Garlic Parmesan wings - the perfect balance of heat, garlic, and savory Parmesan cheese. Try them today!'
  },
  {
    title: 'WingClub: How to Maximize Your Rewards Points',
    slug: 'how-to-maximize-wingclub-rewards',
    excerpt: 'Learn the insider tips and tricks to get the most out of your WingClub membership. From earning to redeeming, we\'ve got you covered.',
    content: `
      <h2>Welcome to WingClub!</h2>
      <p>As a WingClub member, you're already earning points on every order. But did you know there are ways to maximize your rewards and get even more value? Let's dive in!</p>

      <h3>1. Order During Happy Hour</h3>
      <p>Did you know that orders placed during happy hour (3 PM - 6 PM, Monday through Thursday) earn you <strong>1.5x points</strong>? It's the perfect time to grab those afternoon cravings!</p>

      <h3>2. Try Our Monthly Specials</h3>
      <p>Each month, we feature special flavors that earn <strong>double points</strong>. Keep an eye on our app and social media to stay updated on these limited-time offerings.</p>

      <h3>3. Refer Friends and Family</h3>
      <p>Our referral program is incredibly generous. For every friend who joins WingClub and makes their first purchase, you both earn <strong>500 bonus points</strong>. That's enough for a free order of wings!</p>

      <h3>4. Redeem Smartly</h3>
      <p>Your points can be redeemed for more than just free wings. Use them for:
      <ul>
        <li>Free sides and drinks</li>
        <li>Delivery fee waivers</li>
        <li>Exclusive merchandise</li>
        <li>Partner brand rewards (streaming, shopping, gaming, and more!)</li>
      </ul></p>

      <h3>5. Participate in Challenges</h3>
      <p>Join our monthly challenges where you can earn bonus points for trying new flavors, sharing photos on social media, or visiting during special events.</p>

      <h3>Track Your Progress</h3>
      <p>Don't forget to check your WingClub dashboard regularly. You'll see your tier status, available rewards, and personalized offers based on your preferences.</p>

      <p>Start maximizing your WingClub benefits today! Every order brings you closer to amazing rewards.</p>
    `,
    featured_image_url: '/blog-wingclub-rewards.jpg',
    author_name: 'Wingside Team',
    category: 'Community',
    tags: ['wingclub', 'rewards', 'tips', 'savings'],
    is_published: true,
    is_featured: false,
    published_at: new Date('2025-01-08').toISOString(),
    meta_title: 'How to Maximize WingClub Rewards Points | Wingside',
    meta_description: 'Learn insider tips to maximize your WingClub rewards points. From happy hour bonuses to referral rewards, get the most value.'
  },
  {
    title: 'Behind the Sauce: Creating Our Signature BBQ Recipe',
    slug: 'behind-the-sauce-signature-bbq-recipe',
    excerpt: 'Take a peek behind the curtain as we reveal the secrets behind our most popular wing sauce. Spoiler: It took 47 attempts to get it right!',
    content: `
      <h2>The Journey to Perfection</h2>
      <p>Our Signature BBQ sauce is the heart and soul of Wingside. What started as a small experiment in our test kitchen has become our most beloved flavor. But it wasn't easy – it took <strong>47 different iterations</strong> to get it just right.</p>

      <h3>The Secret Ingredient Balance</h3>
      <p>Great BBQ sauce is all about balance. Here's what makes ours special:</p>
      <ul>
        <li><strong>Tomato base:</strong> San Marzano tomatoes for natural sweetness</li>
        <li><strong>Molasses:</strong> For that rich, deep color and flavor</li>
        <li><strong>Brown sugar:</strong> Just enough to create that caramelized coating</li>
        <li><strong>Smoked paprika:</strong> Our secret to the authentic BBQ taste</li>
        <li><strong>A touch of vinegar:</strong> To cut through the richness</li>
        <li><strong>Hickory smoke infusion:</strong> 12 hours of cold smoking</li>
      </ul>

      <h3>The Process</h3>
      <p>Every batch of our Signature BBQ sauce is made fresh in each location. Here's our process:</p>
      <ol>
        <li>We start by simmering the tomatoes for 4 hours</li>
        <li>Add the molasses and brown sugar mixture</li>
        <li>Introduce our spice blend (a secret recipe, of course!)</li>
        <li>Let it slow-cook for another 6 hours</li>
        <li>Cold smoke with hickory for 12 hours</li>
        <li>Taste test (every single batch!)</li>
        <li>Bottle and use within 3 days for maximum freshness</li>
      </ol>

      <h3>Fun Facts</h3>
      <ul>
        <li>We use over 100 lbs of tomatoes per week across all locations</li>
        <li>The sauce is aged for 48 hours before use</li>
        <li>It's our #1 selling flavor year-round</li>
        <li>Customers have asked to buy bottles of it (maybe we should sell it!)</li>
      </ul>

      <h3>Try It Today</h3>
      <p>Next time you're at Wingside, ask for "extra Signature BBQ" on the side. You won't be the first – or the last – person to dip everything on their plate in it!</p>

      <p><em>Have you tried our Signature BBQ wings? Let us know what you think on social media using #WingsideBBQ!</em></p>
    `,
    featured_image_url: '/blog-bbq-sauce.jpg',
    author_name: 'Chef Marcus',
    category: 'Behind the Scenes',
    tags: ['bbq', 'sauce', 'recipe', 'behind-the-scenes'],
    is_published: true,
    is_featured: true,
    published_at: new Date('2025-01-05').toISOString(),
    meta_title: 'Behind the Sauce: Our Signature BBQ Recipe | Wingside',
    meta_description: 'Discover the secrets behind our most popular BBQ sauce. 47 iterations, 12 hours of smoking, and one amazing flavor.'
  },
  {
    title: 'Wingside x Local Artists: Celebrating Nigerian Creativity',
    slug: 'wingside-local-artists-nigerian-creativity',
    excerpt: 'We\'re proud to partner with amazing local artists to bring creativity to our spaces. Learn about our collaboration program and featured artists.',
    content: `
      <h2>Art Meets Flavor</h2>
      <p>At Wingside, we believe food is art – and so is creativity in all its forms. That's why we launched our <strong>Local Artists Collaboration Program</strong> earlier this year, showcasing incredible Nigerian talent in our restaurants.</p>

      <h3>Our Mission</h2>
      <p>We wanted to do more than just serve great food. We wanted to create spaces that celebrate Nigerian culture, creativity, and community. By partnering with local artists, we're able to:</p>
      <ul>
        <li>Transform our walls into rotating art galleries</li>
        <li>Support emerging artists by providing exposure and income</li>
        <li>Create unique dining experiences for our customers</li>
        <li>Give back to the creative community</li>
      </ul>

      <h3>Featured Artists</h3>
      <p>Let's shine a spotlight on some of the amazing artists we've had the honor to work with:</p>

      <h4>Tunde Adebayo - Visual Artist</h4>
      <p>Tunde's vibrant oil paintings capturing Lagos street life have been featured in our Ikeja location. His use of color and movement brings incredible energy to our dining space.</p>

      <h4>Ngozi Okafor - Mixed Media</h4>
      <p>Ngozi's stunning mixed-media pieces incorporating traditional Ankara fabrics and modern materials have been a conversation starter at our Lekki branch. Her work explores themes of identity and tradition.</p>

      <h4>Chinedu Eze - Digital Artist</h4>
      <p>Known for his Afrofuturism digital art, Chinedu's pieces have graced our Victoria Island location. His work imagines a future where technology and tradition merge in beautiful ways.</p>

      <h3>How It Works</h3>
      <p>Each quarter, we select 2-3 artists to showcase their work in our restaurants. The program includes:</p>
      <ul>
        <li><strong>Full wall display</strong> – Dedicated space for their artwork</li>
        <li><strong>Artist bio cards</strong> – Customers can learn about each artist</li>
        <li><strong>Social media features</strong> – We showcase their work on our platforms</li>
        <li><strong>Art commission</strong> – We pay artists for their displayed pieces</li>
        <li><strong>Sales opportunity</strong> – Customers can purchase pieces directly</li>
      </ul>

      <h3>Upcoming Events</h3>
      <p>Join us for our quarterly <strong>"Art & Wings"</strong> nights where you can meet featured artists, enjoy live painting demonstrations, and of course, amazing wings. Our next event is February 15th!</p>

      <h3>Call for Artists</h3>
      <p>Are you an artist interested in collaborating? We're always looking for new talent! Email us at art@wingside.ng with your portfolio and a brief introduction.</p>

      <p><strong>Support local art. Support local creativity. Support Wingside.</strong></p>
    `,
    featured_image_url: '/blog-local-artists.jpg',
    author_name: 'Wingside Team',
    category: 'Events',
    tags: ['art', 'community', 'local', 'collaboration', 'nigeria'],
    is_published: true,
    is_featured: false,
    published_at: new Date('2025-01-03').toISOString(),
    meta_title: 'Wingside x Local Artists | Celebrating Nigerian Creativity',
    meta_description: 'Learn about our collaboration program with Nigerian artists. Featuring Tunde Adebayo, Ngozi Okafor, Chinedu Eze and more.'
  },
  {
    title: 'The Ultimate Guide to Wing Flavors: Find Your Perfect Match',
    slug: 'ultimate-guide-to-wing-flavors',
    excerpt: 'From mild to wild, explore our complete guide to Wingside wing flavors. Discover your perfect match based on your spice tolerance and taste preferences.',
    content: `
      <h2>Find Your Perfect Wing</h2>
      <p>With 20+ flavors across 6 categories, there's a perfect wing for everyone at Wingside. But with so many choices, how do you find your ideal match? Let us guide you!</p>

      <h2>Understanding Our Spice Levels</h2>
      <p>First things first – let's talk heat. Our spice scale ranges from <strong>0 (No Heat)</strong> to <strong>4 (Extreme)</strong>. Here's what each level means:</p>
      <ul>
        <li><strong>0 - Mild:</strong> No heat, just flavor</li>
        <li><strong>1 - Mild:</strong> A gentle warmth</li>
        <li><strong>2 - Medium:</strong> Noticeable but manageable heat</li>
        <li><strong>3 - Hot:</strong> For those who like it spicy</li>
        <li><strong>4 - Extreme:</strong> Only for the brave!</li>
      </ul>

      <h2>Explore Our Categories</h2>

      <h3>🔥 HOT CATEGORY</h3>
      <p>For the heat seekers:</p>
      <ul>
        <li><strong>Caribbean Fire – Level 3:</strong> Tropical heat with scotch bonnet peppers</li>
        <li><strong>Brave – Level 4:</strong> Our hottest! Ghost pepper挑战</li>
        <li><strong>Lemon Pepper – Level 1:</strong> Zesty with a subtle kick</li>
      </ul>

      <h3>🍖 BBQ CATEGORY</h3>
      <p>Smoky, sweet, and savory:</p>
      <ul>
        <li><strong>Signature BBQ – Level 0:</strong> Our classic, customer favorite</li>
        <li><strong>BBQ Rush – Level 1:</strong> Sweet and smoky with a hint of heat</li>
        <li><strong>Smoky Honey – Level 0:</strong> Honey-glazed with hickory smoke</li>
      </ul>

      <h3>🌿 DRY RUB CATEGORY</h3>
      <p>No sauce, just perfect seasoning:</p>
      <ul>
        <li><strong>Lemon Herb – Level 0:</strong> Fresh citrus with garden herbs</li>
        <li><strong>Garlic Parmesan – Level 0:</strong> Savory and addictive</li>
        <li><strong>Original Dry – Level 0:</strong> Simple, classic, delicious</li>
      </ul>

      <h3>🎨 BOLD & FUN CATEGORY</h3>
      <p>Unique flavor combinations:</p>
      <ul>
        <li><strong>Mango Habanero – Level 2:</strong> Sweet meets heat</li>
        <li><strong>Teriyaki – Level 0:</strong> Asian-inspired glaze</li>
        <li><strong>Honey Mustard – Level 0:</strong> Creamy and tangy</li>
      </ul>

      <h3>🍯 SWEET CATEGORY</h3>
      <p>For those with a sweet tooth:</p>
      <ul>
        <li><strong>Honey Glazed – Level 0:</strong> Pure honey perfection</li>
        <li><strong>Maple Bourbon – Level 0:</strong> Rich and indulgent</li>
      </ul>

      <h3>🍺 BOOZY CATEGORY</h3>
      <p>For the adults (21+):</p>
      <ul>
        <li><strong>Beer Batter – Level 0:</strong> Crispy, golden, delicious</li>
        <li><strong>Bourbon BBQ – Level 1:</strong> Bourbon-infused smoky goodness</li>
      </ul>

      <h2>Taking the Quiz</h2>
      <p>Not sure where to start? Answer these questions:</p>
      <ol>
        <li><strong>What's your spice tolerance?</strong><br>
           0-1 → Try Dry Rub, Sweet, or Boozy<br>
           2 → Go for Bold & Fun or mild BBQ<br>
           3 → HOT is your friend<br>
           4 → Brave is calling your name!</li>

        <li><strong>What flavor profile do you prefer?</strong><br>
           Sweet → Honey Glazed, Maple Bourbon<br>
           Savory → Garlic Parmesan, Lemon Herb<br>
           Smoky → Signature BBQ, Smoky Honey<br>
           Tangy → Lemon Pepper, Teriyaki</li>

        <li><strong>Feeling adventurous?</strong><br>
           Yes → Mango Habanero, Caribbean Fire<br>
           No → Stick to the classics you love</li>
      </ol>

      <h2>Pro Tips</h2>
      <ul>
        <li>Order a <strong>flight</strong> to try 4 different flavors at once</li>
        <li>Mix and match – get half one flavor, half another</li>
        <li>Ask for <strong>sauce on the side</strong> to control your spice level</li>
        <li>Try our seasonal flavors – they're only available for a limited time!</li>
      </ul>

      <h2>Still Can't Decide?</h2>
      <p>Our Signature BBQ is the perfect starting point. It's the flavor that made us famous, and there's a reason why it's our #1 seller. Once you've found your comfort zone, branch out and discover new favorites!</p>

      <p><strong>Ready to find your wing soulmate? Order now and let the flavor adventure begin!</strong></p>
    `,
    featured_image_url: '/blog-wing-flavors-guide.jpg',
    author_name: 'Wingside Team',
    category: 'Recipes',
    tags: ['flavors', 'guide', 'spice', 'selection', 'tips'],
    is_published: true,
    is_featured: true,
    published_at: new Date('2025-01-01').toISOString(),
    meta_title: 'Ultimate Guide to Wing Flavors | Find Your Perfect Match',
    meta_description: 'Complete guide to all 20+ Wingside wing flavors. From mild to extreme heat, find your perfect wing based on spice tolerance and taste preferences.'
  }
];

async function seedBlogPosts() {
  console.log('🌱 Starting blog posts seed...');

  try {
    for (const post of blogPosts) {
      const { data, error } = await supabase
        .from('blog_posts')
        .insert(post)
        .select();

      if (error) {
        console.error(`❌ Error inserting "${post.title}":`, error);
      } else {
        console.log(`✅ Inserted: "${post.title}"`);
      }
    }

    console.log('\n🎉 Blog posts seeded successfully!');
    console.log(`📊 Total posts inserted: ${blogPosts.length}`);

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

seedBlogPosts();
