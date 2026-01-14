-- Update existing areas and insert missing ones in your exact order
-- This script handles both updating and inserting delivery areas

-- First, reset all display_orders to 0
UPDATE delivery_areas SET display_order = 0;

-- Update existing areas with their new display_order values
UPDATE delivery_areas SET display_order = 1 WHERE name = 'New GRA';
UPDATE delivery_areas SET display_order = 2 WHERE name = 'Water Lines';
UPDATE delivery_areas SET display_order = 3 WHERE name = 'Oroazi';
UPDATE delivery_areas SET display_order = 4 WHERE name = 'Olu Obasanjo';
UPDATE delivery_areas SET display_order = 5 WHERE name = 'Agip';
UPDATE delivery_areas SET display_order = 6 WHERE name = 'Rumuokalagbor';
UPDATE delivery_areas SET display_order = 7 WHERE name = 'Rumuola Link Road';
UPDATE delivery_areas SET display_order = 8 WHERE name = 'Mile 4';
UPDATE delivery_areas SET display_order = 9 WHERE name = 'Rumuokwuta' AND delivery_fee = 2000;
UPDATE delivery_areas SET display_order = 10 WHERE name = 'Stadium Road';
UPDATE delivery_areas SET display_order = 11 WHERE name = 'Garrison';
UPDATE delivery_areas SET display_order = 12 WHERE name = 'Rumuomasi';
UPDATE delivery_areas SET display_order = 13 WHERE name = 'D-Line';
UPDATE delivery_areas SET display_order = 14 WHERE name = 'Elekahia';
UPDATE delivery_areas SET display_order = 15 WHERE name = 'Airforce';
UPDATE delivery_areas SET display_order = 16 WHERE name = 'Iwofe (Before St. Johns)';
UPDATE delivery_areas SET display_order = 17 WHERE name = 'Agip Estate';
UPDATE delivery_areas SET display_order = 18 WHERE name = 'Rumueme';
UPDATE delivery_areas SET display_order = 19 WHERE name = 'Whimpey';
UPDATE delivery_areas SET display_order = 20 WHERE name = 'Mile 3';
UPDATE delivery_areas SET display_order = 21 WHERE name = 'Ogbunabali';
UPDATE delivery_areas SET display_order = 22 WHERE name = 'Mgbuoshimini';
UPDATE delivery_areas SET display_order = 23 WHERE name = 'Eagle Island';
UPDATE delivery_areas SET display_order = 24 WHERE name = 'Rumuobiakani/ Old Aba Road';
UPDATE delivery_areas SET display_order = 25 WHERE name = 'Mile 1';
UPDATE delivery_areas SET display_order = 26 WHERE name = 'Rumuigbo' AND delivery_fee = 2500;
UPDATE delivery_areas SET display_order = 27 WHERE name = 'Ada George - Before flyover';
UPDATE delivery_areas SET display_order = 28 WHERE name = 'Moscow Road';
UPDATE delivery_areas SET display_order = 29 WHERE name = 'Old GRA';
UPDATE delivery_areas SET display_order = 30 WHERE name = 'Obiwali Road';
UPDATE delivery_areas SET display_order = 31 WHERE name = 'Ada George - After Flyover';
UPDATE delivery_areas SET display_order = 32 WHERE name = 'Iwofe (After St. Johns)';
UPDATE delivery_areas SET display_order = 33 WHERE name = 'Elioparawon';
UPDATE delivery_areas SET display_order = 34 WHERE name = 'Mgbuoba';
UPDATE delivery_areas SET display_order = 35 WHERE name = 'Cocaine Estate';
UPDATE delivery_areas SET display_order = 36 WHERE name = 'Eliozu, Rukpakulusi';
UPDATE delivery_areas SET display_order = 37 WHERE name = 'Eliogbolo';
UPDATE delivery_areas SET display_order = 38 WHERE name = 'East West Road';
UPDATE delivery_areas SET display_order = 39 WHERE name = 'Rumuogba';
UPDATE delivery_areas SET display_order = 40 WHERE name = 'Eastern By Pass';
UPDATE delivery_areas SET display_order = 41 WHERE name = 'Okporo Road';
UPDATE delivery_areas SET display_order = 42 WHERE name = 'Rumuibekwe';
UPDATE delivery_areas SET display_order = 43 WHERE name = 'NTA Road';
UPDATE delivery_areas SET display_order = 44 WHERE name = 'Rumuodara';
UPDATE delivery_areas SET display_order = 45 WHERE name = 'Amadi Ama';
UPDATE delivery_areas SET display_order = 46 WHERE name = 'Peter Odili Road';
UPDATE delivery_areas SET display_order = 47 WHERE name = 'Abuloma (Okuru Ama/Ozuboko)';
UPDATE delivery_areas SET display_order = 48 WHERE name = 'Rumukrushi';
UPDATE delivery_areas SET display_order = 49 WHERE name = 'Nkpolu';
UPDATE delivery_areas SET display_order = 50 WHERE name = 'Rumuokoro';
UPDATE delivery_areas SET display_order = 51 WHERE name = 'Trans-amadi (Golf Estate etc.)';
UPDATE delivery_areas SET display_order = 52 WHERE name = 'Rumurolu';
UPDATE delivery_areas SET display_order = 53 WHERE name = 'Rumuewhara';
UPDATE delivery_areas SET display_order = 54 WHERE name = 'Rumunduru';
UPDATE delivery_areas SET display_order = 55 WHERE name = 'Woji/Alcon';
UPDATE delivery_areas SET display_order = 56 WHERE name = 'Rumodumaya';
UPDATE delivery_areas SET display_order = 57 WHERE name = 'Oil Mill';
UPDATE delivery_areas SET display_order = 58 WHERE name = 'Rumuolumeni/ Saipem';
UPDATE delivery_areas SET display_order = 59 WHERE name = 'Uzuoba';
UPDATE delivery_areas SET display_order = 60 WHERE name = 'Town/Borokiri';
UPDATE delivery_areas SET display_order = 61 WHERE name = 'Akpajo';
UPDATE delivery_areas SET display_order = 62 WHERE name = 'Choba';
UPDATE delivery_areas SET display_order = 63 WHERE name = 'Elimgbu';
UPDATE delivery_areas SET display_order = 64 WHERE name = 'Alakahia';
UPDATE delivery_areas SET display_order = 65 WHERE name = 'Rumuagholu';
UPDATE delivery_areas SET display_order = 66 WHERE name = 'Eneka';
UPDATE delivery_areas SET display_order = 67 WHERE name = 'Sars Road';
UPDATE delivery_areas SET display_order = 68 WHERE name = 'Elelewon';
UPDATE delivery_areas SET display_order = 69 WHERE name = 'Rukpokwu';
UPDATE delivery_areas SET display_order = 70 WHERE name = 'Rumuosi';
UPDATE delivery_areas SET display_order = 71 WHERE name = 'Eleme';
UPDATE delivery_areas SET display_order = 72 WHERE name = 'Igwuruta';
UPDATE delivery_areas SET display_order = 73 WHERE name = 'Eleme junction/Trinity Estate';
UPDATE delivery_areas SET display_order = 74 WHERE name = 'Atali';
UPDATE delivery_areas SET display_order = 75 WHERE name = 'Aluu';
UPDATE delivery_areas SET display_order = 76 WHERE name = 'Oyingbo';
UPDATE delivery_areas SET display_order = 77 WHERE name = 'Omagwa/ Airport';
UPDATE delivery_areas SET display_order = 78 WHERE name = 'Onne';

