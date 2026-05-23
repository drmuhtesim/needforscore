-- 1) Prevent public/clients from reading email_verification_token directly.
-- The owner retrieves it via SECURITY DEFINER function get_my_email_verification_token().
REVOKE SELECT (email_verification_token) ON public.profiles FROM anon, authenticated;

-- 2) Hide vote ownership from anonymous visitors to preserve vote anonymity.
-- Authenticated users still need to read user_id to look up their own vote.
REVOKE SELECT (user_id) ON public.votes FROM anon;
