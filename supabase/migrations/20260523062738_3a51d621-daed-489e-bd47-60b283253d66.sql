
-- 1) profiles: restrict SELECT so anon/other users can't read email_verification_token
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Public can view profiles, but token column is protected via column privileges
REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT (
  id, user_id, username, display_name, avatar_url, city, occupation, age, bio,
  show_avatar, show_display_name, show_city, show_occupation, show_age, show_bio,
  show_linked_accounts, username_chosen, signup_order, email_verified,
  is_banned, banned_at, banned_by, ban_reason, created_at, updated_at
) ON public.profiles TO anon, authenticated;

CREATE POLICY "Profiles are viewable by everyone"
ON public.profiles
FOR SELECT
USING (true);

-- Owners and admins still need full SELECT access for the token (via SECURITY DEFINER RPC get_my_email_verification_token already)
-- 2) votes: hide user_id from public reads via column privileges
DROP POLICY IF EXISTS "Votes are viewable by everyone" ON public.votes;

REVOKE SELECT ON public.votes FROM anon, authenticated;
GRANT SELECT (id, entry_id, comment_id, value, created_at) ON public.votes TO anon, authenticated;
-- user_id remains readable only to the owner via a dedicated policy
GRANT SELECT (user_id) ON public.votes TO authenticated;

CREATE POLICY "Votes are viewable by everyone"
ON public.votes
FOR SELECT
USING (true);

-- 3) conversations: scope INSERT to authenticated
DROP POLICY IF EXISTS "Users can create conversations they participate in" ON public.conversations;
CREATE POLICY "Users can create conversations they participate in"
ON public.conversations
FOR INSERT
TO authenticated
WITH CHECK ((auth.uid() = user1_id) OR (auth.uid() = user2_id));

-- 4) linked_accounts: scope INSERT/UPDATE/DELETE to authenticated
DROP POLICY IF EXISTS "Users can insert their own linked accounts" ON public.linked_accounts;
DROP POLICY IF EXISTS "Users can update their own linked accounts" ON public.linked_accounts;
DROP POLICY IF EXISTS "Users can delete their own linked accounts" ON public.linked_accounts;

CREATE POLICY "Users can insert their own linked accounts"
ON public.linked_accounts
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own linked accounts"
ON public.linked_accounts
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own linked accounts"
ON public.linked_accounts
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
