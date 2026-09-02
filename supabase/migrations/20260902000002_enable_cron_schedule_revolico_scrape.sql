-- Dónde Hay - Enable pg_cron & pg_net and schedule the Revolico scrape
-- Runs the scrape-revolico Edge Function every 6 hours (0, 6, 12, 18 h).
-- NOTE: uso la anon key únicamente para AUTORIZAR la invocación (verify_jwt);
-- la función internamente usa su propio service_role del runtime Supabase.

-- Enable extensions
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Remove any previous schedule (idempotent)
select cron.unschedule('scrape-revolico')
where exists (select 1 from cron.job where jobname = 'scrape-revolico');

-- Schedule every 6 hours
select cron.schedule(
  'scrape-revolico',
  '0 */6 * * *',
  $scrape$
  select net.http_post(
    url := 'https://wtnausykjenjqephbhfw.supabase.co/functions/v1/scrape-revolico',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0bmF1c3lramVuanFlcGhiaGZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5NzU4ODAsImV4cCI6MjEwMjU1MTg4MH0.F8pvQeX6H_Fi6US02Awk7tCiN5tDA-Asvjn_Iku_wcY'
    ),
    body := '{}'
  );
  $scrape$
);
