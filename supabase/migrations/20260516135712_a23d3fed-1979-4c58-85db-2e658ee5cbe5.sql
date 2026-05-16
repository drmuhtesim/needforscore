
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_banned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS banned_at timestamptz,
  ADD COLUMN IF NOT EXISTS banned_by uuid,
  ADD COLUMN IF NOT EXISTS ban_reason text;

CREATE OR REPLACE FUNCTION public.is_banned(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id AND is_banned = true
  );
$$;

-- Tighten insert policies to block banned users
DROP POLICY IF EXISTS "Authenticated users can create entries" ON public.entries;
CREATE POLICY "Authenticated users can create entries"
  ON public.entries FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND is_email_confirmed(auth.uid())
    AND NOT public.is_banned(auth.uid())
  );

DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.comments;
CREATE POLICY "Authenticated users can create comments"
  ON public.comments FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND is_email_confirmed(auth.uid())
    AND ((is_target_response = false) OR is_entry_target(entry_id, auth.uid()))
    AND NOT public.is_banned(auth.uid())
  );

-- Allow moderators/admins to update profiles (for ban fields)
DROP POLICY IF EXISTS "Moderators can update profiles" ON public.profiles;
CREATE POLICY "Moderators can update profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.is_mod_or_admin(auth.uid()))
  WITH CHECK (public.is_mod_or_admin(auth.uid()));
