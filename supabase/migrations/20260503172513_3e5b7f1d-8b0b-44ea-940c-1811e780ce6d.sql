
-- Notifications system
CREATE TYPE public.notification_kind AS ENUM (
  'message',
  'entry_comment',
  'comment_reply',
  'thread_comment'
);

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL,
  actor_id UUID,
  kind public.notification_kind NOT NULL,
  entry_id UUID,
  comment_id UUID,
  conversation_id UUID,
  message_id UUID,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_recipient_created ON public.notifications (recipient_id, created_at DESC);
CREATE INDEX idx_notifications_recipient_unread ON public.notifications (recipient_id) WHERE read_at IS NULL;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT TO authenticated
USING (auth.uid() = recipient_id);

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE TO authenticated
USING (auth.uid() = recipient_id) WITH CHECK (auth.uid() = recipient_id);

CREATE POLICY "Users can delete their own notifications"
ON public.notifications FOR DELETE TO authenticated
USING (auth.uid() = recipient_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- Trigger: new direct message -> notify the other participant
CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  recipient UUID;
BEGIN
  SELECT CASE WHEN c.user1_id = NEW.sender_id THEN c.user2_id ELSE c.user1_id END
    INTO recipient
  FROM public.conversations c
  WHERE c.id = NEW.conversation_id;

  IF recipient IS NOT NULL AND recipient <> NEW.sender_id THEN
    INSERT INTO public.notifications (recipient_id, actor_id, kind, conversation_id, message_id)
    VALUES (recipient, NEW.sender_id, 'message', NEW.conversation_id, NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_new_message
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.notify_new_message();

-- Trigger: new comment -> notify entry owner, parent author, and other thread participants
CREATE OR REPLACE FUNCTION public.notify_new_comment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  entry_owner UUID;
  parent_author UUID;
BEGIN
  SELECT user_id INTO entry_owner FROM public.entries WHERE id = NEW.entry_id;

  -- 1) Reply: notify parent comment author (highest priority, separate kind)
  IF NEW.parent_comment_id IS NOT NULL THEN
    SELECT user_id INTO parent_author
    FROM public.comments WHERE id = NEW.parent_comment_id;
    IF parent_author IS NOT NULL AND parent_author <> NEW.user_id THEN
      INSERT INTO public.notifications (recipient_id, actor_id, kind, entry_id, comment_id)
      VALUES (parent_author, NEW.user_id, 'comment_reply', NEW.entry_id, NEW.id);
    END IF;
  END IF;

  -- 2) Notify entry owner if different from commenter (and not the parent author already notified)
  IF entry_owner IS NOT NULL
     AND entry_owner <> NEW.user_id
     AND (parent_author IS NULL OR parent_author <> entry_owner) THEN
    INSERT INTO public.notifications (recipient_id, actor_id, kind, entry_id, comment_id)
    VALUES (entry_owner, NEW.user_id, 'entry_comment', NEW.entry_id, NEW.id);
  END IF;

  -- 3) Notify other users who previously commented on this entry (thread followers)
  INSERT INTO public.notifications (recipient_id, actor_id, kind, entry_id, comment_id)
  SELECT DISTINCT c.user_id, NEW.user_id, 'thread_comment', NEW.entry_id, NEW.id
  FROM public.comments c
  WHERE c.entry_id = NEW.entry_id
    AND c.user_id <> NEW.user_id
    AND c.deleted_at IS NULL
    AND c.user_id <> COALESCE(entry_owner, '00000000-0000-0000-0000-000000000000'::uuid)
    AND c.user_id <> COALESCE(parent_author, '00000000-0000-0000-0000-000000000000'::uuid);

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_new_comment
AFTER INSERT ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.notify_new_comment();
