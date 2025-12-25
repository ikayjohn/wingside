-- Add separate visibility toggles for homepage and products
-- This allows flavors to be shown on homepage without being available for ordering

-- Add new columns to flavors table
ALTER TABLE flavors
ADD COLUMN IF NOT EXISTS show_on_homepage BOOLEAN DEFAULT true;

ALTER TABLE flavors
ADD COLUMN IF NOT EXISTS available_for_products BOOLEAN DEFAULT true;

-- Update existing records
UPDATE flavors SET show_on_homepage = true WHERE show_on_homepage IS NULL;
UPDATE flavors SET available_for_products = true WHERE available_for_products IS NULL;

-- Add comments
COMMENT ON COLUMN flavors.show_on_homepage IS 'Whether to display this flavor on the homepage flavor catalog';
COMMENT ON COLUMN flavors.available_for_products IS 'Whether this flavor can be selected when ordering products';

-- Keep is_active for backwards compatibility (general active status)
COMMENT ON COLUMN flavors.is_active IS 'Whether this flavor is generally active (master toggle)';

-- Verify the changes
SELECT name, category, is_active, show_on_homepage, available_for_products FROM flavors ORDER BY category, display_order;
