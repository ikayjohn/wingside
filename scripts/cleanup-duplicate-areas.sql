-- Find all duplicate areas (same name appearing multiple times)
SELECT name, COUNT(*) as count, STRING_AGG(id::text, ', ') as ids
FROM delivery_areas
WHERE is_active = true
GROUP BY name
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- Show all areas that are NOT in the user's list of 78
-- These should be deleted
SELECT name, delivery_fee, display_order, id
FROM delivery_areas
WHERE is_active = true
  AND name NOT IN (
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
