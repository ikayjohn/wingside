-- Add missing Embedly fields to profiles table
-- These are referenced in the auto-wallet API but were missing

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bank_account VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bank_code VARCHAR(20);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_wallet_active BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_wallet_sync TIMESTAMP WITH TIME ZONE;

-- Add indexes for lookups
CREATE INDEX IF NOT EXISTS idx_profiles_bank_account ON profiles(bank_account);
CREATE INDEX IF NOT EXISTS idx_profiles_is_wallet_active ON profiles(is_wallet_active);

-- Verify columns were added
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN (
    'bank_account',
    'bank_name',
    'bank_code',
    'is_wallet_active',
    'last_wallet_sync',
    'embedly_customer_id',
    'embedly_wallet_id',
    'wallet_balance'
  )
ORDER BY column_name;
