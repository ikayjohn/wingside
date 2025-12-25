-- Create storage bucket for event images
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-images', 'event-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Create policies for the bucket
-- Allow public access to view images
CREATE POLICY "Public Access Event Images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'event-images');

-- Allow admins to upload images
CREATE POLICY "Admins Can Upload Event Images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'event-images' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Allow admins to delete images
CREATE POLICY "Admins Can Delete Event Images"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'event-images' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Allow admins to update images
CREATE POLICY "Admins Can Update Event Images"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'event-images' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
