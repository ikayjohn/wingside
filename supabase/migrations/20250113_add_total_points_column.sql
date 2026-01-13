-- Add total_points column to profiles table
-- This migration adds the points tracking columns to the profiles table

-- Add total_points column if it doesn't exist
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0;

-- Add column to track points earned from referrals if it doesn't exist
-- Note: total_referral_earnings might already exist, so we check first
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles'
        AND column_name = 'total_referral_earnings'
    ) THEN
        ALTER TABLE profiles ADD COLUMN total_referral_earnings INTEGER DEFAULT 0;
    END IF;
END $$;

-- Create an index on total_points for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_total_points ON profiles(total_points);

-- Add comment for documentation
COMMENT ON COLUMN profiles.total_points IS 'Total loyalty points earned by the customer (₦10 spent = 1 point)';
COMMENT ON COLUMN profiles.total_referral_earnings IS 'Total points earned from referral program';

-- Update existing profiles to have 0 points if NULL
UPDATE profiles
SET total_points = COALESCE(total_points, 0),
    total_referral_earnings = COALESCE(total_referral_earnings, 0)
WHERE total_points IS NULL OR total_referral_earnings IS NULL;
