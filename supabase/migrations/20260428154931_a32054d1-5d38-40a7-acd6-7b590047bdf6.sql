
-- 1) Hard delete website + email entries and dependent rows
DELETE FROM public.votes WHERE entry_id IN (SELECT id FROM public.entries WHERE category IN ('website','email'));
DELETE FROM public.comment_media WHERE comment_id IN (
  SELECT c.id FROM public.comments c
  JOIN public.entries e ON e.id = c.entry_id
  WHERE e.category IN ('website','email')
);
DELETE FROM public.votes WHERE comment_id IN (
  SELECT c.id FROM public.comments c
  JOIN public.entries e ON e.id = c.entry_id
  WHERE e.category IN ('website','email')
);
DELETE FROM public.comments WHERE entry_id IN (SELECT id FROM public.entries WHERE category IN ('website','email'));
DELETE FROM public.target_verifications WHERE entry_id IN (SELECT id FROM public.entries WHERE category IN ('website','email'));
DELETE FROM public.entries WHERE category IN ('website','email');

-- 2) Recreate enum without website/email (postgres can't drop enum values)
ALTER TYPE public.entry_category RENAME TO entry_category_old;
CREATE TYPE public.entry_category AS ENUM ('instagram','tiktok','twitter','phone','score');
ALTER TABLE public.entries
  ALTER COLUMN category TYPE public.entry_category
  USING category::text::public.entry_category;
DROP TYPE public.entry_category_old;

-- 3) Reply support on comments
ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS parent_comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_comments_parent ON public.comments(parent_comment_id);

-- Enforce: only verified target may post a reply (parent_comment_id IS NOT NULL).
-- Top-level comments (parent NULL) are unrestricted (existing rules apply).
CREATE OR REPLACE FUNCTION public.enforce_reply_only_by_target()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.parent_comment_id IS NOT NULL THEN
    IF NOT public.is_entry_target(NEW.entry_id, NEW.user_id) THEN
      RAISE EXCEPTION 'Only the verified target of this entry can reply to comments';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_reply_only_by_target ON public.comments;
CREATE TRIGGER trg_enforce_reply_only_by_target
  BEFORE INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.enforce_reply_only_by_target();

-- 4) Auto-lowercase entry target on insert/update
CREATE OR REPLACE FUNCTION public.lowercase_entry_target()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.target IS NOT NULL THEN
    NEW.target := lower(NEW.target);
  END IF;
  IF NEW.target_normalized IS NOT NULL THEN
    NEW.target_normalized := lower(NEW.target_normalized);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lowercase_entry_target ON public.entries;
CREATE TRIGGER trg_lowercase_entry_target
  BEFORE INSERT OR UPDATE ON public.entries
  FOR EACH ROW EXECUTE FUNCTION public.lowercase_entry_target();

-- Backfill existing rows
UPDATE public.entries SET target = lower(target), target_normalized = lower(target_normalized)
WHERE target <> lower(target) OR target_normalized <> lower(target_normalized);

-- 5) Make kijujan moderator + admin
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'moderator'::app_role FROM public.profiles WHERE username = 'kijujan'
ON CONFLICT DO NOTHING;
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'admin'::app_role FROM public.profiles WHERE username = 'kijujan'
ON CONFLICT DO NOTHING;
