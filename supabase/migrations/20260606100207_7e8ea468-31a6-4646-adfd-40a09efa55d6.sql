-- Hide email_verification_token from public/authenticated reads via column-level privileges.
REVOKE SELECT (email_verification_token) ON public.profiles FROM anon, authenticated;

-- Hide votes.user_id from anonymous viewers. Authenticated users keep access (needed for their own vote lookups).
REVOKE SELECT (user_id) ON public.votes FROM anon;