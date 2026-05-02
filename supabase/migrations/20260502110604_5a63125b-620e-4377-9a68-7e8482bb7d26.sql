-- Fix handle_new_user: gen_random_bytes lives in the "extensions" schema, not "public"
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  base_username TEXT;
  candidate TEXT;
  suffix INT := 0;
  has_explicit BOOLEAN := false;
  is_oauth BOOLEAN := false;
BEGIN
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
    is_oauth,
    CASE WHEN is_oauth THEN NULL ELSE encode(extensions.gen_random_bytes(24), 'hex') END
  );

  RETURN NEW;
END;
$function$;

-- Mark all existing users as email-verified so they aren't blocked from posting/commenting
UPDATE public.profiles
SET email_verified = true,
    email_verification_token = NULL
WHERE email_verified = false;