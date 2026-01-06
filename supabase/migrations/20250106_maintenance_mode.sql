-- Maintenance Mode System
-- Creates table for managing maintenance mode settings and whitelisted emails

-- Create maintenance_settings table
CREATE TABLE IF NOT EXISTS public.maintenance_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  is_enabled BOOLEAN DEFAULT false,
  title TEXT DEFAULT 'Site Maintenance',
  message TEXT DEFAULT 'We are currently performing scheduled maintenance. We will be back shortly.',
  estimated_completion TIMESTAMP WITH TIME ZONE,
  whitelisted_emails TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default maintenance settings (disabled)
INSERT INTO public.maintenance_settings (is_enabled, title, message)
VALUES (
  false,
  'Site Maintenance',
  'We are currently performing scheduled maintenance. We will be back shortly.'
)
ON CONFLICT DO NOTHING;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_maintenance_settings_enabled
ON public.maintenance_settings(is_enabled);

-- Create function to get current maintenance settings
CREATE OR REPLACE FUNCTION get_maintenance_settings()
RETURNS TABLE (
  is_enabled BOOLEAN,
  title TEXT,
  message TEXT,
  estimated_completion TIMESTAMP WITH TIME ZONE,
  whitelisted_emails TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT ms.is_enabled, ms.title, ms.message, ms.estimated_completion, ms.whitelisted_emails
  FROM public.maintenance_settings ms
  ORDER BY ms.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update maintenance settings
CREATE OR REPLACE FUNCTION update_maintenance_settings(
  p_is_enabled BOOLEAN,
  p_title TEXT DEFAULT NULL,
  p_message TEXT DEFAULT NULL,
  p_estimated_completion TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_whitelisted_emails TEXT[] DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  -- Update or insert maintenance settings
  INSERT INTO public.maintenance_settings (
    is_enabled,
    title,
    message,
    estimated_completion,
    whitelisted_emails
  ) VALUES (
    p_is_enabled,
    COALESCE(p_title, 'Site Maintenance'),
    COALESCE(p_message, 'We are currently performing scheduled maintenance.'),
    p_estimated_completion,
    COALESCE(p_whitelisted_emails, ARRAY[]::TEXT[])
  )
  ON CONFLICT DO NOTHING;

  -- Update existing record
  UPDATE public.maintenance_settings
  SET
    is_enabled = p_is_enabled,
    title = COALESCE(p_title, title),
    message = COALESCE(p_message, message),
    estimated_completion = COALESCE(p_estimated_completion, estimated_completion),
    whitelisted_emails = COALESCE(p_whitelisted_emails, whitelisted_emails),
    updated_at = NOW()
  WHERE id = (SELECT id FROM public.maintenance_settings ORDER BY created_at DESC LIMIT 1);

  v_result := json_build_object(
    'success', true,
    'message', 'Maintenance settings updated'
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if email is whitelisted
CREATE OR REPLACE FUNCTION is_email_whitelisted(p_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_whitelisted TEXT[];
BEGIN
  -- Get whitelisted emails from maintenance settings
  SELECT whitelisted_emails INTO v_whitelisted
  FROM public.maintenance_settings
  WHERE is_enabled = true
  ORDER BY created_at DESC
  LIMIT 1;

  -- Return false if no whitelist or email not found
  IF v_whitelisted IS NULL THEN
    RETURN false;
  END IF;

  RETURN p_email = ANY(v_whitelisted);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON maintenance_settings TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_maintenance_settings() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION is_email_whitelisted(TEXT) TO anon, authenticated;

-- Row Level Security (RLS)
ALTER TABLE public.maintenance_settings ENABLE ROW LEVEL SECURITY;

-- Only allow service role to modify
CREATE POLICY "Service role can manage maintenance settings"
ON public.maintenance_settings
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Allow everyone to read settings
CREATE POLICY "Everyone can read maintenance settings"
ON public.maintenance_settings
FOR SELECT
TO anon, authenticated
USING (true);

-- Add helpful comments
COMMENT ON TABLE public.maintenance_settings IS 'Stores maintenance mode configuration and whitelisted emails';
COMMENT ON COLUMN public.maintenance_settings.is_enabled IS 'Whether maintenance mode is currently active';
COMMENT ON COLUMN public.maintenance_settings.whitelisted_emails IS 'Array of email addresses that can bypass maintenance mode';
COMMENT ON FUNCTION get_maintenance_settings() IS 'Returns current maintenance mode settings';
COMMENT ON FUNCTION is_email_whitelisted(TEXT) IS 'Checks if an email address is whitelisted to bypass maintenance mode';
