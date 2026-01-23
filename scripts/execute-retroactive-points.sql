-- ============================================================================
-- EXECUTE RETROACTIVE POINTS AWARDING
-- ============================================================================
-- This script executes the function that was already created
-- ============================================================================

-- Show current state before
SELECT '=== BEFORE EXECUTION ===' as info;

SELECT
    p.email,
    p.total_points as current_points,
    COUNT(o.id) as paid_orders,
    SUM(o.total) as total_spent,
    FLOOR(SUM(o.total) / 100) as expected_points
FROM profiles p
INNER JOIN orders o ON o.user_id = p.id
WHERE o.payment_status = 'paid'
GROUP BY p.id, p.email, p.total_points
ORDER BY total_spent DESC;

-- Execute the function
SELECT '=== EXECUTING FUNCTION ===' as info;

SELECT * FROM retroactively_award_points();

-- Show results after
SELECT '=== AFTER EXECUTION ===' as info;

SELECT
    p.email,
    p.total_points as new_points,
    COUNT(DISTINCT o.id) as total_orders,
    SUM(CASE WHEN o.payment_status = 'paid' THEN 1 ELSE 0 END) as paid_orders,
    FLOOR(SUM(CASE WHEN o.payment_status = 'paid' THEN o.total ELSE 0 END) / 100) as expected_points,
    COUNT(ph.id) as point_transactions
FROM profiles p
LEFT JOIN orders o ON o.user_id = p.id
LEFT JOIN points_history ph ON ph.user_id = p.id
GROUP BY p.id, p.email, p.total_points
HAVING COUNT(o.id) > 0
ORDER BY new_points DESC NULLS LAST;

-- Specific users
SELECT '=== VERIFICATION ===' as info;

SELECT
    p.email,
    p.total_points as current_points,
    COUNT(o.id) as orders,
    SUM(CASE WHEN o.payment_status = 'paid' THEN o.total ELSE 0 END) as spent,
    FLOOR(SUM(CASE WHEN o.payment_status = 'paid' THEN o.total ELSE 0 END) / 100) as expected_points
FROM profiles p
LEFT JOIN orders o ON o.user_id = p.id
WHERE p.email IN ('billionaireboyscorp@gmail.com', 'blackspacebhd@gmail.com')
GROUP BY p.id, p.email, p.total_points;
