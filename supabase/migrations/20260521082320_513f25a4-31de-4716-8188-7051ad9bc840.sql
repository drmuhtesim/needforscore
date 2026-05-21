
-- Reduce realtime WAL polling load: remove tables we don't actively need pushed.
-- notifications -> client will poll every 60s instead.
-- conversations -> nothing subscribes to it.
ALTER PUBLICATION supabase_realtime DROP TABLE public.notifications;
ALTER PUBLICATION supabase_realtime DROP TABLE public.conversations;

-- Reduce email-queue cron from every 5s to every 30s (still near-instant for users,
-- but cuts cron.job_run_details inserts by 6x).
SELECT cron.alter_job(1, schedule := '30 seconds');
