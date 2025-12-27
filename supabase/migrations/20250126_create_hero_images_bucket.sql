-- Create hero-images storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('hero-images', 'hero-images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public access to hero-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to hero-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin updates to hero-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin deletes from hero-images" ON storage.objects;

-- Allow public access to hero-images bucket
CREATE POLICY "Allow public access to hero-images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'hero-images');

-- Allow authenticated users to upload to hero-images
CREATE POLICY "Allow authenticated uploads to hero-images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'hero-images' AND
  auth.role() = 'authenticated'
);

-- Allow admins to update hero-images
CREATE POLICY "Allow admin updates to hero-images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'hero-images' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  bucket_id = 'hero-images' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Allow admins to delete from hero-images
CREATE POLICY "Allow admin deletes from hero-images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'hero-images' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
