-- Migration: Add delivery cutoff time setting
-- Date: 2026-02-14
-- Description: Add configurable delivery cutoff time (default 6pm)

-- Insert delivery cutoff time setting
INSERT INTO site_settings (setting_key, setting_value, category, created_at, updated_at)
VALUES (
  'delivery_cutoff_time',
  '18:00',
  'orders',
  NOW(),
  NOW()
)
ON CONFLICT (setting_key) DO NOTHING;

-- Add comment for documentation
COMMENT ON COLUMN site_settings.setting_value IS 'For delivery_cutoff_time: HH:MM format (24-hour) in Nigeria time (WAT/UTC+1). Delivery orders disabled after this time.';
