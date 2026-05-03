CREATE OR REPLACE FUNCTION public.notify_new_comment()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  entry_owner UUID;
  parent_author UUID;
BEGIN
  SELECT user_id INTO entry_owner FROM public.entries WHERE id = NEW.entry_id;

  IF NEW.parent_comment_id IS NOT NULL THEN
    SELECT user_id INTO parent_author
    FROM public.comments WHERE id = NEW.parent_comment_id;
    IF parent_author IS NOT NULL AND parent_author <> NEW.user_id THEN
      INSERT INTO public.notifications (recipient_id, actor_id, kind, entry_id, comment_id)
      VALUES (parent_author, NEW.user_id, 'comment_reply'::notification_kind, NEW.entry_id, NEW.id);
    END IF;
  END IF;

  IF entry_owner IS NOT NULL
     AND entry_owner <> NEW.user_id
     AND (parent_author IS NULL OR parent_author <> entry_owner) THEN
    INSERT INTO public.notifications (recipient_id, actor_id, kind, entry_id, comment_id)
    VALUES (entry_owner, NEW.user_id, 'entry_comment'::notification_kind, NEW.entry_id, NEW.id);
  END IF;

  INSERT INTO public.notifications (recipient_id, actor_id, kind, entry_id, comment_id)
  SELECT DISTINCT c.user_id, NEW.user_id, 'thread_comment'::notification_kind, NEW.entry_id, NEW.id
  FROM public.comments c
  WHERE c.entry_id = NEW.entry_id
    AND c.user_id <> NEW.user_id
    AND c.deleted_at IS NULL
    AND c.user_id <> COALESCE(entry_owner, '00000000-0000-0000-0000-000000000000'::uuid)
    AND c.user_id <> COALESCE(parent_author, '00000000-0000-0000-0000-000000000000'::uuid);

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_new_message()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  recipient UUID;
BEGIN
  SELECT CASE WHEN c.user1_id = NEW.sender_id THEN c.user2_id ELSE c.user1_id END
    INTO recipient
  FROM public.conversations c
  WHERE c.id = NEW.conversation_id;

  IF recipient IS NOT NULL AND recipient <> NEW.sender_id THEN
    INSERT INTO public.notifications (recipient_id, actor_id, kind, conversation_id, message_id)
    VALUES (recipient, NEW.sender_id, 'message'::notification_kind, NEW.conversation_id, NEW.id);
  END IF;
  RETURN NEW;
END;
$function$;