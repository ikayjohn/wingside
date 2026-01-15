-- Add missing columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS date_of_birth TEXT,
ADD COLUMN IF NOT EXISTS gender TEXT;

-- Create comment
COMMENT ON COLUMN profiles.date_of_birth IS 'Date of birth in DD-MM or DD-MM-YYYY format';
COMMENT ON COLUMN profiles.gender IS 'Gender: Male or Female';
