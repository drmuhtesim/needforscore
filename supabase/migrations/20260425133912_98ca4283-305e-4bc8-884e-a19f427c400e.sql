-- Add 'score' as a new platform/category for entries
ALTER TYPE public.entry_category ADD VALUE IF NOT EXISTS 'score';