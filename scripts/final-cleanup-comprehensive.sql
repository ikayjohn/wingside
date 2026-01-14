-- FINAL CLEANUP: Get exactly 78 areas
-- This will show and delete ALL areas except your exact 78

-- First, let's see what we have
SELECT COUNT(*) as current_total FROM delivery_areas;

-- Show ALL areas that will be deleted (areas NOT in your list)
SELECT name, display_order, delivery_fee, is_active
FROM delivery_areas
WHERE name NOT IN (
  'New GRA', 'Water Lines', 'Oroazi', 'Olu Obasanjo', 'Agip', 'Rumuokalagbor',
  'Rumuola Link Road', 'Mile 4', 'Rumuokwuta', 'Stadium Road', 'Garrison',
  'Rumuomasi', 'D-Line', 'Elekahia', 'Airforce', 'Iwofe (Before St. Johns)',
  'Agip Estate', 'Rumueme', 'Whimpey', 'Mile 3', 'Ogbunabali', 'Mgbuoshimini',
  'Eagle Island', 'Rumuobiakani/ Old Aba Road', 'Mile 1', 'Rumuigbo',
  'Ada George - Before flyover', 'Moscow Road', 'Old GRA', 'Obiwali Road',
  'Ada George - After Flyover', 'Iwofe (After St. Johns)', 'Elioparawon',
  'Mgbuoba', 'Cocaine Estate', 'Eliozu, Rukpakulusi', 'Eliogbolo', 'East West Road',
  'Rumuogba', 'Eastern By Pass', 'Okporo Road', 'Rumuibekwe', 'NTA Road',
  'Rumuodara', 'Amadi Ama', 'Peter Odili Road', 'Abuloma (Okuru Ama/Ozuboko)',
  'Rumukrushi', 'Nkpolu', 'Rumuokoro', 'Trans-amadi (Golf Estate etc.)', 'Rumurolu',
  'Rumuewhara', 'Rumunduru', 'Woji/Alcon', 'Rumodumaya', 'Oil Mill',
  'Rumuolumeni/ Saipem', 'Uzuoba', 'Town/Borokiri', 'Akpajo', 'Choba', 'Elimgbu',
  'Alakahia', 'Rumuagholu', 'Eneka', 'Sars Road', 'Elelewon', 'Rukpokwu', 'Rumuosi',
  'Eleme', 'Igwuruta', 'Eleme junction/Trinity Estate', 'Atali', 'Aluu', 'Oyingbo',
  'Omagwa/ Airport', 'Onne'
)
ORDER BY display_order;

-- Delete all extra areas
DELETE FROM delivery_areas
WHERE name NOT IN (
  'New GRA', 'Water Lines', 'Oroazi', 'Olu Obasanjo', 'Agip', 'Rumuokalagbor',
  'Rumuola Link Road', 'Mile 4', 'Rumuokwuta', 'Stadium Road', 'Garrison',
  'Rumuomasi', 'D-Line', 'Elekahia', 'Airforce', 'Iwofe (Before St. Johns)',
  'Agip Estate', 'Rumueme', 'Whimpey', 'Mile 3', 'Ogbunabali', 'Mgbuoshimini',
  'Eagle Island', 'Rumuobiakani/ Old Aba Road', 'Mile 1', 'Rumuigbo',
  'Ada George - Before flyover', 'Moscow Road', 'Old GRA', 'Obiwali Road',
  'Ada George - After Flyover', 'Iwofe (After St. Johns)', 'Elioparawon',
  'Mgbuoba', 'Cocaine Estate', 'Eliozu, Rukpakulusi', 'Eliogbolo', 'East West Road',
  'Rumuogba', 'Eastern By Pass', 'Okporo Road', 'Rumuibekwe', 'NTA Road',
  'Rumuodara', 'Amadi Ama', 'Peter Odili Road', 'Abuloma (Okuru Ama/Ozuboko)',
  'Rumukrushi', 'Nkpolu', 'Rumuokoro', 'Trans-amadi (Golf Estate etc.)', 'Rumurolu',
  'Rumuewhara', 'Rumunduru', 'Woji/Alcon', 'Rumodumaya', 'Oil Mill',
  'Rumuolumeni/ Saipem', 'Uzuoba', 'Town/Borokiri', 'Akpajo', 'Choba', 'Elimgbu',
  'Alakahia', 'Rumuagholu', 'Eneka', 'Sars Road', 'Elelewon', 'Rukpokwu', 'Rumuosi',
  'Eleme', 'Igwuruta', 'Eleme junction/Trinity Estate', 'Atali', 'Aluu', 'Oyingbo',
  'Omagwa/ Airport', 'Onne'
);

-- Verify we now have exactly 78 areas
SELECT COUNT(*) as final_count FROM delivery_areas;

-- Show final list
SELECT name, delivery_fee, display_order
FROM delivery_areas
ORDER BY display_order ASC;
