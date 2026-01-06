-- Complete Migration for Access Code System
-- This replaces the email whitelist system with access codes

-- Step 1: Drop all existing functions and tables
DROP FUNCTION IF EXISTS update_maintenance_settings CASCADE;
DROP FUNCTION IF EXISTS get_maintenance_settings() CASCADE;
DROP FUNCTION IF EXISTS is_email_whitelisted(TEXT) CASCADE;
DROP TABLE IF EXISTS public.maintenance_settings CASCADE;

-- Step 2: Create maintenance_settings table with access codes
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

-- Step 3: Insert default maintenance settings
INSERT INTO public.maintenance_settings (is_enabled, title, message, access_codes)
VALUES (
  false,
  'Site Maintenance',
  'We are currently performing scheduled maintenance. We will be back shortly.',
  ARRAY['WINGSIDE2025']  -- Default access code
);

-- Step 4: Create index for faster queries
CREATE INDEX idx_maintenance_settings_enabled
ON public.maintenance_settings(is_enabled);

-- Step 5: Create function to get current maintenance settings
CREATE OR REPLACE FUNCTION get_maintenance_settings()
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

-- Step 6: Create function to update maintenance settings
CREATE OR REPLACE FUNCTION update_maintenance_settings(
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
  -- Update the most recent settings record
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

-- Step 7: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON maintenance_settings TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_maintenance_settings() TO anon, authenticated;

-- Step 8: Enable Row Level Security (RLS)
ALTER TABLE public.maintenance_settings ENABLE ROW LEVEL SECURITY;

-- Step 9: Drop existing policies if they exist
DROP POLICY IF EXISTS "Service role can manage maintenance settings" ON public.maintenance_settings;
DROP POLICY IF EXISTS "Everyone can read maintenance settings" ON public.maintenance_settings;

-- Step 10: Create RLS policies
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

-- Step 11: Add helpful comments
COMMENT ON TABLE public.maintenance_settings IS 'Stores maintenance mode configuration and access codes';
COMMENT ON COLUMN public.maintenance_settings.is_enabled IS 'Whether maintenance mode is currently active';
COMMENT ON COLUMN public.maintenance_settings.access_codes IS 'Array of access codes that can bypass maintenance mode';
COMMENT ON FUNCTION get_maintenance_settings() IS 'Returns current maintenance mode settings';
COMMENT ON FUNCTION update_maintenance_settings() IS 'Updates maintenance mode settings';
