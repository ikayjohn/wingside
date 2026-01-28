-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Cards table to store Embedly cards
CREATE TABLE IF NOT EXISTS cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  card_id TEXT UNIQUE, -- Embedly card ID
  account_number TEXT NOT NULL UNIQUE, -- Card account number
  masked_pan TEXT NOT NULL, -- Masked card number (e.g., 1234********5678)
  wallet_id TEXT NOT NULL, -- Associated Embedly wallet ID
  type TEXT NOT NULL DEFAULT 'VIRTUAL', -- VIRTUAL or PHYSICAL
  status TEXT NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, FROZEN, BLOCKED, TERMINATED
  balance NUMERIC DEFAULT 0, -- Current card balance
  daily_limit NUMERIC, -- Daily spending limit
  monthly_limit NUMERIC, -- Monthly spending limit
  expiry_date TEXT, -- Card expiry date
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cards_user_id ON cards(user_id);
CREATE INDEX IF NOT EXISTS idx_cards_account_number ON cards(account_number);
CREATE INDEX IF NOT EXISTS idx_cards_status ON cards(status);

-- Card transactions table
CREATE TABLE IF NOT EXISTS card_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- ATM, POS, CHECKOUT, FUNDING, etc.
  amount NUMERIC NOT NULL, -- Transaction amount (always positive)
  currency TEXT NOT NULL DEFAULT 'NGN',
  status TEXT NOT NULL DEFAULT 'success', -- success, failed, pending
  payment_reference TEXT UNIQUE, -- Transaction reference
  stan TEXT, -- System Trace Audit Number
  rrn TEXT, -- Retrieval Reference Number
  description TEXT, -- Transaction description
  date_of_transaction TEXT, -- Date of transaction from webhook
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_card_transactions_card_id ON card_transactions(card_id);
CREATE INDEX IF NOT EXISTS idx_card_transactions_user_id ON card_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_card_transactions_date ON card_transactions(date_of_transaction);
CREATE INDEX IF NOT EXISTS idx_card_transactions_payment_reference ON card_transactions(payment_reference);

-- Update profiles table to store wallet account number
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS embedly_wallet_account_number TEXT;
CREATE INDEX IF NOT EXISTS idx_profiles_wallet_account ON profiles(embedly_wallet_account_number);
