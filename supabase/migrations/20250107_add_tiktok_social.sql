-- Add TikTok social media setting
-- This adds TikTok to the available social media platforms

INSERT INTO site_settings (setting_key, setting_value, category, description, created_at, updated_at)
VALUES (
  'social_tiktok',
  'https://www.tiktok.com/@mywingside',
  'social',
  'TikTok profile URL',
  NOW(),
  NOW()
)
ON CONFLICT (setting_key) DO NOTHING;
