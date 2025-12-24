-- Add birthday day and month columns to profiles table
-- This allows customers to save their birthday for special rewards

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS birthday_day INTEGER,
ADD COLUMN IF NOT EXISTS birthday_month INTEGER;

-- Add comment for documentation
COMMENT ON COLUMN profiles.birthday_day IS 'Day of the month for customer birthday (1-31)';
COMMENT ON COLUMN profiles.birthday_month IS 'Month for customer birthday (1-12)';
