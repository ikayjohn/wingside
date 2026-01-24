-- Add Transactional Email Templates to Database
-- This makes all email templates editable through the admin UI

-- 1. Referral Invitation Email
INSERT INTO email_templates (template_key, name, subject, html_content, variables, is_active)
VALUES (
  'referral_invitation',
  'Referral Invitation',
  '{{referrerName}} invited you to Wingside - Get ₦1,000!',
  '<!DOCTYPE html>
<html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #F7C400 0%, #ffdb4d 100%); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0; }
      .header h1 { margin: 0; color: #552627; font-size: 32px; font-weight: bold; }
      .header p { margin: 10px 0 0; color: #552627; font-size: 16px; }
      .content { background: #fff; padding: 40px 30px; border: 1px solid #e0e0e0; border-top: none; }
      .message { background: #FDF5E5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F7C400; }
      .message p { margin: 0; color: #552627; font-size: 15px; line-height: 1.8; }
      .referral-code { background: #552627; color: #F7C400; padding: 20px; text-align: center; border-radius: 8px; margin: 30px 0; }
      .referral-code-label { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; opacity: 0.9; }
      .referral-code-value { font-size: 32px; font-weight: bold; letter-spacing: 3px; font-family: ''Courier New'', monospace; }
      .benefits { background: #f9f9f9; padding: 25px; border-radius: 8px; margin: 25px 0; }
      .benefit-item { margin: 15px 0; padding-left: 15px; }
      .benefit-title { font-weight: bold; color: #552627; margin-bottom: 3px; }
      .benefit-desc { font-size: 14px; color: #666; }
      .cta-button { display: inline-block; background: #F7C400; color: #552627; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px; margin: 20px 0; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
      .footer { background: #f9f9f9; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0; border-radius: 0 0 12px 12px; }
      .footer-text { font-size: 13px; color: #666; margin: 5px 0; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>You''ve Been Invited!</h1>
        <p>Your friend {{referrerName}} wants to share the Wingside experience</p>
      </div>
      <div class="content">
        <p style="font-size: 16px; color: #552627; margin-bottom: 20px;">Hello!</p>
        <p style="font-size: 15px; color: #333; line-height: 1.8; margin-bottom: 20px;">
          <strong>{{referrerName}}</strong> thinks you''d love Wingside''s amazing chicken wings and wants you to join our community!
        </p>
        {{#customMessage}}
        <div class="message">
          <p><strong>Personal Message:</strong></p>
          <p style="margin-top: 10px; font-style: italic;">"{{customMessage}}"</p>
        </div>
        {{/customMessage}}
        <div class="benefits">
          <h3 style="color: #552627; margin-top: 0; margin-bottom: 20px; text-align: center;">What You''ll Get</h3>
          <div class="benefit-item">
            <div class="benefit-title">₦1,000 Welcome Bonus</div>
            <div class="benefit-desc">Get ₦1,000 credited to your wallet after your first order of ₦1,000 or more</div>
          </div>
          <div class="benefit-item">
            <div class="benefit-title">15 Bonus Points</div>
            <div class="benefit-desc">Start earning rewards right from your first order</div>
          </div>
          <div class="benefit-item">
            <div class="benefit-title">20+ Amazing Flavors</div>
            <div class="benefit-desc">From classic BBQ to bold Suya Spice and everything in between</div>
          </div>
          <div class="benefit-item">
            <div class="benefit-title">Fast Delivery</div>
            <div class="benefit-desc">Hot, fresh wings delivered straight to your door</div>
          </div>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <p style="font-size: 14px; color: #666; margin-bottom: 15px;">Use this referral code when signing up:</p>
          <div class="referral-code">
            <div class="referral-code-label">Your Referral Code</div>
            <div class="referral-code-value">{{referralCode}}</div>
          </div>
          <a href="{{referralLink}}" class="cta-button">Join Wingside & Get ₦1,000</a>
          <p style="font-size: 13px; color: #999; margin-top: 15px;">
            Or copy this link: <br>
            <a href="{{referralLink}}" style="color: #F7C400; word-break: break-all;">{{referralLink}}</a>
          </p>
        </div>
        <div style="background: #FDF5E5; padding: 20px; border-radius: 8px; margin-top: 30px; text-align: center;">
          <p style="margin: 0; color: #552627; font-size: 14px;">
            <strong>Bonus:</strong> {{referrerName}} will also get ₦1,000 when you complete your first order!
          </p>
        </div>
      </div>
      <div class="footer">
        <p class="footer-text"><strong>Wingside</strong></p>
        <p class="footer-text">24 King Perekule Street, GRA<br>Port Harcourt</p>
        <p class="footer-text" style="margin-top: 15px;">Questions? Contact us at <a href="mailto:reachus@wingside.ng" style="color: #F7C400;">reachus@wingside.ng</a></p>
        <p class="footer-text" style="margin-top: 15px;">© 2026 Wingside. All rights reserved.</p>
        <p class="footer-text" style="font-size: 11px; color: #999; margin-top: 15px;">
          You received this email because {{referrerName}} invited you to join Wingside.
        </p>
      </div>
    </div>
  </body>
</html>',
  '{"referrerName": "Friend Name", "referralCode": "ABC123", "referralLink": "https://wingside.ng/signup?ref=ABC123", "customMessage": "Optional personal message"}'::jsonb,
  true
) ON CONFLICT (template_key) DO UPDATE SET
  name = EXCLUDED.name,
  subject = EXCLUDED.subject,
  html_content = EXCLUDED.html_content,
  variables = EXCLUDED.variables,
  updated_at = NOW();

-- 2. Order Confirmation Email
INSERT INTO email_templates (template_key, name, subject, html_content, variables, is_active)
VALUES (
  'order_confirmation',
  'Order Confirmation',
  'Order Confirmation #{{orderNumber}}',
  '<!DOCTYPE html>
<html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: #F7C400; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
      .header h1 { margin: 0; color: #552627; font-size: 28px; }
      .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; }
      .order-number { background: #552627; color: #F7C400; padding: 15px; text-align: center; font-size: 18px; font-weight: bold; border-radius: 8px; margin-bottom: 20px; }
      .badge { display: inline-block; background: #F7C400; color: #552627; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; }
      .button { display: inline-block; background: #F7C400; color: #552627; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
      .footer { background: #f9f9f9; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0; border-radius: 0 0 8px 8px; }
      .footer-text { font-size: 13px; color: #666; margin: 5px 0; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Order Confirmed!</h1>
        <p>Thank you for your order, {{customerName}}!</p>
      </div>
      <div class="content">
        <div class="order-number">Order #{{orderNumber}}</div>
        <div style="text-align: center; margin-bottom: 20px;">
          <span class="badge">Status: {{status}}</span>
        </div>
        <p>We''re preparing your delicious wings! You''ll receive updates as your order progresses.</p>
        <div style="text-align: center;">
          <a href="{{trackingLink}}" class="button">Track Your Order</a>
        </div>
      </div>
      <div class="footer">
        <p class="footer-text"><strong>Wingside</strong></p>
        <p class="footer-text">24 King Perekule Street, GRA<br>Port Harcourt</p>
        <p class="footer-text" style="margin-top: 15px;">Questions? Contact us at <a href="mailto:reachus@wingside.ng" style="color: #F7C400;">reachus@wingside.ng</a></p>
        <p class="footer-text" style="margin-top: 15px;">© 2026 Wingside. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>',
  '{"orderNumber": "WS12345", "customerName": "Customer", "status": "PENDING", "trackingLink": "https://wingside.ng/track"}'::jsonb,
  true
) ON CONFLICT (template_key) DO UPDATE SET
  name = EXCLUDED.name,
  subject = EXCLUDED.subject,
  html_content = EXCLUDED.html_content,
  variables = EXCLUDED.variables,
  updated_at = NOW();

-- 3. Payment Confirmation Email
INSERT INTO email_templates (template_key, name, subject, html_content, variables, is_active)
VALUES (
  'payment_confirmation',
  'Payment Confirmation',
  'Payment Confirmation #{{orderNumber}}',
  '<!DOCTYPE html>
<html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: #F7C400; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
      .header h1 { margin: 0; color: #552627; font-size: 28px; }
      .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; }
      .amount { font-size: 24px; font-weight: bold; color: #552627; text-align: center; margin: 20px 0; }
      .badge { display: inline-block; background: #28a745; color: #fff; padding: 8px 20px; border-radius: 20px; font-size: 14px; font-weight: bold; }
      .footer { background: #f9f9f9; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0; border-radius: 0 0 8px 8px; }
      .footer-text { font-size: 13px; color: #666; margin: 5px 0; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Payment Successful!</h1>
        <p>Thank you, {{customerName}}!</p>
      </div>
      <div class="content">
        <div style="text-align: center; margin: 20px 0;">
          <span class="badge">Payment Complete</span>
        </div>
        <div class="amount">{{amount}}</div>
        <p style="text-align: center;">Your payment for Order #{{orderNumber}} has been processed successfully!</p>
      </div>
      <div class="footer">
        <p class="footer-text"><strong>Wingside</strong></p>
        <p class="footer-text">24 King Perekule Street, GRA<br>Port Harcourt</p>
        <p class="footer-text" style="margin-top: 15px;">Questions? Contact us at <a href="mailto:reachus@wingside.ng" style="color: #F7C400;">reachus@wingside.ng</a></p>
        <p class="footer-text" style="margin-top: 15px;">© 2026 Wingside. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>',
  '{"orderNumber": "WS12345", "customerName": "Customer", "amount": "₦5,000"}'::jsonb,
  true
) ON CONFLICT (template_key) DO UPDATE SET
  name = EXCLUDED.name,
  subject = EXCLUDED.subject,
  html_content = EXCLUDED.html_content,
  variables = EXCLUDED.variables,
  updated_at = NOW();

-- 4. Order Notification (Admin)
INSERT INTO email_templates (template_key, name, subject, html_content, variables, is_active)
VALUES (
  'order_notification_admin',
  'Order Notification (Admin)',
  'New Order #{{orderNumber}} - {{total}}',
  '<!DOCTYPE html>
<html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: #552627; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
      .header h1 { margin: 0; color: #F7C400; font-size: 28px; }
      .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; }
      .total-amount { font-size: 32px; font-weight: bold; color: #28a745; text-align: center; margin: 20px 0; }
      .button { display: inline-block; background: #552627; color: #F7C400; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; }
      .footer { background: #f9f9f9; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0; border-radius: 0 0 8px 8px; }
      .footer-text { font-size: 13px; color: #666; margin: 5px 0; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>New Order Received!</h1>
      </div>
      <div class="content">
        <div class="total-amount">{{total}}</div>
        <p><strong>Customer:</strong> {{customerName}}</p>
        <p><strong>Email:</strong> {{customerEmail}}</p>
        <p><strong>Phone:</strong> {{customerPhone}}</p>
        <div style="text-align: center; margin-top: 30px;">
          <a href="{{adminLink}}" class="button">View Order in Admin</a>
        </div>
      </div>
      <div class="footer">
        <p class="footer-text"><strong>Wingside</strong></p>
        <p class="footer-text">24 King Perekule Street, GRA<br>Port Harcourt</p>
        <p class="footer-text" style="margin-top: 15px;">Questions? Contact us at <a href="mailto:reachus@wingside.ng" style="color: #F7C400;">reachus@wingside.ng</a></p>
        <p class="footer-text" style="margin-top: 15px;">© 2026 Wingside. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>',
  '{"orderNumber": "WS12345", "total": "₦5,000", "customerName": "John Doe", "customerEmail": "john@example.com", "customerPhone": "08012345678", "adminLink": "https://wingside.ng/admin/orders"}'::jsonb,
  true
) ON CONFLICT (template_key) DO UPDATE SET
  name = EXCLUDED.name,
  subject = EXCLUDED.subject,
  html_content = EXCLUDED.html_content,
  variables = EXCLUDED.variables,
  updated_at = NOW();

-- 5. Contact Form Notification
INSERT INTO email_templates (template_key, name, subject, html_content, variables, is_active)
VALUES (
  'contact_notification',
  'Contact Form Notification',
  '{{formType}} - Contact from {{name}}',
  '<!DOCTYPE html>
<html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: #F7C400; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
      .header h1 { margin: 0; color: #552627; font-size: 28px; }
      .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; }
      .badge { display: inline-block; background: #552627; color: #F7C400; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; }
      .field { margin-bottom: 15px; }
      .label { font-weight: bold; color: #552627; }
      .footer { background: #f9f9f9; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0; border-radius: 0 0 8px 8px; }
      .footer-text { font-size: 13px; color: #666; margin: 5px 0; }
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
          <span class="badge">{{formType}}</span>
        </div>
        <div class="field">
          <div class="label">Name</div>
          <div>{{name}}</div>
        </div>
        <div class="field">
          <div class="label">Email</div>
          <div>{{email}}</div>
        </div>
        <div class="field">
          <div class="label">Message</div>
          <div>{{message}}</div>
        </div>
      </div>
      <div class="footer">
        <p class="footer-text"><strong>Wingside</strong></p>
        <p class="footer-text">24 King Perekule Street, GRA<br>Port Harcourt</p>
        <p class="footer-text" style="margin-top: 15px;">Questions? Contact us at <a href="mailto:reachus@wingside.ng" style="color: #F7C400;">reachus@wingside.ng</a></p>
        <p class="footer-text" style="margin-top: 15px;">© 2026 Wingside. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>',
  '{"formType": "General Inquiry", "name": "John Doe", "email": "john@example.com", "message": "Sample message"}'::jsonb,
  true
) ON CONFLICT (template_key) DO UPDATE SET
  name = EXCLUDED.name,
  subject = EXCLUDED.subject,
  html_content = EXCLUDED.html_content,
  variables = EXCLUDED.variables,
  updated_at = NOW();

-- Add comment
COMMENT ON TABLE email_templates IS 'Stores editable email templates for transactional and marketing emails. Templates use {{variable}} syntax for dynamic content.';
