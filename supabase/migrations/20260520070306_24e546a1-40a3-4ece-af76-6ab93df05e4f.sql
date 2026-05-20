CREATE INDEX IF NOT EXISTS idx_votes_user_entry ON public.votes (user_id, entry_id) WHERE entry_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_votes_user_comment ON public.votes (user_id, comment_id) WHERE comment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_votes_entry ON public.votes (entry_id) WHERE entry_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_votes_comment ON public.votes (comment_id) WHERE comment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_comments_entry_active ON public.comments (entry_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_entries_category_created ON public.entries (category, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_entries_target_normalized ON public.entries (target_normalized) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_created ON public.notifications (recipient_id, created_at DESC);