-- Add Embedly Checkout payment gateway setting
-- This enables/disables the "Pay with Bank Transfer" option in checkout

-- Insert Embedly payment gateway setting
INSERT INTO site_settings (setting_key, setting_value, category, description, created_at, updated_at)
VALUES (
  'payment_gateway_embedly_enabled',
  'true',
  'payment_gateways',
  'Enable Embedly Checkout bank transfer payment gateway',
  NOW(),
  NOW()
)
ON CONFLICT (setting_key) DO UPDATE SET
  setting_value = 'true',
  updated_at = NOW();
