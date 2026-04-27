
-- Update is_entry_target to also recognize verified linked accounts
CREATE OR REPLACE FUNCTION public.is_entry_target(_entry_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.target_verifications
    WHERE entry_id = _entry_id AND user_id = _user_id
  )
  OR public.user_owns_entry_target(_entry_id, _user_id);
$$;
