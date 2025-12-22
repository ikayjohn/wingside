-- Drop existing table and policies
DROP TABLE IF EXISTS stores CASCADE;

-- Create stores table for store/location information
CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  phone VARCHAR(50),
  email VARCHAR(255),
  opening_hours VARCHAR(255),
  image_url TEXT,
  thumbnail_url TEXT,
  is_headquarters BOOLEAN DEFAULT false,
  rating DECIMAL(2,1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  services TEXT[], -- Array of services like 'Dine in', 'Takeout', etc.
  features TEXT[], -- Array of features like 'wifi', 'outdoor seating', etc.
  maps_url TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- Create policy: Anyone can read active stores
CREATE POLICY "Anyone can read active stores"
  ON stores
  FOR SELECT
  USING (is_active = true);

-- Create policy: Only admins can insert stores
CREATE POLICY "Admins can insert stores"
  ON stores
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create policy: Only admins can update stores
CREATE POLICY "Admins can update stores"
  ON stores
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create policy: Only admins can delete stores
CREATE POLICY "Admins can delete stores"
  ON stores
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Insert default stores
INSERT INTO stores (
  name,
  address,
  city,
  state,
  phone,
  email,
  opening_hours,
  image_url,
  thumbnail_url,
  is_headquarters,
  rating,
  review_count,
  services,
  features,
  maps_url,
  display_order
) VALUES
  (
    'WINGSIDE Port Harcourt',
    '24 King Perekule Street, GRA',
    'Port Harcourt',
    'Rivers State',
    '08090191999',
    'reachus@wingside.ng',
    '8:00 AM - 10:00 PM Daily',
    '/contact-location-1.jpg',
    '/contact-location-1-thumb.jpg',
    true,
    4.8,
    324,
    ARRAY['Dine in', 'Takeout', 'Delivery', 'Catering'],
    ARRAY['dine thru', 'outdoor seating', 'wifi', 'wheelchair accessible'],
    'https://www.google.com/maps/search/?api=1&query=24+King+Perekule+Street+GRA+Port+Harcourt',
    1
  ),
  (
    'WINGSIDE Sani Abacha',
    '30/33 Sani Abacha Road, The Autograph Mall',
    'Port Harcourt',
    'Rivers State',
    '08090191999',
    'reachus@wingside.ng',
    '8:00 AM - 10:00 PM Daily',
    '/contact-location-2.jpg',
    '/contact-location-2-thumb.jpg',
    false,
    4.8,
    324,
    ARRAY['Dine in', 'Takeout', 'Delivery', 'Catering'],
    ARRAY['outdoor seating', 'wifi', 'wheelchair accessible'],
    'https://www.google.com/maps/search/?api=1&query=30+33+Sani+Abacha+Road+The+Autograph+Mall+Port+Harcourt',
    2
  )
ON CONFLICT DO NOTHING;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_stores_city ON stores(city);
CREATE INDEX IF NOT EXISTS idx_stores_state ON stores(state);
CREATE INDEX IF NOT EXISTS idx_stores_active ON stores(is_active);
CREATE INDEX IF NOT EXISTS idx_stores_display_order ON stores(display_order);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_stores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_stores_updated_at_trigger
BEFORE UPDATE ON stores
FOR EACH ROW
EXECUTE FUNCTION update_stores_updated_at();
