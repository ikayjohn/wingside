-- Create settings table for site configuration
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(255) UNIQUE NOT NULL,
  value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create policy: Only admins can read settings
CREATE POLICY "Admins can read settings"
  ON settings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create policy: Only admins can insert settings
CREATE POLICY "Admins can insert settings"
  ON settings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create policy: Only admins can update settings
CREATE POLICY "Admins can update settings"
  ON settings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create policy: Only admins can delete settings
CREATE POLICY "Admins can delete settings"
  ON settings
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Insert default settings
INSERT INTO settings (key, value) VALUES
  ('site_name', 'Wingside'),
  ('site_tagline', 'Premium Chicken Wings'),
  ('contact_email', 'hello@wingside.ng'),
  ('contact_phone', '+234 800 000 0000'),
  ('contact_address', 'Lagos, Nigeria'),
  ('facebook_url', 'https://www.facebook.com/mywingside/'),
  ('instagram_url', 'https://www.instagram.com/mywingside/'),
  ('twitter_url', 'https://x.com/mywingside/'),
  ('linkedin_url', 'https://www.linkedin.com/company/wingside'),
  ('youtube_url', 'https://www.youtube.com/@mywingside'),
  ('whatsapp_number', '+234 800 000 0000'),
  ('delivery_fee', '0'),
  ('min_order_amount', '0'),
  ('tax_rate', '0')
ON CONFLICT (key) DO NOTHING;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
