-- Helper: check if a user's email is confirmed
CREATE OR REPLACE FUNCTION public.is_email_confirmed(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = _user_id AND email_confirmed_at IS NOT NULL
  );
$$;

-- Tighten entry insert policy
DROP POLICY IF EXISTS "Authenticated users can create entries" ON public.entries;
CREATE POLICY "Authenticated users can create entries"
ON public.entries
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND public.is_email_confirmed(auth.uid()));

-- Tighten comment insert policy
DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.comments;
CREATE POLICY "Authenticated users can create comments"
ON public.comments
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND public.is_email_confirmed(auth.uid())
  AND ((is_target_response = false) OR public.is_entry_target(entry_id, auth.uid()))
);