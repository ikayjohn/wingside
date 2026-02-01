-- Improved promo code usage increment with limit enforcement

CREATE OR REPLACE FUNCTION increment_promo_usage(promo_id UUID)
RETURNS TABLE(success BOOLEAN, error_message TEXT) AS $$
DECLARE
    v_usage_limit INTEGER;
    v_current_count INTEGER;
BEGIN
    -- Lock the promo code row for update
    SELECT usage_limit, COALESCE(used_count, 0)
    INTO v_usage_limit, v_current_count
    FROM promo_codes
    WHERE id = promo_id
    FOR UPDATE;

    -- Check if promo code exists
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'Promo code not found';
        RETURN;
    END IF;

    -- Check if usage limit will be exceeded
    IF v_usage_limit IS NOT NULL AND v_current_count >= v_usage_limit THEN
        RETURN QUERY SELECT FALSE, 'Promo code usage limit already reached';
        RETURN;
    END IF;

    -- Atomic increment
    UPDATE promo_codes
    SET used_count = COALESCE(used_count, 0) + 1,
        updated_at = NOW()
    WHERE id = promo_id;

    RETURN QUERY SELECT TRUE, NULL::TEXT;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION increment_promo_usage IS 'Atomically increment promo code used_count with usage limit enforcement to prevent race conditions';
