const { createClient } = require('@supabase/supabase-js');

// Try to load from multiple possible env file locations
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' }); // Fallback to .env

// Verify required env vars are set
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL is not set');
  console.error('💡 Make sure environment variables are set in .env or .env.local');
  process.exit(1);
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY is not set');
  console.error('💡 Make sure environment variables are set in .env or .env.local');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const templates = [
  {
    template_key: 'welcome',
    name: 'Welcome Email',
    subject: 'Welcome to Wingside!',
    html_content: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Wingside</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: white;">
    <!-- Header -->
    <div style="background-color: #F7C400; padding: 30px; text-align: center;">
      <img src="https://wingside.ng/logo.png" alt="Wingside" style="max-width: 150px; margin-bottom: 10px;">
      <h1 style="margin: 0; color: #000000; font-size: 28px;">Welcome to Wingside!</h1>
    </div>

    <!-- Content -->
    <div style="padding: 40px 30px;">
      <p style="font-size: 18px; color: #333333; margin-bottom: 20px;">
        Hi {{customer_name}},
      </p>
      <p style="font-size: 16px; color: #555555; line-height: 1.6; margin-bottom: 20px;">
        Welcome to the Wingside family! We're thrilled to have you on board. Get ready to experience the best wings in Port Harcourt with 20 amazing flavors to choose from!
      </p>

      <!-- Features -->
      <div style="background-color: #FDF5E5; border-radius: 8px; padding: 25px; margin: 30px 0;">
        <h3 style="margin: 0 0 15px 0; color: #552627; font-size: 18px;">What's Next?</h3>
        <ul style="margin: 0; padding-left: 20px; color: #555555; line-height: 1.8;">
          <li>Browse our <a href="https://wingside.ng/order" style="color: #F7C400; text-decoration: none; font-weight: bold;">20 delicious wing flavors</a></li>
          <li>Place your first order and earn reward points</li>
          <li>Track your orders in real-time</li>
          <li>Get exclusive deals and promotions</li>
        </ul>
      </div>

      {{#referral_code}}
      <!-- Referral Section -->
      <div style="background-color: #FDF5E5; border: 2px dashed #F7C400; border-radius: 8px; padding: 25px; margin: 30px 0; text-align: center;">
        <h3 style="margin: 0 0 15px 0; color: #552627; font-size: 20px;">Share & Earn ₦1,000!</h3>
        <p style="margin: 0 0 15px 0; color: #555555; font-size: 15px;">
          Invite your friends and earn ₦1,000 for each friend who places their first order!
        </p>
        <div style="background-color: white; border-radius: 6px; padding: 15px; margin-bottom: 15px;">
          <p style="margin: 0 0 8px 0; font-size: 13px; color: #888888;">YOUR REFERRAL CODE</p>
          <p style="margin: 0; font-size: 24px; font-weight: bold; color: #F7C400; letter-spacing: 2px;">{{referral_code}}</p>
        </div>
        <a href="{{referral_link}}" style="display: inline-block; background-color: #F7C400; color: #000000; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
          Copy Referral Link
        </a>
      </div>
      {{/referral_code}}

      <!-- CTA -->
      <div style="text-align: center; margin: 35px 0;">
        <a href="https://wingside.ng/order" style="display: inline-block; background-color: #F7C400; color: #000000; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px;">
          Order Now
        </a>
      </div>

      <!-- Contact -->
      <p style="font-size: 14px; color: #888888; margin-top: 30px; text-align: center;">
        Questions? Reach out to us at <a href="mailto:support@wingside.ng" style="color: #F7C400; text-decoration: none;">support@wingside.ng</a>
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #552627; padding: 30px; text-align: center;">
      <p style="margin: 0 0 10px 0; color: #ffffff; font-size: 14px;">Follow us on social media</p>
      <div style="margin: 15px 0;">
        <a href="https://instagram.com/wingside.ng" style="display: inline-block; margin: 0 10px; color: #ffffff; text-decoration: none; font-size: 20px;">Instagram</a>
        <a href="https://facebook.com/wingside.ng" style="display: inline-block; margin: 0 10px; color: #ffffff; text-decoration: none; font-size: 20px;">Facebook</a>
        <a href="https://twitter.com/wingside.ng" style="display: inline-block; margin: 0 10px; color: #ffffff; text-decoration: none; font-size: 20px;">Twitter</a>
      </div>
      <p style="margin: 20px 0 0 0; color: #aaaaaa; font-size: 12px;">
        © 2026 Wingside. All rights reserved.<br>
        13 Tombia Street, Port Harcourt, Nigeria
      </p>
    </div>
  </div>
</body>
</html>
    `,
    text_content: `
Welcome to Wingside!

Hi {{customer_name}},

Welcome to the Wingside family! We're thrilled to have you on board. Get ready to experience the best wings in Port Harcourt with 20 amazing flavors to choose from!

What's Next?
- Browse our 20 delicious wing flavors: https://wingside.ng/order
- Place your first order and earn reward points
- Track your orders in real-time
- Get exclusive deals and promotions

{{#referral_code}}
Share & Earn ₦1,000!
Invite your friends and earn ₦1,000 for each friend who places their first order!

Your referral code: {{referral_code}}
Referral link: {{referral_link}}
{{/referral_code}}

Order now: https://wingside.ng/order

Questions? Reach out to us at support@wingside.ng

Follow us on social media:
Instagram: https://instagram.com/wingside.ng
Facebook: https://facebook.com/wingside.ng
Twitter: https://twitter.com/wingside.ng

© 2026 Wingside. All rights reserved.
13 Tombia Street, Port Harcourt, Nigeria
    `,
    is_active: true,
  },
  {
    template_key: 'referral_reward',
    name: 'Referral Reward Notification',
    subject: 'You earned ₦{{reward_amount}}!',
    html_content: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Referral Reward Earned</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: white;">
    <!-- Header -->
    <div style="background-color: #F7C400; padding: 30px; text-align: center;">
      <img src="https://wingside.ng/logo.png" alt="Wingside" style="max-width: 150px; margin-bottom: 10px;">
      <h1 style="margin: 0; color: #000000; font-size: 28px;">Congratulations!</h1>
    </div>

    <!-- Content -->
    <div style="padding: 40px 30px;">
      <p style="font-size: 18px; color: #333333; margin-bottom: 20px;">
        Hi {{customer_name}},
      </p>

      <!-- Reward Card -->
      <div style="background: linear-gradient(135deg, #F7C400 0%, #F5C000 100%); border-radius: 12px; padding: 30px; margin: 30px 0; text-align: center; box-shadow: 0 4px 15px rgba(247, 196, 0, 0.3);">
        <p style="margin: 0 0 10px 0; font-size: 16px; color: #000000; opacity: 0.8;">YOU EARNED</p>
        <p style="margin: 0 0 15px 0; font-size: 48px; font-weight: bold; color: #000000;">₦{{reward_amount}}</p>
        <p style="margin: 0; font-size: 14px; color: #000000; opacity: 0.8;">Referral Reward</p>
      </div>

      <p style="font-size: 16px; color: #555555; line-height: 1.6; margin-bottom: 20px;">
        Awesome news! Your friend <strong>{{referred_user_name}}</strong> just completed their first order, and you've earned a reward!
      </p>

      <!-- Stats -->
      <div style="background-color: #FDF5E5; border-radius: 8px; padding: 25px; margin: 30px 0;">
        <h3 style="margin: 0 0 15px 0; color: #552627; font-size: 18px;">Your Referral Stats</h3>
        <div style="display: flex; justify-content: space-around; text-align: center;">
          <div>
            <p style="margin: 0; font-size: 32px; font-weight: bold; color: #F7C400;">{{total_rewards}}</p>
            <p style="margin: 5px 0 0 0; font-size: 14px; color: #555555;">Total Rewards</p>
          </div>
        </div>
      </div>

      <!-- Keep Sharing -->
      <div style="background-color: #FDF5E5; border: 2px dashed #F7C400; border-radius: 8px; padding: 25px; margin: 30px 0; text-align: center;">
        <h3 style="margin: 0 0 15px 0; color: #552627; font-size: 20px;">Keep Sharing & Earning!</h3>
        <p style="margin: 0 0 15px 0; color: #555555; font-size: 15px;">
          There's no limit to how much you can earn. Share your referral link with more friends!
        </p>
        <a href="{{referral_link}}" style="display: inline-block; background-color: #F7C400; color: #000000; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
          Your Referral Link
        </a>
      </div>

      <!-- CTA -->
      <div style="text-align: center; margin: 35px 0;">
        <a href="https://wingside.ng/order" style="display: inline-block; background-color: #F7C400; color: #000000; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px;">
          Order Now
        </a>
      </div>

      <!-- Contact -->
      <p style="font-size: 14px; color: #888888; margin-top: 30px; text-align: center;">
        Questions about your reward? <a href="mailto:support@wingside.ng" style="color: #F7C400; text-decoration: none;">Contact us</a>
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #552627; padding: 30px; text-align: center;">
      <p style="margin: 0 0 10px 0; color: #ffffff; font-size: 14px;">Follow us on social media</p>
      <div style="margin: 15px 0;">
        <a href="https://instagram.com/wingside.ng" style="display: inline-block; margin: 0 10px; color: #ffffff; text-decoration: none; font-size: 20px;">Instagram</a>
        <a href="https://facebook.com/wingside.ng" style="display: inline-block; margin: 0 10px; color: #ffffff; text-decoration: none; font-size: 20px;">Facebook</a>
        <a href="https://twitter.com/wingside.ng" style="display: inline-block; margin: 0 10px; color: #ffffff; text-decoration: none; font-size: 20px;">Twitter</a>
      </div>
      <p style="margin: 20px 0 0 0; color: #aaaaaa; font-size: 12px;">
        © 2026 Wingside. All rights reserved.<br>
        13 Tombia Street, Port Harcourt, Nigeria
      </p>
    </div>
  </div>
</body>
</html>
    `,
    text_content: `
Congratulations!

Hi {{customer_name}},

YOU EARNED ₦{{reward_amount}}!
Referral Reward

Awesome news! Your friend {{referred_user_name}} just completed their first order, and you've earned a reward!

Your Referral Stats
Total Rewards: {{total_rewards}}

Keep Sharing & Earning!
There's no limit to how much you can earn. Share your referral link with more friends!
{{referral_link}}

Order now: https://wingside.ng/order

Questions about your reward? Contact us at support@wingside.ng

Follow us on social media:
Instagram: https://instagram.com/wingside.ng
Facebook: https://facebook.com/wingside.ng
Twitter: https://twitter.com/wingside.ng

© 2026 Wingside. All rights reserved.
13 Tombia Street, Port Harcourt, Nigeria
    `,
    is_active: true,
  }
];

async function addTemplates() {
  console.log('📧 Adding Email Templates...\n');

  for (const template of templates) {
    try {
      // Check if template exists
      const { data: existing } = await supabase
        .from('email_templates')
        .select('id')
        .eq('template_key', template.template_key)
        .single();

      let result;
      if (existing) {
        // Update existing template
        const { data, error } = await supabase
          .from('email_templates')
          .update({
            name: template.name,
            subject: template.subject,
            html_content: template.html_content.trim(),
            text_content: template.text_content.trim(),
            is_active: template.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq('template_key', template.template_key)
          .select();

        if (error) throw error;
        result = data;
        console.log(`✅ Updated: ${template.name} (${template.template_key})`);
      } else {
        // Insert new template
        const { data, error } = await supabase
          .from('email_templates')
          .insert({
            template_key: template.template_key,
            name: template.name,
            subject: template.subject,
            html_content: template.html_content.trim(),
            text_content: template.text_content.trim(),
            is_active: template.is_active,
          })
          .select();

        if (error) throw error;
        result = data;
        console.log(`✅ Added: ${template.name} (${template.template_key})`);
      }
    } catch (error) {
      console.error(`❌ Error with ${template.template_key}:`, error.message);
    }
  }

  console.log('\n✨ Email templates setup complete!\n');
}

addTemplates().catch(console.error);
