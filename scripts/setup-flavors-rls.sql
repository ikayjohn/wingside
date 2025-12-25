-- Flavors Table RLS Policies
-- Enable RLS on flavors table

-- Enable RLS
ALTER TABLE flavors ENABLE ROW LEVEL SECURITY;

-- Policy: Public can view active flavors
CREATE POLICY "Public can view active flavors"
  ON flavors
  FOR SELECT
  TO public
  USING (is_active = true);

-- Policy: Admins can view all flavors
CREATE POLICY "Admins can view all flavors"
  ON flavors
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Admins can insert flavors
CREATE POLICY "Admins can insert flavors"
  ON flavors
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Admins can update flavors
CREATE POLICY "Admins can update flavors"
  ON flavors
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Admins can delete flavors
CREATE POLICY "Admins can delete flavors"
  ON flavors
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
