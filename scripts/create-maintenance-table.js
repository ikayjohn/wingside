/**
 * Simple script to completely reset maintenance mode
 * This drops everything and recreates from scratch
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function resetMaintenanceMode() {
  console.log('🔄 Resetting Maintenance Mode System\n')

  try {
    // Drop existing table and functions
    console.log('Step 1: Dropping existing table...')
    await supabase.rpc('exec_sql', {
      sql: 'DROP TABLE IF EXISTS public.maintenance_settings CASCADE;'
    }).catch(() => {})
    console.log('✅ Table dropped')

    console.log('\nStep 2: Dropping existing functions...')
    await supabase.rpc('exec_sql', {
      sql: 'DROP FUNCTION IF EXISTS public.get_maintenance_settings CASCADE;'
    }).catch(() => {})
    await supabase.rpc('exec_sql', {
      sql: 'DROP FUNCTION IF EXISTS public.update_maintenance_settings CASCADE;'
    }).catch(() => {})
    console.log('✅ Functions dropped')

    console.log('\nStep 3: Creating new table...')
    const { error: tableError } = await supabase.rpc('exec_sql', {
      sql: `
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

        CREATE INDEX idx_maintenance_enabled ON public.maintenance_settings(is_enabled);

        COMMENT ON TABLE public.maintenance_settings IS 'Stores maintenance mode configuration';
        COMMENT ON COLUMN public.maintenance_settings.is_enabled IS 'Whether maintenance mode is currently active';
        COMMENT ON COLUMN public.maintenance_settings.access_codes IS 'Access codes that can bypass maintenance mode';
      `
    })

    if (tableError) {
      // If exec_sql doesn't exist, use direct SQL
      const { error: directError } = await supabase
        .from('maintenance_settings')
        .select('*')
        .limit(1)

      if (directError && directError.code === '42P01') {
        console.log('❌ Table does not exist and cannot create without SQL execution')
        console.log('⚠️  Please run this SQL manually in Supabase SQL Editor:\n')
        console.log(`
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

          CREATE INDEX idx_maintenance_enabled ON public.maintenance_settings(is_enabled);

          INSERT INTO public.maintenance_settings (is_enabled, title, message, access_codes)
          VALUES (false, 'Site Maintenance', 'We are currently performing scheduled maintenance. We will be back shortly.', ARRAY['WINGSIDE2025']);
        `)
        return
      }
    }

    console.log('✅ Table created')

    console.log('\nStep 4: Creating get_maintenance_settings function...')
    const { error: func1Error } = await supabase.rpc('exec_sql', {
      sql: `
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

        GRANT EXECUTE ON FUNCTION public.get_maintenance_settings() TO anon, authenticated;
      `
    })

    if (func1Error) {
      console.log('⚠️  Could not create function via RPC')
      console.log('⚠️  Please run this SQL manually in Supabase SQL Editor')
      return
    }

    console.log('✅ get_maintenance_settings function created')

    console.log('\nStep 5: Creating update_maintenance_settings function...')
    const { error: func2Error } = await supabase.rpc('exec_sql', {
      sql: `
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

        GRANT EXECUTE ON FUNCTION public.update_maintenance_settings(
          BOOLEAN, TEXT, TEXT, TIMESTAMP WITH TIME ZONE, TEXT[]
        ) TO authenticated;

        GRANT USAGE ON SCHEMA public TO anon, authenticated;
        GRANT SELECT ON maintenance_settings TO anon, authenticated;
      `
    })

    if (func2Error) {
      console.log('⚠️  Could not create update function via RPC')
      return
    }

    console.log('✅ update_maintenance_settings function created')

    console.log('\nStep 6: Testing functions...')
    const { data: test, error: testError } = await supabase
      .rpc('get_maintenance_settings')

    if (testError) {
      console.log('❌ Test failed:', testError.message)
    } else {
      console.log('✅ Functions working!')
      console.log('\nCurrent settings:', JSON.stringify(test, null, 2))
    }

    console.log('\n✅ Maintenance mode system reset complete!')

  } catch (error) {
    console.error('❌ Error:', error.message)
    console.log('\n⚠️  Please run the following SQL in Supabase SQL Editor:')
    console.log(`
-- Drop and recreate maintenance table
DROP TABLE IF EXISTS public.maintenance_settings CASCADE;

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

INSERT INTO public.maintenance_settings (is_enabled, title, message, access_codes)
VALUES (false, 'Site Maintenance', 'We are currently performing scheduled maintenance. We will be back shortly.', ARRAY['WINGSIDE2025']);

-- Create functions
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_maintenance_settings() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_maintenance_settings(BOOLEAN, TEXT, TEXT, TIMESTAMP WITH TIME ZONE, TEXT[]) TO authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON maintenance_settings TO anon, authenticated;
    `)
  }
}

resetMaintenanceMode()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))
