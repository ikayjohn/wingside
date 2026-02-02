-- Quick insert for navigation visibility settings
-- Run this in Supabase SQL Editor

INSERT INTO site_settings (setting_key, setting_value, category, description) VALUES
  -- Header (7)
  ('page_visible_wingclub', 'true', 'navigation', 'Show/hide Wingclub in Header sidebar'),
  ('page_visible_business', 'true', 'navigation', 'Show/hide Wingside Business in Header sidebar'),
  ('page_visible_wingcafe', 'true', 'navigation', 'Show/hide Wingcafé in Header sidebar'),
  ('page_visible_gifts', 'true', 'navigation', 'Show/hide Wingside Gifts in Header sidebar'),
  ('page_visible_connect', 'true', 'navigation', 'Show/hide Wingside Connect in Header sidebar'),
  ('page_visible_kids', 'true', 'navigation', 'Show/hide Wingside Kids in Header sidebar'),
  ('page_visible_sports', 'true', 'navigation', 'Show/hide Wingside Sports in Header sidebar'),
  -- Footer Company (8)
  ('page_visible_about', 'true', 'navigation', 'Show/hide About Us in Footer'),
  ('page_visible_hotspots', 'true', 'navigation', 'Show/hide Wingside Hotspots in Footer'),
  ('page_visible_wingside_to_go', 'true', 'navigation', 'Show/hide Wingside To-Go in Footer'),
  ('page_visible_support', 'true', 'navigation', 'Show/hide Support in Footer'),
  ('page_visible_blog', 'true', 'navigation', 'Show/hide Blog in Footer'),
  ('page_visible_flavors', 'true', 'navigation', 'Show/hide Flavors in Footer'),
  ('page_visible_gift_balance', 'true', 'navigation', 'Show/hide Gift Card Balance in Footer'),
  ('page_visible_contact', 'true', 'navigation', 'Show/hide Contact Us in Footer'),
  -- Footer Get Involved (4)
  ('page_visible_careers', 'true', 'navigation', 'Show/hide Careers in Footer'),
  ('page_visible_franchising', 'true', 'navigation', 'Show/hide Franchising in Footer'),
  ('page_visible_wingside_cares', 'true', 'navigation', 'Show/hide Wingside Cares in Footer'),
  ('page_visible_partnership', 'true', 'navigation', 'Show/hide Partnership in Footer'),
  -- Footer Legal (3)
  ('page_visible_cookie_preferences', 'true', 'navigation', 'Show/hide Cookie Preferences in Footer'),
  ('page_visible_terms', 'true', 'navigation', 'Show/hide Terms & Conditions in Footer'),
  ('page_visible_privacy', 'true', 'navigation', 'Show/hide Privacy Policy in Footer')
ON CONFLICT (setting_key) DO NOTHING;

-- Verify
SELECT COUNT(*) as navigation_settings_count FROM site_settings WHERE category = 'navigation';
