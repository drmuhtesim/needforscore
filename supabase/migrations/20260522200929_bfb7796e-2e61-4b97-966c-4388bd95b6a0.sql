
-- ============================================================
-- Security hardening migration
-- ============================================================

-- 1) PROFILES: hide sensitive columns via column-level grants
-- Drop public read-all, replace with same row policy but column-restricted privileges.
REVOKE SELECT ON public.profiles FROM anon, authenticated;

GRANT SELECT (
  id, user_id, username, display_name, avatar_url, bio, age, occupation, city,
  show_avatar, show_display_name, show_city, show_occupation, show_age, show_bio, show_linked_accounts,
  username_chosen, email_verified, signup_order, created_at, updated_at
) ON public.profiles TO anon, authenticated;

-- Ban-related columns: only signed-in users (mods need them; regular users rarely query them)
GRANT SELECT (is_banned, banned_at, ban_reason, banned_by) ON public.profiles TO authenticated;

-- email_verification_token: NEVER directly readable. Exposed only via SECURITY DEFINER RPC below for owner.

CREATE OR REPLACE FUNCTION public.get_my_email_verification_token()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email_verification_token
  FROM public.profiles
  WHERE user_id = auth.uid()
    AND email_verified = false
  LIMIT 1;
$$;
REVOKE EXECUTE ON FUNCTION public.get_my_email_verification_token() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_email_verification_token() TO authenticated;


-- 2) VOTES: hide user_id from anonymous scrapers
REVOKE SELECT ON public.votes FROM anon, authenticated;
GRANT SELECT (id, entry_id, comment_id, value, created_at) ON public.votes TO anon, authenticated;
GRANT SELECT (user_id) ON public.votes TO authenticated;


-- 3) LINKED_ACCOUNTS: clear verification_code automatically on verification
CREATE OR REPLACE FUNCTION public.clear_verification_code_on_verify()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.verified = true THEN
    NEW.verification_code := '';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_clear_verification_code ON public.linked_accounts;
CREATE TRIGGER trg_clear_verification_code
BEFORE INSERT OR UPDATE ON public.linked_accounts
FOR EACH ROW EXECUTE FUNCTION public.clear_verification_code_on_verify();

-- Backfill: scrub codes from already-verified rows
UPDATE public.linked_accounts SET verification_code = '' WHERE verified = true AND verification_code <> '';


-- 4) SECURITY DEFINER functions: revoke from anon for trigger-only / service-only functions
-- Trigger functions are invoked internally by the trigger machinery and don't need EXECUTE grants.
REVOKE EXECUTE ON FUNCTION public.notify_new_comment() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_entry_verified_target() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_comment_per_entry_limit() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_comment_media_limit() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.bump_conversation_last_message() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_reply_only_by_target() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_profile_fields() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.lowercase_entry_target() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_new_message() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.clear_verification_code_on_verify() FROM PUBLIC, anon, authenticated;

-- Service-role-only queue helpers
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;

-- get_email_by_username: keep for username login but lock search_path explicitly (already set)
-- verify_email_with_token: keep callable (used by /verify-email page)


-- 5) Fix mutable search_path on queue helpers
CREATE OR REPLACE FUNCTION public.enqueue_email(queue_name text, payload jsonb)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $function$
BEGIN
  RETURN pgmq.send(queue_name, payload);
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN pgmq.send(queue_name, payload);
END;
$function$;

CREATE OR REPLACE FUNCTION public.read_email_batch(queue_name text, batch_size integer, vt integer)
RETURNS TABLE(msg_id bigint, read_ct integer, message jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $function$
BEGIN
  RETURN QUERY SELECT r.msg_id, r.read_ct, r.message FROM pgmq.read(queue_name, vt, batch_size) r;
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN;
END;
$function$;

CREATE OR REPLACE FUNCTION public.delete_email(queue_name text, message_id bigint)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $function$
BEGIN
  RETURN pgmq.delete(queue_name, message_id);
EXCEPTION WHEN undefined_table THEN
  RETURN FALSE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.move_to_dlq(source_queue text, dlq_name text, message_id bigint, payload jsonb)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $function$
DECLARE new_id BIGINT;
BEGIN
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  PERFORM pgmq.delete(source_queue, message_id);
  RETURN new_id;
EXCEPTION WHEN undefined_table THEN
  BEGIN
    PERFORM pgmq.create(dlq_name);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  BEGIN
    PERFORM pgmq.delete(source_queue, message_id);
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;
  RETURN new_id;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;


-- 6) STORAGE: avatars bucket — drop broad SELECT (which permits listing) and replace
-- with no SELECT policy. The bucket stays public, so direct GET by URL still works,
-- but anonymous LIST queries return zero rows.
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
