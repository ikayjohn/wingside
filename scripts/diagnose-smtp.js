// Detailed SMTP diagnostics for Supabase
require('dotenv').config({ path: '.env.local' });

// Check environment variables
console.log('🔍 Environment Check\n');
console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing');
console.log('SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
console.log('');

// Verify configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const projectId = supabaseUrl?.match(/https:\/\/(.+?)\.supabase\.co/)?.[1];

if (!projectId) {
  console.error('❌ Could not extract project ID from Supabase URL');
  process.exit(1);
}

console.log('📋 Project Information\n');
console.log('Project ID:', projectId);
console.log('Project URL:', supabaseUrl);
console.log('');

console.log('🔧 Required Configuration Steps\n');
console.log('Please complete these steps in order:\n');

console.log('1️⃣  CONFIGURE RESEND (if not already done):');
console.log('   a) Go to: https://resend.com/api-keys');
console.log('   b) Copy your API key\n');

console.log('2️⃣  VERIFY YOUR DOMAIN IN RESEND:');
console.log('   a) Go to: https://resend.com/domains');
console.log('   b) Add/verify: wingside.ng');
console.log('   c) Or use @resend.com for testing\n');

console.log('3️⃣  CONFIGURE SMTP IN SUPABASE:');
console.log('   a) Go to: https://app.' + projectId + '/settings/auth');
console.log('   b) Scroll to "SMTP Settings"');
console.log('   c) Toggle "Enable Custom SMTP" to ON');
console.log('   d) Enter:');
console.log('      - Sender email: noreply@wingside.ng');
console.log('      - Sender name: Wingside');
console.log('      - SMTP Host: smtp.resend.com');
console.log('      - SMTP Port: 587');
console.log('      - SMTP User: resend');
console.log('      - SMTP Password: <your-resend-api-key>');
console.log('   e) Click "Save"\n');

console.log('4️⃣  CHECK EMAIL TEMPLATES:');
console.log('   a) Go to: https://app.' + projectId + '/auth/templates');
console.log('   b) Find "Reset Password" template');
console.log('   c) Ensure toggle is ON (enabled)\n');

console.log('5️⃣  VERIFY REDIRECT URLS:');
console.log('   a) Go to: https://app.' + projectId + '/auth/url-configuration');
console.log('   b) Under "Redirect URLs", add:');
console.log('      - https://wingside.ng/reset-password');
console.log('      - http://localhost:3000/reset-password (for testing)');
console.log('   c) Click "Save"\n');

console.log('🧪 TEST AGAIN\n');
console.log('After completing all steps above, test again:');
console.log('   node scripts/test-resend-smtp.js\n');

console.log('❓ STILL NOT WORKING?\n');
console.log('Common issues:');
console.log('1. Sender email not verified in Resend');
console.log('   → Use noreply@<your-domain>.resend.com for quick testing\n');
console.log('2. SMTP settings not saved');
console.log('   → Try clicking "Save" again in Supabase\n');
console.log('3. Wrong SMTP host/port');
console.log('   → Must be: smtp.resend.com : 587\n');
console.log('4. Email template disabled');
console.log('   → Enable the "Reset Password" template\n');
console.log('5. API key invalid/expired');
console.log('   → Generate a new API key in Resend\n');

console.log('📚 Additional Resources:');
console.log('   Resend Docs: https://resend.com/docs/send-with-smtp');
console.log('   Supabase Auth: https://supabase.com/docs/guides/auth/auth-smtp\n');
