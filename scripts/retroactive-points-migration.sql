-- Retroactively Award Points for Old Paid Orders
-- This script awards points for all previously paid orders that didn't get points

-- First, let's see what we're working with
SELECT
    p.email,
    p.total_points as current_points,
    COUNT(o.id) as paid_orders,
    SUM(o.total) as total_spent,
    FLOOR(SUM(o.total) / 10) as expected_points
FROM profiles p
INNER JOIN orders o ON o.user_id = p.id
WHERE o.payment_status = 'paid'
GROUP BY p.id, p.email, p.total_points
ORDER BY total_spent DESC;

-- Now create a function to retroactively award points
CREATE OR REPLACE FUNCTION retroactively_award_points()
RETURNS TABLE(
    user_id UUID,
    email TEXT,
    orders_processed INTEGER,
    points_awarded INTEGER,
    new_total_points INTEGER
) AS $$
DECLARE
    user_record RECORD;
    order_record RECORD;
    v_points_to_award INTEGER;
    v_new_total INTEGER;
    v_order_count INTEGER;
BEGIN
    -- Loop through all users who have paid orders
    FOR user_record IN
        SELECT DISTINCT o.user_id, p.email
        FROM orders o
        INNER JOIN profiles p ON p.id = o.user_id
        WHERE o.payment_status = 'paid'
    LOOP
        v_points_to_award := 0;
        v_order_count := 0;

        -- Calculate points for each order and award them
        FOR order_record IN
            SELECT id, order_number, total
            FROM orders
            WHERE user_id = user_record.user_id
            AND payment_status = 'paid'
            ORDER BY created_at ASC
        LOOP
            -- Award points for this order (₦100 = 10 points)
            DECLARE
                v_order_points INTEGER := FLOOR(order_record.total / 10);
            BEGIN
                -- Update user's total_points
                UPDATE profiles
                SET total_points = COALESCE(total_points, 0) + v_order_points,
                    updated_at = NOW()
                WHERE id = user_record.user_id
                RETURNING total_points INTO v_new_total;

                -- Log in points_history if table exists
                BEGIN
                    INSERT INTO points_history (
                        user_id,
                        points,
                        type,
                        source,
                        description,
                        metadata,
                        created_at
                    ) VALUES (
                        user_record.user_id,
                        v_order_points,
                        'earned',
                        'purchase',
                        'Retroactive points for order #' || order_record.order_number,
                        jsonb_build_object(
                            'order_id', order_record.id,
                            'order_number', order_record.order_number,
                            'order_total', order_record.total,
                            'awarded_at', NOW()
                        ),
                        order_record.created_at  -- Use original order date
                    );
                EXCEPTION WHEN OTHERS THEN
                    -- Table might not exist, continue
                    RAISE NOTICE 'Could not log to points_history for order %', order_record.order_number;
                END;

                v_points_to_award := v_points_to_award + v_order_points;
                v_order_count := v_order_count + 1;

                RAISE NOTICE 'Awarded % points to % for order #%s (total: %)',
                    v_order_points,
                    user_record.email,
                    order_record.order_number,
                    v_new_total;
            END;
        END LOOP;

        -- Return result for this user
        RETURN NEXT;
    END LOOP;

    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Execute the function to award points
SELECT * FROM retroactively_award_points();

-- Verify the results
SELECT
    p.email,
    p.total_points as new_points,
    COUNT(DISTINCT o.id) as total_orders,
    SUM(CASE WHEN o.payment_status = 'paid' THEN 1 ELSE 0 END) as paid_orders,
    FLOOR(SUM(CASE WHEN o.payment_status = 'paid' THEN o.total ELSE 0 END) / 10) as points_from_orders,
    COUNT(ph.id) as point_transactions
FROM profiles p
LEFT JOIN orders o ON o.user_id = p.id
LEFT JOIN points_history ph ON ph.user_id = p.id
GROUP BY p.id, p.email, p.total_points
HAVING COUNT(o.id) > 0
ORDER BY new_points DESC NULLS LAST;
