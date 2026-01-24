-- ============================================================================
-- Referral Fraud Detection System
-- ============================================================================
-- Detects and flags suspicious referral patterns to prevent fraud
-- ============================================================================

-- ============================================================================
-- Table: Referral Fraud Flags
-- ============================================================================
-- Stores fraud detection flags and scores for referrals

CREATE TABLE IF NOT EXISTS referral_fraud_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id UUID NOT NULL REFERENCES referrals(id) ON DELETE CASCADE,
  fraud_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  fraud_score INTEGER NOT NULL DEFAULT 0, -- 0-100
  description TEXT,
  evidence JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'flagged' CHECK (status IN ('flagged', 'investigating', 'confirmed_fraud', 'false_positive', 'resolved')),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_fraud_flags_referral_id ON referral_fraud_flags(referral_id);
CREATE INDEX IF NOT EXISTS idx_fraud_flags_status ON referral_fraud_flags(status);
CREATE INDEX IF NOT EXISTS idx_fraud_flags_severity ON referral_fraud_flags(severity);
CREATE INDEX IF NOT EXISTS idx_fraud_flags_fraud_type ON referral_fraud_flags(fraud_type);
CREATE INDEX IF NOT EXISTS idx_fraud_flags_created_at ON referral_fraud_flags(created_at DESC);

-- ============================================================================
-- Function: Detect Email Pattern Fraud
-- ============================================================================
-- Detects suspicious email patterns (e.g., john1@email.com, john2@email.com)

CREATE OR REPLACE FUNCTION detect_email_pattern_fraud(p_referrer_id UUID)
RETURNS TABLE(
  referral_id UUID,
  fraud_type TEXT,
  severity TEXT,
  fraud_score INTEGER,
  description TEXT,
  evidence JSONB
) AS $$
DECLARE
  v_referral RECORD;
  v_base_email TEXT;
  v_similar_count INTEGER;
BEGIN
  -- Check all referrals by this referrer
  FOR v_referral IN
    SELECT r.id, r.referred_email, r.referrer_id
    FROM referrals r
    WHERE r.referrer_id = p_referrer_id
      AND r.status IN ('signed_up', 'first_order_completed')
  LOOP
    -- Extract base email (remove numbers at end)
    v_base_email := regexp_replace(v_referral.referred_email, '\d+@', '@');

    -- Count similar emails
    SELECT COUNT(*) INTO v_similar_count
    FROM referrals
    WHERE referrer_id = p_referrer_id
      AND referred_email ~ ('^' || regexp_replace(v_base_email, '@.*', '') || '\d*@');

    -- If 3+ similar emails, flag as suspicious
    IF v_similar_count >= 3 THEN
      referral_id := v_referral.id;
      fraud_type := 'email_pattern_fraud';
      severity := CASE
        WHEN v_similar_count >= 5 THEN 'critical'
        WHEN v_similar_count >= 4 THEN 'high'
        ELSE 'medium'
      END;
      fraud_score := LEAST(v_similar_count * 15, 100);
      description := FORMAT('Suspicious email pattern detected: %s similar emails found', v_similar_count);
      evidence := jsonb_build_object(
        'similar_emails_count', v_similar_count,
        'base_pattern', v_base_email,
        'referred_email', v_referral.referred_email
      );
      RETURN NEXT;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Function: Detect Rapid Referral Fraud
-- ============================================================================
-- Detects unusually rapid referrals (many referrals in short time)

CREATE OR REPLACE FUNCTION detect_rapid_referral_fraud(p_referrer_id UUID)
RETURNS TABLE(
  referral_id UUID,
  fraud_type TEXT,
  severity TEXT,
  fraud_score INTEGER,
  description TEXT,
  evidence JSONB
) AS $$
DECLARE
  v_referral RECORD;
  v_recent_count INTEGER;
  v_hourly_count INTEGER;
