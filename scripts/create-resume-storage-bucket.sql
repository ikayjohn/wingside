-- Create storage bucket for resumes
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO UPDATE SET name = 'resumes', public = false;

-- Allow public uploads (for job applications)
CREATE POLICY "Public can upload resumes"
  ON storage.objects FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'resumes');

-- Allow admins to view and download resumes
CREATE POLICY "Admins can download resumes"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'resumes'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
