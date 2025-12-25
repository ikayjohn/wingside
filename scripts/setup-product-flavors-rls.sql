-- Product Flavors Junction Table RLS Policies
-- Enable RLS on product_flavors table

-- Enable RLS
ALTER TABLE product_flavors ENABLE ROW LEVEL SECURITY;

-- Policy: Public can view product-flavor relationships
CREATE POLICY "Public can view product flavors"
  ON product_flavors
  FOR SELECT
  TO public
  USING (true);

-- Policy: Admins can manage product-flavor relationships
CREATE POLICY "Admins can manage product flavors"
  ON product_flavors
  FOR ALL
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