BEGIN
  -- Check referrals in last 24 hours
  SELECT COUNT(*) INTO v_recent_count
  FROM referrals
  WHERE referrer_id = p_referrer_id
    AND created_at > NOW() - INTERVAL '24 hours';

  -- Check referrals in last hour
  SELECT COUNT(*) INTO v_hourly_count
  FROM referrals
  WHERE referrer_id = p_referrer_id
    AND created_at > NOW() - INTERVAL '1 hour';

  -- Flag if suspicious velocity
  IF v_recent_count >= 10 OR v_hourly_count >= 5 THEN
    FOR v_referral IN
      SELECT id FROM referrals
      WHERE referrer_id = p_referrer_id
        AND created_at > NOW() - INTERVAL '24 hours'
      LIMIT 1
    LOOP
      referral_id := v_referral.id;
      fraud_type := 'rapid_referral_velocity';
      severity := CASE
        WHEN v_hourly_count >= 10 OR v_recent_count >= 20 THEN 'critical'
        WHEN v_hourly_count >= 7 OR v_recent_count >= 15 THEN 'high'
        ELSE 'medium'
      END;
      fraud_score := LEAST((v_recent_count * 5) + (v_hourly_count * 10), 100);
      description := FORMAT('Suspicious referral velocity: %s in 24h, %s in 1h', v_recent_count, v_hourly_count);
      evidence := jsonb_build_object(
        'referrals_last_24h', v_recent_count,
        'referrals_last_1h', v_hourly_count,
        'threshold_exceeded', true
      );
      RETURN NEXT;
    END LOOP;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Function: Detect No Purchase Activity Fraud
-- ============================================================================
-- Detects referred users who never made a purchase (fake accounts)

CREATE OR REPLACE FUNCTION detect_no_purchase_fraud()
RETURNS TABLE(
  referral_id UUID,
  fraud_type TEXT,
  severity TEXT,
  fraud_score INTEGER,
  description TEXT,
  evidence JSONB
) AS $$
DECLARE
  v_referral RECORD;
  v_days_since_signup INTEGER;
  v_order_count INTEGER;
BEGIN
  -- Check referrals older than 30 days with no orders
  FOR v_referral IN
    SELECT r.id, r.referred_user_id, r.referred_email, r.created_at
    FROM referrals r
    WHERE r.status = 'signed_up'
      AND r.created_at < NOW() - INTERVAL '30 days'
      AND r.referred_user_id IS NOT NULL
  LOOP
    -- Count orders from referred user
    SELECT COUNT(*) INTO v_order_count
    FROM orders
    WHERE user_id = v_referral.referred_user_id;

    -- Calculate days since signup
    v_days_since_signup := EXTRACT(DAY FROM (NOW() - v_referral.created_at));

    -- Flag if no orders after 30+ days
    IF v_order_count = 0 THEN
      referral_id := v_referral.id;
      fraud_type := 'no_purchase_activity';
      severity := CASE
        WHEN v_days_since_signup >= 90 THEN 'high'
        WHEN v_days_since_signup >= 60 THEN 'medium'
        ELSE 'low'
      END;
      fraud_score := LEAST(v_days_since_signup, 100);
      description := FORMAT('Referred user has no purchases after %s days', v_days_since_signup);
      evidence := jsonb_build_object(
        'days_since_signup', v_days_since_signup,
        'order_count', v_order_count,
        'referred_email', v_referral.referred_email
      );
      RETURN NEXT;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Function: Detect Self-Referral Fraud
-- ============================================================================
-- Detects potential self-referrals based on email/name similarity

CREATE OR REPLACE FUNCTION detect_self_referral_fraud()
RETURNS TABLE(
  referral_id UUID,
  fraud_type TEXT,
  severity TEXT,
  fraud_score INTEGER,
  description TEXT,
  evidence JSONB
) AS $$
DECLARE
  v_referral RECORD;
  v_referrer_email TEXT;
  v_referrer_name TEXT;
  v_referred_name TEXT;
  v_similarity_score NUMERIC;
