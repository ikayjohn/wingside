-- Create job_positions table
CREATE TABLE IF NOT EXISTS job_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  location TEXT NOT NULL,
  overview TEXT,
  responsibilities TEXT[] DEFAULT '{}',
  qualifications TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE job_positions ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to manage positions
CREATE POLICY "Admins can view all job positions"
  ON job_positions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert job positions"
  ON job_positions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update job positions"
  ON job_positions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete job positions"
  ON job_positions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Public policy for viewing active positions (for careers page)
CREATE POLICY "Public can view active job positions"
  ON job_positions FOR SELECT
  TO public
  USING (is_active = true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_job_positions_is_active ON job_positions(is_active);
CREATE INDEX IF NOT EXISTS idx_job_positions_created_at ON job_positions(created_at DESC);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_job_positions_updated_at
  BEFORE UPDATE ON job_positions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
