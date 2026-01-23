-- Add is_active column to categories if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'is_active') THEN
        ALTER TABLE categories ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Create subcategories table
CREATE TABLE IF NOT EXISTS subcategories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(category_id, name)
);

-- Seed subcategories for Wing Cafe
DO $$
DECLARE
    wing_cafe_id UUID;
BEGIN
    SELECT id INTO wing_cafe_id FROM categories WHERE name = 'Wing Cafe';
    
    IF wing_cafe_id IS NOT NULL THEN
        INSERT INTO subcategories (category_id, name, display_order)
        VALUES 
            (wing_cafe_id, 'Coffee Classics', 1),
            (wing_cafe_id, 'Everyday Sips', 2),
            (wing_cafe_id, 'Toasted & Spiced Lattes', 3),
            (wing_cafe_id, 'Gourmet & Dessert-Inspired Lattes', 4),
            (wing_cafe_id, 'Matcha Lattes', 5),
            (wing_cafe_id, 'Chai Lattes', 6),
            (wing_cafe_id, 'Hot Smelts', 7),
            (wing_cafe_id, 'Teas', 8),
            (wing_cafe_id, 'Wingfreshers', 9),
            (wing_cafe_id, 'Milkshakes', 10),
            (wing_cafe_id, 'Signature Pairings', 11)
        ON CONFLICT (category_id, name) DO NOTHING;
    END IF;
END $$;