BEGIN
  FOR v_referral IN
    SELECT r.id, r.referrer_id, r.referred_user_id, r.referred_email
    FROM referrals r
    WHERE r.referred_user_id IS NOT NULL
  LOOP
    -- Get referrer details
    SELECT email, full_name INTO v_referrer_email, v_referrer_name
    FROM profiles
    WHERE id = v_referral.referrer_id;

    -- Get referred user details
    SELECT full_name INTO v_referred_name
    FROM profiles
    WHERE id = v_referral.referred_user_id;

    -- Check email domain similarity
    IF split_part(v_referrer_email, '@', 2) = split_part(v_referral.referred_email, '@', 2) THEN
      -- Check name similarity
      v_similarity_score := similarity(LOWER(v_referrer_name), LOWER(COALESCE(v_referred_name, '')));

      -- Flag if suspicious similarity
      IF v_similarity_score > 0.5 OR
         LOWER(v_referrer_email) LIKE '%' || LOWER(split_part(v_referral.referred_email, '@', 1)) || '%' THEN

        referral_id := v_referral.id;
        fraud_type := 'self_referral_suspected';
        severity := CASE
          WHEN v_similarity_score > 0.8 THEN 'critical'
          WHEN v_similarity_score > 0.6 THEN 'high'
          ELSE 'medium'
        END;
        fraud_score := LEAST(ROUND(v_similarity_score * 100)::INTEGER, 100);
        description := 'Potential self-referral: similar email/name patterns';
        evidence := jsonb_build_object(
          'referrer_email', v_referrer_email,
          'referred_email', v_referral.referred_email,
          'referrer_name', v_referrer_name,
          'referred_name', v_referred_name,
          'similarity_score', v_similarity_score
        );
        RETURN NEXT;
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Function: Run All Fraud Checks
-- ============================================================================
-- Runs all fraud detection checks and inserts flags

CREATE OR REPLACE FUNCTION run_referral_fraud_detection()
RETURNS TABLE(
  flags_created INTEGER,
  summary JSONB
) AS $$
DECLARE
  v_flags_count INTEGER := 0;
  v_email_pattern_count INTEGER := 0;
  v_rapid_count INTEGER := 0;
  v_no_purchase_count INTEGER := 0;
  v_self_referral_count INTEGER := 0;
  v_flag RECORD;
BEGIN
  -- Run email pattern fraud detection for all referrers
  FOR v_flag IN
    SELECT DISTINCT r.referrer_id
    FROM referrals r
  LOOP
    INSERT INTO referral_fraud_flags (
      referral_id, fraud_type, severity, fraud_score, description, evidence
    )
    SELECT * FROM detect_email_pattern_fraud(v_flag.referrer_id)
    ON CONFLICT DO NOTHING;

    GET DIAGNOSTICS v_email_pattern_count = ROW_COUNT;
    v_flags_count := v_flags_count + v_email_pattern_count;
  END LOOP;

  -- Run rapid referral fraud detection
  FOR v_flag IN
    SELECT DISTINCT r.referrer_id
    FROM referrals r
  LOOP
    INSERT INTO referral_fraud_flags (
      referral_id, fraud_type, severity, fraud_score, description, evidence
    )
    SELECT * FROM detect_rapid_referral_fraud(v_flag.referrer_id)
    ON CONFLICT DO NOTHING;

    GET DIAGNOSTICS v_rapid_count = ROW_COUNT;
    v_flags_count := v_flags_count + v_rapid_count;
  END LOOP;

  -- Run no purchase activity fraud detection
  INSERT INTO referral_fraud_flags (
    referral_id, fraud_type, severity, fraud_score, description, evidence
  )
  SELECT * FROM detect_no_purchase_fraud()
  ON CONFLICT DO NOTHING;

  GET DIAGNOSTICS v_no_purchase_count = ROW_COUNT;
  v_flags_count := v_flags_count + v_no_purchase_count;

  -- Run self-referral fraud detection
  INSERT INTO referral_fraud_flags (
    referral_id, fraud_type, severity, fraud_score, description, evidence
  )
  SELECT * FROM detect_self_referral_fraud()
  ON CONFLICT DO NOTHING;

  GET DIAGNOSTICS v_self_referral_count = ROW_COUNT;
  v_flags_count := v_flags_count + v_self_referral_count;

  -- Return summary
  flags_created := v_flags_count;
  summary := jsonb_build_object(
    'total_flags', v_flags_count,
    'email_pattern_flags', v_email_pattern_count,
    'rapid_referral_flags', v_rapid_count,
    'no_purchase_flags', v_no_purchase_count,
    'self_referral_flags', v_self_referral_count,
    'run_at', NOW()
  );
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Function: Get Fraud Dashboard Stats
-- ============================================================================

