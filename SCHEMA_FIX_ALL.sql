-- =====================================================
-- COMPREHENSIVE SCHEMA FIX FOR WINGSIDE DATABASE
-- Run this on production to fix all schema mismatches
-- =====================================================

-- =====================================================
-- 1. Fix wallet_transactions Table
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

-- Ensure balance_after exists
ALTER TABLE wallet_transactions
ADD COLUMN IF NOT EXISTS balance_after DECIMAL(15,2);

-- Ensure transaction_type exists
ALTER TABLE wallet_transactions
ADD COLUMN IF NOT EXISTS transaction_type VARCHAR(50);

-- Ensure foreign key columns exist
ALTER TABLE wallet_transactions
ADD COLUMN IF NOT EXISTS referral_reward_id UUID REFERENCES referral_rewards(id) ON DELETE SET NULL;

ALTER TABLE wallet_transactions
ADD COLUMN IF NOT EXISTS reward_claim_id UUID REFERENCES reward_claims(id) ON DELETE SET NULL;

ALTER TABLE wallet_transactions
ADD COLUMN IF NOT EXISTS promo_code_id UUID REFERENCES promo_codes(id) ON DELETE SET NULL;

ALTER TABLE wallet_transactions
ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id) ON DELETE SET NULL;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_currency ON wallet_transactions(currency);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_reference ON wallet_transactions(reference);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_updated_at ON wallet_transactions(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_transaction_type ON wallet_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_referral_reward_id ON wallet_transactions(referral_reward_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_order_id ON wallet_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_reward_claim_id ON wallet_transactions(reward_claim_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_promo_code_id ON wallet_transactions(promo_code_id);

-- Add comments
COMMENT ON COLUMN wallet_transactions.currency IS 'Currency code (ISO 4217): NGN, USD, etc.';
COMMENT ON COLUMN wallet_transactions.reference IS 'Unique transaction reference for tracking';
COMMENT ON COLUMN wallet_transactions.updated_at IS 'Timestamp when transaction was last updated';
COMMENT ON COLUMN wallet_transactions.balance_after IS 'Wallet balance after transaction';
COMMENT ON COLUMN wallet_transactions.transaction_type IS 'Type: funding, order_payment, etc.';

-- =====================================================
-- 2. Ensure orders Table Has All Required Fields
-- =====================================================

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255);

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_gateway VARCHAR(50);

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS transaction_reference VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_orders_payment_reference ON orders(payment_reference);
CREATE INDEX IF NOT EXISTS idx_orders_transaction_reference ON orders(transaction_reference);
CREATE INDEX IF NOT EXISTS idx_orders_payment_gateway ON orders(payment_gateway);

COMMENT ON COLUMN orders.payment_reference IS 'Payment gateway reference/transaction ID';
COMMENT ON COLUMN orders.paid_at IS 'Timestamp when payment was confirmed';
COMMENT ON COLUMN orders.payment_gateway IS 'Payment gateway used: paystack, nomba, wallet, etc.';
COMMENT ON COLUMN orders.transaction_reference IS 'Internal transaction reference';

-- =====================================================
-- 3. Create updated_at Trigger for wallet_transactions
-- =====================================================

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
-- 4. Verify Schema
-- =====================================================

-- Run these queries to verify the fixes:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'wallet_transactions' ORDER BY ordinal_position;
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'orders' AND column_name LIKE '%payment%' OR column_name LIKE '%reference%';

-- =====================================================
-- Summary:
-- =====================================================
-- ✅ Fixed wallet_transactions: added currency, reference, updated_at
-- ✅ Fixed orders: ensured payment tracking fields exist
-- ✅ Added all necessary indexes for performance
-- ✅ Added triggers for auto-update timestamps
-- ✅ Added documentation comments
-- =====================================================

SELECT 'Schema fix completed successfully! ✅' AS status;
