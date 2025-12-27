/**
 * Quick script to check and fix hero slides setup
 * Run with: node scripts/check-hero-slides.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndFix() {
  console.log('🔍 Checking hero slides setup...\n');

  try {
    // Check if table exists and has data
    const { data: slides, error } = await supabase
      .from('hero_slides')
      .select('*');

    if (error) {
      console.error('❌ Error accessing hero_slides table:', error.message);
      console.error('\n📋 The migration hasn\'t been applied yet.');
      console.error('\n✅ Solution: Run these SQL files in Supabase Dashboard → SQL Editor:');
      console.error('   1. supabase/migrations/20250126_create_hero_images_bucket.sql');
      console.error('   2. supabase/migrations/20250126_create_hero_slides.sql');
      process.exit(1);
    }

    console.log(`✅ hero_slides table exists`);
    console.log(`📊 Found ${slides.length} slide(s)\n`);

    if (slides.length === 0) {
      console.log('⚠️  No slides found. Creating default slide...\n');

      const { data: newSlide, error: insertError } = await supabase
        .from('hero_slides')
        .insert({
          title: 'Wingside Hero - Default',
          headline: 'Where [yellow]Flavor[/yellow] takes [white]Flight[/white]',
          description: 'Your wings, Your way. 20 bold flavors, endless cravings. Ready to take off?',
          image_url: '/thinkbox.png',
          is_active: true,
          display_order: 0,
        })
        .select()
        .single();

      if (insertError) {
        console.error('❌ Error creating default slide:', insertError.message);
        process.exit(1);
      }

      console.log('✅ Default slide created successfully!');
      console.log('\n📝 Slide Details:');
      console.log('   Headline: Where Flavor takes Flight');
      console.log('   Description: Your wings, Your way...');
      console.log('   Image: /thinkbox.png (placeholder)\n');
      console.log('💡 Tip: Go to /admin/hero-slides to upload a proper hero image!');
    } else {
      console.log('✅ Slides already exist. Current slides:');
      slides.forEach((slide, index) => {
        console.log(`   ${index + 1}. ${slide.title}`);
        console.log(`      Status: ${slide.is_active ? 'Active' : 'Inactive'}`);
        console.log(`      Order: ${slide.display_order}\n`);
      });
    }

    // Check storage bucket
    console.log('📦 Checking storage bucket...');
    const { data: buckets } = await supabase.storage.listBuckets();
    const heroBucket = buckets?.find(b => b.id === 'hero-images');

    if (!heroBucket) {
      console.log('⚠️  hero-images bucket not found');
      console.log('💡 Run: supabase/migrations/20250126_create_hero_images_bucket.sql');
    } else {
      console.log('✅ hero-images bucket exists');
    }

    console.log('\n✨ Setup check complete!');
    console.log('🌐 Visit /admin/hero-slides to manage your slides');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

checkAndFix();
