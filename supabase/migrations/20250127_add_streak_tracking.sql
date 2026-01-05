-- Add streak tracking fields to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_order_date DATE,
ADD COLUMN IF NOT EXISTS streak_start_date DATE;

-- Create an index on last_order_date for faster streak calculations
CREATE INDEX IF NOT EXISTS idx_profiles_last_order_date ON profiles(last_order_date);

-- Add comments for documentation
COMMENT ON COLUMN profiles.current_streak IS 'Current consecutive days/days active streak';
COMMENT ON COLUMN profiles.longest_streak IS 'Longest streak achieved by the user';
COMMENT ON COLUMN profiles.last_order_date IS 'Date of the last order/activity';
COMMENT ON COLUMN profiles.streak_start_date IS 'Start date of the current streak';
