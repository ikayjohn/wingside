-- Notification Preferences
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email_enabled BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT false,
  sms_enabled BOOLEAN DEFAULT false,

  -- Email preferences
  email_order_confirmations BOOLEAN DEFAULT true,
  email_order_status BOOLEAN DEFAULT true,
  email_promotions BOOLEAN DEFAULT false,
  email_newsletter BOOLEAN DEFAULT false,
  email_rewards BOOLEAN DEFAULT true,
  email_reminders BOOLEAN DEFAULT true,

  -- Push preferences
  push_order_confirmations BOOLEAN DEFAULT true,
  push_order_status BOOLEAN DEFAULT true,
  push_promotions BOOLEAN DEFAULT false,
  push_rewards BOOLEAN DEFAULT true,

  -- SMS preferences
  sms_order_confirmations BOOLEAN DEFAULT false,
  sms_order_status BOOLEAN DEFAULT true,
  sms_promotions BOOLEAN DEFAULT false,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Email Templates
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  variables JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Notification Logs
CREATE TABLE notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  order_id UUID REFERENCES orders(id),
  notification_type TEXT NOT NULL, -- 'email', 'push', 'sms'
  template_key TEXT,
  channel TEXT, -- 'order_confirmation', 'order_status', 'promotion', etc.
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Push Notification Subscriptions (Web Push)
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_notification_preferences_user ON notification_preferences(user_id);
CREATE INDEX idx_notification_logs_user ON notification_logs(user_id);
CREATE INDEX idx_notification_logs_order ON notification_logs(order_id);
CREATE INDEX idx_notification_logs_type ON notification_logs(notification_type);
CREATE INDEX idx_notification_logs_status ON notification_logs(status);
CREATE INDEX idx_notification_logs_created ON notification_logs(created_at);
CREATE INDEX idx_push_subscriptions_user ON push_subscriptions(user_id);
CREATE INDEX idx_push_subscriptions_active ON push_subscriptions(is_active);

-- Enable Row Level Security
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notification_preferences
CREATE POLICY "Users can view own notification preferences"
  ON notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification preferences"
  ON notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification preferences"
  ON notification_preferences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for push_subscriptions
CREATE POLICY "Users can view own push subscriptions"
  ON push_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own push subscriptions"
  ON push_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own push subscriptions"
  ON push_subscriptions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own push subscriptions"
  ON push_subscriptions FOR DELETE
  USING (auth.uid() = user_id);

-- Admin policies for email_templates and notification_logs
CREATE POLICY "Admins can view all email_templates"
  ON email_templates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage email_templates"
  ON email_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can view all notification_logs"
  ON notification_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert notification_logs"
  ON notification_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Users can view their own notification logs
CREATE POLICY "Users can view own notification_logs"
  ON notification_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Create default notification preferences for existing users
