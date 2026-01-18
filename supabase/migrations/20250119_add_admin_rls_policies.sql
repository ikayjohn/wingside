-- Add missing admin RLS policies for various tables
-- These policies allow admins to insert, update, and delete data

-- =============================================
-- EVENTS TABLE
-- =============================================

-- Enable RLS if not already enabled
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can insert events
CREATE POLICY IF NOT EXISTS "Admins can insert events"
  ON events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Admins can update events
CREATE POLICY IF NOT EXISTS "Admins can update events"
  ON events
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

-- Policy: Admins can delete events
CREATE POLICY IF NOT EXISTS "Admins can delete events"
  ON events
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =============================================
-- STORES TABLE
-- =============================================

-- Enable RLS if not already enabled
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- Policy: Public can view stores
CREATE POLICY IF NOT EXISTS "Public can view stores"
  ON stores
  FOR SELECT
  TO public
  USING (true);

-- Policy: Admins can insert stores
CREATE POLICY IF NOT EXISTS "Admins can insert stores"
  ON stores
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Admins can update stores
CREATE POLICY IF NOT EXISTS "Admins can update stores"
  ON stores
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

-- Policy: Admins can delete stores
CREATE POLICY IF NOT EXISTS "Admins can delete stores"
  ON stores
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =============================================
-- PROMO_CODES TABLE
-- =============================================

-- Enable RLS if not already enabled
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

-- Policy: Public can view active promo codes
CREATE POLICY IF NOT EXISTS "Public can view active promo codes"
  ON promo_codes
  FOR SELECT
  TO public
  USING (is_active = true);

-- Policy: Admins can insert promo codes
CREATE POLICY IF NOT EXISTS "Admins can insert promo codes"
  ON promo_codes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Admins can update promo codes
CREATE POLICY IF NOT EXISTS "Admins can update promo codes"
  ON promo_codes
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

-- Policy: Admins can delete promo codes
CREATE POLICY IF NOT EXISTS "Admins can delete promo codes"
  ON promo_codes
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =============================================
-- JOB_POSITIONS TABLE
-- =============================================

-- Enable RLS if not already enabled
ALTER TABLE job_positions ENABLE ROW LEVEL SECURITY;

-- Policy: Public can view active job positions
CREATE POLICY IF NOT EXISTS "Public can view active job positions"
  ON job_positions
  FOR SELECT
  TO public
  USING (is_active = true);

-- Policy: Admins can insert job positions
CREATE POLICY IF NOT EXISTS "Admins can insert job positions"
  ON job_positions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Admins can update job positions
CREATE POLICY IF NOT EXISTS "Admins can update job positions"
  ON job_positions
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

-- Policy: Admins can delete job positions
CREATE POLICY IF NOT EXISTS "Admins can delete job positions"
  ON job_positions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =============================================
-- PICKUP_LOCATIONS TABLE
-- =============================================

-- Enable RLS if not already enabled
ALTER TABLE pickup_locations ENABLE ROW LEVEL SECURITY;

-- Policy: Public can view active pickup locations
CREATE POLICY IF NOT EXISTS "Public can view active pickup locations"
  ON pickup_locations
  FOR SELECT
  TO public
  USING (is_active = true);

-- Policy: Admins can insert pickup locations
CREATE POLICY IF NOT EXISTS "Admins can insert pickup locations"
  ON pickup_locations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Admins can update pickup locations
CREATE POLICY IF NOT EXISTS "Admins can update pickup locations"
  ON pickup_locations
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

-- Policy: Admins can delete pickup locations
CREATE POLICY IF NOT EXISTS "Admins can delete pickup locations"
  ON pickup_locations
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =============================================
-- DELIVERY_AREAS TABLE
-- =============================================

-- Enable RLS if not already enabled
ALTER TABLE delivery_areas ENABLE ROW LEVEL SECURITY;

-- Policy: Public can view active delivery areas
CREATE POLICY IF NOT EXISTS "Public can view active delivery areas"
  ON delivery_areas
  FOR SELECT
  TO public
  USING (is_active = true);

-- Policy: Admins can insert delivery areas
CREATE POLICY IF NOT EXISTS "Admins can insert delivery areas"
  ON delivery_areas
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Admins can update delivery areas
CREATE POLICY IF NOT EXISTS "Admins can update delivery areas"
  ON delivery_areas
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

-- Policy: Admins can delete delivery areas
CREATE POLICY IF NOT EXISTS "Admins can delete delivery areas"
  ON delivery_areas
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
