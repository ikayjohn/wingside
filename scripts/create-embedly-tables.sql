-- Embedly Integration Tables
-- This script creates tables needed for Embedly API integration

-- Add Embedly-related columns to existing profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS embedly_customer_id UUID,
ADD COLUMN IF NOT EXISTS embedly_wallet_id UUID,
ADD COLUMN IF NOT EXISTS bank_code VARCHAR(50),
ADD COLUMN IF NOT EXISTS is_wallet_active BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS wallet_balance DECIMAL(15,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS last_wallet_sync TIMESTAMP WITH TIME ZONE;

-- Transfer logs for tracking all transfers
CREATE TABLE IF NOT EXISTS transfer_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('wallet', 'interbank')),
    from_account VARCHAR(50) NOT NULL,
    to_account VARCHAR(50) NOT NULL,
    bank_code VARCHAR(50),
    amount DECIMAL(15,2) NOT NULL,
    reference VARCHAR(255) NOT NULL UNIQUE,
    provider_reference VARCHAR(255),
    remarks TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Wallet transactions for detailed history
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    type VARCHAR(10) NOT NULL CHECK (type IN ('credit', 'debit')),
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'NGN',
    reference VARCHAR(255),
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Checkout transactions for one-time payments
CREATE TABLE IF NOT EXISTS checkout_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id VARCHAR(255) NOT NULL UNIQUE,
    wallet_id VARCHAR(255),
    checkout_ref VARCHAR(255) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'expired', 'failed')),
    sender_account VARCHAR(50),
    sender_name VARCHAR(255),
    customer_email VARCHAR(255),
    customer_name VARCHAR(255),
    metadata JSONB,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Embedly webhook logs for debugging
CREATE TABLE IF NOT EXISTS webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB NOT NULL,
    signature VARCHAR(255),
    status VARCHAR(20) DEFAULT 'received' CHECK (status IN ('received', 'processed', 'failed')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_embedly_customer_id ON profiles(embedly_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_embedly_wallet_id ON profiles(embedly_wallet_id);
CREATE INDEX IF NOT EXISTS idx_transfer_logs_user_id ON transfer_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_transfer_logs_reference ON transfer_logs(reference);
CREATE INDEX IF NOT EXISTS idx_transfer_logs_status ON transfer_logs(status);
CREATE INDEX IF NOT EXISTS idx_transfer_logs_created_at ON transfer_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_reference ON wallet_transactions(reference);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type ON wallet_transactions(type);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON wallet_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_checkout_transactions_checkout_ref ON checkout_transactions(checkout_ref);
CREATE INDEX IF NOT EXISTS idx_checkout_transactions_status ON checkout_transactions(status);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_type ON webhook_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkout_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles (existing policies may need updating)
CREATE POLICY "Users can view own profile with Embedly data" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own Embedly data" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- RLS policies for transfer_logs
CREATE POLICY "Users can view own transfer logs" ON transfer_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transfer logs" ON transfer_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS policies for wallet_transactions
CREATE POLICY "Users can view own wallet transactions" ON wallet_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert wallet transactions" ON wallet_transactions
    FOR INSERT WITH CHECK (true); -- Webhooks need to insert

-- RLS policies for checkout_transactions
CREATE POLICY "Users can view related checkout transactions" ON checkout_transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.email = checkout_transactions.customer_email
        )
    );

CREATE POLICY "System can manage checkout transactions" ON checkout_transactions
    FOR ALL WITH CHECK (true); -- Webhooks and system processes

-- RLS policies for webhook_logs (system only)
CREATE POLICY "System can manage webhook logs" ON webhook_logs
    FOR ALL WITH CHECK (true);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_transfer_logs_updated_at
    BEFORE UPDATE ON transfer_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallet_transactions_updated_at
    BEFORE UPDATE ON wallet_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_checkout_transactions_updated_at
    BEFORE UPDATE ON checkout_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON COLUMN profiles.embedly_customer_id IS 'Customer ID from Embedly system';
COMMENT ON COLUMN profiles.embedly_wallet_id IS 'Wallet ID from Embedly system';
COMMENT ON COLUMN profiles.bank_code IS 'Bank code for virtual account';
COMMENT ON COLUMN profiles.is_wallet_active IS 'Whether the Embedly wallet is active';
COMMENT ON COLUMN profiles.wallet_balance IS 'Current wallet balance from Embedly';
COMMENT ON COLUMN profiles.last_wallet_sync IS 'Last time wallet balance was synced with Embedly';

COMMENT ON TABLE transfer_logs IS 'Logs for all wallet transfers (internal and external)';
COMMENT ON TABLE wallet_transactions IS 'Detailed transaction history for all wallet movements';
COMMENT ON TABLE checkout_transactions IS 'One-time payment checkout transactions';
COMMENT ON TABLE webhook_logs IS 'Logs of all received webhooks from Embedly';

-- Create view for user wallet summary
CREATE OR REPLACE VIEW user_wallet_summary AS
SELECT
    p.id as user_id,
    p.email,
    p.full_name,
    p.embedly_customer_id,
    p.embedly_wallet_id,
    p.bank_account,
    p.bank_name,
    p.bank_code,
    p.is_wallet_active,
    p.wallet_balance,
    p.last_wallet_sync,
    COUNT(CASE WHEN wt.type = 'credit' THEN 1 END) as credit_transactions,
    COUNT(CASE WHEN wt.type = 'debit' THEN 1 END) as debit_transactions,
    COALESCE(SUM(CASE WHEN wt.type = 'credit' THEN wt.amount ELSE 0 END), 0) as total_credits,
    COALESCE(SUM(CASE WHEN wt.type = 'debit' THEN wt.amount ELSE 0 END), 0) as total_debits
FROM profiles p
LEFT JOIN wallet_transactions wt ON p.id = wt.user_id AND wt.status = 'completed'
GROUP BY p.id, p.email, p.full_name, p.embedly_customer_id, p.embedly_wallet_id,
         p.bank_account, p.bank_name, p.bank_code, p.is_wallet_active,
         p.wallet_balance, p.last_wallet_sync;