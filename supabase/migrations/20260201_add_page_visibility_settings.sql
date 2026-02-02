-- Migration: Add page visibility settings to site_settings table
-- Created: 2026-02-01
-- Purpose: Enable admin control over navigation menu visibility
--
-- This migration adds 23 new settings to manage which pages appear in:
-- - Header sidebar menu (7 links)
-- - Footer Company section (8 links)
-- - Footer Get Involved section (4 links)
-- - Footer Legal section (3 links)
--
-- All pages default to visible (value: 'true') for backward compatibility

-- ============================================
-- HEADER SIDEBAR MENU LINKS (7 settings)
-- ============================================
INSERT INTO site_settings (setting_key, setting_value, category, description)
VALUES
  ('page_visible_wingclub', 'true', 'navigation', 'Show/hide Wingclub in Header sidebar'),
  ('page_visible_business', 'true', 'navigation', 'Show/hide Wingside Business in Header sidebar'),
  ('page_visible_wingcafe', 'true', 'navigation', 'Show/hide Wingcafé in Header sidebar'),
  ('page_visible_gifts', 'true', 'navigation', 'Show/hide Wingside Gifts in Header sidebar'),
  ('page_visible_connect', 'true', 'navigation', 'Show/hide Wingside Connect in Header sidebar'),
  ('page_visible_kids', 'true', 'navigation', 'Show/hide Wingside Kids in Header sidebar'),
  ('page_visible_sports', 'true', 'navigation', 'Show/hide Wingside Sports in Header sidebar')
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================
-- FOOTER COMPANY SECTION LINKS (8 settings)
-- ============================================
INSERT INTO site_settings (setting_key, setting_value, category, description)
VALUES
  ('page_visible_about', 'true', 'navigation', 'Show/hide About Us in Footer Company section'),
  ('page_visible_hotspots', 'true', 'navigation', 'Show/hide Wingside Hotspots in Footer Company section'),
  ('page_visible_wingside_to_go', 'true', 'navigation', 'Show/hide Wingside To-Go in Footer Company section'),
  ('page_visible_support', 'true', 'navigation', 'Show/hide Support in Footer Company section'),
  ('page_visible_blog', 'true', 'navigation', 'Show/hide Blog in Footer Company section'),
  ('page_visible_flavors', 'true', 'navigation', 'Show/hide Flavors in Footer Company section'),
  ('page_visible_gift_balance', 'true', 'navigation', 'Show/hide Gift Card Balance in Footer Company section'),
  ('page_visible_contact', 'true', 'navigation', 'Show/hide Contact Us in Footer Company section')
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================
-- FOOTER GET INVOLVED SECTION LINKS (4 settings)
-- ============================================
INSERT INTO site_settings (setting_key, setting_value, category, description)
VALUES
  ('page_visible_careers', 'true', 'navigation', 'Show/hide Careers in Footer Get Involved section'),
  ('page_visible_franchising', 'true', 'navigation', 'Show/hide Franchising in Footer Get Involved section'),
  ('page_visible_wingside_cares', 'true', 'navigation', 'Show/hide Wingside Cares in Footer Get Involved section'),
  ('page_visible_partnership', 'true', 'navigation', 'Show/hide Partnership in Footer Get Involved section')
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================
-- FOOTER LEGAL SECTION LINKS (3 settings)
-- Note: Terms and Privacy are always visible for legal compliance
-- ============================================
INSERT INTO site_settings (setting_key, setting_value, category, description)
VALUES
  ('page_visible_cookie_preferences', 'true', 'navigation', 'Show/hide Cookie Preferences in Footer Legal section'),
  ('page_visible_terms', 'true', 'navigation', 'Show/hide Terms & Conditions in Footer Legal section (always visible for legal compliance)'),
  ('page_visible_privacy', 'true', 'navigation', 'Show/hide Privacy Policy in Footer Legal section (always visible for legal compliance)')
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================
-- VERIFICATION
-- ============================================
-- Verify all 23 settings were inserted
DO $$
DECLARE
  navigation_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO navigation_count
  FROM site_settings
  WHERE category = 'navigation';

  IF navigation_count < 23 THEN
    RAISE WARNING 'Expected 23 navigation settings, found %', navigation_count;
  ELSE
    RAISE NOTICE 'Successfully verified % navigation settings', navigation_count;
  END IF;
END $$;
