-- ============================================================================
-- Promo Code Auto-Deactivation System
-- ============================================================================
-- Automatically deactivates promo codes that have passed their valid_until date
-- ============================================================================

-- ============================================================================
-- Function: Process Promo Code Expiration
-- ============================================================================
-- Finds and deactivates promo codes that have expired
-- Returns list of codes that were deactivated

CREATE OR REPLACE FUNCTION process_promo_expiration()
RETURNS TABLE(
  code_id UUID,
  code TEXT,
  valid_until TIMESTAMPTZ,
  days_overdue INTEGER
) AS $$
BEGIN
  RETURN QUERY
  UPDATE promo_codes
  SET is_active = false,
      updated_at = NOW()
  WHERE valid_until IS NOT NULL
    AND valid_until < NOW()
    AND is_active = true
  RETURNING
    id as code_id,
    promo_codes.code,
    promo_codes.valid_until,
    EXTRACT(DAY FROM (NOW() - promo_codes.valid_until))::INTEGER as days_overdue;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Function: Get Expiring Promo Codes (for preview/warnings)
-- ============================================================================
-- Returns promo codes that will expire within X days
-- Used to send warning notifications to admins

CREATE OR REPLACE FUNCTION get_expiring_promo_codes(
  p_days_before INTEGER DEFAULT 7
)
RETURNS TABLE(
  code_id UUID,
  code TEXT,
  description TEXT,
  valid_until TIMESTAMPTZ,
  days_until_expiry INTEGER,
  usage_stats TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    id as code_id,
    promo_codes.code,
    promo_codes.description,
    promo_codes.valid_until,
    EXTRACT(DAY FROM (promo_codes.valid_until - NOW()))::INTEGER as days_until_expiry,
    FORMAT('%s/%s used',
      promo_codes.used_count,
      COALESCE(promo_codes.usage_limit::TEXT, 'unlimited')
    ) as usage_stats
  FROM promo_codes
  WHERE valid_until IS NOT NULL
    AND valid_until > NOW()
    AND valid_until <= NOW() + (p_days_before || ' days')::INTERVAL
    AND is_active = true
  ORDER BY promo_codes.valid_until ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Grant permissions
-- ============================================================================

GRANT EXECUTE ON FUNCTION process_promo_expiration() TO service_role;
GRANT EXECUTE ON FUNCTION get_expiring_promo_codes(INTEGER) TO service_role;

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON FUNCTION process_promo_expiration() IS
'Processes promo code expiration. Deactivates promo codes past their valid_until date. Should be run via cron job daily.';

COMMENT ON FUNCTION get_expiring_promo_codes(INTEGER) IS
'Returns promo codes that will expire within specified days. Used to send warning notifications to admins. Default 7 days before expiration.';
