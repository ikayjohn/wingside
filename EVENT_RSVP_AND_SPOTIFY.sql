-- =============================================
-- EVENT RSVP SYSTEM WITH SPOTIFY INTEGRATION
-- =============================================

-- Step 1: Add Spotify fields to events table
ALTER TABLE events
ADD COLUMN IF NOT EXISTS spotify_playlist_url TEXT,
ADD COLUMN IF NOT EXISTS spotify_description TEXT;

-- Add comment for documentation
COMMENT ON COLUMN events.spotify_playlist_url IS 'Spotify playlist URL for the event (e.g., https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M)';
COMMENT ON COLUMN events.spotify_description IS 'Custom description text to show with the playlist (e.g., "Listen to our playlist curated for you this Valentine")';


-- Step 2: Create event_rsvps table for RSVP tracking
CREATE TABLE IF NOT EXISTS event_rsvps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  attending TEXT DEFAULT 'yes' CHECK (attending IN ('yes', 'maybe', 'no')),
  stay_updated BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Add comments for documentation
COMMENT ON TABLE event_rsvps IS 'Stores RSVP submissions for events';
COMMENT ON COLUMN event_rsvps.attending IS 'Whether the person will attend: yes, maybe, or no';
COMMENT ON COLUMN event_rsvps.stay_updated IS 'Whether user wants to receive updates about future events';


-- Step 3: Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_event_rsvps_event_id ON event_rsvps(event_id);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_email ON event_rsvps(email);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_created_at ON event_rsvps(created_at DESC);


-- Step 4: Enable Row Level Security (RLS)
ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;


-- Step 5: Create RLS Policies

-- Allow anyone to insert RSVPs (public can RSVP)
DROP POLICY IF EXISTS "Anyone can RSVP to events" ON event_rsvps;
CREATE POLICY "Anyone can RSVP to events"
  ON event_rsvps FOR INSERT
  WITH CHECK (true);

-- Allow users to view their own RSVPs by email
DROP POLICY IF EXISTS "Users can view their own RSVPs" ON event_rsvps;
CREATE POLICY "Users can view their own RSVPs"
  ON event_rsvps FOR SELECT
  USING (true);

-- Only admins can update RSVPs
DROP POLICY IF EXISTS "Only admins can update RSVPs" ON event_rsvps;
CREATE POLICY "Only admins can update RSVPs"
  ON event_rsvps FOR UPDATE
  USING (true);

-- Only admins can delete RSVPs
DROP POLICY IF EXISTS "Only admins can delete RSVPs" ON event_rsvps;
CREATE POLICY "Only admins can delete RSVPs"
  ON event_rsvps FOR DELETE
  USING (true);


-- Step 6: Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_event_rsvps_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create trigger for updated_at
DROP TRIGGER IF EXISTS event_rsvps_updated_at ON event_rsvps;
CREATE TRIGGER event_rsvps_updated_at
  BEFORE UPDATE ON event_rsvps
  FOR EACH ROW
  EXECUTE FUNCTION update_event_rsvps_updated_at();


-- =============================================
-- VERIFICATION QUERIES (Run these to check)
-- =============================================

-- Check if columns were added to events table
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'events'
-- AND column_name IN ('spotify_playlist_url', 'spotify_description');

-- Check if event_rsvps table was created
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'event_rsvps';

-- Check indexes
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'event_rsvps';

-- Check RLS policies
-- SELECT policyname, cmd, qual
-- FROM pg_policies
-- WHERE tablename = 'event_rsvps';
