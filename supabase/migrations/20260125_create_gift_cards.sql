-- Gift Cards System Migration
-- Created: 2026-01-25
-- Purpose: Enable gift card balance checking and management

-- Create gift_cards table
CREATE TABLE IF NOT EXISTS gift_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_number VARCHAR(20) UNIQUE NOT NULL,
  pin VARCHAR(4) NOT NULL,
  initial_balance DECIMAL(10,2) NOT NULL DEFAULT 0,
  current_balance DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'NGN',
  is_active BOOLEAN DEFAULT true,
  activated_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  purchaser_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  recipient_email VARCHAR(255),
  recipient_name VARCHAR(255),
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Create gift_card_transactions table for tracking usage
CREATE TABLE IF NOT EXISTS gift_card_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_card_id UUID NOT NULL REFERENCES gift_cards(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('purchase', 'redemption', 'refund', 'adjustment')),
  amount DECIMAL(10,2) NOT NULL,
  balance_before DECIMAL(10,2) NOT NULL,
  balance_after DECIMAL(10,2) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_gift_cards_card_number ON gift_cards(card_number);
CREATE INDEX IF NOT EXISTS idx_gift_cards_purchaser ON gift_cards(purchaser_id);
CREATE INDEX IF NOT EXISTS idx_gift_cards_active ON gift_cards(is_active);
CREATE INDEX IF NOT EXISTS idx_gift_card_transactions_card_id ON gift_card_transactions(gift_card_id);
CREATE INDEX IF NOT EXISTS idx_gift_card_transactions_order_id ON gift_card_transactions(order_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_gift_card_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER gift_cards_updated_at
  BEFORE UPDATE ON gift_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_gift_card_updated_at();

-- Create function to validate gift card
CREATE OR REPLACE FUNCTION validate_gift_card(
  p_card_number VARCHAR,
  p_pin VARCHAR
)
RETURNS TABLE (
  is_valid BOOLEAN,
  card_id UUID,
  current_balance DECIMAL,
  currency VARCHAR,
  is_active BOOLEAN,
  expires_at TIMESTAMPTZ,
  error_message TEXT
) AS $$
DECLARE
  v_card gift_cards%ROWTYPE;
BEGIN
  -- Find the gift card
  SELECT * INTO v_card
  FROM gift_cards
  WHERE card_number = p_card_number;

  -- Check if card exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT
      false,
      NULL::UUID,
      0::DECIMAL,
      ''::VARCHAR,
      false,
      NULL::TIMESTAMPTZ,
      'Invalid card number'::TEXT;
    RETURN;
  END IF;

  -- Verify PIN
  IF v_card.pin != p_pin THEN
    RETURN QUERY SELECT
      false,
      NULL::UUID,
      0::DECIMAL,
      ''::VARCHAR,
      false,
      NULL::TIMESTAMPTZ,
      'Invalid PIN'::TEXT;
    RETURN;
  END IF;

  -- Check if card is active
  IF NOT v_card.is_active THEN
    RETURN QUERY SELECT
      false,
      v_card.id,
      v_card.current_balance,
      v_card.currency,
      v_card.is_active,
      v_card.expires_at,
      'Card is inactive'::TEXT;
    RETURN;
  END IF;

  -- Check if card is expired
  IF v_card.expires_at IS NOT NULL AND v_card.expires_at < NOW() THEN
    RETURN QUERY SELECT
      false,
      v_card.id,
      v_card.current_balance,
      v_card.currency,
      v_card.is_active,
      v_card.expires_at,
      'Card has expired'::TEXT;
    RETURN;
  END IF;

  -- Card is valid
  RETURN QUERY SELECT
    true,
    v_card.id,
    v_card.current_balance,
    v_card.currency,
    v_card.is_active,
    v_card.expires_at,
    NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to redeem gift card
CREATE OR REPLACE FUNCTION redeem_gift_card(
  p_card_number VARCHAR,
  p_pin VARCHAR,
  p_amount DECIMAL,
  p_order_id UUID,
  p_user_id UUID
)
RETURNS TABLE (
  success BOOLEAN,
  new_balance DECIMAL,
  error_message TEXT
) AS $$
DECLARE
  v_validation RECORD;
  v_card gift_cards%ROWTYPE;
BEGIN
  -- Validate the card
  SELECT * INTO v_validation
  FROM validate_gift_card(p_card_number, p_pin);

  IF NOT v_validation.is_valid THEN
    RETURN QUERY SELECT
      false,
      0::DECIMAL,
      v_validation.error_message;
    RETURN;
  END IF;

  -- Get card details
  SELECT * INTO v_card
  FROM gift_cards
  WHERE card_number = p_card_number;

  -- Check if sufficient balance
  IF v_card.current_balance < p_amount THEN
    RETURN QUERY SELECT
      false,
      v_card.current_balance,
      'Insufficient balance'::TEXT;
    RETURN;
  END IF;

  -- Update card balance
  UPDATE gift_cards
  SET current_balance = current_balance - p_amount
  WHERE id = v_card.id;

  -- Record transaction
  INSERT INTO gift_card_transactions (
    gift_card_id,
    order_id,
    transaction_type,
    amount,
    balance_before,
    balance_after,
    description,
    created_by
  ) VALUES (
    v_card.id,
    p_order_id,
    'redemption',
    p_amount,
    v_card.current_balance,
    v_card.current_balance - p_amount,
    'Gift card redeemed for order',
    p_user_id
  );

  RETURN QUERY SELECT
    true,
    v_card.current_balance - p_amount,
    NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert some sample gift cards for testing (optional - remove in production)
INSERT INTO gift_cards (card_number, pin, initial_balance, current_balance, is_active, expires_at) VALUES
  ('1234567890123456', '1234', 10000.00, 10000.00, true, NOW() + INTERVAL '1 year'),
  ('9876543210987654', '5678', 5000.00, 5000.00, true, NOW() + INTERVAL '1 year'),
  ('1111222233334444', '0000', 15000.00, 15000.00, true, NOW() + INTERVAL '1 year')
ON CONFLICT (card_number) DO NOTHING;

-- Grant permissions
GRANT SELECT ON gift_cards TO authenticated;
GRANT SELECT ON gift_card_transactions TO authenticated;

-- Comments for documentation
COMMENT ON TABLE gift_cards IS 'Stores gift card information and balances';
COMMENT ON TABLE gift_card_transactions IS 'Tracks all gift card transactions';
COMMENT ON FUNCTION validate_gift_card IS 'Validates gift card number and PIN, returns card status';
COMMENT ON FUNCTION redeem_gift_card IS 'Redeems gift card amount for an order';
