-- Referral System Database Schema for Wingside
-- This script creates the necessary tables for a comprehensive referral system

-- First, add referral-related columns to the existing profiles table
-- Note: Run this command if the profiles table exists and needs to be altered
-- ALTER TABLE profiles
-- ADD COLUMN referral_code VARCHAR(20) UNIQUE,
-- ADD COLUMN referred_by UUID REFERENCES profiles(id),
-- ADD COLUMN referral_count INTEGER DEFAULT 0,
-- ADD COLUMN total_referral_earnings DECIMAL(10,2) DEFAULT 0.00;

-- Referrals table to track all referral activities
CREATE TABLE IF NOT EXISTS referrals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    referrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    referred_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    referral_code_used VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending_signup', -- pending_signup, signed_up, first_order_completed, reward_paid
    reward_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    referrer_reward_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    referred_email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,

    -- Unique constraint to prevent duplicate referrals
    UNIQUE(referred_email, referrer_id)
);

-- Referral rewards table to track all reward transactions
CREATE TABLE IF NOT EXISTS referral_rewards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    referral_id UUID NOT NULL REFERENCES referrals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reward_type VARCHAR(20) NOT NULL, -- referrer_bonus, referred_bonus
    amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, credited, expired
    credited_to_wallet BOOLEAN DEFAULT FALSE,
    wallet_transaction_id UUID, -- Reference to wallet_transactions table
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    credited_at TIMESTAMP WITH TIME ZONE
);

-- Referral settings table (for admin configuration)
CREATE TABLE IF NOT EXISTS referral_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default referral settings
INSERT INTO referral_settings (setting_key, setting_value, description) VALUES
('referrer_reward_amount', '500', 'Reward amount for referrer in Naira'),
('referred_reward_amount', '500', 'Reward amount for referred user in Naira'),
('min_order_amount_for_reward', '1000', 'Minimum order amount for referral reward to be activated'),
('reward_expiry_days', '30', 'Days until referral reward expires'),
('max_referrals_per_user', '50', 'Maximum number of referrals per user'),
('referral_program_active', 'true', 'Whether the referral program is currently active')
ON CONFLICT (setting_key) DO NOTHING;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_user_id ON referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_referral_code_used ON referrals(referral_code_used);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_user_id ON referral_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_referral_id ON referral_rewards(referral_id);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_status ON referral_rewards(status);

-- Function to update referral count when a new referral is created
CREATE OR REPLACE FUNCTION update_referral_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Update referrer's referral count
    UPDATE profiles
    SET referral_count = referral_count + 1
    WHERE id = NEW.referrer_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update referral count
DROP TRIGGER IF EXISTS trigger_update_referral_count ON referrals;
CREATE TRIGGER trigger_update_referral_count
    AFTER INSERT ON referrals
    FOR EACH ROW
    EXECUTE FUNCTION update_referral_count();

-- Function to create wallet entry for referral rewards (if wallet table exists)
CREATE OR REPLACE FUNCTION credit_referral_reward_to_wallet(
    user_id UUID,
    amount DECIMAL,
    description TEXT
)
RETURNS VOID AS $$
BEGIN
    -- This function assumes you have a wallet or wallet_transactions table
    -- You can modify this based on your actual wallet structure

    -- Example implementation (modify based on your wallet table structure):
    -- INSERT INTO wallet_transactions (user_id, amount, type, description, created_at)
    -- VALUES (user_id, amount, 'credit', description, NOW());

    -- For now, we'll just log this action
    RAISE NOTICE 'Wallet credit of % for user %: %', amount, user_id, description;
END;
$$ LANGUAGE plpgsql;

-- RLS (Row Level Security) policies
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_settings ENABLE ROW LEVEL SECURITY;

-- Users can see their own referrals and rewards
CREATE POLICY "Users can view their own referrals" ON referrals
    FOR SELECT USING (
        auth.uid() = referrer_id OR
        auth.uid() = referred_user_id
    );

CREATE POLICY "Users can view their own rewards" ON referral_rewards
    FOR SELECT USING (auth.uid() = user_id);

-- Only admins can modify referral data
CREATE POLICY "Admins can insert referrals" ON referrals
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "Admins can update referrals" ON referrals
    FOR UPDATE USING (EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
    ));

-- Anyone can read referral settings
CREATE POLICY "Anyone can read referral settings" ON referral_settings
    FOR SELECT USING (is_active = true);

-- Views for easy querying
CREATE OR REPLACE VIEW user_referral_stats AS
SELECT
    p.id,
    p.full_name,
    p.email,
    p.referral_code,
    COALESCE(p.referral_count, 0) as referral_count,
    COALESCE(p.total_referral_earnings, 0) as total_earnings,
    COUNT(r.id) FILTER (WHERE r.status = 'first_order_completed') as completed_referrals,
    COALESCE(SUM(rr.amount), 0) as total_rewards_credited
FROM profiles p
LEFT JOIN referrals r ON p.id = r.referrer_id
LEFT JOIN referral_rewards rr ON p.id = rr.user_id AND rr.status = 'credited'
GROUP BY p.id, p.full_name, p.email, p.referral_code, p.referral_count, p.total_referral_earnings;

-- Function to check and process referral rewards after first order
CREATE OR REPLACE FUNCTION process_referral_reward_after_first_order(
    user_id UUID,
    order_amount DECIMAL
)
RETURNS BOOLEAN AS $$
DECLARE
    referral_record RECORD;
    min_order_amount DECIMAL;
    referrer_reward DECIMAL;
    referred_reward DECIMAL;
BEGIN
    -- Get referral settings
    SELECT CAST(setting_value AS DECIMAL) INTO min_order_amount
    FROM referral_settings
    WHERE setting_key = 'min_order_amount_for_reward' AND is_active = TRUE;

    SELECT CAST(setting_value AS DECIMAL) INTO referrer_reward
    FROM referral_settings
    WHERE setting_key = 'referrer_reward_amount' AND is_active = TRUE;

    SELECT CAST(setting_value AS DECIMAL) INTO referred_reward
    FROM referral_settings
    WHERE setting_key = 'referred_reward_amount' AND is_active = TRUE;

    -- Find the referral record for this user
    SELECT * INTO referral_record
    FROM referrals
    WHERE referred_user_id = user_id AND status = 'signed_up';

    IF NOT FOUND THEN
        RETURN FALSE; -- No pending referral found
    END IF;

    -- Check if order meets minimum amount
    IF order_amount < min_order_amount THEN
        RETURN FALSE;
    END IF;

    -- Update referral status
    UPDATE referrals
    SET status = 'first_order_completed',
        completed_at = NOW(),
        updated_at = NOW()
    WHERE id = referral_record.id;

    -- Create reward records
    -- Reward for referrer
    INSERT INTO referral_rewards (
        referral_id,
        user_id,
        reward_type,
        amount,
        description,
        status
    ) VALUES (
        referral_record.id,
        referral_record.referrer_id,
        'referrer_bonus',
        referrer_reward,
        'Referral bonus from ' || referral_record.referred_email,
        'pending'
    );

    -- Reward for referred user
    INSERT INTO referral_rewards (
        referral_id,
        user_id,
        reward_type,
        amount,
        description,
        status
    ) VALUES (
        referral_record.id,
        user_id,
        'referred_bonus',
        referred_reward,
        'Welcome bonus for using referral code',
        'pending'
    );

    -- Update referrer's total earnings
    UPDATE profiles
    SET total_referral_earnings = COALESCE(total_referral_earnings, 0) + referrer_reward
    WHERE id = referral_record.referrer_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;