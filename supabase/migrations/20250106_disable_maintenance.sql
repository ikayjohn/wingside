-- Disable maintenance mode immediately
UPDATE public.maintenance_settings
SET is_enabled = false;
