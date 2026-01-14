// Test if Resend SMTP is configured for password reset
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testPasswordReset() {
  // Use your real email for testing
  const testEmail = 'ikayjohn@gmail.com'; // Replace with your actual email

  console.log('🧪 Testing Password Reset with Resend SMTP\n');
  console.log('Test Email:', testEmail);
  console.log('Redirect URL:', `${supabaseUrl.replace('/api/v1', '')}/reset-password\n`);

  console.log('📧 This will test if Supabase is configured to use Resend SMTP\n');

  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(testEmail, {
      redirectTo: `${supabaseUrl.replace('/api/v1', '')}/reset-password`,
    });

    if (error) {
      console.error('❌ Error sending password reset:');
      console.error('   ', error.message);
      console.error('\n🔧 Troubleshooting:');
      console.error('\n1. Check Supabase SMTP Settings:');
      console.error('   ' + supabaseUrl.replace('/api/v1', '').replace('https://', 'https://app.') + '/settings/auth');
      console.error('\n2. Configure these SMTP settings:');
      console.error('   Host: smtp.resend.com');
      console.error('   Port: 587');
      console.error('   User: resend');
      console.error('   Password: <your-resend-api-key>');
      console.error('   Sender: noreply@yourdomain.com');
      console.error('\n3. Verify your domain in Resend:');
      console.error('   https://resend.com/domains\n');
      console.error('4. Check email templates:');
      console.error('   ' + supabaseUrl.replace('/api/v1', '').replace('https://', 'https://app.') + '/auth/templates');
    } else {
      console.log('✅ Password reset email sent successfully!');
      console.log('\n📬 Check your inbox (and spam folder) for the reset link.');
      console.log('\n💡 If you received the email, your Resend SMTP is working correctly!');
      console.log('   If you didn\'t receive it:');
      console.log('   1. Check Resend logs: https://resend.com/logs');
      console.log('   2. Verify sender email in Supabase matches verified domain in Resend');
      console.log('   3. Ensure email template is enabled in Supabase');
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  }
}

// Prompt user to confirm
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('This script will send a test password reset email.');
console.log('Make sure you have configured Resend SMTP in Supabase first.\n');

rl.question('Continue? (yes/no): ', (answer) => {
  rl.close();
  if (answer.toLowerCase() === 'yes') {
    testPasswordReset();
  } else {
    console.log('\n❌ Cancelled. Please configure Resend SMTP first:');
    console.log('https://supabase.com/dashboard/project/cxbqochxrhokdscgijxe/settings/auth\n');
    console.log('SMTP Settings:');
    console.log('  Host: smtp.resend.com');
    console.log('  Port: 587');
    console.log('  User: resend');
    console.log('  Password: <your-resend-api-key>');
    console.log('  Sender: noreply@yourdomain.com');
  }
});
