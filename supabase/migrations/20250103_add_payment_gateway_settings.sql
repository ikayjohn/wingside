-- Add payment gateway enable/disable settings
-- This allows admins to toggle which payment gateways are available

-- Enable/disable Paystack payment gateway
INSERT INTO site_settings (setting_key, setting_value, category, description, created_at, updated_at)
VALUES (
  'payment_gateway_paystack_enabled',
  'true',
  'payment',
  'Enable or disable Paystack payment gateway (true/false)',
  NOW(),
  NOW()
)
ON CONFLICT (setting_key) DO NOTHING;

-- Enable/disable Nomba payment gateway
INSERT INTO site_settings (setting_key, setting_value, category, description, created_at, updated_at)
VALUES (
  'payment_gateway_nomba_enabled',
  'true',
  'payment',
  'Enable or disable Nomba payment gateway (true/false)',
  NOW(),
  NOW()
)
ON CONFLICT (setting_key) DO NOTHING;

-- Enable/disable Wallet payment option
INSERT INTO site_settings (setting_key, setting_value, category, description, created_at, updated_at)
VALUES (
  'payment_gateway_wallet_enabled',
  'true',
  'payment',
  'Enable or disable Wallet payment option (true/false)',
  NOW(),
  NOW()
)
ON CONFLICT (setting_key) DO NOTHING;

-- Add comment for documentation
COMMENT ON COLUMN site_settings.setting_value IS 'For payment gateways: true = enabled, false = disabled';
