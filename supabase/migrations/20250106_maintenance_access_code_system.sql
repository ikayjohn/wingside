-- DO NOT RUN THIS ALL AT ONCE!
-- Run each section separately in order

-- =====================================================
-- SECTION 1: Drop all policies first
-- =====================================================
DROP POLICY IF EXISTS "Service role can manage maintenance settings" ON public.maintenance_settings;
DROP POLICY IF EXISTS "Everyone can read maintenance settings" ON public.maintenance_settings;
DROP POLICY IF EXISTS "Allow read access to everyone" ON public.maintenance_settings;
DROP POLICY IF EXISTS "Allow service role to modify settings" ON public.maintenance_settings;

-- =====================================================
-- SECTION 2: Drop all functions (with all possible signatures)
-- =====================================================
DROP FUNCTION IF EXISTS get_maintenance_settings() CASCADE;
DROP FUNCTION IF EXISTS get_maintenance_settings(JSON) CASCADE;
DROP FUNCTION IF EXISTS update_maintenance_settings(BYTEA) CASCADE;
DROP FUNCTION IF EXISTS update_maintenance_settings(p_is_enabled BOOLEAN, p_title TEXT, p_message TEXT, p_estimated_completion TIMESTAMP WITH TIME ZONE, p_whitelisted_emails TEXT[]) CASCADE;
DROP FUNCTION IF EXISTS update_maintenance_settings(p_is_enabled BOOLEAN, p_title TEXT, p_message TEXT, p_estimated_completion TIMESTAMP WITH TIME ZONE, p_access_codes TEXT[]) CASCADE;
DROP FUNCTION IF EXISTS update_maintenance_settings(BYTEA, p_is_enabled BOOLEAN, p_title TEXT, p_message TEXT, p_estimated_completion TIMESTAMP WITH TIME ZONE, p_whitelisted_emails TEXT[]) CASCADE;
DROP FUNCTION IF EXISTS is_email_whitelisted(TEXT) CASCADE;

-- =====================================================
-- SECTION 3: Drop the table
-- =====================================================
DROP TABLE IF EXISTS public.maintenance_settings CASCADE;

-- =====================================================
-- SECTION 4: Create fresh table with access codes
-- =====================================================
CREATE TABLE public.maintenance_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  is_enabled BOOLEAN DEFAULT false,
  title TEXT DEFAULT 'Site Maintenance',
  message TEXT DEFAULT 'We are currently performing scheduled maintenance. We will be back shortly.',
  estimated_completion TIMESTAMP WITH TIME ZONE,
  access_codes TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SECTION 5: Insert default settings
-- =====================================================
INSERT INTO public.maintenance_settings (is_enabled, title, message, access_codes)
VALUES (
  false,
  'Site Maintenance',
  'We are currently performing scheduled maintenance. We will be back shortly.',
  ARRAY['WINGSIDE2025']
);

-- =====================================================
-- SECTION 6: Create index
-- =====================================================
CREATE INDEX idx_maintenance_settings_enabled
ON public.maintenance_settings(is_enabled);

-- =====================================================
-- SECTION 7: Create get_maintenance_settings function
-- =====================================================
CREATE FUNCTION get_maintenance_settings()
RETURNS JSON AS $$
DECLARE
  v_settings JSON;
BEGIN
  SELECT json_build_object(
    'is_enabled', ms.is_enabled,
    'title', ms.title,
    'message', ms.message,
    'estimated_completion', ms.estimated_completion,
    'access_codes', ms.access_codes
  ) INTO v_settings
  FROM public.maintenance_settings ms
  ORDER BY ms.created_at DESC
  LIMIT 1;

  RETURN v_settings;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SECTION 8: Create update_maintenance_settings function
-- =====================================================
CREATE FUNCTION update_maintenance_settings(
  p_is_enabled BOOLEAN,
  p_title TEXT DEFAULT NULL,
  p_message TEXT DEFAULT NULL,
  p_estimated_completion TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_access_codes TEXT[] DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  UPDATE public.maintenance_settings
  SET
    is_enabled = p_is_enabled,
    title = COALESCE(p_title, title),
    message = COALESCE(p_message, message),
    estimated_completion = COALESCE(p_estimated_completion, estimated_completion),
    access_codes = COALESCE(p_access_codes, access_codes),
    updated_at = NOW()
  WHERE id = (SELECT id FROM public.maintenance_settings ORDER BY created_at DESC LIMIT 1);

  v_result := json_build_object(
    'success', true,
    'message', 'Maintenance settings updated'
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SECTION 9: Grant permissions
-- =====================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON maintenance_settings TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_maintenance_settings() TO anon, authenticated;

-- =====================================================
-- SECTION 10: Enable RLS
-- =====================================================
ALTER TABLE public.maintenance_settings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- SECTION 11: Create RLS policies
-- =====================================================
CREATE POLICY "Service role can manage maintenance settings"
ON public.maintenance_settings
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Everyone can read maintenance settings"
ON public.maintenance_settings
FOR SELECT
TO anon, authenticated
USING (true);

-- =====================================================
-- SECTION 12: Add comments
-- =====================================================
COMMENT ON TABLE public.maintenance_settings IS 'Stores maintenance mode configuration and access codes';
COMMENT ON COLUMN public.maintenance_settings.is_enabled IS 'Whether maintenance mode is currently active';
COMMENT ON COLUMN public.maintenance_settings.access_codes IS 'Array of access codes that can bypass maintenance mode';