-- Insert missing areas (ones that don't exist in DB yet)
INSERT INTO delivery_areas (name, description, delivery_fee, min_order_amount, estimated_time, is_active, display_order) VALUES
('Eastern By Pass', 'Port Harcourt - Eastern By Pass area', 3000, 5000, '20-30 mins', true, 40),
('Okporo Road', 'Port Harcourt - Okporo Road area', 3000, 5000, '20-30 mins', true, 41),
('NTA Road', 'Port Harcourt - NTA Road area', 3000, 5000, '20-30 mins', true, 43),
('Rumuodara', 'Port Harcourt - Rumuodara area', 3000, 5000, '20-30 mins', true, 44),
('Amadi Ama', 'Port Harcourt - Amadi Ama area', 3000, 5000, '20-30 mins', true, 45),
('Peter Odili Road', 'Port Harcourt - Peter Odili Road area', 3000, 5000, '20-30 mins', true, 46),
('Abuloma (Okuru Ama/Ozuboko)', 'Port Harcourt - Abuloma area', 3000, 5000, '20-30 mins', true, 47),
('Rumukrushi', 'Port Harcourt - Rumukrushi area', 3000, 5000, '20-30 mins', true, 48),
('Nkpolu', 'Port Harcourt - Nkpolu area', 3000, 5000, '20-30 mins', true, 49),
('Rumuokoro', 'Port Harcourt - Rumuokoro area', 3000, 5000, '20-30 mins', true, 50),
('Trans-amadi (Golf Estate etc.)', 'Port Harcourt - Trans-amadi area', 3000, 5000, '20-30 mins', true, 51),
('Rumodumaya', 'Port Harcourt - Rumodumaya area', 3000, 5000, '20-30 mins', true, 56),
('Oil Mill', 'Port Harcourt - Oil Mill area', 4000, 5000, '30-40 mins', true, 57),
('Rumuolumeni/ Saipem', 'Port Harcourt - Rumuolumeni/Saipem area', 4000, 5000, '30-40 mins', true, 58),
('Elimgbu', 'Port Harcourt - Elimgbu area', 4000, 5000, '30-40 mins', true, 63),
('Alakahia', 'Port Harcourt - Alakahia area', 4000, 5000, '30-40 mins', true, 64),
('Rumuagholu', 'Port Harcourt - Rumuagholu area', 4000, 5000, '30-40 mins', true, 65),
('Eneka', 'Port Harcourt - Eneka area', 4000, 5000, '30-40 mins', true, 66),
('Sars Road', 'Port Harcourt - Sars Road area', 4000, 5000, '30-40 mins', true, 67),
('Elelewon', 'Port Harcourt - Elelewon area', 4000, 5000, '30-40 mins', true, 68),
('Rukpokwu', 'Port Harcourt - Rukpokwu area', 4000, 5000, '30-40 mins', true, 69),
('Rumuosi', 'Port Harcourt - Rumuosi area', 4000, 5000, '30-40 mins', true, 70);

-- Verify the order
SELECT id, name, delivery_fee, display_order
FROM delivery_areas
WHERE is_active = true
ORDER BY display_order ASC
LIMIT 20;
