/**
 * Test Email Sending Script
 *
 * This script tests the Resend email configuration by sending test emails.
 *
 * Usage:
 *   node scripts/test-email-sending.js
 *
 * Make sure to set your RESEND_API_KEY in .env.local
 */

require('dotenv').config({ path: '.env.local' });

const { Resend } = require('resend');

// Check if API key is configured
if (!process.env.RESEND_API_KEY) {
  console.error('❌ RESEND_API_KEY is not configured in .env.local');
  console.log('\n💡 Get your API key from: https://dashboard.resend.com/api-keys');
  process.exit(1);
}

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.FROM_EMAIL || 'Wingside <noreply@wingside.ng>';
const TEST_EMAIL = process.env.TEST_EMAIL || 'reachus@wingside.ng';

console.log('🧪 Testing Email Sending Configuration\n');
console.log('From:', FROM_EMAIL);
console.log('To:', TEST_EMAIL);
console.log('API Key:', process.env.RESEND_API_KEY.substring(0, 20) + '...\n');

// Test 1: Simple Test Email
async function testSimpleEmail() {
  console.log('📧 Test 1: Sending simple test email...');

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [TEST_EMAIL],
      subject: 'Wingside Email Test - Simple',
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
              .success { color: #28a745; font-weight: bold; font-size: 18px; text-align: center; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🍗 Wingside Email Test</h1>
              </div>
              <div class="content">
                <div class="success">✅ Email Configuration Working!</div>
                <p>This is a test email from Wingside to verify that Resend is properly configured.</p>
                <p><strong>Test Details:</strong></p>
                <ul>
                  <li>Service: Resend</li>
                  <li>From: ${FROM_EMAIL}</li>
                  <li>Sent: ${new Date().toLocaleString()}</li>
                </ul>
                <p>If you received this email, your email configuration is working correctly! 🎉</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('❌ Failed:', error);
      return false;
    }

    console.log('✅ Success! Email ID:', data.id);
    console.log('   Check your inbox at:', TEST_EMAIL);
    return true;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

// Test 2: Contact Form Notification Email
async function testContactNotification() {
  console.log('\n📧 Test 2: Sending contact form notification...');

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [TEST_EMAIL],
      subject: 'Sports Community - Contact from John Doe',
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
              .field { margin-bottom: 15px; }
              .label { font-weight: bold; color: #552627; }
              .badge { display: inline-block; background: #552627; color: #F7C400; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>New Contact Form Submission</h1>
              </div>
              <div class="content">
                <div class="field">
                  <div class="label">Type</div>
                  <span class="badge">Sports Community</span>
                </div>
                <div class="field">
                  <div class="label">Name</div>
                  <div>John Doe</div>
                </div>
                <div class="field">
                  <div class="label">Email</div>
                  <div>john.doe@example.com</div>
                </div>
                <div class="field">
                  <div class="label">Phone</div>
                  <div>+234 801 234 5678</div>
                </div>
                <div class="field">
                  <div class="label">Message</div>
                  <div>I'm interested in joining the Wing5 Leagues!</div>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('❌ Failed:', error);
      return false;
    }

    console.log('✅ Success! Email ID:', data.id);
    return true;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

// Test 3: Order Confirmation Email
async function testOrderConfirmation() {
  console.log('\n📧 Test 3: Sending order confirmation...');

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [TEST_EMAIL],
      subject: 'Order Confirmation #WS12345',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #F7C400; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .header h1 { margin: 0; color: #552627; font-size: 28px; }
              .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px; }
              .order-number { background: #552627; color: #F7C400; padding: 15px; text-align: center; font-size: 18px; font-weight: bold; border-radius: 8px; margin-bottom: 20px; }
              .item { background: #fff; padding: 15px; margin-bottom: 10px; border-radius: 6px; border: 1px solid #e0e0e0; }
              .badge { display: inline-block; background: #F7C400; color: #552627; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🍗 Order Confirmed!</h1>
                <p>Thank you for your order, Jane Smith!</p>
              </div>
              <div class="content">
                <div class="order-number">Order #WS12345</div>
                <div style="text-align: center; margin-bottom: 20px;">
                  <span class="badge">Status: PENDING</span>
                </div>
                <div class="item">
                  <div style="font-weight: bold; color: #552627;">Wings Pack - 12 Pieces</div>
                  <div style="font-size: 13px; color: #666; margin-top: 5px;">
                    Size: Large | Flavors: BBQ, HOT
                  </div>
                  <div style="font-size: 13px; color: #666;">Qty: 2 × ₦8,500</div>
                </div>
                <div style="margin-top: 20px; padding-top: 15px; border-top: 2px solid #F7C400;">
                  <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; color: #552627;">
                    <span>Total</span>
                    <span>₦17,500</span>
                  </div>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('❌ Failed:', error);
      return false;
    }

    console.log('✅ Success! Email ID:', data.id);
    return true;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

// Test 4: Payment Confirmation Email
async function testPaymentConfirmation() {
  console.log('\n📧 Test 4: Sending payment confirmation...');

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [TEST_EMAIL],
      subject: 'Payment Confirmation #WS12345',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #F7C400; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .header h1 { margin: 0; color: #552627; font-size: 28px; }
              .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px; }
              .success-icon { text-align: center; font-size: 64px; margin: 20px 0; }
              .order-number { background: #552627; color: #F7C400; padding: 15px; text-align: center; font-size: 18px; font-weight: bold; border-radius: 8px; margin: 20px 0; }
              .amount { font-size: 32px; font-weight: bold; color: #F7C400; text-align: center; margin: 20px 0; }
              .badge { display: inline-block; background: #28a745; color: #fff; padding: 8px 20px; border-radius: 20px; font-size: 14px; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="success-icon">✅</div>
                <h1>Payment Successful!</h1>
                <p>Thank you, Jane Smith!</p>
              </div>
              <div class="content">
                <div style="text-align: center;">
                  <span class="badge">Payment Complete</span>
                </div>
                <div class="order-number">Order #WS12345</div>
                <div class="amount">₦17,500</div>
                <div style="background: #fff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <div style="padding: 10px 0; border-bottom: 1px solid #e0e0e0;">
                    <strong>Payment Method:</strong> CARD
                  </div>
                  <div style="padding: 10px 0; border-bottom: 1px solid #e0e0e0;">
                    <strong>Transaction Reference:</strong> REF_1234567890
                  </div>
                  <div style="padding: 10px 0;">
                    <strong>Date:</strong> ${new Date().toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('❌ Failed:', error);
      return false;
    }

    console.log('✅ Success! Email ID:', data.id);
    return true;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('═══════════════════════════════════════════════════════════\n');

  const results = [];

  results.push(await testSimpleEmail());
  results.push(await testContactNotification());
  results.push(await testOrderConfirmation());
  results.push(await testPaymentConfirmation());

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('\n📊 Test Summary:');
  console.log(`   Total: ${results.length}`);
  console.log(`   ✅ Passed: ${results.filter(r => r).length}`);
  console.log(`   ❌ Failed: ${results.filter(r => !r).length}`);

  if (results.every(r => r)) {
    console.log('\n🎉 All tests passed! Email configuration is working correctly.');
    console.log(`\n📬 Check your inbox at: ${TEST_EMAIL}`);
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.');
    process.exit(1);
  }
}

runAllTests();
