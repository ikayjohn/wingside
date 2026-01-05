-- Add auto_close_outside_hours setting
-- If it exists with 'business' category, update it to 'order_availability'
INSERT INTO site_settings (setting_key, setting_value, category, description, created_at, updated_at)
VALUES (
  'auto_close_outside_hours',
  'false',
  'order_availability',
  'Automatically disable orders outside business hours',
  NOW(),
  NOW()
)
ON CONFLICT (setting_key) DO UPDATE SET
  category = 'order_availability',
  description = 'Automatically disable orders outside business hours',
  updated_at = NOW();

-- Add opening hours settings for each day
-- If they exist with 'business' category, update them to 'order_availability'
INSERT INTO site_settings (setting_key, setting_value, category, description, created_at, updated_at)
VALUES
  ('monday_open', '11:00', 'order_availability', 'Monday opening time (24h format)', NOW(), NOW()),
  ('monday_close', '22:00', 'order_availability', 'Monday closing time (24h format)', NOW(), NOW()),
  ('tuesday_open', '11:00', 'order_availability', 'Tuesday opening time (24h format)', NOW(), NOW()),
  ('tuesday_close', '22:00', 'order_availability', 'Tuesday closing time (24h format)', NOW(), NOW()),
  ('wednesday_open', '11:00', 'order_availability', 'Wednesday opening time (24h format)', NOW(), NOW()),
  ('wednesday_close', '22:00', 'order_availability', 'Wednesday closing time (24h format)', NOW(), NOW()),
  ('thursday_open', '11:00', 'order_availability', 'Thursday opening time (24h format)', NOW(), NOW()),
  ('thursday_close', '22:00', 'order_availability', 'Thursday closing time (24h format)', NOW(), NOW()),
  ('friday_open', '11:00', 'order_availability', 'Friday opening time (24h format)', NOW(), NOW()),
  ('friday_close', '23:00', 'order_availability', 'Friday closing time (24h format)', NOW(), NOW()),
  ('saturday_open', '12:00', 'order_availability', 'Saturday opening time (24h format)', NOW(), NOW()),
  ('saturday_close', '23:00', 'order_availability', 'Saturday closing time (24h format)', NOW(), NOW()),
  ('sunday_open', '12:00', 'order_availability', 'Sunday opening time (24h format)', NOW(), NOW()),
  ('sunday_close', '21:00', 'order_availability', 'Sunday closing time (24h format)', NOW(), NOW())
ON CONFLICT (setting_key) DO UPDATE SET
  category = 'order_availability',
  updated_at = NOW();

-- Add timezone setting
INSERT INTO site_settings (setting_key, setting_value, category, description, created_at, updated_at)
VALUES (
  'business_timezone',
  'Africa/Lagos',
  'order_availability',
  'Timezone for business hours',
  NOW(),
  NOW()
)
ON CONFLICT (setting_key) DO UPDATE SET
  category = 'order_availability',
  updated_at = NOW();

-- Make sure any existing day-based settings in 'business' category are moved to 'order_availability'
UPDATE site_settings
SET category = 'order_availability'
WHERE category = 'business'
AND (
  setting_key LIKE '%_open' OR
  setting_key LIKE '%_close' OR
  setting_key = 'business_timezone'
);
