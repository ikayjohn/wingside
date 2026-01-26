-- Fix wallet_transactions table schema to match code usage
-- Add missing columns that are being inserted by application code

-- Add balance_after column (tracks balance after each transaction)
ALTER TABLE wallet_transactions
ADD COLUMN IF NOT EXISTS balance_after DECIMAL(15,2);

-- Add transaction_type column (e.g., 'funding', 'order_payment', 'referral_bonus')
ALTER TABLE wallet_transactions
ADD COLUMN IF NOT EXISTS transaction_type VARCHAR(50);

-- Add foreign key reference columns
ALTER TABLE wallet_transactions
ADD COLUMN IF NOT EXISTS referral_reward_id UUID REFERENCES referral_rewards(id) ON DELETE SET NULL;

ALTER TABLE wallet_transactions
ADD COLUMN IF NOT EXISTS reward_claim_id UUID REFERENCES reward_claims(id) ON DELETE SET NULL;

ALTER TABLE wallet_transactions
ADD COLUMN IF NOT EXISTS promo_code_id UUID REFERENCES promo_codes(id) ON DELETE SET NULL;

ALTER TABLE wallet_transactions
ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id) ON DELETE SET NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_transaction_type ON wallet_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_referral_reward_id ON wallet_transactions(referral_reward_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_order_id ON wallet_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_created ON wallet_transactions(user_id, created_at DESC);

-- Add comment explaining the schema
COMMENT ON COLUMN wallet_transactions.balance_after IS 'Balance after this transaction was applied';
COMMENT ON COLUMN wallet_transactions.transaction_type IS 'Type of transaction: funding, order_payment, referral_bonus, points_conversion, etc.';
