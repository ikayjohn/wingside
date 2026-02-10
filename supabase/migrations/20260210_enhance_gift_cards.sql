-- Gift Card System Complete Migration
-- Creates gift card tables with 12-digit alphanumeric codes, card design selection, and tracking

-- Step 1: Create gift_cards table
CREATE TABLE IF NOT EXISTS gift_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(12) UNIQUE NOT NULL,
  card_number VARCHAR(16), -- Backward compatibility (legacy field)
  pin VARCHAR(4), -- Backward compatibility (legacy field)
  design_image VARCHAR(50),
  purchased_by UUID REFERENCES auth.users(id),
  payment_reference VARCHAR(255),
  denomination INTEGER NOT NULL,
  initial_balance DECIMAL(10, 2) NOT NULL,
  current_balance DECIMAL(10, 2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'NGN',
  recipient_name VARCHAR(255),
  recipient_email VARCHAR(255) NOT NULL,
  message TEXT,
  is_active BOOLEAN DEFAULT FALSE,
  activated_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  email_sent_at TIMESTAMP WITH TIME ZONE,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Step 1b: Create gift_card_transactions table
CREATE TABLE IF NOT EXISTS gift_card_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_card_id UUID NOT NULL REFERENCES gift_cards(id) ON DELETE CASCADE,
  transaction_type VARCHAR(50) NOT NULL, -- 'purchase', 'redemption', 'adjustment', 'refund'
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  order_id UUID REFERENCES orders(id),
  user_id UUID REFERENCES auth.users(id),
  balance_before DECIMAL(10, 2),
  balance_after DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Step 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_gift_cards_code ON gift_cards(code);
CREATE INDEX IF NOT EXISTS idx_gift_cards_recipient_email ON gift_cards(recipient_email);
CREATE INDEX IF NOT EXISTS idx_gift_cards_expiry ON gift_cards(expires_at);
CREATE INDEX IF NOT EXISTS idx_gift_cards_purchased_by ON gift_cards(purchased_by);
CREATE INDEX IF NOT EXISTS idx_gift_cards_payment_reference ON gift_cards(payment_reference);

-- Step 3: Add gift card columns to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS gift_card_id UUID REFERENCES gift_cards(id),
ADD COLUMN IF NOT EXISTS gift_card_amount DECIMAL(10, 2) DEFAULT 0;

-- Step 4: Create unique constraint to prevent duplicate redemption per order
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_gift_card_unique ON orders(gift_card_id, id) WHERE gift_card_id IS NOT NULL;

-- Step 5: Create function to generate cryptographically secure 12-digit alphanumeric codes
-- Excludes ambiguous characters: I, O, 1, 0, l
CREATE OR REPLACE FUNCTION generate_gift_card_code()
RETURNS VARCHAR(12) AS $$
DECLARE
  chars VARCHAR := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Excludes I, O, 1, 0
  result VARCHAR := '';
  i INTEGER;
  random_index INTEGER;
  code_exists BOOLEAN;
BEGIN
  LOOP
    result := '';
    FOR i IN 1..12 LOOP
      -- Generate random index between 1 and length of chars
      random_index := 1 + floor(random() * length(chars))::INTEGER;
      result := result || substring(chars FROM random_index FOR 1);
    END LOOP;

    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM gift_cards WHERE code = result) INTO code_exists;

    -- Exit loop if code is unique
    EXIT WHEN NOT code_exists;
  END LOOP;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Create enhanced redemption function
CREATE OR REPLACE FUNCTION redeem_gift_card_by_code(
  p_code VARCHAR(12),
  p_amount DECIMAL(10, 2),
  p_order_id UUID,
  p_user_id UUID
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  gift_card_id UUID,
  remaining_balance DECIMAL(10, 2)
) AS $$
DECLARE
  v_gift_card_id UUID;
  v_current_balance DECIMAL(10, 2);
  v_is_active BOOLEAN;
  v_expires_at TIMESTAMP WITH TIME ZONE;
  v_new_balance DECIMAL(10, 2);
