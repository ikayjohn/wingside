-- Add latitude and longitude columns to stores table
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Update the two existing stores with correct coordinates
-- Store 1: WINGSIDE Port Harcourt - 4.8215029, 6.9979447
UPDATE stores
SET latitude = 4.8215029,
    longitude = 6.9979447
WHERE name = 'WINGSIDE Port Harcourt';

-- Store 2: WINGSIDE Sani Abacha - 4.8155927, 6.9917649
UPDATE stores
SET latitude = 4.8155927,
    longitude = 6.9917649
WHERE name = 'WINGSIDE Sani Abacha';
