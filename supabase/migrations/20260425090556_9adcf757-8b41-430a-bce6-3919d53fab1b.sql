-- 1) comment_media table
CREATE TYPE public.media_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE public.comment_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  storage_path TEXT NOT NULL,
  status public.media_status NOT NULL DEFAULT 'pending',
  moderator_id UUID,
  moderator_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_comment_media_comment ON public.comment_media(comment_id);
CREATE INDEX idx_comment_media_status ON public.comment_media(status);

ALTER TABLE public.comment_media ENABLE ROW LEVEL SECURITY;

-- Visibility: approved visible to all; owners + mods see everything
CREATE POLICY "Approved media viewable by everyone"
ON public.comment_media FOR SELECT
USING (
  status = 'approved'
  OR auth.uid() = user_id
  OR public.is_mod_or_admin(auth.uid())
);

-- Owners can insert media for their own comments (max 10 per comment enforced via trigger)
CREATE POLICY "Owners can add media to their comments"
ON public.comment_media FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.comments c
    WHERE c.id = comment_id AND c.user_id = auth.uid() AND c.deleted_at IS NULL
  )
);

-- Owners can delete their own media
CREATE POLICY "Owners can delete their own media"
ON public.comment_media FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Moderators can update status / moderator notes
CREATE POLICY "Moderators can review media"
ON public.comment_media FOR UPDATE TO authenticated
USING (public.is_mod_or_admin(auth.uid()))
WITH CHECK (public.is_mod_or_admin(auth.uid()));

-- Moderators can delete media
CREATE POLICY "Moderators can delete media"
ON public.comment_media FOR DELETE TO authenticated
USING (public.is_mod_or_admin(auth.uid()));

CREATE TRIGGER trg_comment_media_updated_at
BEFORE UPDATE ON public.comment_media
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enforce max 10 media per comment
CREATE OR REPLACE FUNCTION public.enforce_comment_media_limit()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  cnt INT;
BEGIN
  SELECT COUNT(*) INTO cnt FROM public.comment_media WHERE comment_id = NEW.comment_id;
  IF cnt >= 10 THEN
    RAISE EXCEPTION 'A comment can have at most 10 media attachments';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_comment_media_limit
BEFORE INSERT ON public.comment_media
FOR EACH ROW EXECUTE FUNCTION public.enforce_comment_media_limit();

-- 2) Enforce max 2 active comments per (user, entry)
CREATE OR REPLACE FUNCTION public.enforce_comment_per_entry_limit()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  cnt INT;
BEGIN
  SELECT COUNT(*) INTO cnt
  FROM public.comments
  WHERE entry_id = NEW.entry_id
    AND user_id = NEW.user_id
    AND deleted_at IS NULL;
  IF cnt >= 2 THEN
    RAISE EXCEPTION 'You can post at most 2 experiences on a single entry';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_comments_per_entry_limit
BEFORE INSERT ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.enforce_comment_per_entry_limit();

-- 3) Tighten entry deletion: only mods/admins can soft-delete entries (owners cannot delete their own entry)
DROP POLICY IF EXISTS "Users can delete their own entries" ON public.entries;
DROP POLICY IF EXISTS "Users can update their own entries" ON public.entries;

-- Owners may still update non-deletion fields (description, rating, status).
-- We enforce via WITH CHECK that they cannot set deleted_at/deleted_by themselves.
CREATE POLICY "Users can update their own entries (no soft delete)"
ON public.entries FOR UPDATE TO authenticated
USING (auth.uid() = user_id AND deleted_at IS NULL)
WITH CHECK (auth.uid() = user_id AND deleted_at IS NULL);

-- 4) Storage bucket for comment media (public read, since approved-only is filtered at DB; objects use folder = comment_id)
INSERT INTO storage.buckets (id, name, public)
VALUES ('comment-media', 'comment-media', true)
ON CONFLICT (id) DO NOTHING;

-- Public read for objects in this bucket (we control reveal in DB through comment_media.status)
CREATE POLICY "Public can read comment media files"
ON storage.objects FOR SELECT
USING (bucket_id = 'comment-media');

-- Authenticated users can upload to their own folder (folder name = user id)
CREATE POLICY "Users can upload comment media to own folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'comment-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Owners can delete their own files
CREATE POLICY "Users can delete own comment media files"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'comment-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Moderators can delete any file in this bucket
CREATE POLICY "Moderators can delete any comment media files"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'comment-media' AND public.is_mod_or_admin(auth.uid())
);