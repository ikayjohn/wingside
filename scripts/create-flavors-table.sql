-- Flavors Management System
-- Centralized flavor configuration for products

-- Drop existing flavors table if it exists (to ensure clean schema)
DROP TABLE IF EXISTS flavors CASCADE;

-- Create flavors table
CREATE TABLE flavors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL, -- 'HOT', 'BBQ', 'DRY RUB', 'BOLD & FUN', 'SWEET', 'BOOZY'
  description TEXT,
  image_url TEXT,
  spice_level INTEGER, -- 0-5 scale for heat level
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0, -- For custom ordering in UI
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_flavors_category ON flavors(category);
CREATE INDEX IF NOT EXISTS idx_flavors_active ON flavors(is_active);
CREATE INDEX IF NOT EXISTS idx_flavors_display_order ON flavors(display_order);

-- Add comments
COMMENT ON TABLE flavors IS 'Centralized flavor management for all products';
COMMENT ON COLUMN flavors.category IS 'HOT, BBQ, DRY RUB, BOLD & FUN, SWEET, BOOZY';
COMMENT ON COLUMN flavors.spice_level IS 'Spice/heat level from 0 (mild) to 5 (extremely hot)';
COMMENT ON COLUMN flavors.is_active IS 'Whether this flavor is currently available';
COMMENT ON COLUMN flavors.display_order IS 'Lower numbers appear first in lists';

-- Insert existing flavors
INSERT INTO flavors (name, category, description, spice_level, display_order) VALUES
-- HOT Category
('Wingferno', 'HOT', 'Piping hot peppers. Something special for the insane…', 5, 1),
('Dragon Breath', 'HOT', 'Hot peppers & more hot peppers. Draaaagon!!! Your mushroom clouds will come for all of us…', 4, 2),
('Braveheart', 'HOT', 'Habaneros & hot chili. Feel the heat, feel the burn.', 3, 3),
('Mango Heat', 'HOT', 'Mango purée & hot peppers. All sweet, all heat…', 2, 4),

-- BBQ Category
('BBQ Rush', 'BBQ', 'BBQ sauce & honey. Sweet ol BBQ', 1, 1),
('BBQ Fire', 'BBQ', 'BBQ sauce & hot peppers. A flavorful hot fire mix of sweet & spicy', 2, 2),

-- DRY RUB Category
('Lemon Pepper', 'DRY RUB', 'Its all in the name. Tangy deliciousness', 1, 1),
('Cameroon Pepper', 'DRY RUB', 'Cameroon pepper & herbs. Part dry, part spicy, whole lotta good', 2, 2),
('Caribbean Jerk', 'DRY RUB', 'Tropical spice mix. Mild peppers you love…', 2, 3),
('Yaji', 'DRY RUB', 'Its in the name. Born and raised in Nigeria', 3, 4),

-- BOLD & FUN Category
('The Italian', 'BOLD & FUN', 'Garlic & cheese. The ideal choice for sophisticated palates', 1, 1),
('Wing of the North', 'BOLD & FUN', 'Spicy dates & dates. Dont ask, dont tell', 2, 2),
('Tokyo', 'BOLD & FUN', 'Soy sauce & sweet chili. From Asia with love', 1, 3),
('Hot Nuts', 'BOLD & FUN', 'Peanuts & hot chili. Delicious amazingness', 2, 4),
('The Slayer', 'BOLD & FUN', 'Garlic & herbs. Keeps the vampires away…', 3, 5),

-- SWEET Category
('Sweet Dreams', 'SWEET', 'Cola & garlic sauce. Sweet with heat on heat', 0, 1),
('Yellow Gold', 'SWEET', 'Honey & mustard. Sweet & sassy with soothing buttery flavour', 0, 2),

-- BOOZY Category
('Whiskey Vibes', 'BOOZY', 'Whiskey & hot sauce. Booze is intellectual', 1, 1),
('Tequila Wingrise', 'BOOZY', 'Tequila & citrus. Now you can eat your tequila too', 1, 2),
('Gustavo', 'BOOZY', 'Beer & barbecue sauce. Hot wings, cold dings', 2, 3)

ON CONFLICT (name) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_flavors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_flavors_updated_at_trigger ON flavors;
CREATE TRIGGER update_flavors_updated_at_trigger
  BEFORE UPDATE ON flavors
  FOR EACH ROW
  EXECUTE FUNCTION update_flavors_updated_at();
