-- ENUMS
CREATE TYPE public.entry_category AS ENUM ('instagram', 'tiktok', 'twitter', 'phone', 'email', 'website');
CREATE TYPE public.entry_status AS ENUM ('safe', 'suspicious', 'danger');

-- ENTRIES
CREATE TABLE public.entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  target TEXT NOT NULL,
  target_normalized TEXT NOT NULL,
  category public.entry_category NOT NULL,
  status public.entry_status NOT NULL,
  description TEXT NOT NULL,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 10),
  verified_target BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_entries_category ON public.entries(category);
CREATE INDEX idx_entries_status ON public.entries(status);
CREATE INDEX idx_entries_user ON public.entries(user_id);
CREATE INDEX idx_entries_target_norm ON public.entries(target_normalized);
CREATE INDEX idx_entries_created ON public.entries(created_at DESC);

ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Entries are viewable by everyone"
  ON public.entries FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create entries"
  ON public.entries FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own entries"
  ON public.entries FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own entries"
  ON public.entries FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_entries_updated_at
  BEFORE UPDATE ON public.entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- TARGET VERIFICATIONS
CREATE TABLE public.target_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_id UUID NOT NULL REFERENCES public.entries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (entry_id, user_id)
);

CREATE INDEX idx_target_verif_entry ON public.target_verifications(entry_id);

ALTER TABLE public.target_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Verifications are viewable by everyone"
  ON public.target_verifications FOR SELECT USING (true);

CREATE POLICY "Users can verify themselves as target"
  ON public.target_verifications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own verification"
  ON public.target_verifications FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Security definer to safely check target ownership
CREATE OR REPLACE FUNCTION public.is_entry_target(_entry_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.target_verifications
    WHERE entry_id = _entry_id AND user_id = _user_id
  );
$$;

-- Sync entries.verified_target when a verification is added/removed
CREATE OR REPLACE FUNCTION public.sync_entry_verified_target()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.entries SET verified_target = true WHERE id = NEW.entry_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    IF NOT EXISTS (SELECT 1 FROM public.target_verifications WHERE entry_id = OLD.entry_id) THEN
      UPDATE public.entries SET verified_target = false WHERE id = OLD.entry_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_sync_verified_target_ins
  AFTER INSERT ON public.target_verifications
  FOR EACH ROW EXECUTE FUNCTION public.sync_entry_verified_target();

CREATE TRIGGER trg_sync_verified_target_del
  AFTER DELETE ON public.target_verifications
  FOR EACH ROW EXECUTE FUNCTION public.sync_entry_verified_target();

-- COMMENTS
CREATE TABLE public.comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_id UUID NOT NULL REFERENCES public.entries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  is_target_response BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_comments_entry ON public.comments(entry_id);
CREATE INDEX idx_comments_user ON public.comments(user_id);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are viewable by everyone"
  ON public.comments FOR SELECT USING (true);

-- Anyone authenticated can comment; if marking is_target_response, must be verified target
CREATE POLICY "Authenticated users can create comments"
  ON public.comments FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (
      is_target_response = false
      OR public.is_entry_target(entry_id, auth.uid())
    )
  );

CREATE POLICY "Users can update their own comments"
  ON public.comments FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND (
      is_target_response = false
      OR public.is_entry_target(entry_id, auth.uid())
    )
  );

CREATE POLICY "Users can delete their own comments"
  ON public.comments FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- VOTES (single table for entry & comment votes)
CREATE TABLE public.votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  entry_id UUID REFERENCES public.entries(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  value SMALLINT NOT NULL CHECK (value IN (-1, 1)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    (entry_id IS NOT NULL AND comment_id IS NULL)
    OR (entry_id IS NULL AND comment_id IS NOT NULL)
  )
);

CREATE UNIQUE INDEX uniq_vote_user_entry
  ON public.votes(user_id, entry_id) WHERE entry_id IS NOT NULL;
CREATE UNIQUE INDEX uniq_vote_user_comment
  ON public.votes(user_id, comment_id) WHERE comment_id IS NOT NULL;
CREATE INDEX idx_votes_entry ON public.votes(entry_id) WHERE entry_id IS NOT NULL;
CREATE INDEX idx_votes_comment ON public.votes(comment_id) WHERE comment_id IS NOT NULL;

ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Votes are viewable by everyone"
  ON public.votes FOR SELECT USING (true);

CREATE POLICY "Authenticated users can vote"
  ON public.votes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes"
  ON public.votes FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes"
  ON public.votes FOR DELETE TO authenticated
  USING (auth.uid() = user_id);