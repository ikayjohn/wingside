-- Add accept_orders setting to site_settings table
-- This allows admins to toggle orders on/off from the settings page

INSERT INTO site_settings (setting_key, setting_value, category, description, created_at, updated_at)
VALUES (
  'accept_orders',
  'true',
  'general',
  'Whether the website is currently accepting orders',
  NOW(),
  NOW()
)
ON CONFLICT (setting_key) DO NOTHING;

-- Add comment for documentation
COMMENT ON COLUMN site_settings.setting_value IS 'For accept_orders: true = accepting orders, false = orders disabled';
