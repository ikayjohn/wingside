const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function applyMaintenanceMigration() {
  console.log('Applying maintenance mode migration...')

  try {
    // Check if maintenance_settings table exists
    const { data: existingTable, error: checkError } = await supabase
      .rpc('get_maintenance_settings')
      .single()

    if (!checkError) {
      console.log('✓ Maintenance mode system already exists')
      return
    }

    // Create the maintenance_settings table
    const { error: tableError } = await supabase.rpc('create_maintenance_system', {
      sql: `
        -- Create maintenance_settings table
        CREATE TABLE IF NOT EXISTS public.maintenance_settings (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          is_enabled BOOLEAN DEFAULT false,
          title TEXT DEFAULT 'Site Maintenance',
          message TEXT DEFAULT 'We are currently performing scheduled maintenance. We will be back shortly.',
          estimated_completion TIMESTAMP WITH TIME ZONE,
          whitelisted_emails TEXT[] DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          CONSTRAINT single_row_constraint CHECK (id = '00000000-0000-0000-0000-000000000001'::uuid)
        );

        -- Create function to get maintenance settings
        CREATE OR REPLACE FUNCTION get_maintenance_settings()
        RETURNS maintenance_settings
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
          RETURN (
            SELECT *
            FROM maintenance_settings
            WHERE id = '00000000-0000-0000-0000-000000000001'::uuid
          );
        END;
        $$;

        -- Create function to update maintenance settings
        CREATE OR REPLACE FUNCTION update_maintenance_settings(
          p_is_enabled BOOLEAN,
          p_title TEXT,
          p_message TEXT,
          p_estimated_completion TIMESTAMP WITH TIME ZONE,
          p_whitelisted_emails TEXT[]
        )
        RETURNS maintenance_settings
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
          INSERT INTO maintenance_settings (
            id, is_enabled, title, message, estimated_completion, whitelisted_emails
          )
          VALUES (
            '00000000-0000-0000-0000-000000000001'::uuid,
            p_is_enabled,
            p_title,
            p_message,
            p_estimated_completion,
            p_whitelisted_emails
          )
          ON CONFLICT (id) DO UPDATE
          SET
            is_enabled = EXCLUDED.is_enabled,
            title = EXCLUDED.title,
            message = EXCLUDED.message,
            estimated_completion = EXCLUDED.estimated_completion,
            whitelisted_emails = EXCLUDED.whitelisted_emails,
            updated_at = NOW()
          RETURNING *;
        END;
        $$;

        -- Create function to check if email is whitelisted
        CREATE OR REPLACE FUNCTION is_email_whitelisted(p_email TEXT)
        RETURNS BOOLEAN
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        DECLARE
          settings maintenance_settings;
        BEGIN
          SELECT * INTO settings
          FROM maintenance_settings
          WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;

          RETURN p_email = ANY(settings.whitelisted_emails);
        END;
        $$;

        -- Enable RLS
        ALTER TABLE maintenance_settings ENABLE ROW LEVEL SECURITY;

        -- Create RLS policies
        CREATE POLICY "Allow read access to everyone"
        ON maintenance_settings
        FOR SELECT
        TO public
        USING (true);

        CREATE POLICY "Allow service role to modify settings"
        ON maintenance_settings
        FOR ALL
        TO service_role
        USING (true)
        WITH CHECK (true);

        -- Insert default settings
        INSERT INTO maintenance_settings (
          id, is_enabled, title, message, estimated_completion, whitelisted_emails
        )
        VALUES (
          '00000000-0000-0000-0000-000000000001'::uuid,
          false,
          'Site Maintenance',
          'We are currently performing scheduled maintenance. We will be back shortly.',
          NULL,
          ARRAY[]::TEXT[]
        )
        ON CONFLICT (id) DO NOTHING;
      `
    })

    if (tableError) {
      console.error('Error creating maintenance system:', tableError)
      throw tableError
    }

    console.log('✓ Maintenance mode migration applied successfully')

  } catch (error) {
    console.error('Migration failed:', error)
    throw error
  }
}

applyMaintenanceMigration()
  .then(() => {
    console.log('Migration completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Migration failed:', error)
    process.exit(1)
  })
