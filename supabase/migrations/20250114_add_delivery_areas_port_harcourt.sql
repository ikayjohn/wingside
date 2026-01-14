-- Add Port Harcourt Delivery Areas
-- Migration: 20250114_add_delivery_areas_port_harcourt.sql

-- ₦3,000 Delivery Areas (16 areas - Closest locations)
INSERT INTO delivery_areas (name, description, delivery_fee, min_order_amount, estimated_time, is_active, display_order) VALUES
('Eliogbolo', 'Port Harcourt - Eliogbolo area', 3000, 5000, '20-30 mins', true, 1),
('East West Road', 'Port Harcourt - East West Road corridor', 3000, 5000, '20-30 mins', true, 2),
('Rumuogba', 'Port Harcourt - Rumuogba area', 3000, 5000, '20-30 mins', true, 3),
('Rumuokwuta', 'Port Harcourt - Rumuokwuta area', 3000, 5000, '20-30 mins', true, 4),
('Rumualogu/Airport Road', 'Port Harcourt - Rumualogu/Airport Road area', 3000, 5000, '20-30 mins', true, 5),
('Rumuola', 'Port Harcourt - Rumuola area', 3000, 5000, '20-30 mins', true, 6),
('Rumuomoi', 'Port Harcourt - Rumuomoi area', 3000, 5000, '20-30 mins', true, 7),
('Rumuikwr', 'Port Harcourt - Rumuikwr area', 3000, 5000, '20-30 mins', true, 8),
('Rumuola/Park Lane', 'Port Harcourt - Rumuola/Park Lane area', 3000, 5000, '20-30 mins', true, 9),
('Rumuodomaya', 'Port Harcourt - Rumuodomaya area', 3000, 5000, '20-30 mins', true, 10),
('Rumuibekwe', 'Port Harcourt - Rumuibekwe area', 3000, 5000, '20-30 mins', true, 11),
('Rumuola/NTA', 'Port Harcourt - Rumuola/NTA area', 3000, 5000, '20-30 mins', true, 12),
('Rumuigbo', 'Port Harcourt - Rumuigbo area', 3000, 5000, '20-30 mins', true, 13),
('Rumurolu', 'Port Harcourt - Rumurolu area', 3000, 5000, '20-30 mins', true, 14),
('Rumuokwurusi', 'Port Harcourt - Rumuokwurusi area', 3000, 5000, '20-30 mins', true, 15),
('Rumualogu', 'Port Harcourt - Rumualogu area', 3000, 5000, '20-30 mins', true, 16);

-- ₦3,500 Delivery Areas (6 areas - Mid-close locations)
INSERT INTO delivery_areas (name, description, delivery_fee, min_order_amount, estimated_time, is_active, display_order) VALUES
('Rumuewhara', 'Port Harcourt - Rumuewhara area', 3500, 5000, '25-35 mins', true, 17),
('Rumunduru', 'Port Harcourt - Rumunduru area', 3500, 5000, '25-35 mins', true, 18),
('Woji/Alcon', 'Port Harcourt - Woji/Alcon area', 3500, 5000, '25-35 mins', true, 19),
('Rumuoparali', 'Port Harcourt - Rumuoparali area', 3500, 5000, '25-35 mins', true, 20),
('Rumuola/Station', 'Port Harcourt - Rumuola/Station area', 3500, 5000, '25-35 mins', true, 21),
('Rumuokuta', 'Port Harcourt - Rumuokuta area', 3500, 5000, '25-35 mins', true, 22);

-- ₦4,000 Delivery Areas (13 areas - Mid-range locations)
INSERT INTO delivery_areas (name, description, delivery_fee, min_order_amount, estimated_time, is_active, display_order) VALUES
('Uzuoba', 'Port Harcourt - Uzuoba area', 4000, 5000, '30-40 mins', true, 23),
('Town/Borokiri', 'Port Harcourt - Town/Borokiri area', 4000, 5000, '30-40 mins', true, 24),
('Akpajo', 'Port Harcourt - Akpajo area', 4000, 5000, '30-40 mins', true, 25),
('Choba', 'Port Harcourt - Choba area', 4000, 5000, '30-40 mins', true, 26),
('Rumuekini', 'Port Harcourt - Rumuekini area', 4000, 5000, '30-40 mins', true, 27),
('Rumuokwuta/Aluu', 'Port Harcourt - Rumuokwuta/Aluu area', 4000, 5000, '30-40 mins', true, 28),
('Rumuola/GRA', 'Port Harcourt - Rumuola/GRA area', 4000, 5000, '30-40 mins', true, 29),
('Rumuokuta/Aluu', 'Port Harcourt - Rumuokuta/Aluu area', 4000, 5000, '30-40 mins', true, 30),
('Rumuewhara/Rumuduru', 'Port Harcourt - Rumuewhara/Rumuduru area', 4000, 5000, '30-40 mins', true, 31),
('Rumuigbo/Rumurolu', 'Port Harcourt - Rumuigbo/Rumurolu area', 4000, 5000, '30-40 mins', true, 32),
('Rumuola/Eagle Island', 'Port Harcourt - Rumuola/Eagle Island area', 4000, 5000, '30-40 mins', true, 33),
('Trans Amadi', 'Port Harcourt - Trans Amadi area', 4000, 5000, '30-40 mins', true, 34),
('Rumuokwurusi/Igwuruta', 'Port Harcourt - Rumuokwurusi/Igwuruta area', 4000, 5000, '30-40 mins', true, 35);

-- ₦5,000 Delivery Areas (4 areas - Distant locations)
INSERT INTO delivery_areas (name, description, delivery_fee, min_order_amount, estimated_time, is_active, display_order) VALUES
('Eleme', 'Port Harcourt - Eleme area', 5000, 5000, '35-45 mins', true, 36),
('Igwuruta', 'Port Harcourt - Igwuruta area', 5000, 5000, '35-45 mins', true, 37),
('Eleme Junction/Trinity Estate', 'Port Harcourt - Eleme Junction/Trinity Estate area', 5000, 5000, '35-45 mins', true, 38),
('Atali', 'Port Harcourt - Atali area', 5000, 5000, '35-45 mins', true, 39);

-- ₦6,000 Delivery Areas (4 areas - Farthest locations)
INSERT INTO delivery_areas (name, description, delivery_fee, min_order_amount, estimated_time, is_active, display_order) VALUES
('Aluu', 'Port Harcourt - Aluu area', 6000, 5000, '40-50 mins', true, 40),
('Oyingbo', 'Port Harcourt - Oyingbo area', 6000, 5000, '40-50 mins', true, 41),
('Omagwa/Airport', 'Port Harcourt - Omagwa/Airport area', 6000, 5000, '40-50 mins', true, 42),
('Onne', 'Port Harcourt - Onne area', 6000, 5000, '40-50 mins', true, 43);

-- Total: 43 new delivery areas added
