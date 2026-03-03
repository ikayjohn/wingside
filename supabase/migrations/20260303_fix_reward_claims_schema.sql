-- Migration: Fix reward_claims table schema mismatch
-- Date: 2026-03-03
-- Problem: claim_reward() function inserts into columns (points, description, status)
--          that don't exist on the live reward_claims table. This caused ALL reward
--          claims (social verifications, first order bonus) to silently fail.

-- Add missing columns to reward_claims
ALTER TABLE reward_claims ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;
ALTER TABLE reward_claims ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE reward_claims ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'claimed';
ALTER TABLE reward_claims ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Backfill status for existing rows that predate the column
UPDATE reward_claims SET status = 'claimed' WHERE status IS NULL;
