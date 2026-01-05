const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifySetup() {
  console.log('🔍 Verifying Notification System Setup...\n');

  const checks = [];

  // Check 1: Environment Variables
  console.log('📋 Checking Environment Variables...');
  const envVars = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓ Set' : '✗ Missing',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓ Set' : '✗ Missing',
    RESEND_API_KEY: process.env.RESEND_API_KEY ? '✓ Set' : '✗ Missing',
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ? '✓ Set' : '✗ Missing',
    VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY ? '✓ Set' : '✗ Missing',
  };
  console.log(envVars);
  checks.push(Object.values(envVars).every(v => v.includes('✓') || v.startsWith('http')));
  console.log('');

  // Check 2: Database Tables
  console.log('🗄️  Checking Database Tables...');
  const tables = ['notification_preferences', 'email_templates', 'notification_logs', 'push_subscriptions'];

  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(1);

    if (error) {
      console.log(`✗ ${table}: ERROR - ${error.message}`);
      checks.push(false);
    } else {
      console.log(`✓ ${table}: OK`);
      checks.push(true);
    }
  }
  console.log('');

  // Check 3: Email Templates
  console.log('📧 Checking Email Templates...');
  const { data: templates, error: templateError } = await supabase
    .from('email_templates')
    .select('template_key');

  if (templateError) {
    console.log(`✗ Error loading templates: ${templateError.message}`);
    checks.push(false);
  } else {
    console.log(`✓ Found ${templates.length} email templates:`);
    templates.forEach(t => console.log(`  - ${t.template_key}`));
    checks.push(templates.length >= 6); // Should have at least 6 templates
  }
  console.log('');

  // Check 4: API Endpoints
  console.log('🌐 Checking API Endpoints...');
  const endpoints = [
    'http://localhost:3000/api/notifications/push/vapid',
    'http://localhost:3000/api/notifications/preferences',
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint);
      if (response.ok) {
        console.log(`✓ ${endpoint}`);
        checks.push(true);
      } else {
        console.log(`✗ ${endpoint} - Status: ${response.status}`);
        checks.push(false);
      }
    } catch (error) {
      console.log(`✗ ${endpoint} - ERROR: ${error.message}`);
      checks.push(false);
    }
  }
  console.log('');

  // Summary
  console.log('━'.repeat(60));
  const passed = checks.filter(c => c).length;
  const total = checks.length;
  const percentage = Math.round((passed / total) * 100);

  console.log(`\n✅ Verification Complete: ${passed}/${total} checks passed (${percentage}%)\n`);

  if (passed === total) {
    console.log('🎉 All checks passed! Your notification system is ready to use!\n');
    console.log('Next steps:');
    console.log('1. Test email notifications:');
    console.log('   node scripts/test-email-notifications.js order confirmation');
    console.log('');
    console.log('2. Visit the notification preferences page:');
    console.log('   http://localhost:3000/my-account/notifications');
    console.log('');
    console.log('3. Visit the admin dashboard:');
    console.log('   http://localhost:3000/admin/notifications');
  } else {
    console.log('⚠️  Some checks failed. Please review the errors above.\n');
    console.log('Common fixes:');
    console.log('- Ensure .env.local has all required variables');
    console.log('- Restart the dev server: npm run dev');
    console.log('- Verify database migration was applied');
    console.log('- Check Supabase credentials are correct');
  }

  process.exit(passed === total ? 0 : 1);
}

verifySetup().catch(error => {
  console.error('Verification error:', error);
  process.exit(1);
});
