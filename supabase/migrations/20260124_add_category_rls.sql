-- Enable RLS on subcategories if not already enabled
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active subcategories
CREATE POLICY "Allow public read for active subcategories" ON subcategories
FOR SELECT USING (is_active = true);

-- Allow admins full access to subcategories
CREATE POLICY "Allow admins full access to subcategories" ON subcategories
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Ensure categories are also manageable by admins
-- (Assuming RLS is already enabled on categories, update it just in case)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'categories' AND rowsecurity = true) THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'Allow admins full access to categories') THEN
            CREATE POLICY "Allow admins full access to categories" ON categories
            FOR ALL USING (
              EXISTS (
                SELECT 1 FROM profiles
                WHERE profiles.id = auth.uid()
                AND profiles.role = 'admin'
              )
            );
        END IF;
    END IF;
END $$;
