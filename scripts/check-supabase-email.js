// Check Supabase email configuration for password reset
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testPasswordReset() {
  const testEmail = 'test@example.com';

  console.log('🧪 Testing Supabase Password Reset\n');
  console.log('Supabase URL:', supabaseUrl);
  console.log('Test Email:', testEmail);
  console.log('Redirect URL:', `${supabaseUrl.replace('/api/v1', '')}/reset-password\n`);

  console.log('🔄 Attempting to send password reset email...\n');

  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(testEmail, {
      redirectTo: `${supabaseUrl.replace('/api/v1', '')}/reset-password`,
    });

    if (error) {
      console.error('❌ Error:', error);
      console.error('\nError Details:');
      console.error('  Message:', error.message);
      console.error('  Status:', error.status);
      console.error('  Name:', error.name);

      console.log('\n🔧 Common fixes:');
      console.log('1. Check Email Templates in Supabase Dashboard:');
      console.log(`   ${supabaseUrl.replace('/api/v1', '').replace('https://', 'https://app.')}/project/_/auth/templates`);
      console.log('\n2. Check SMTP Settings in Supabase Dashboard:');
      console.log(`   ${supabaseUrl.replace('/api/v1', '').replace('https://', 'https://app.')}/project/_/settings/auth`);
      console.log('\n3. Whitelist redirect URL in Supabase Dashboard:');
      console.log(`   ${supabaseUrl.replace('/api/v1', '').replace('https://', 'https://app.')}/project/_/settings/auth/url-configuration`);
    } else {
      console.log('✅ Success! Email would be sent (but test email may not exist)');
      console.log('\n💡 If this worked but your form still shows error:');
      console.log('   - Check browser console for actual error message');
      console.log('   - Ensure your redirect URL is whitelisted');
      console.log('   - Verify email templates are configured');
    }
  } catch (err) {
    console.error('❌ Unexpected Error:', err);
  }
}

testPasswordReset();
