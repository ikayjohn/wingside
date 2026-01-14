-- Reorder Delivery Areas - Exact Order Provided
-- Sets display_order to match your preferred delivery route sequence

UPDATE delivery_areas SET display_order = 1 WHERE name = 'New GRA';
UPDATE delivery_areas SET display_order = 2 WHERE name = 'Water lines';
UPDATE delivery_areas SET display_order = 3 WHERE name = 'Oroazi';
UPDATE delivery_areas SET display_order = 4 WHERE name = 'Olu Obasanjo';
UPDATE delivery_areas SET display_order = 5 WHERE name = 'Agip';
UPDATE delivery_areas SET display_order = 6 WHERE name = 'Rumuokalagbor';
UPDATE delivery_areas SET display_order = 7 WHERE name = 'Rumuola Link Road';
UPDATE delivery_areas SET display_order = 8 WHERE name = 'Mile 4';
UPDATE delivery_areas SET display_order = 9 WHERE name = 'Rumuokwuta';
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
UPDATE delivery_areas SET display_order = 24 WHERE name = 'Rumuobiakani / Old Aba Road';
UPDATE delivery_areas SET display_order = 25 WHERE name = 'Mile 1';
UPDATE delivery_areas SET display_order = 26 WHERE name = 'Rumuigbo';
UPDATE delivery_areas SET display_order = 27 WHERE name = 'Ada George- Before flyover';
UPDATE delivery_areas SET display_order = 28 WHERE name = 'Moscow Road';
UPDATE delivery_areas SET display_order = 29 WHERE name = 'Old GRA';
UPDATE delivery_areas SET display_order = 30 WHERE name = 'Obiwali Road';
UPDATE delivery_areas SET display_order = 31 WHERE name = 'Ada George (After Flyover)';
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
UPDATE delivery_areas SET display_order = 60 WHERE name = 'Town/ Borokiri';
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

-- Verify the new order
SELECT id, name, delivery_fee, display_order
FROM delivery_areas
WHERE is_active = true
ORDER BY display_order ASC;
