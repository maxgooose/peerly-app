-- Setup cron job for auto-matching
-- Uses pg_cron extension to schedule the auto-match Edge Function

-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule auto-match to run every 5 minutes (for testing)
-- Change to daily (0 8 * * *) for production
SELECT cron.schedule(
  'auto-match-users',           -- job name
  '*/5 * * * *',                -- every 5 minutes (cron expression)
  $$
  SELECT
    net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/auto-match',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.supabase_anon_key')
      ),
      body := '{}'::jsonb
    ) as request_id;
  $$
);

-- Store Supabase settings for the cron job to use
-- You'll need to update these with your actual Supabase URL and anon key
-- Run these commands in Supabase SQL Editor after migration:
--
-- ALTER DATABASE postgres SET "app.settings.supabase_url" TO 'https://your-project.supabase.co';
-- ALTER DATABASE postgres SET "app.settings.supabase_anon_key" TO 'your-anon-key';

-- View all scheduled jobs
-- SELECT * FROM cron.job;

-- Unschedule the job (if needed)
-- SELECT cron.unschedule('auto-match-users');

-- Change schedule to daily at 8am for production:
-- SELECT cron.schedule(
--   'auto-match-users',
--   '0 8 * * *',  -- daily at 8am
--   $$ ... same SQL as above ... $$
-- );
