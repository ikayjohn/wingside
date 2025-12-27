-- Create hero_slides table
CREATE TABLE IF NOT EXISTS hero_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  headline TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for active slides ordered by display order
CREATE INDEX IF NOT EXISTS idx_hero_slides_active_order ON hero_slides(is_active, display_order);

-- Enable Row Level Security
ALTER TABLE hero_slides ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access on hero_slides" ON hero_slides;
DROP POLICY IF EXISTS "Allow admin full access on hero_slides" ON hero_slides;

-- Create policy for public read access (for displaying on homepage)
CREATE POLICY "Allow public read access on hero_slides"
ON hero_slides FOR SELECT
TO public
USING (is_active = true);

-- Create policy for admin access (all operations)
CREATE POLICY "Allow admin full access on hero_slides"
ON hero_slides FOR ALL
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

-- Insert default slide with current hero content (if not exists)
INSERT INTO hero_slides (title, headline, description, image_url, is_active, display_order)
SELECT
  'Wingside Hero - Default',
  'Where [yellow]Flavor[/yellow] takes [white]Flight[/white]',
  'Your wings, Your way. 20 bold flavors, endless cravings. Ready to take off?',
  '/thinkbox.png',  -- Placeholder image, update with actual hero image
  true,
  0
WHERE NOT EXISTS (
  SELECT 1 FROM hero_slides WHERE title = 'Wingside Hero - Default'
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_hero_slides_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS set_hero_slides_updated_at ON hero_slides;

-- Trigger to automatically update updated_at
CREATE TRIGGER set_hero_slides_updated_at
BEFORE UPDATE ON hero_slides
FOR EACH ROW
EXECUTE FUNCTION update_hero_slides_updated_at();
