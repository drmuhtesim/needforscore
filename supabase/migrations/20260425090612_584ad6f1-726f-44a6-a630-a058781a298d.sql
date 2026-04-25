-- Make bucket private to prevent listing & enforce DB-driven access via signed URLs
UPDATE storage.buckets SET public = false WHERE id = 'comment-media';

-- Drop the broad public read policy
DROP POLICY IF EXISTS "Public can read comment media files" ON storage.objects;

-- Owners and moderators can read raw objects directly; everyone else must go through signed URLs requested by the app
CREATE POLICY "Owners and mods can read comment media files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'comment-media'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.is_mod_or_admin(auth.uid())
  )
);