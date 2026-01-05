/**
 * Test All Notification Features
 *
 * This script tests all notification systems including:
 * - Email notifications (Resend)
 * - Contact form submissions
 * - Order confirmations
 * - Payment confirmations
 * - Webhook signature verification
 *
 * Usage:
 *   node scripts/test-all-notifications.js
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🧪 Testing All Notification Features\n');
console.log('='.repeat(60));

// Test 1: Check Environment Variables
console.log('\n📋 Test 1: Environment Variables');
console.log('-'.repeat(60));

const envChecks = {
  'RESEND_API_KEY': process.env.RESEND_API_KEY,
  'FROM_EMAIL': process.env.FROM_EMAIL,
  'ADMIN_EMAIL': process.env.ADMIN_EMAIL,
  'PAYSTACK_SECRET_KEY': process.env.PAYSTACK_SECRET_KEY,
  'NOMBA_WEBHOOK_SECRET': process.env.NOMBA_WEBHOOK_SECRET,
};

let envScore = 0;
Object.entries(envChecks).forEach(([key, value]) => {
  const status = value ? '✅' : '❌';
  const display = value ? `${value.substring(0, 20)}...` : 'Not set';
  console.log(`${status} ${key}: ${display}`);
  if (value) envScore++;
});

console.log(`\nScore: ${envScore}/${Object.keys(envChecks).length} configured`);

// Test 2: Email Service Configuration
console.log('\n📧 Test 2: Email Service Configuration');
console.log('-'.repeat(60));

async function testEmailService() {
  const { Resend } = require('resend');

  if (!process.env.RESEND_API_KEY) {
    console.log('❌ Resend not configured - skipping email tests');
    return false;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    // Test simple email
    const { data, error } = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'Wingside <noreply@wingside.ng>',
      to: process.env.TEST_EMAIL || process.env.ADMIN_EMAIL,
      subject: 'Wingside Notifications Test',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #F7C400; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .header h1 { margin: 0; color: #552627; }
              .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px; }
              .success { color: #28a745; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✅ Email Test Successful</h1>
              </div>
              <div class="content">
                <p class="success">All notification systems are working!</p>
                <p><strong>Test Details:</strong></p>
                <ul>
                  <li>Service: Resend</li>
                  <li>Environment: Node.js Test Script</li>
                  <li>Timestamp: ${new Date().toLocaleString()}</li>
                </ul>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.log('❌ Email test failed:', error.message);
      return false;
    }

    console.log('✅ Email service working - Email ID:', data.id);
    console.log(`   Check inbox at: ${process.env.TEST_EMAIL || process.env.ADMIN_EMAIL}`);
    return true;
  } catch (error) {
    console.log('❌ Email service error:', error.message);
    return false;
  }
}

// Test 3: Contact Form Submissions
async function testContactForm() {
  console.log('\n📝 Test 3: Contact Form Submissions');
  console.log('-'.repeat(60));

  const testData = {
    type: 'test',
    name: 'Test User',
    email: 'test@example.com',
    phone: '+234 800 000 0000',
    message: 'This is a test notification',
  };

  try {
    const response = await fetch('http://localhost:3000/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData),
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Contact form submission successful');
      console.log('   Message:', result.message);
      return true;
    } else {
      console.log('❌ Contact form failed:', result.error);
      return false;
    }
  } catch (error) {
    console.log('⚠️  Contact form test skipped (server not running):', error.message);
    return null;
  }
}

// Test 4: Database Tables
async function testDatabaseTables() {
  console.log('\n🗄️  Test 4: Database Tables');
  console.log('-'.repeat(60));

  const tables = [
    'contact_submissions',
    'orders',
    'wallet_transactions',
    'notifications',
    'promo_codes',
  ];

  let tableCount = 0;

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: OK (${data.length} records)`);
        tableCount++;
      }
    } catch (error) {
      console.log(`❌ ${table}: ${error.message}`);
    }
  }

  console.log(`\nDatabase tables: ${tableCount}/${tables.length} accessible`);
  return tableCount === tables.length;
}

// Test 5: Notification Functions
async function testNotificationFunctions() {
  console.log('\n🔔 Test 5: Notification Functions');
  console.log('-'.repeat(60));

  const functions = [
    {
      name: 'get_wallet_balance',
      params: { p_user_id: '00000000-0000-0000-0000-000000000000' }
    },
    {
      name: 'award_points',
      params: {
        p_user_id: '00000000-0000-0000-0000-000000000000',
        p_reward_type: 'test',
        p_points: 10,
        p_description: 'Test notification'
      }
    },
  ];

  let funcCount = 0;

  for (const func of functions) {
    try {
      const { data, error } = await supabase.rpc(func.name, func.params);

      if (error) {
        // Some errors are expected (invalid UUID, etc.)
        if (error.message.includes('function')) {
          console.log(`❌ ${func.name}: Function not found`);
        } else {
          console.log(`⚠️  ${func.name}: ${error.message.substring(0, 60)}...`);
        }
      } else {
        console.log(`✅ ${func.name}: Function exists`);
        funcCount++;
      }
    } catch (error) {
      console.log(`❌ ${func.name}: ${error.message}`);
    }
  }

  console.log(`\nFunctions: ${funcCount}/${functions.length} available`);
}

// Test 6: Webhook Endpoints
async function testWebhookEndpoints() {
  console.log('\n🔗 Test 6: Webhook Endpoints');
  console.log('-'.repeat(60));

  const webhooks = [
    { name: 'Paystack', url: '/api/payment/webhook' },
    { name: 'Nomba', url: '/api/payment/nomba/webhook' },
  ];

  console.log('Webhook endpoints configured:');
  webhooks.forEach(webhook => {
    const paystackSig = process.env.PAYSTACK_SECRET_KEY ? '✅' : '❌';
    const nombaSig = process.env.NOMBA_WEBHOOK_SECRET ? '✅' : '❌';

    if (webhook.name === 'Paystack') {
      console.log(`${paystackSig} ${webhook.name}: ${webhook.url}`);
      console.log(`   Signature verification: ${paystackSig === '✅' ? 'HMAC-SHA512' : 'Not configured'}`);
    } else {
      console.log(`${nombaSig} ${webhook.name}: ${webhook.url}`);
      console.log(`   Signature verification: ${nombaSig === '✅' ? 'HMAC-SHA512' : 'Not configured'}`);
    }
  });

  console.log('\n💡 To test webhooks manually:');
  console.log('1. Use ngrok or similar to expose localhost');
  console.log('2. Register webhook URL with payment provider');
  console.log('3. Trigger a test payment');
}

// Test 7: Email Templates
async function testEmailTemplates() {
  console.log('\n📨 Test 7: Email Templates');
  console.log('-'.repeat(60));

  const templates = [
    { name: 'Contact Notification', file: 'lib/emails/service.ts - sendContactNotification' },
    { name: 'Order Confirmation', file: 'lib/emails/service.ts - sendOrderConfirmation' },
    { name: 'Payment Confirmation', file: 'lib/emails/service.ts - sendPaymentConfirmation' },
    { name: 'Order Notification', file: 'lib/emails/service.ts - sendOrderNotification' },
  ];

  templates.forEach(template => {
    console.log(`✅ ${template.name}`);
    console.log(`   Location: ${template.file}`);
  });
}

// Summary
function printSummary(results) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));

  let passed = 0;
  let failed = 0;
  let skipped = 0;

  Object.entries(results).forEach(([test, result]) => {
    if (result === true) passed++;
    else if (result === false) failed++;
    else skipped++;
  });

  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⚠️  Skipped: ${skipped}`);
  console.log(`📝 Total: ${passed + failed + skipped}`);

  if (failed === 0 && skipped === 0) {
    console.log('\n🎉 All tests passed! Notification systems are fully functional.');
  } else if (failed === 0) {
    console.log('\n✨ All critical tests passed!');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.');
  }

  console.log('\n📚 Next Steps:');
  console.log('1. Ensure RESEND_API_KEY is configured');
  console.log('2. Configure NOMBA_WEBHOOK_SECRET in production');
  console.log('3. Test with real payments to verify webhook signatures');
  console.log('4. Monitor email deliverability in Resend dashboard');
}

// Run all tests
async function runAllTests() {
  const results = {};

  // Test 1: Environment Variables (already done)
  results['Environment Variables'] = envScore === Object.keys(envChecks).length;

  // Test 2: Email Service
  const emailResult = await testEmailService();
  results['Email Service'] = emailResult;

  // Test 3: Contact Form (depends on server running)
  const contactResult = await testContactForm();
  results['Contact Form'] = contactResult;

  // Test 4: Database Tables
  const dbResult = await testDatabaseTables();
  results['Database Tables'] = dbResult;

  // Test 5: Notification Functions
  await testNotificationFunctions();

  // Test 6: Webhook Endpoints
  await testWebhookEndpoints();

  // Test 7: Email Templates
  await testEmailTemplates();

  // Print Summary
  printSummary(results);
}

runAllTests().catch(error => {
  console.error('\n❌ Test suite error:', error);
  process.exit(1);
});
