-- Add email verification fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_verification_token text;

CREATE INDEX IF NOT EXISTS idx_profiles_email_verification_token
  ON public.profiles(email_verification_token)
  WHERE email_verification_token IS NOT NULL;

-- Replace is_email_confirmed to use profiles.email_verified
CREATE OR REPLACE FUNCTION public.is_email_confirmed(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id AND email_verified = true
  );
$$;

-- Update handle_new_user to also set a verification token for new sign-ups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_username TEXT;
  candidate TEXT;
  suffix INT := 0;
  has_explicit BOOLEAN := false;
  is_oauth BOOLEAN := false;
BEGIN
  -- OAuth users (google/apple) come pre-verified by their provider
  is_oauth := (NEW.raw_app_meta_data ? 'provider')
              AND (NEW.raw_app_meta_data->>'provider') <> 'email';

  IF NEW.raw_user_meta_data ? 'username' AND length(coalesce(NEW.raw_user_meta_data->>'username','')) >= 3 THEN
    has_explicit := true;
    base_username := lower(NEW.raw_user_meta_data->>'username');
  ELSE
    base_username := lower(split_part(NEW.email, '@', 1));
  END IF;

  base_username := regexp_replace(base_username, '[^a-z0-9_.]', '', 'g');
  IF length(base_username) < 3 THEN
    base_username := 'user' || substring(NEW.id::text, 1, 8);
  END IF;
  IF length(base_username) > 30 THEN
    base_username := substring(base_username, 1, 30);
  END IF;

  candidate := base_username;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = candidate) LOOP
    suffix := suffix + 1;
    candidate := substring(base_username, 1, 30 - length(suffix::text)) || suffix::text;
  END LOOP;

  INSERT INTO public.profiles (
    user_id, username, display_name, username_chosen,
    email_verified, email_verification_token
  )
  VALUES (
    NEW.id,
    candidate,
    coalesce(NEW.raw_user_meta_data->>'display_name', candidate),
    has_explicit,
    is_oauth,  -- OAuth users are auto-verified
    CASE WHEN is_oauth THEN NULL ELSE encode(gen_random_bytes(24), 'hex') END
  );

  RETURN NEW;
END;
$$;

-- Ensure the trigger exists on auth.users (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Token verification function (callable by anyone via RPC)
CREATE OR REPLACE FUNCTION public.verify_email_with_token(_token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count int;
BEGIN
  IF _token IS NULL OR length(_token) < 10 THEN
    RETURN false;
  END IF;

  UPDATE public.profiles
  SET email_verified = true,
      email_verification_token = NULL,
      updated_at = now()
  WHERE email_verification_token = _token
    AND email_verified = false;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_email_with_token(text) TO anon, authenticated;