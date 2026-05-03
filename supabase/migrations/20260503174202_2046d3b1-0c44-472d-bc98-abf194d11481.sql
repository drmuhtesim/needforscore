ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS show_avatar boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_city boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_occupation boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_age boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_bio boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_linked_accounts boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_display_name boolean NOT NULL DEFAULT false;