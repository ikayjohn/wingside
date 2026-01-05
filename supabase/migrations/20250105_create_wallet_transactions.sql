-- =====================================================
-- Wallet Transactions Table
-- =====================================================
-- This table tracks all wallet transactions for users
-- including credits, debits, and running balance

-- Create wallet_transactions table
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Transaction details
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
  amount DECIMAL(10, 2) NOT NULL,
  balance_after DECIMAL(10, 2) NOT NULL, -- Balance after this transaction

  -- Transaction metadata
  transaction_type TEXT NOT NULL CHECK (transaction_type IN (
    'refund',               -- Money refunded to wallet
    'funding',              -- Wallet funded by user
    'order_payment',        -- Order paid from wallet
    'referral_reward',      -- Points from referral program
    'first_order_bonus',    -- First order bonus
    'purchase_points',      -- Points earned from purchase
    'promo_credit',         -- Promo code credit
    'social_verification',  -- Social media verification reward
    'streak_bonus',         -- Daily streak bonus
    'manual_adjustment',    -- Admin manual adjustment
    'affiliate_commission', -- Affiliate earnings
    'cashback'              -- Cashback rewards
  )),

  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN (
    'pending',
    'completed',
    'failed',
    'reversed'
  )),

  -- References
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  referral_reward_id UUID REFERENCES public.referral_rewards(id) ON DELETE SET NULL,
  reward_claim_id UUID REFERENCES public.reward_claims(id) ON DELETE SET NULL,
  promo_code_id UUID REFERENCES public.promo_codes(id) ON DELETE SET NULL,

  -- Metadata for extensibility
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique index to prevent duplicate order payments
CREATE UNIQUE INDEX IF NOT EXISTS idx_wallet_transactions_unique_order_payment
ON public.wallet_transactions(transaction_type, order_id)
WHERE order_id IS NOT NULL;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON public.wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON public.wallet_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type ON public.wallet_transactions(type);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_status ON public.wallet_transactions(status);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_created ON public.wallet_transactions(user_id, created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE public.wallet_transactions IS 'Tracks all wallet transactions including credits, debits, and balance history';
COMMENT ON COLUMN public.wallet_transactions.type IS 'Transaction type: credit (money in) or debit (money out)';
COMMENT ON COLUMN public.wallet_transactions.balance_after IS 'Wallet balance after this transaction was applied';
COMMENT ON COLUMN public.wallet_transactions.transaction_type IS 'Category of transaction: refund, funding, order_payment, referral_reward, etc.';
COMMENT ON COLUMN public.wallet_transactions.status IS 'Transaction status: pending, completed, failed, reversed';

-- =====================================================
-- Helper Functions
-- =====================================================

-- Function to get current wallet balance for a user
CREATE OR REPLACE FUNCTION get_wallet_balance(p_user_id UUID)
RETURNS DECIMAL(10, 2)
AS $$
BEGIN
  RETURN COALESCE(
    (SELECT balance_after
     FROM public.wallet_transactions
     WHERE user_id = p_user_id AND status = 'completed'
     ORDER BY created_at DESC
     LIMIT 1),
    0
  );
END;
$$ LANGUAGE plpgsql;

-- Function to record a wallet transaction
CREATE OR REPLACE FUNCTION record_wallet_transaction(
  p_user_id UUID,
  p_type TEXT, -- 'credit' or 'debit'
  p_amount DECIMAL(10, 2),
  p_transaction_type TEXT,
  p_description TEXT,
  p_order_id UUID DEFAULT NULL,
  p_referral_reward_id UUID DEFAULT NULL,
  p_reward_claim_id UUID DEFAULT NULL,
  p_promo_code_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
AS $$
DECLARE
  v_current_balance DECIMAL(10, 2);
  v_new_balance DECIMAL(10, 2);
  v_transaction_id UUID;
BEGIN
  -- Get current balance
  v_current_balance := get_wallet_balance(p_user_id);

  -- Calculate new balance
  IF p_type = 'credit' THEN
    v_new_balance := v_current_balance + p_amount;
  ELSE
    -- Check if sufficient balance
    IF v_current_balance < p_amount THEN
      RAISE EXCEPTION 'Insufficient wallet balance. Current: %, Required: %', v_current_balance, p_amount;
    END IF;
    v_new_balance := v_current_balance - p_amount;
  END IF;

  -- Insert transaction
  INSERT INTO public.wallet_transactions (
    user_id,
    type,
    amount,
    balance_after,
    transaction_type,
    description,
    order_id,
    referral_reward_id,
    reward_claim_id,
    promo_code_id,
    metadata,
    status
  ) VALUES (
    p_user_id,
    p_type,
    p_amount,
    v_new_balance,
    p_transaction_type,
    p_description,
    p_order_id,
    p_referral_reward_id,
    p_reward_claim_id,
    p_promo_code_id,
    p_metadata,
    'completed'
  ) RETURNING id INTO v_transaction_id;

  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql;

-- Function to credit wallet (wrapper for convenience)
CREATE OR REPLACE FUNCTION credit_wallet(
  p_user_id UUID,
  p_amount DECIMAL(10, 2),
  p_transaction_type TEXT,
  p_description TEXT,
  p_referral_reward_id UUID DEFAULT NULL,
  p_reward_claim_id UUID DEFAULT NULL,
  p_promo_code_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
AS $$
BEGIN
  RETURN record_wallet_transaction(
    p_user_id,
    'credit',
    p_amount,
    p_transaction_type,
    p_description,
    NULL, -- order_id
    p_referral_reward_id,
    p_reward_claim_id,
    p_promo_code_id,
    p_metadata
  );
END;
$$ LANGUAGE plpgsql;

-- Function to debit wallet for order payment
CREATE OR REPLACE FUNCTION debit_wallet_for_order(
  p_user_id UUID,
  p_order_id UUID,
  p_amount DECIMAL(10, 2)
)
RETURNS UUID
AS $$
DECLARE
  v_order_number TEXT;
BEGIN
  -- Get order number for description
  SELECT order_number INTO v_order_number
  FROM public.orders
  WHERE id = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  -- Record debit transaction
  RETURN record_wallet_transaction(
    p_user_id,
    'debit',
    p_amount,
    'order_payment',
    'Order Payment - ' || v_order_number,
    p_order_id,
    NULL, -- referral_reward_id
    NULL, -- reward_claim_id
    NULL, -- promo_code_id
    '{"order_payment": true}'::JSONB
  );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Enable Row Level Security
-- =====================================================

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own wallet transactions
CREATE POLICY "Users can view own wallet transactions"
ON public.wallet_transactions
FOR SELECT
USING (auth.uid() = user_id);

-- Only service role can insert (via API functions)
CREATE POLICY "Service role can insert wallet transactions"
ON public.wallet_transactions
FOR INSERT
WITH CHECK (true);

-- =====================================================
-- Grant Permissions
-- =====================================================

-- Grant usage on functions
GRANT EXECUTE ON FUNCTION get_wallet_balance(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION record_wallet_transaction TO service_role;
GRANT EXECUTE ON FUNCTION credit_wallet TO service_role;
GRANT EXECUTE ON FUNCTION debit_wallet_for_order TO service_role;

-- Grant select on table
GRANT SELECT ON public.wallet_transactions TO authenticated;
GRANT ALL ON public.wallet_transactions TO service_role;
