-- Create sports_events table for managing sports events on the /sports page
CREATE TABLE IF NOT EXISTS public.sports_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL,
  image_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on date for sorting
CREATE INDEX IF NOT EXISTS idx_sports_events_date ON public.sports_events(date DESC);

-- Create index on is_active for filtering
CREATE INDEX IF NOT EXISTS idx_sports_events_active ON public.sports_events(is_active);

-- Enable RLS
ALTER TABLE public.sports_events ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (admin access is handled by app-level checks)
CREATE POLICY "Allow all access to sports_events" ON public.sports_events
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add comment
COMMENT ON TABLE public.sports_events IS 'Sports events displayed on the /sports page';
