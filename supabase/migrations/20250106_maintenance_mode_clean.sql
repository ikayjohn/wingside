-- ============================================
-- MAINTENANCE MODE SYSTEM - COMPLETE REBUILD
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Clean up existing objects
DROP TABLE IF EXISTS public.maintenance_settings CASCADE;
DROP FUNCTION IF EXISTS public.get_maintenance_settings() CASCADE;
DROP FUNCTION IF EXISTS public.update_maintenance_settings(BYTEA) CASCADE;
DROP FUNCTION IF EXISTS public.update_maintenance_settings(BOOLEAN, TEXT, TEXT, TIMESTAMP WITH TIME ZONE, TEXT[]) CASCADE;

-- Step 2: Create maintenance_settings table
CREATE TABLE public.maintenance_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  is_enabled BOOLEAN DEFAULT false NOT NULL,
  title TEXT DEFAULT 'Site Maintenance' NOT NULL,
  message TEXT DEFAULT 'We are currently performing scheduled maintenance. We will be back shortly.' NOT NULL,
  estimated_completion TIMESTAMP WITH TIME ZONE,
  access_codes TEXT[] DEFAULT ARRAY['WINGSIDE2025']::TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create index for faster queries
CREATE INDEX idx_maintenance_enabled ON public.maintenance_settings(is_enabled);

-- Add comments
COMMENT ON TABLE public.maintenance_settings IS 'Stores maintenance mode configuration';
COMMENT ON COLUMN public.maintenance_settings.is_enabled IS 'Whether maintenance mode is currently active';
COMMENT ON COLUMN public.maintenance_settings.access_codes IS 'Access codes that can bypass maintenance mode';

-- Step 3: Insert default settings
INSERT INTO public.maintenance_settings (is_enabled, title, message, access_codes)
VALUES (
  false,
  'Site Maintenance',
  'We are currently performing scheduled maintenance. We will be back shortly.',
  ARRAY['WINGSIDE2025']::TEXT[]
);

-- Step 4: Create get_maintenance_settings function
CREATE OR REPLACE FUNCTION public.get_maintenance_settings()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Step 5: Create update_maintenance_settings function
CREATE OR REPLACE FUNCTION public.update_maintenance_settings(
  p_is_enabled BOOLEAN,
  p_title TEXT DEFAULT NULL,
  p_message TEXT DEFAULT NULL,
  p_estimated_completion TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_access_codes TEXT[] DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  UPDATE public.maintenance_settings
  SET
    is_enabled = p_is_enabled,
    title = COALESCE(p_title, title),
    message = COALESCE(p_message, message),
    estimated_completion = p_estimated_completion,
    access_codes = COALESCE(p_access_codes, access_codes),
    updated_at = NOW()
  WHERE id = (
    SELECT id FROM public.maintenance_settings
    ORDER BY created_at DESC
    LIMIT 1
  );

  v_result := json_build_object(
    'success', true,
    'message', 'Maintenance settings updated'
  );

  RETURN v_result;
END;
$$;

-- Step 6: Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON maintenance_settings TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_maintenance_settings() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_maintenance_settings(BOOLEAN, TEXT, TEXT, TIMESTAMP WITH TIME ZONE, TEXT[]) TO authenticated;

-- Step 7: Enable RLS
ALTER TABLE public.maintenance_settings ENABLE ROW LEVEL SECURITY;

-- Step 8: Create RLS policies
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

-- Step 9: Verify
SELECT * FROM public.maintenance_settings;
SELECT public.get_maintenance_settings();
