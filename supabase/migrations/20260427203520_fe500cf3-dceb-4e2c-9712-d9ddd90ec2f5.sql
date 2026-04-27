-- Add profile fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS occupation TEXT,
  ADD COLUMN IF NOT EXISTS age SMALLINT,
  ADD COLUMN IF NOT EXISTS bio TEXT;

-- Validation: age 13..120 if provided; bio max 500
CREATE OR REPLACE FUNCTION public.validate_profile_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.age IS NOT NULL AND (NEW.age < 13 OR NEW.age > 120) THEN
    RAISE EXCEPTION 'age must be between 13 and 120';
  END IF;
  IF NEW.bio IS NOT NULL AND length(NEW.bio) > 500 THEN
    RAISE EXCEPTION 'bio max 500 chars';
  END IF;
  IF NEW.city IS NOT NULL AND length(NEW.city) > 80 THEN
    RAISE EXCEPTION 'city max 80 chars';
  END IF;
  IF NEW.occupation IS NOT NULL AND length(NEW.occupation) > 80 THEN
    RAISE EXCEPTION 'occupation max 80 chars';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_profile_fields_trg ON public.profiles;
CREATE TRIGGER validate_profile_fields_trg
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.validate_profile_fields();

-- Avatars storage bucket (public read)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);