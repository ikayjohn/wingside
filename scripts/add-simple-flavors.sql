-- Add columns for simple string flavors
ALTER TABLE products 
ADD COLUMN simple_flavors TEXT[],
ADD COLUMN flavor_label TEXT;

COMMENT ON COLUMN products.simple_flavors IS 'Simple string flavors like Regular, Hot, Iced, Coke, Fanta, Sprite';
COMMENT ON COLUMN products.flavor_label IS 'Label for flavor selection UI, like Temperature, Tea Type, Drink Option';
