-- Social Media Follow Verification System
-- Allows users to submit their social usernames for admin verification

-- Create social_verifications table
CREATE TABLE IF NOT EXISTS social_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, -- 'instagram', 'twitter', 'tiktok', etc.
  username TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'verified', 'rejected'
  reward_points INTEGER NOT NULL,
  reward_claimed BOOLEAN DEFAULT false,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES profiles(id),
  metadata JSONB, -- Store screenshots, notes, etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_social_verifications_user_id ON social_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_social_verifications_status ON social_verifications(status);
CREATE INDEX IF NOT EXISTS idx_social_verifications_platform ON social_verifications(platform);

-- Add comment
COMMENT ON TABLE social_verifications IS 'Tracks social media follow verification requests from users';
COMMENT ON COLUMN social_verifications.status IS 'pending = awaiting verification, verified = confirmed, rejected = denied';
COMMENT ON COLUMN social_verifications.reward_claimed IS 'True if user has claimed their reward points';
