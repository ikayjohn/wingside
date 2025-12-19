-- Add integration fields to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS zoho_contact_id VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS embedly_customer_id VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS embedly_wallet_id VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wallet_balance DECIMAL(12, 2) DEFAULT 0;

-- Add source field to orders for tracking online vs in-store
ALTER TABLE orders ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'online';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS zoho_deal_id VARCHAR(255);

-- Indexes for integration lookups
CREATE INDEX IF NOT EXISTS idx_profiles_zoho_contact_id ON profiles(zoho_contact_id);
CREATE INDEX IF NOT EXISTS idx_profiles_embedly_customer_id ON profiles(embedly_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_embedly_wallet_id ON profiles(embedly_wallet_id);
CREATE INDEX IF NOT EXISTS idx_orders_source ON orders(source);
