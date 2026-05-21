CREATE INDEX IF NOT EXISTS idx_votes_entry_user
ON public.votes (entry_id, user_id)
WHERE entry_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_votes_comment_user
ON public.votes (comment_id, user_id)
WHERE comment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_votes_entry_value
ON public.votes (entry_id, value)
WHERE entry_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_votes_comment_value
ON public.votes (comment_id, value)
WHERE comment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread_created
ON public.notifications (recipient_id, created_at DESC)
WHERE read_at IS NULL;

CREATE OR REPLACE FUNCTION public.get_entries_feed(
  _category text DEFAULT 'all',
  _search text DEFAULT '',
  _limit integer DEFAULT 100
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  target text,
  target_normalized text,
  category public.entry_category,
  description text,
  rating smallint,
  verified_target boolean,
  created_at timestamp with time zone,
  deleted_at timestamp with time zone,
  deleted_by uuid,
  profile_user_id uuid,
  profile_username text,
  profile_display_name text,
  profile_avatar_url text,
  profile_city text,
  profile_occupation text,
  profile_age smallint,
  profile_bio text,
  profile_show_avatar boolean,
  profile_show_display_name boolean,
  profile_show_city boolean,
  profile_show_occupation boolean,
  profile_show_age boolean,
  profile_show_bio boolean,
  profile_show_linked_accounts boolean,
  profile_signup_order bigint,
  vote_score integer,
  comment_count integer,
  avg_rating numeric,
  my_vote integer,
  last_comment_excerpt text
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  WITH filtered AS (
    SELECT e.*
    FROM public.entries e
    WHERE e.deleted_at IS NULL
      AND (
        COALESCE(NULLIF(_category, ''), 'all') = 'all'
        OR e.category = _category::public.entry_category
      )
      AND (
        NULLIF(BTRIM(COALESCE(_search, '')), '') IS NULL
        OR e.target_normalized ILIKE ('%' || LOWER(BTRIM(_search)) || '%')
      )
    ORDER BY e.created_at DESC
    LIMIT LEAST(GREATEST(COALESCE(_limit, 100), 1), 100)
  ),
  comment_rows AS (
    SELECT
      c.entry_id,
      c.content,
      c.created_at,
      CASE
        WHEN NULLIF(substring(c.content FROM '(\d{1,2})\s*/\s*10\s*$'), '')::int BETWEEN 1 AND 10
          THEN NULLIF(substring(c.content FROM '(\d{1,2})\s*/\s*10\s*$'), '')::int
        ELSE NULL
      END AS rating_value
    FROM public.comments c
    JOIN filtered f ON f.id = c.entry_id
    WHERE c.deleted_at IS NULL
  ),
  comment_stats AS (
    SELECT
      entry_id,
      COUNT(*)::int AS comment_count,
      ROUND(AVG(rating_value)::numeric, 1) AS avg_rating,
      MAX(created_at) AS last_comment_at
    FROM comment_rows
    GROUP BY entry_id
  ),
  last_comments AS (
    SELECT DISTINCT ON (entry_id)
      entry_id,
      NULLIF(
        BTRIM(
          regexp_replace(
            regexp_replace(content, E'\\n\\n(?:— [^:]+: )?\\d{1,2}/10\\s*$', '', 'g'),
            E'^\\s*\\*\\*[^\\n]+?\\*\\*\\s*\\n+',
            '',
            'g'
          )
        ),
        ''
      ) AS last_comment_excerpt
    FROM comment_rows
    ORDER BY entry_id, created_at DESC
  ),
  vote_stats AS (
    SELECT
      v.entry_id,
      COALESCE(SUM(v.value), 0)::int AS vote_score
    FROM public.votes v
    JOIN filtered f ON f.id = v.entry_id
    WHERE v.entry_id IS NOT NULL
    GROUP BY v.entry_id
  ),
  viewer_votes AS (
    SELECT
      v.entry_id,
      v.value::int AS my_vote
    FROM public.votes v
    JOIN filtered f ON f.id = v.entry_id
    WHERE v.entry_id IS NOT NULL
      AND v.user_id = auth.uid()
  )
  SELECT
    f.id,
    f.user_id,
    f.target,
    f.target_normalized,
    f.category,
    f.description,
    f.rating,
    f.verified_target,
    f.created_at,
    f.deleted_at,
    f.deleted_by,
    p.user_id AS profile_user_id,
    p.username AS profile_username,
    p.display_name AS profile_display_name,
    p.avatar_url AS profile_avatar_url,
    p.city AS profile_city,
    p.occupation AS profile_occupation,
    p.age AS profile_age,
    p.bio AS profile_bio,
    p.show_avatar AS profile_show_avatar,
    p.show_display_name AS profile_show_display_name,
    p.show_city AS profile_show_city,
    p.show_occupation AS profile_show_occupation,
    p.show_age AS profile_show_age,
    p.show_bio AS profile_show_bio,
    p.show_linked_accounts AS profile_show_linked_accounts,
    p.signup_order AS profile_signup_order,
    COALESCE(vs.vote_score, 0) AS vote_score,
    COALESCE(cs.comment_count, 0) AS comment_count,
    cs.avg_rating,
    COALESCE(vv.my_vote, 0) AS my_vote,
    lc.last_comment_excerpt
  FROM filtered f
  LEFT JOIN public.profiles p ON p.user_id = f.user_id
  LEFT JOIN comment_stats cs ON cs.entry_id = f.id
  LEFT JOIN last_comments lc ON lc.entry_id = f.id
  LEFT JOIN vote_stats vs ON vs.entry_id = f.id
  LEFT JOIN viewer_votes vv ON vv.entry_id = f.id
  ORDER BY COALESCE(cs.last_comment_at, f.created_at) DESC;
$$;