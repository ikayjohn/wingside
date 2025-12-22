-- Create referral_shares table to track sharing activities
CREATE TABLE IF NOT EXISTS referral_shares (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    share_method VARCHAR(20) NOT NULL, -- email, whatsapp, twitter, facebook, copy_link
    recipient_email VARCHAR(255), -- Only for email shares
    custom_message TEXT,
    referral_code_used VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CHECK (share_method IN ('email', 'whatsapp', 'twitter', 'facebook', 'copy_link', 'instagram'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_referral_shares_user_id ON referral_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_shares_share_method ON referral_shares(share_method);
CREATE INDEX IF NOT EXISTS idx_referral_shares_created_at ON referral_shares(created_at);

-- RLS policy
ALTER TABLE referral_shares ENABLE ROW LEVEL SECURITY;

-- Users can view their own share activities
CREATE POLICY "Users can view their own referral shares" ON referral_shares
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own share activities
CREATE POLICY "Users can insert their own referral shares" ON referral_shares
    FOR INSERT WITH CHECK (auth.uid() = user_id);