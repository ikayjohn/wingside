-- Create delivery_areas table
CREATE TABLE IF NOT EXISTS delivery_areas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  delivery_fee DECIMAL(10, 2) NOT NULL,
  min_order_amount DECIMAL(10, 2) DEFAULT 0,
  estimated_time VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for active areas
CREATE INDEX idx_delivery_areas_active ON delivery_areas(is_active, display_order);

-- Add trigger for updated_at
CREATE TRIGGER update_delivery_areas_updated_at
BEFORE UPDATE ON delivery_areas
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Insert initial delivery areas for Lagos, Nigeria
INSERT INTO delivery_areas (name, description, delivery_fee, min_order_amount, estimated_time, display_order) VALUES
('Victoria Island', 'Victoria Island and Ikoyi', 1500, 5000, '30-45 mins', 1),
('Lekki Phase 1', 'Lekki Phase 1, Oniru', 2000, 5000, '45-60 mins', 2),
('Ajah', 'Ajah, Sangotedo, Lakowe', 2500, 7000, '60-75 mins', 3),
('Mainland (Yaba, Surulere)', 'Yaba, Surulere, Ebute Metta', 2000, 5000, '45-60 mins', 4),
('Ikeja', 'Ikeja, Allen, Ogba', 2500, 6000, '50-65 mins', 5),
('Maryland/Gbagada', 'Maryland, Gbagada, Ogudu', 2500, 6000, '50-65 mins', 6);