CREATE OR REPLACE FUNCTION get_fraud_dashboard_stats()
RETURNS TABLE(
  total_flags INTEGER,
  pending_review INTEGER,
  confirmed_fraud INTEGER,
  false_positives INTEGER,
  by_severity JSONB,
  by_type JSONB,
  recent_flags JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER as total_flags,
    COUNT(*) FILTER (WHERE status = 'flagged')::INTEGER as pending_review,
    COUNT(*) FILTER (WHERE status = 'confirmed_fraud')::INTEGER as confirmed_fraud,
    COUNT(*) FILTER (WHERE status = 'false_positive')::INTEGER as false_positives,
    jsonb_object_agg(
      severity,
      COUNT(*) FILTER (WHERE severity = referral_fraud_flags.severity)
    ) as by_severity,
    jsonb_object_agg(
      fraud_type,
      COUNT(*) FILTER (WHERE fraud_type = referral_fraud_flags.fraud_type)
    ) as by_type,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', id,
          'fraud_type', fraud_type,
          'severity', severity,
          'fraud_score', fraud_score,
          'created_at', created_at
        ) ORDER BY created_at DESC
      )
      FROM referral_fraud_flags
      WHERE status = 'flagged'
      LIMIT 10
    ) as recent_flags
  FROM referral_fraud_flags;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Function: Review Fraud Flag (Admin Action)
-- ============================================================================

CREATE OR REPLACE FUNCTION review_fraud_flag(
  p_flag_id UUID,
  p_admin_id UUID,
  p_status TEXT,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE referral_fraud_flags
  SET
    status = p_status,
    reviewed_by = p_admin_id,
    reviewed_at = NOW(),
    admin_notes = COALESCE(p_admin_notes, admin_notes),
    updated_at = NOW()
  WHERE id = p_flag_id;

  -- If confirmed fraud, update referral status
  IF p_status = 'confirmed_fraud' THEN
    UPDATE referrals
    SET status = 'fraud_detected'
    WHERE id = (SELECT referral_id FROM referral_fraud_flags WHERE id = p_flag_id);

    -- Revoke rewards if already paid
    -- (Implementation depends on your rewards system)
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Grant Permissions
-- ============================================================================

GRANT EXECUTE ON FUNCTION detect_email_pattern_fraud(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION detect_rapid_referral_fraud(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION detect_no_purchase_fraud() TO service_role;
GRANT EXECUTE ON FUNCTION detect_self_referral_fraud() TO service_role;
GRANT EXECUTE ON FUNCTION run_referral_fraud_detection() TO service_role;
GRANT EXECUTE ON FUNCTION get_fraud_dashboard_stats() TO service_role;
GRANT EXECUTE ON FUNCTION review_fraud_flag(UUID, UUID, TEXT, TEXT) TO service_role;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE referral_fraud_flags IS 'Stores fraud detection flags for referrals with evidence and severity levels';
COMMENT ON FUNCTION run_referral_fraud_detection() IS 'Runs all fraud detection checks and creates flags for suspicious referrals';
COMMENT ON FUNCTION get_fraud_dashboard_stats() IS 'Returns aggregated fraud statistics for admin dashboard';
COMMENT ON FUNCTION review_fraud_flag(UUID, UUID, TEXT, TEXT) IS 'Allows admin to review and update status of fraud flags';

-- ============================================================================
-- Enable pg_trgm extension for similarity function
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;
