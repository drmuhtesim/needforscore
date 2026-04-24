-- ============= 1. ROLES SYSTEM =============
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check role (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Helper: is moderator OR admin
CREATE OR REPLACE FUNCTION public.is_mod_or_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'moderator')
  )
$$;

-- RLS for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============= 2. SOFT DELETE COLUMNS =============
ALTER TABLE public.entries
  ADD COLUMN deleted_at TIMESTAMPTZ,
  ADD COLUMN deleted_by UUID;

ALTER TABLE public.comments
  ADD COLUMN deleted_at TIMESTAMPTZ,
  ADD COLUMN deleted_by UUID;

CREATE INDEX idx_entries_deleted_at ON public.entries (deleted_at);
CREATE INDEX idx_comments_deleted_at ON public.comments (deleted_at);

-- Replace SELECT policies to hide soft-deleted (but allow owner + mods to see)
DROP POLICY IF EXISTS "Entries are viewable by everyone" ON public.entries;
CREATE POLICY "Entries are viewable by everyone"
  ON public.entries FOR SELECT
  USING (
    deleted_at IS NULL
    OR auth.uid() = user_id
    OR public.is_mod_or_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;
CREATE POLICY "Comments are viewable by everyone"
  ON public.comments FOR SELECT
  USING (
    deleted_at IS NULL
    OR auth.uid() = user_id
    OR public.is_mod_or_admin(auth.uid())
  );

-- Allow mods/admins to update entries (for soft delete)
CREATE POLICY "Moderators can soft-delete entries"
  ON public.entries FOR UPDATE
  TO authenticated
  USING (public.is_mod_or_admin(auth.uid()))
  WITH CHECK (public.is_mod_or_admin(auth.uid()));

CREATE POLICY "Moderators can soft-delete comments"
  ON public.comments FOR UPDATE
  TO authenticated
  USING (public.is_mod_or_admin(auth.uid()))
  WITH CHECK (public.is_mod_or_admin(auth.uid()));

-- ============= 3. SIGNUP ORDER (for generation badges) =============
CREATE SEQUENCE IF NOT EXISTS public.profiles_signup_order_seq;

ALTER TABLE public.profiles
  ADD COLUMN signup_order BIGINT;

-- Backfill existing profiles by created_at order
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) AS rn
  FROM public.profiles
)
UPDATE public.profiles p
SET signup_order = o.rn
FROM ordered o
WHERE p.id = o.id;

-- Advance the sequence past existing values
SELECT setval('public.profiles_signup_order_seq', COALESCE((SELECT MAX(signup_order) FROM public.profiles), 0) + 1, false);

ALTER TABLE public.profiles
  ALTER COLUMN signup_order SET DEFAULT nextval('public.profiles_signup_order_seq'),
  ALTER COLUMN signup_order SET NOT NULL;

ALTER SEQUENCE public.profiles_signup_order_seq OWNED BY public.profiles.signup_order;

CREATE UNIQUE INDEX idx_profiles_signup_order ON public.profiles (signup_order);