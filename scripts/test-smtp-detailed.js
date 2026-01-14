// Detailed SMTP test with full error logging
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDetailed() {
  const testEmail = 'ikayjohn@gmail.com';

  console.log('🔍 Detailed SMTP Diagnostic\n');
  console.log('Configuration:');
  console.log('  Project:', supabaseUrl);
  console.log('  Test Email:', testEmail);
  console.log('  Sender: noreply@wingside.ng');
  console.log('');

  console.log('Attempting password reset...\n');

  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(testEmail, {
      redirectTo: `${supabaseUrl.replace('/api/v1', '')}/reset-password`,
    });

    if (error) {
      console.log('❌ ERROR DETAILS:');
      console.log('='.repeat(60));
      console.log('Error Name:', error.name || 'Unknown');
      console.log('Error Message:', error.message);
      console.log('Error Status:', error.status || 'N/A');
      console.log('Full Error Object:', JSON.stringify(error, null, 2));
      console.log('='.repeat(60));

      console.log('\n🔧 Most Likely Causes:\n');

      if (error.message.includes('Email') || error.message.includes('smtp')) {
        console.log('1. SMTP Connection Issue');
        console.log('   → Verify: smtp.resend.com (not smtp.gmail.com)');
        console.log('   → Verify: Port 587 (not 465 or 25)');
        console.log('   → Verify: API key is valid and not expired');
        console.log('   → Check: Resend API key has SMTP permissions\n');
      }

      if (error.message.includes('sender') || error.message.includes('from')) {
        console.log('2. Sender Email Issue');
        console.log('   → Verify: wingside.ng is verified in Resend');
        console.log('   → Try: noreply@cxbqochxrhokdscgijxe.resend.com for testing\n');
      }

      console.log('3. Check Supabase Logs');
      console.log('   → https://app.cxbqochxrhokdscgijxe/logs/auth');
      console.log('   → Look for SMTP connection errors\n');

      console.log('4. Check Resend Logs');
      console.log('   → https://resend.com/logs');
      console.log('   → See if email was attempted\n');

    } else {
      console.log('✅ SUCCESS! Email should be on its way.');
      console.log('\nCheck:');
      console.log('  1. Your inbox');
      console.log('  2. Spam folder');
      console.log('  3. Resend logs: https://resend.com/logs');
    }
  } catch (err) {
    console.log('❌ UNEXPECTED ERROR:');
    console.log('='.repeat(60));
    console.log(err);
    console.log('='.repeat(60));
  }
}

testDetailed();
