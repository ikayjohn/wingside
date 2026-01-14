-- Clear Redis cache for delivery areas
-- Run this in Supabase SQL editor

-- This will delete the delivery_areas cache key from Redis
SELECT redis.del('delivery_areas');

-- Verify the cache is cleared
SELECT redis.get('delivery_areas');

-- Now test a fresh fetch from the database
SELECT COUNT(*) as total,
       COUNT(*) FILTER (WHERE is_active = true) as active
FROM delivery_areas;
