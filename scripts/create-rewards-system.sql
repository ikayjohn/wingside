-- Rewards and Points System
-- Allows users to earn points through various activities

-- Create rewards/points table
CREATE TABLE IF NOT EXISTS rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reward_type TEXT NOT NULL, -- 'purchase', 'first_order', 'referral', 'social_follow', 'review', 'birthday'
  points INTEGER NOT NULL,
  amount_spent DECIMAL(10, 2), -- For purchase rewards, track how much was spent
  description TEXT,
  metadata JSONB, -- Store additional data (order_id, referral_code, social_platform, etc.)
  status TEXT DEFAULT 'earned', -- 'earned', 'pending', 'expired'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- Points could expire after some time
  INDEX idx_rewards_user_id (user_id),
  INDEX idx_rewards_status (status)
);

-- Create reward_claims table for one-time rewards
CREATE TABLE IF NOT EXISTS reward_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reward_type TEXT NOT NULL, -- 'first_order', 'instagram_follow', 'review', 'birthday'
  claimed_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB,
  UNIQUE(user_id, reward_type),
  INDEX idx_reward_claims_user_reward (user_id, reward_type)
);

-- Add points column to profiles if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;

-- Function to award points
CREATE OR REPLACE FUNCTION award_points(
  p_user_id UUID,
  p_reward_type TEXT,
  p_points INTEGER,
  p_amount_spent DECIMAL DEFAULT 0,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_reward_id UUID;
BEGIN
  -- Insert reward record
  INSERT INTO rewards (user_id, reward_type, points, amount_spent, description, metadata)
  VALUES (p_user_id, p_reward_type, p_points, p_amount_spent, p_description, p_metadata)
  RETURNING id INTO v_reward_id;
  
  -- Update user's total points
  UPDATE profiles
  SET points = points + p_points
  WHERE id = p_user_id;
  
  RETURN v_reward_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user has claimed a one-time reward
CREATE OR REPLACE FUNCTION has_claimed_reward(
  p_user_id UUID,
  p_reward_type TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_claimed BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM reward_claims
    WHERE user_id = p_user_id AND reward_type = p_reward_type
  ) INTO v_claimed;
  
  RETURN v_claimed;
END;
$$ LANGUAGE plpgsql;

-- Function to claim a one-time reward
CREATE OR REPLACE FUNCTION claim_reward(
  p_user_id UUID,
  p_reward_type TEXT,
  p_points INTEGER,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_reward_id UUID;
BEGIN
  -- Check if already claimed
  IF has_claimed_reward(p_user_id, p_reward_type) THEN
    RAISE EXCEPTION 'Reward already claimed';
  END IF;
  
  -- Mark as claimed
  INSERT INTO reward_claims (user_id, reward_type, metadata)
  VALUES (p_user_id, p_reward_type, p_metadata);
  
  -- Award points
  v_reward_id := award_points(
    p_user_id, 
    p_reward_type, 
    p_points, 
    0, 
    p_description, 
    p_metadata
  );
  
  RETURN v_reward_id;
END;
$$ LANGUAGE plpgsql;