INSERT INTO notification_preferences (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- Insert default email templates
INSERT INTO email_templates (template_key, name, subject, html_content, text_content, variables) VALUES
(
  'order_confirmation',
  'Order Confirmation',
  'Order Confirmation - Wingside',
  '
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
    <div style="background-color: #552627; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
      <h1 style="color: #F7C400; margin: 0; font-size: 32px;">Wingside</h1>
    </div>
    <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <h2 style="color: #552627; margin-top: 0;">Order Confirmed! 🎉</h2>
      <p style="color: #333; line-height: 1.6;">
        Hi {{customer_name}},
      </p>
      <p style="color: #333; line-height: 1.6;">
        Thank you for your order! We''ve received it and will get started on those delicious wings right away.
      </p>
      <div style="background-color: #FDF5E5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #552627; margin-top: 0;">Order Details</h3>
        <p style="color: #333; margin: 5px 0;"><strong>Order Number:</strong> {{order_number}}</p>
        <p style="color: #333; margin: 5px 0;"><strong>Total:</strong> {{total_amount}}</p>
        <p style="color: #333; margin: 5px 0;"><strong>Payment Method:</strong> {{payment_method}}</p>
        {{#if delivery_address}}
        <p style="color: #333; margin: 5px 0;"><strong>Delivery Address:</strong> {{delivery_address}}</p>
        {{/if}}
      </div>
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{order_tracking_url}}" style="background-color: #F7C400; color: #552627; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Track Your Order</a>
      </div>
      <p style="color: #666; font-size: 14px; line-height: 1.6;">
        Estimated preparation time: {{estimated_time}} minutes<br/>
        You''ll receive another notification when your order is ready for delivery/pickup.
      </p>
    </div>
    <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
      <p style="margin: 5px 0;">© 2026 Wingside Foods. All rights reserved.</p>
      <p style="margin: 5px 0;">Questions? Contact us at support@wingside.ng | 08091990199</p>
    </div>
  </div>
  ',
  '
  ORDER CONFIRMATION - Wingside

  Hi {{customer_name}},

  Thank you for your order! We''ve received it and will get started on those delicious wings right away.

  ORDER DETAILS
  Order Number: {{order_number}}
  Total: {{total_amount}}
  Payment Method: {{payment_method}}
  {{#if delivery_address}}Delivery Address: {{delivery_address}}{{/if}}

  Estimated preparation time: {{estimated_time}} minutes

  You''ll receive another notification when your order is ready for delivery/pickup.

  Track your order: {{order_tracking_url}}

  © 2026 Wingside Foods
  Questions? Contact us at support@wingside.ng | 08091990199
  ',
  '{"customer_name": "string", "order_number": "string", "total_amount": "string", "payment_method": "string", "delivery_address": "string?", "estimated_time": "number", "order_tracking_url": "string"}'::jsonb
),
(
  'order_ready',
  'Order Ready for Pickup/Delivery',
  'Your Wingside Order is Ready! 🍗',
  '
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
    <div style="background-color: #552627; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
      <h1 style="color: #F7C400; margin: 0; font-size: 32px;">Wingside</h1>
    </div>
    <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <h2 style="color: #552627; margin-top: 0;">Your Order is Ready! 🎉</h2>
      <p style="color: #333; line-height: 1.6;">
        Hi {{customer_name}},
      </p>
      <p style="color: #333; line-height: 1.6;">
        Great news! Your order #{{order_number}} is ready and on its way to you.
      </p>
      {{#if delivery_driver}}
      <div style="background-color: #FDF5E5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #552627; margin-top: 0;">Delivery Information</h3>
        <p style="color: #333; margin: 5px 0;"><strong>Driver:</strong> {{delivery_driver}}</p>
        <p style="color: #333; margin: 5px 0;"><strong>Estimated Arrival:</strong> {{estimated_arrival}}</p>
      </div>
      {{else}}
      <div style="background-color: #FDF5E5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #552627; margin-top: 0;">Pickup Information</h3>
        <p style="color: #333; margin: 5px 0;">Your order is ready for pickup at our location.</p>
        <p style="color: #333; margin: 5px 0;"><strong>Pickup Address:</strong> {{pickup_address}}</p>
      </div>
      {{/if}}
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{order_tracking_url}}" style="background-color: #F7C400; color: #552627; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Track Your Order</a>
      </div>
    </div>
    <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
      <p style="margin: 5px 0;">© 2026 Wingside Foods. All rights reserved.</p>
    </div>
  </div>
  ',
  '
  YOUR ORDER IS READY - Wingside

  Hi {{customer_name}},

  Great news! Your order #{{order_number}} is ready and on its way to you.

  {{#if delivery_driver}}DELIVERY INFORMATION
  Driver: {{delivery_driver}}
  Estimated Arrival: {{estimated_arrival}}
  {{else}}PICKUP INFORMATION
  Your order is ready for pickup at our location.
  Pickup Address: {{pickup_address}}
  {{/if}}

  Track your order: {{order_tracking_url}}

  © 2026 Wingside Foods
  ',
  '{"customer_name": "string", "order_number": "string", "delivery_driver": "string?", "estimated_arrival": "string?", "pickup_address": "string?", "order_tracking_url": "string"}'::jsonb
),
(
  'order_delivered',
  'Order Delivered',
  'Order Delivered - Enjoy Your Wings! 🍗',
  '
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
    <div style="background-color: #552627; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
      <h1 style="color: #F7C400; margin: 0; font-size: 32px;">Wingside</h1>
    </div>
    <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <h2 style="color: #552627; margin-top: 0;">Delivered! Enjoy Your Wings! 🎉</h2>
      <p style="color: #333; line-height: 1.6;">
        Hi {{customer_name}},
      </p>
      <p style="color: #333; line-height: 1.6;">
        Your order #{{order_number}} has been delivered. We hope you enjoy your delicious wings!
      </p>
      <div style="background-color: #FDF5E5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #552627; margin-top: 0;">Earned Rewards</h3>
        <p style="color: #333; margin: 5px 0;">You earned <strong>{{points_earned}}</strong> points from this order!</p>
        <p style="color: #333; margin: 5px 0;">Current Balance: <strong>{{total_points}}</strong> points</p>
      </div>
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{reorder_url}}" style="background-color: #F7C400; color: #552627; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Order Again</a>
      </div>
    </div>
    <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
      <p style="margin: 5px 0;">Rate your order: {{review_url}}</p>
      <p style="margin: 5px 0;">© 2026 Wingside Foods. All rights reserved.</p>
    </div>
  </div>
  ',
  '
  ORDER DELIVERED - Wingside

  Hi {{customer_name}},

  Your order #{{order_number}} has been delivered. We hope you enjoy your delicious wings!

  EARNED REWARDS
  You earned {{points_earned}} points from this order!
  Current Balance: {{total_points}} points

  Order again: {{reorder_url}}
  Rate your order: {{review_url}}

  © 2026 Wingside Foods
  ',
  '{"customer_name": "string", "order_number": "string", "points_earned": "number", "total_points": "number", "reorder_url": "string", "review_url": "string"}'::jsonb
),
(
  'promotion',
  'Special Promotion',
  'Special Offer from Wingside! 🔥',
  '
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
    <div style="background-color: #552627; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
      <h1 style="color: #F7C400; margin: 0; font-size: 32px;">Wingside</h1>
    </div>
    <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <h2 style="color: #552627; margin-top: 0;">{{promo_title}}</h2>
      <p style="color: #333; line-height: 1.6; font-size: 18px;">
        {{promo_message}}
      </p>
      {{#if discount_code}}
      <div style="background-color: #FDF5E5; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
        <p style="color: #552627; font-size: 24px; font-weight: bold; margin: 10px 0;">Use Code: {{discount_code}}</p>
        <p style="color: #666; margin: 10px 0;">Valid until: {{expiry_date}}</p>
      </div>
      {{/if}}
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{cta_url}}" style="background-color: #F7C400; color: #552627; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">{{cta_text}}</a>
      </div>
    </div>
    <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
      <p style="margin: 5px 0;">© 2026 Wingside Foods. All rights reserved.</p>
    </div>
  </div>
  ',
  '
  SPECIAL OFFER - Wingside

  {{promo_title}}

  {{promo_message}}

  {{#if discount_code}}Use Code: {{discount_code}}
  Valid until: {{expiry_date}}{{/if}}

  {{cta_text}}: {{cta_url}}

  © 2026 Wingside Foods
  ',
  '{"promo_title": "string", "promo_message": "string", "discount_code": "string?", "expiry_date": "string?", "cta_url": "string", "cta_text": "string"}'::jsonb
),
(
  'reward_earned',
  'Reward Earned',
  'You Earned Rewards! 🎁',
  '
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
    <div style="background-color: #552627; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
      <h1 style="color: #F7C400; margin: 0; font-size: 32px;">Wingside</h1>
    </div>
    <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <h2 style="color: #552627; margin-top: 0;">Congratulations! 🎉</h2>
      <p style="color: #333; line-height: 1.6;">
        Hi {{customer_name}},
      </p>
      <p style="color: #333; line-height: 1.6;">
        {{reward_message}}
      </p>
      <div style="background-color: #FDF5E5; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
        <p style="color: #552627; font-size: 32px; font-weight: bold; margin: 10px 0;">+{{points_earned}} Points</p>
        <p style="color: #666; margin: 10px 0;">Your Balance: {{total_points}} Points</p>
      </div>
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{rewards_url}}" style="background-color: #F7C400; color: #552627; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">View Rewards</a>
      </div>
    </div>
    <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
      <p style="margin: 5px 0;">© 2026 Wingside Foods. All rights reserved.</p>
    </div>
  </div>
  ',
  '
  YOU EARNED REWARDS - Wingside

  Hi {{customer_name}},

  {{reward_message}}

  +{{points_earned}} Points
  Your Balance: {{total_points}} Points

  View your rewards: {{rewards_url}}

  © 2026 Wingside Foods
  ',
  '{"customer_name": "string", "reward_message": "string", "points_earned": "number", "total_points": "number", "rewards_url": "string"}'::jsonb
),
(
  'password_reset',
  'Password Reset',
  'Reset Your Password - Wingside',
  '
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
    <div style="background-color: #552627; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
      <h1 style="color: #F7C400; margin: 0; font-size: 32px;">Wingside</h1>
    </div>
    <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <h2 style="color: #552627; margin-top: 0;">Reset Your Password</h2>
      <p style="color: #333; line-height: 1.6;">
        Hi {{customer_name}},
      </p>
      <p style="color: #333; line-height: 1.6;">
        We received a request to reset your password. Click the button below to create a new password:
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{reset_url}}" style="background-color: #F7C400; color: #552627; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
      </div>
      <p style="color: #666; font-size: 14px; line-height: 1.6;">
        This link will expire in 1 hour.<br/>
        If you didn''t request this, please ignore this email.
      </p>
    </div>
    <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
      <p style="margin: 5px 0;">© 2026 Wingside Foods. All rights reserved.</p>
    </div>
  </div>
  ',
  '
  RESET YOUR PASSWORD - Wingside

  Hi {{customer_name}},

  We received a request to reset your password. Click the link below to create a new password:

  {{reset_url}}

  This link will expire in 1 hour.

  If you didn''t request this, please ignore this email.

  © 2026 Wingside Foods
  ',
  '{"customer_name": "string", "reset_url": "string"}'::jsonb
);

-- Function to update notification preferences
CREATE OR REPLACE FUNCTION update_notification_preferences(
  p_user_id UUID,
  p_email_enabled BOOLEAN DEFAULT NULL,
  p_push_enabled BOOLEAN DEFAULT NULL,
  p_sms_enabled BOOLEAN DEFAULT NULL,
  p_email_order_confirmations BOOLEAN DEFAULT NULL,
  p_email_order_status BOOLEAN DEFAULT NULL,
  p_email_promotions BOOLEAN DEFAULT NULL,
  p_email_newsletter BOOLEAN DEFAULT NULL,
  p_email_rewards BOOLEAN DEFAULT NULL,
  p_email_reminders BOOLEAN DEFAULT NULL,
  p_push_order_confirmations BOOLEAN DEFAULT NULL,
  p_push_order_status BOOLEAN DEFAULT NULL,
  p_push_promotions BOOLEAN DEFAULT NULL,
  p_push_rewards BOOLEAN DEFAULT NULL,
  p_sms_order_confirmations BOOLEAN DEFAULT NULL,
  p_sms_order_status BOOLEAN DEFAULT NULL,
  p_sms_promotions BOOLEAN DEFAULT NULL
)
RETURNS notification_preferences AS $$
DECLARE
  v_prefs notification_preferences;
BEGIN
  INSERT INTO notification_preferences (
    user_id,
    email_enabled,
    push_enabled,
    sms_enabled,
    email_order_confirmations,
    email_order_status,
    email_promotions,
    email_newsletter,
    email_rewards,
    email_reminders,
    push_order_confirmations,
    push_order_status,
    push_promotions,
    push_rewards,
    sms_order_confirmations,
    sms_order_status,
    sms_promotions
  ) VALUES (
    p_user_id,
    COALESCE(p_email_enabled, true),
    COALESCE(p_push_enabled, false),
    COALESCE(p_sms_enabled, false),
    COALESCE(p_email_order_confirmations, true),
    COALESCE(p_email_order_status, true),
    COALESCE(p_email_promotions, false),
    COALESCE(p_email_newsletter, false),
    COALESCE(p_email_rewards, true),
    COALESCE(p_email_reminders, true),
    COALESCE(p_push_order_confirmations, true),
    COALESCE(p_push_order_status, true),
    COALESCE(p_push_promotions, false),
    COALESCE(p_push_rewards, true),
    COALESCE(p_sms_order_confirmations, false),
    COALESCE(p_sms_order_status, true),
    COALESCE(p_sms_promotions, false)
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email_enabled = COALESCE(p_email_enabled, notification_preferences.email_enabled),
    push_enabled = COALESCE(p_push_enabled, notification_preferences.push_enabled),
    sms_enabled = COALESCE(p_sms_enabled, notification_preferences.sms_enabled),
    email_order_confirmations = COALESCE(p_email_order_confirmations, notification_preferences.email_order_confirmations),
    email_order_status = COALESCE(p_email_order_status, notification_preferences.email_order_status),
    email_promotions = COALESCE(p_email_promotions, notification_preferences.email_promotions),
    email_newsletter = COALESCE(p_email_newsletter, notification_preferences.email_newsletter),
    email_rewards = COALESCE(p_email_rewards, notification_preferences.email_rewards),
    email_reminders = COALESCE(p_email_reminders, notification_preferences.email_reminders),
    push_order_confirmations = COALESCE(p_push_order_confirmations, notification_preferences.push_order_confirmations),
    push_order_status = COALESCE(p_push_order_status, notification_preferences.push_order_status),
    push_promotions = COALESCE(p_push_promotions, notification_preferences.push_promotions),
    push_rewards = COALESCE(p_push_rewards, notification_preferences.push_rewards),
    sms_order_confirmations = COALESCE(p_sms_order_confirmations, notification_preferences.sms_order_confirmations),
    sms_order_status = COALESCE(p_sms_order_status, notification_preferences.sms_order_status),
    sms_promotions = COALESCE(p_sms_promotions, notification_preferences.sms_promotions),
    updated_at = NOW()
  RETURNING * INTO v_prefs;

  RETURN v_prefs;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_notification_preferences TO authenticated;
