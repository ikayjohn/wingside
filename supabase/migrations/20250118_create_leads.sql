-- Create leads table for CRM lead management
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,

  -- Lead source and classification
  source TEXT NOT NULL CHECK (source IN ('website', 'referral', 'social', 'event', 'partner', 'other')),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'proposed', 'negotiation', 'converted', 'lost')),

  -- Lead scoring
  score INTEGER DEFAULT 0 CHECK (score >= 0),
  score_updated_at TIMESTAMP WITH TIME ZONE,

  -- Qualification details
  estimated_value NUMERIC(10, 2),
  budget TEXT CHECK (budget IN ('low', 'medium', 'high', 'not_specified')),
  timeline TEXT CHECK (timeline IN ('immediate', '1-3_months', '3-6_months', '6-12_months', 'not_sure')),
  interest_level TEXT CHECK (interest_level IN ('low', 'medium', 'high')),

  -- Conversion tracking
  converted_to_customer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  converted_at TIMESTAMP WITH TIME ZONE,

  -- Tracking
  lead_source_details JSONB DEFAULT '{}',
  last_contacted_at TIMESTAMP WITH TIME ZONE,
  follow_up_date DATE,

  -- Notes and activity
  notes TEXT,
  tags TEXT[], -- Array of tags for categorization (e.g., 'vip', 'event-lead', 'corporate')

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_source ON leads(source);
CREATE INDEX idx_leads_score ON leads(score DESC);
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX idx_leads_assigned_to ON leads(created_by);

-- Create lead_activities table for tracking all lead interactions
CREATE TABLE IF NOT EXISTS lead_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,

  -- Activity details
  activity_type TEXT NOT NULL CHECK (activity_type IN ('call', 'email', 'sms', 'meeting', 'note', 'status_change', 'email_opened', 'email_clicked', 'website_visit')),
  subject TEXT,
  description TEXT,

  -- Additional context
  metadata JSONB DEFAULT '{}', -- Store extra data like email_id, call_duration, etc.

  -- Tracking
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_lead_activities_lead_id ON lead_activities(lead_id);
CREATE INDEX idx_lead_activities_created_at ON lead_activities(created_at DESC);

-- Create lead_email_campaigns table for automated email sequences
CREATE TABLE IF NOT EXISTS lead_email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,

  -- Campaign settings
  is_active BOOLEAN DEFAULT true,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('new_lead', 'lead_status_change', 'scheduled', 'manual')),

  -- Trigger conditions
  trigger_conditions JSONB DEFAULT '{}', -- e.g., {"status": "new", "source": "website"}

  -- Email sequence
  emails JSONB NOT NULL, -- Array of email objects with delay, subject, body

  -- Tracking
  total_leads INTEGER DEFAULT 0,
  sent_emails INTEGER DEFAULT 0,
  opened_emails INTEGER DEFAULT 0,
  clicked_emails INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_lead_email_campaigns_active ON lead_email_campaigns(is_active);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_leads_updated_at();

CREATE TRIGGER update_lead_email_campaigns_updated_at
  BEFORE UPDATE ON lead_email_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_leads_updated_at();

-- Enable Row Level Security
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_email_campaigns ENABLE ROW LEVEL SECURITY;

-- RLS Policies for leads
-- Admin and staff can see all leads
CREATE POLICY "Admins and staff can view all leads"
  ON leads FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- Admin and staff can insert leads
CREATE POLICY "Admins and staff can insert leads"
  ON leads FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- Admin and staff can update leads
CREATE POLICY "Admins and staff can update leads"
  ON leads FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- Admin can delete leads
CREATE POLICY "Admins can delete leads"
  ON leads FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for lead_activities
CREATE POLICY "Admins and staff can view all lead activities"
  ON lead_activities FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Admins and staff can insert lead activities"
  ON lead_activities FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- RLS Policies for lead_email_campaigns
CREATE POLICY "Admins can manage email campaigns"
  ON lead_email_campaigns FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Add comments for documentation
COMMENT ON TABLE leads IS 'CRM leads table for managing potential customers before conversion';
COMMENT ON TABLE lead_activities IS 'Tracks all interactions and activities with leads';
COMMENT ON TABLE lead_email_campaigns IS 'Automated email campaigns for lead nurturing';
COMMENT ON COLUMN leads.score IS 'Lead score based on engagement and qualification (higher is better)';
COMMENT ON COLUMN leads.budget IS 'Estimated budget level for the lead';
COMMENT ON COLUMN leads.timeline IS 'Expected purchase timeline';
COMMENT ON COLUMN leads.interest_level IS 'Self-reported or assessed interest level';
