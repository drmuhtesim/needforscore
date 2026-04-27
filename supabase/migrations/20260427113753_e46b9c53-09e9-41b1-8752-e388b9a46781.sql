-- Make duplicate-entry prevention scoped to (target_normalized, category):
-- e.g. instagram/@ali and tiktok/@ali should both be allowed,
-- but two open instagram/@ali entries should not.
DROP INDEX IF EXISTS public.entries_target_normalized_unique_active;

CREATE UNIQUE INDEX entries_target_category_unique_active
  ON public.entries (target_normalized, category)
  WHERE (deleted_at IS NULL);