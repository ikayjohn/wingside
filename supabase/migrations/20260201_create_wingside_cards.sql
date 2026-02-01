-- Wingside Card System
-- Physical tap cards linked to Embedly wallets
-- Migration: 20260201_create_wingside_cards.sql

-- Create wingside_cards table
CREATE TABLE IF NOT EXISTS wingside_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Embedly Integration
  embedly_customer_id TEXT NOT NULL,
  embedly_wallet_id TEXT NOT NULL,
  card_serial TEXT UNIQUE NOT NULL, -- Physical card serial number (e.g., WS123456)

  -- Card Security
  card_pin_hash TEXT NOT NULL, -- Encrypted PIN for POS transactions
  max_debit DECIMAL(10, 2) DEFAULT 50000, -- Maximum single transaction limit

  -- Card Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
    'active',      -- Card is active and usable
    'suspended',   -- Temporarily suspended
    'lost',        -- Reported lost
    'stolen',      -- Reported stolen
    'expired',     -- Card has expired
    'terminated'   -- Permanently deactivated
  )),

  -- Card Type
  card_type TEXT NOT NULL DEFAULT 'standard' CHECK (card_type IN (
    'standard',    -- Regular Wingside card
    'gift',        -- Gift card (cannot be reloaded)
    'corporate'    -- Corporate/business card
  )),

  -- Usage Tracking
  linked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE,
  last_transaction_amount DECIMAL(10, 2),
  total_transactions INTEGER DEFAULT 0,
  total_spent DECIMAL(10, 2) DEFAULT 0,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ONE card per user constraint
CREATE UNIQUE INDEX idx_wingside_cards_one_per_user
ON wingside_cards(user_id)
WHERE status IN ('active', 'suspended');

-- Fast lookups by card serial
CREATE UNIQUE INDEX idx_wingside_cards_serial
ON wingside_cards(card_serial);

-- Fast lookups by user
CREATE INDEX idx_wingside_cards_user_id
ON wingside_cards(user_id);

-- Fast lookups by status
CREATE INDEX idx_wingside_cards_status
ON wingside_cards(status);

-- Add comments for documentation
COMMENT ON TABLE wingside_cards IS 'Physical Wingside tap cards linked to customer Embedly wallets';
COMMENT ON COLUMN wingside_cards.card_serial IS 'Physical card serial number scanned at POS (e.g., WS123456)';
COMMENT ON COLUMN wingside_cards.card_pin_hash IS 'Encrypted PIN for secure POS transactions';
COMMENT ON COLUMN wingside_cards.max_debit IS 'Maximum amount that can be spent in a single transaction';
COMMENT ON COLUMN wingside_cards.status IS 'Card status: active, suspended, lost, stolen, expired, terminated';

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_wingside_cards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER wingside_cards_updated_at
BEFORE UPDATE ON wingside_cards
FOR EACH ROW
EXECUTE FUNCTION update_wingside_cards_updated_at();

-- Function to get card details by serial
CREATE OR REPLACE FUNCTION get_card_by_serial(p_card_serial TEXT)
RETURNS TABLE(
  card_id UUID,
  user_id UUID,
  user_email TEXT,
  user_name TEXT,
  embedly_wallet_id TEXT,
  status TEXT,
  max_debit DECIMAL,
  last_used_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    wc.id,
    wc.user_id,
    p.email,
    p.full_name,
    wc.embedly_wallet_id,
    wc.status,
    wc.max_debit,
    wc.last_used_at
  FROM wingside_cards wc
  JOIN profiles p ON p.id = wc.user_id
  WHERE wc.card_serial = p_card_serial;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user can link a card
CREATE OR REPLACE FUNCTION can_user_link_card(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_active_cards INTEGER;
BEGIN
  -- Check if user already has an active or suspended card
  SELECT COUNT(*) INTO v_active_cards
  FROM wingside_cards
  WHERE user_id = p_user_id
  AND status IN ('active', 'suspended');

  RETURN v_active_cards = 0;
END;
$$ LANGUAGE plpgsql;

-- Function to record card usage
CREATE OR REPLACE FUNCTION record_card_usage(
  p_card_serial TEXT,
  p_transaction_amount DECIMAL,
  p_transaction_id TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE wingside_cards
  SET
    last_used_at = NOW(),
    last_transaction_amount = p_transaction_amount,
    total_transactions = total_transactions + 1,
    total_spent = total_spent + p_transaction_amount,
    metadata = jsonb_set(
      COALESCE(metadata, '{}'::jsonb),
      '{last_transaction_id}',
      to_jsonb(COALESCE(p_transaction_id, ''))
    )
  WHERE card_serial = p_card_serial
  AND status = 'active';

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE wingside_cards ENABLE ROW LEVEL SECURITY;

-- Users can only see their own cards
CREATE POLICY "Users can view own cards"
ON wingside_cards
FOR SELECT
USING (auth.uid() = user_id);

-- Only service role can insert/update cards (via API)
CREATE POLICY "Service role can manage cards"
ON wingside_cards
FOR ALL
USING (true)
WITH CHECK (true);

-- Grant permissions
GRANT SELECT ON wingside_cards TO authenticated;
GRANT ALL ON wingside_cards TO service_role;
GRANT EXECUTE ON FUNCTION get_card_by_serial(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION can_user_link_card(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION record_card_usage(TEXT, DECIMAL, TEXT) TO service_role;
