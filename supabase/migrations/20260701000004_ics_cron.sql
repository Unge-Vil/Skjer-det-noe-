-- Scheduler infrastructure for ICS feed sync. Enables pg_cron + pg_net so a
-- job can POST /api/cron/sync-ics on a schedule. The job itself is NOT created
-- here because the app has no public URL yet — register it once deployed by
-- running the templated command below (fill in <BASE_URL> and <CRON_SECRET>),
-- or switch to a Cloudflare Cron Trigger instead.
--
--   select cron.schedule(
--     'ics-sync',
--     '*/30 * * * *',
--     $$ select net.http_post(
--          url     := '<BASE_URL>/api/cron/sync-ics',
--          headers := jsonb_build_object('content-type','application/json','x-cron-secret','<CRON_SECRET>'),
--          body    := '{}'::jsonb
--        ); $$
--   );

create extension if not exists pg_cron;
create extension if not exists pg_net;
