-- Remove status column from entries table (make it nullable first, then remove later)
-- For now, we keep it in DB but stop requiring it in forms
-- Just update the default to not require status

-- Note: We keep status in DB for backward compatibility 
-- but make it nullable so forms don't require it
ALTER TABLE public.entries ALTER COLUMN status DROP NOT NULL;