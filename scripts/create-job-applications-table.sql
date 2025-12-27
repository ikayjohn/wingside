-- Create job_applications table
CREATE TABLE IF NOT EXISTS job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_position_id UUID REFERENCES job_positions(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  experience TEXT,
  cover_letter TEXT,
  resume_url TEXT,
  resume_file_name TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'shortlisted', 'rejected', 'hired')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to manage applications
CREATE POLICY "Admins can view all job applications"
  ON job_applications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update job applications"
  ON job_applications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete job applications"
  ON job_applications FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create policy for public to insert applications (no auth required)
CREATE POLICY "Public can insert job applications"
  ON job_applications FOR INSERT
  TO public
  WITH CHECK (true);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_job_applications_job_position_id ON job_applications(job_position_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);
CREATE INDEX IF NOT EXISTS idx_job_applications_created_at ON job_applications(created_at DESC);

-- Add updated_at trigger
CREATE TRIGGER update_job_applications_updated_at
  BEFORE UPDATE ON job_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create a view for applications with job details
CREATE OR REPLACE VIEW job_applications_with_position AS
SELECT
  ja.*,
  jp.title as position_title,
  jp.location as position_location
FROM job_applications ja
LEFT JOIN job_positions jp ON ja.job_position_id = jp.id;
