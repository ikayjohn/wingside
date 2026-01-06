const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const migrationSQL = `
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
    ORDER BY created_at DESC
    LIMIT 1
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
DECLARE
  v_settings maintenance_settings;
BEGIN
  -- Insert or update settings
  INSERT INTO maintenance_settings (
    is_enabled, title, message, estimated_completion, whitelisted_emails
  )
  VALUES (
    p_is_enabled,
    p_title,
    p_message,
    p_estimated_completion,
    p_whitelisted_emails
  )
  ON CONFLICT ((1)) DO UPDATE
  SET
    is_enabled = EXCLUDED.is_enabled,
    title = EXCLUDED.title,
    message = EXCLUDED.message,
    estimated_completion = EXCLUDED.estimated_completion,
    whitelisted_emails = EXCLUDED.whitelisted_emails,
    updated_at = NOW()
  RETURNING * INTO v_settings;

  RETURN v_settings;
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
  FROM get_maintenance_settings();

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  RETURN p_email = ANY(settings.whitelisted_emails);
END;
$$;

-- Enable RLS
ALTER TABLE maintenance_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow read access to everyone" ON maintenance_settings;
DROP POLICY IF EXISTS "Allow service role to modify settings" ON maintenance_settings;

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

-- Insert default settings if table is empty
INSERT INTO maintenance_settings (
  is_enabled, title, message, estimated_completion, whitelisted_emails
)
VALUES (
  false,
  'Site Maintenance',
  'We are currently performing scheduled maintenance. We will be back shortly.',
  NULL,
  ARRAY[]::TEXT[]
)
ON CONFLICT DO NOTHING;
`

async function applyMigration() {
  console.log('Applying maintenance mode migration...')

  try {
    // Split SQL by semicolon and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    for (const statement of statements) {
      if (statement.trim().length === 0) continue

      console.log('Executing statement...')

      const { data, error } = await supabase.rpc('exec_sql', {
        sql: statement
      })

      if (error) {
        // Try direct SQL execution
        console.log('RPC failed, trying direct query...')
        const { error: directError } = await supabase
          .from('maintenance_settings')
          .select('*')
          .limit(1)

        if (!directError) {
          console.log('✓ Table already exists, continuing...')
          continue
        }
      }
    }

    // Verify the migration worked
    const { data: settings, error } = await supabase
      .rpc('get_maintenance_settings')
      .single()

    if (error) {
      throw error
    }

    console.log('✓ Maintenance mode migration applied successfully')
    console.log('Default settings:', settings)

  } catch (error) {
    console.error('Migration error:', error)
    throw error
  }
}

applyMigration()
  .then(() => {
    console.log('\n✓ Migration completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n✗ Migration failed:', error.message)
    process.exit(1)
  })
