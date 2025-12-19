-- Pickup Locations table
CREATE TABLE IF NOT EXISTS pickup_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(100) DEFAULT 'Port Harcourt',
  state VARCHAR(100) DEFAULT 'Rivers',
  phone VARCHAR(20),
  opening_hours VARCHAR(100),
  estimated_time VARCHAR(50) DEFAULT '15-20 mins',
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for active locations
CREATE INDEX IF NOT EXISTS idx_pickup_locations_active ON pickup_locations(is_active);
CREATE INDEX IF NOT EXISTS idx_pickup_locations_order ON pickup_locations(display_order);

-- Trigger for updated_at
CREATE TRIGGER update_pickup_locations_updated_at BEFORE UPDATE ON pickup_locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed with existing static data
INSERT INTO pickup_locations (name, address, city, state, estimated_time, display_order, is_active)
VALUES 
  ('Wingside, Autograph Mall', 'Autograph Mall, Peter Odili Road', 'Port Harcourt', 'Rivers', '15-20 mins', 1, true),
  ('Wingside, GRA', '24 King Perekule Street, GRA Phase 2', 'Port Harcourt', 'Rivers', '15-20 mins', 2, true)
ON CONFLICT DO NOTHING;
