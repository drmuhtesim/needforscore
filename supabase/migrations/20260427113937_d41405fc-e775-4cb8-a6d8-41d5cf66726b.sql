-- Track whether the user has explicitly chosen their username
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username_chosen BOOLEAN NOT NULL DEFAULT false;

-- Existing users already have their username — treat as chosen
UPDATE public.profiles SET username_chosen = true WHERE username_chosen = false;

-- For new signups: if metadata.username was provided (email/password flow),
-- mark as chosen. Google-only logins won't pass username, so it stays false.
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  base_username TEXT;
  candidate TEXT;
  suffix INT := 0;
  has_explicit BOOLEAN := false;
BEGIN
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

  INSERT INTO public.profiles (user_id, username, display_name, username_chosen)
  VALUES (NEW.id, candidate, coalesce(NEW.raw_user_meta_data->>'display_name', candidate), has_explicit);

  RETURN NEW;
END;
$function$;