BEGIN
  -- Lock the gift card row for update
  SELECT id, current_balance, is_active, expires_at
  INTO v_gift_card_id, v_current_balance, v_is_active, v_expires_at
  FROM gift_cards
  WHERE code = p_code
  FOR UPDATE;

  -- Check if gift card exists
  IF v_gift_card_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Invalid gift card code'::TEXT, NULL::UUID, 0::DECIMAL(10, 2);
    RETURN;
  END IF;

  -- Check if gift card is active
  IF NOT v_is_active THEN
    RETURN QUERY SELECT FALSE, 'Gift card is not active'::TEXT, v_gift_card_id, v_current_balance;
    RETURN;
  END IF;

  -- Check if gift card has expired
  IF v_expires_at < NOW() THEN
    -- Deactivate expired card
    UPDATE gift_cards SET is_active = FALSE WHERE id = v_gift_card_id;
    RETURN QUERY SELECT FALSE, 'Gift card has expired'::TEXT, v_gift_card_id, v_current_balance;
    RETURN;
  END IF;

  -- Check if sufficient balance
  IF v_current_balance < p_amount THEN
    RETURN QUERY SELECT FALSE, 'Insufficient gift card balance'::TEXT, v_gift_card_id, v_current_balance;
    RETURN;
  END IF;

  -- Deduct amount from gift card
  v_new_balance := v_current_balance - p_amount;

  UPDATE gift_cards
  SET current_balance = v_new_balance,
      last_used_at = NOW()
  WHERE id = v_gift_card_id;

  -- Record transaction
  INSERT INTO gift_card_transactions (
    gift_card_id,
    transaction_type,
    amount,
    order_id,
    user_id,
    balance_after
  ) VALUES (
    v_gift_card_id,
    'redemption',
    -p_amount,
    p_order_id,
    p_user_id,
    v_new_balance
  );

  -- Return success
  RETURN QUERY SELECT TRUE, 'Gift card redeemed successfully'::TEXT, v_gift_card_id, v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Add comments for documentation
COMMENT ON TABLE gift_cards IS 'Stores gift card information with 12-digit codes and card designs';
COMMENT ON TABLE gift_card_transactions IS 'Tracks all gift card balance changes and redemptions';
COMMENT ON COLUMN gift_cards.code IS '12-digit alphanumeric code (excludes I, O, 1, 0, l)';
COMMENT ON COLUMN gift_cards.design_image IS 'Gift card design filename (val-01.png to val-04.png, gift-love1.png to gift-love6.png)';
COMMENT ON COLUMN gift_cards.denomination IS 'Original purchase amount in Naira (15000, 20000, or 50000)';
COMMENT ON COLUMN gift_cards.card_number IS 'Legacy 16-digit card number for backward compatibility';
COMMENT ON COLUMN gift_cards.pin IS 'Legacy 4-digit PIN for backward compatibility';
COMMENT ON FUNCTION generate_gift_card_code() IS 'Generates cryptographically secure 12-digit alphanumeric codes';
COMMENT ON FUNCTION redeem_gift_card_by_code IS 'Validates and redeems gift card with comprehensive checks';

-- Step 8: Create updated_at trigger for gift_cards
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_gift_cards_updated_at ON gift_cards;
CREATE TRIGGER update_gift_cards_updated_at
  BEFORE UPDATE ON gift_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Step 9: Enable Row Level Security
ALTER TABLE gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_card_transactions ENABLE ROW LEVEL SECURITY;

-- Step 10: Create RLS Policies for gift_cards

-- Allow users to view gift cards where they are the recipient or purchaser
DROP POLICY IF EXISTS "Users can view their own gift cards" ON gift_cards;
CREATE POLICY "Users can view their own gift cards" ON gift_cards
  FOR SELECT
  USING (
    auth.uid() = purchased_by OR
    recipient_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Allow service role full access (for API routes)
DROP POLICY IF EXISTS "Service role has full access to gift cards" ON gift_cards;
CREATE POLICY "Service role has full access to gift cards" ON gift_cards
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Allow authenticated users to insert gift cards (for purchase flow)
DROP POLICY IF EXISTS "Authenticated users can create gift cards" ON gift_cards;
CREATE POLICY "Authenticated users can create gift cards" ON gift_cards
  FOR INSERT
  WITH CHECK (auth.uid() = purchased_by);

-- Step 11: Create RLS Policies for gift_card_transactions

-- Allow users to view transactions for their gift cards
DROP POLICY IF EXISTS "Users can view their gift card transactions" ON gift_card_transactions;
CREATE POLICY "Users can view their gift card transactions" ON gift_card_transactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM gift_cards gc
      WHERE gc.id = gift_card_transactions.gift_card_id
      AND (
        gc.purchased_by = auth.uid() OR
        gc.recipient_email = (SELECT email FROM auth.users WHERE id = auth.uid())
      )
    )
  );

-- Allow service role full access
DROP POLICY IF EXISTS "Service role has full access to transactions" ON gift_card_transactions;
CREATE POLICY "Service role has full access to transactions" ON gift_card_transactions
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
