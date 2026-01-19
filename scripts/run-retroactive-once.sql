-- ============================================================================
-- RUN RETROACTIVE POINTS FUNCTION (ONCE ONLY!)
-- ============================================================================
-- This script executes the function that awards points for old paid orders
-- Make sure you only run this ONCE!
-- ============================================================================

-- Execute the function
SELECT * FROM retroactively_award_points();

-- Verify results
SELECT
    '=== RESULTS ===' as info;

SELECT
    p.email,
    p.total_points as new_points,
    COUNT(o.id) as total_orders,
    SUM(CASE WHEN o.payment_status = 'paid' THEN 1 ELSE 0 END) as paid_orders,
    SUM(CASE WHEN o.payment_status = 'paid' THEN o.total ELSE 0 END) as total_spent,
    FLOOR(SUM(CASE WHEN o.payment_status = 'paid' THEN o.total ELSE 0 END) / 10) as expected_points
FROM profiles p
LEFT JOIN orders o ON o.user_id = p.id
GROUP BY p.id, p.email, p.total_points
HAVING SUM(CASE WHEN o.payment_status = 'paid' THEN o.total ELSE 0 END) > 0
ORDER BY new_points DESC;
