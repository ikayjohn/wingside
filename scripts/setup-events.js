const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupEventsTable() {
  console.log('Setting up events table...');

  // Create the events table using raw SQL
  const sql = `
    -- Create events table
    CREATE TABLE IF NOT EXISTS events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      description TEXT,
      event_date DATE NOT NULL,
      event_time TIME,
      location TEXT NOT NULL,
      image_url TEXT,
      is_active BOOLEAN DEFAULT true,
      display_order INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Enable RLS
    ALTER TABLE events ENABLE ROW LEVEL SECURITY;

    -- Create policies
    DROP POLICY IF EXISTS "Anyone can view active events" ON events;
    CREATE POLICY "Anyone can view active events"
      ON events
      FOR SELECT
      USING (is_active = true);

    DROP POLICY IF EXISTS "Admins can insert events" ON events;
    CREATE POLICY "Admins can insert events"
      ON events
      FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
        )
      );

    DROP POLICY IF EXISTS "Admins can update events" ON events;
    CREATE POLICY "Admins can update events"
      ON events
      FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
        )
      );

    DROP POLICY IF EXISTS "Admins can delete events" ON events;
    CREATE POLICY "Admins can delete events"
      ON events
      FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
        )
      );

    -- Create index on event_date for sorting
    CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date DESC);

    -- Grant permissions
    GRANT USAGE ON SCHEMA public TO anon;
    GRANT USAGE ON SCHEMA public TO authenticated;
    GRANT SELECT ON events TO anon;
    GRANT ALL ON events TO authenticated;
  `;

  try {
    // Since we can't execute multiple SQL statements at once through the client,
    // we'll break it down into individual operations
    console.log('Creating events table...');

    // First, let's create the table using the Supabase REST API directly through the client
    const { data, error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
      console.error('Error creating table:', error);
      console.log('\nPlease run the SQL manually in Supabase SQL Editor:');
      console.log('https://supabase.com/dashboard/project/cxbqochxrhokdscgijxe/sql/new');
      console.log('\nCopy the contents of: scripts/create-events-table.sql');
    } else {
      console.log('✅ Events table created successfully!');
    }
  } catch (err) {
    console.error('Error:', err);
    console.log('\nPlease run the SQL manually in Supabase SQL Editor:');
    console.log('https://supabase.com/dashboard/project/cxbqochxrhokdscgijxe/sql/new');
  }
}

setupEventsTable();
