-- Fix promo code usage race condition with atomic increment

CREATE OR REPLACE FUNCTION increment_promo_usage(promo_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Atomic increment - safe from race conditions
    UPDATE promo_codes
    SET used_count = COALESCE(used_count, 0) + 1
    WHERE id = promo_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION increment_promo_usage IS 'Atomically increment promo code used_count to prevent race conditions';
