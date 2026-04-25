CREATE UNIQUE INDEX IF NOT EXISTS entries_target_normalized_unique_active
ON public.entries (target_normalized)
WHERE deleted_at IS NULL;