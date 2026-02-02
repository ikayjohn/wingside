-- =====================================================
-- Complete Schema Fix for wallet_transactions Table
-- Adds all missing columns used by application code
-- =====================================================

-- Add currency column (e.g., 'NGN', 'USD')
ALTER TABLE wallet_transactions
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'NGN';

-- Add reference column (transaction reference for tracking)
ALTER TABLE wallet_transactions
ADD COLUMN IF NOT EXISTS reference VARCHAR(255);

-- Add updated_at column for tracking modifications
ALTER TABLE wallet_transactions
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Ensure balance_after exists (may already exist from previous migration)
ALTER TABLE wallet_transactions
ADD COLUMN IF NOT EXISTS balance_after DECIMAL(15,2);

-- Ensure transaction_type exists (may already exist from previous migration)
ALTER TABLE wallet_transactions
ADD COLUMN IF NOT EXISTS transaction_type VARCHAR(50);

-- Ensure foreign key columns exist (may already exist)
ALTER TABLE wallet_transactions
ADD COLUMN IF NOT EXISTS referral_reward_id UUID REFERENCES referral_rewards(id) ON DELETE SET NULL;

ALTER TABLE wallet_transactions
ADD COLUMN IF NOT EXISTS reward_claim_id UUID REFERENCES reward_claims(id) ON DELETE SET NULL;

ALTER TABLE wallet_transactions
ADD COLUMN IF NOT EXISTS promo_code_id UUID REFERENCES promo_codes(id) ON DELETE SET NULL;

ALTER TABLE wallet_transactions
ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id) ON DELETE SET NULL;

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_currency ON wallet_transactions(currency);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_reference ON wallet_transactions(reference);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_updated_at ON wallet_transactions(updated_at DESC);

-- Add indexes for foreign keys (if not already exist)
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_transaction_type ON wallet_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_referral_reward_id ON wallet_transactions(referral_reward_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_order_id ON wallet_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_reward_claim_id ON wallet_transactions(reward_claim_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_promo_code_id ON wallet_transactions(promo_code_id);

-- Add comments for documentation
COMMENT ON COLUMN wallet_transactions.currency IS 'Currency code (ISO 4217): NGN, USD, etc.';
COMMENT ON COLUMN wallet_transactions.reference IS 'Unique transaction reference for tracking and reconciliation';
COMMENT ON COLUMN wallet_transactions.updated_at IS 'Timestamp when transaction status was last updated';
COMMENT ON COLUMN wallet_transactions.balance_after IS 'Wallet balance after this transaction was applied';
COMMENT ON COLUMN wallet_transactions.transaction_type IS 'Type of transaction: funding, order_payment, referral_bonus, points_conversion, etc.';

-- Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_wallet_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_wallet_transactions_updated_at ON wallet_transactions;

CREATE TRIGGER trigger_update_wallet_transactions_updated_at
BEFORE UPDATE ON wallet_transactions
FOR EACH ROW
EXECUTE FUNCTION update_wallet_transactions_updated_at();

-- =====================================================
-- Summary of Changes:
-- =====================================================
-- ✅ Added currency column (VARCHAR(3), default 'NGN')
-- ✅ Added reference column (VARCHAR(255))
-- ✅ Added updated_at column with auto-update trigger
-- ✅ Ensured balance_after, transaction_type, and foreign keys exist
-- ✅ Added performance indexes
-- ✅ Added documentation comments
-- =====================================================
