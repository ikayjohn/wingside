-- CRM Enhancement Tables Migration
-- Created: 2026-02-15
-- Purpose: Add tables for advanced CRM features including tags, communication tracking, campaigns, and custom segments

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Customer Tags/Labels System
CREATE TABLE IF NOT EXISTS customer_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

CREATE TABLE IF NOT EXISTS customer_tag_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_email TEXT NOT NULL,
  tag_id UUID REFERENCES customer_tags(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES profiles(id),
  UNIQUE(customer_email, tag_id)
);

-- 2. Communication History Tracking
CREATE TABLE IF NOT EXISTS communication_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_email TEXT NOT NULL,
  channel TEXT NOT NULL, -- 'email', 'sms', 'push'
  message_type TEXT NOT NULL, -- 'promotional', 'transactional', 'campaign'
  subject TEXT,
  content TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  sent_by UUID REFERENCES profiles(id),
  campaign_id UUID, -- Reference added below
  status TEXT DEFAULT 'sent', -- 'sent', 'delivered', 'failed', 'opened', 'clicked'
  metadata JSONB DEFAULT '{}'::jsonb
);

-- 3. Win-back Campaigns
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  campaign_type TEXT NOT NULL, -- 'winback', 'promotional', 'retention'
  target_segment TEXT, -- Segment ID or custom criteria
  channel TEXT NOT NULL, -- 'email', 'sms', 'push', 'multi'
  message_template JSONB NOT NULL, -- {subject, body, variables}
  promo_code_id UUID REFERENCES promo_codes(id),
  status TEXT DEFAULT 'draft', -- 'draft', 'scheduled', 'active', 'paused', 'completed'
  scheduled_at TIMESTAMPTZ,
  sent_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  conversion_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS campaign_recipients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  customer_email TEXT NOT NULL,
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ, -- Made a purchase
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  error_message TEXT
);

-- 4. Custom Segments (saved filters)
CREATE TABLE IF NOT EXISTS custom_segments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  criteria JSONB NOT NULL, -- Filter conditions
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  last_used_at TIMESTAMPTZ,
  customer_count INTEGER DEFAULT 0
);

-- Add foreign key for communication_log.campaign_id (circular reference)
ALTER TABLE communication_log ADD CONSTRAINT fk_campaign
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_customer_tag_assignments_email ON customer_tag_assignments(customer_email);
CREATE INDEX IF NOT EXISTS idx_customer_tag_assignments_tag ON customer_tag_assignments(tag_id);
CREATE INDEX IF NOT EXISTS idx_communication_log_email ON communication_log(customer_email);
CREATE INDEX IF NOT EXISTS idx_communication_log_campaign ON communication_log(campaign_id);
CREATE INDEX IF NOT EXISTS idx_communication_log_sent_at ON communication_log(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_campaign ON campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_email ON campaign_recipients(customer_email);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);

-- Enable Row Level Security
ALTER TABLE customer_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_tag_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_segments ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Admin only access
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin full access to customer_tags" ON customer_tags;
DROP POLICY IF EXISTS "Admin full access to customer_tag_assignments" ON customer_tag_assignments;
DROP POLICY IF EXISTS "Admin full access to communication_log" ON communication_log;
DROP POLICY IF EXISTS "Admin full access to campaigns" ON campaigns;
DROP POLICY IF EXISTS "Admin full access to campaign_recipients" ON campaign_recipients;
DROP POLICY IF EXISTS "Admin full access to custom_segments" ON custom_segments;

-- Create policies for admin access
CREATE POLICY "Admin full access to customer_tags" ON customer_tags
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admin full access to customer_tag_assignments" ON customer_tag_assignments
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admin full access to communication_log" ON communication_log
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admin full access to campaigns" ON campaigns
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admin full access to campaign_recipients" ON campaign_recipients
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admin full access to custom_segments" ON custom_segments
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role IN ('admin', 'super_admin')
    )
  );

-- Insert some default tags for common use cases
INSERT INTO customer_tags (name, color, description) VALUES
  ('VIP', '#9333ea', 'Very Important Person - High value customer'),
  ('High Value', '#10b981', 'Customers with high lifetime value'),
  ('At Risk', '#f59e0b', 'Customers at risk of churning'),
  ('Won Back', '#3b82f6', 'Previously churned customers who returned'),
  ('Loyalty Member', '#8b5cf6', 'Active loyalty program participants'),
  ('Corporate', '#6366f1', 'B2B corporate accounts'),
  ('Complaint', '#ef4444', 'Customers who filed complaints')
ON CONFLICT (name) DO NOTHING;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'CRM enhancement tables created successfully!';
  RAISE NOTICE 'Created tables: customer_tags, customer_tag_assignments, communication_log, campaigns, campaign_recipients, custom_segments';
  RAISE NOTICE 'All tables have RLS policies enabled for admin-only access';
  RAISE NOTICE 'Default tags inserted: VIP, High Value, At Risk, Won Back, Loyalty Member, Corporate, Complaint';
END $$;
