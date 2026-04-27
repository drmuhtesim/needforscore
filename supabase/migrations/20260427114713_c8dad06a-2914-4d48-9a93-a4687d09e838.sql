
CREATE TYPE public.social_platform AS ENUM ('instagram', 'x', 'tiktok');

CREATE TABLE public.linked_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform public.social_platform NOT NULL,
  handle TEXT NOT NULL,
  handle_normalized TEXT NOT NULL,
  verification_code TEXT NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMPTZ,
  last_attempt_at TIMESTAMPTZ,
  attempt_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, platform)
);

CREATE UNIQUE INDEX linked_accounts_verified_unique
  ON public.linked_accounts (platform, handle_normalized)
  WHERE verified = true;

CREATE INDEX linked_accounts_lookup
  ON public.linked_accounts (platform, handle_normalized);

ALTER TABLE public.linked_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Verified linked accounts viewable by everyone"
  ON public.linked_accounts FOR SELECT
  USING (verified = true OR auth.uid() = user_id);

CREATE POLICY "Users can insert their own linked accounts"
  ON public.linked_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own linked accounts"
  ON public.linked_accounts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own linked accounts"
  ON public.linked_accounts FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER trg_linked_accounts_updated_at
  BEFORE UPDATE ON public.linked_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Helper: check if a given user owns a verified linked account matching an entry's target
CREATE OR REPLACE FUNCTION public.user_owns_entry_target(_entry_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.entries e
    JOIN public.linked_accounts la
      ON la.handle_normalized = e.target_normalized
     AND la.platform::text = e.category::text
     AND la.verified = true
     AND la.user_id = _user_id
    WHERE e.id = _entry_id
  );
$$;
