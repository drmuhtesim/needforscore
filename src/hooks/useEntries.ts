import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CategoryType } from "@/components/CategorySidebar";
import { averageRating } from "@/lib/commentRating";
import { applyProfilePrivacy, PROFILE_PRIVACY_FIELDS } from "@/lib/profilePrivacy";
import { useAuth } from "@/contexts/AuthContext";

export interface EntryRow {
  id: string;
  user_id: string;
  target: string;
  target_normalized: string;
  category: Exclude<CategoryType, "all">;
  description: string;
  rating: number;
  verified_target: boolean;
  created_at: string;
  deleted_at?: string | null;
  deleted_by?: string | null;
  profiles?: { username: string; display_name: string | null; avatar_url: string | null; signup_order?: number | null } | null;
  vote_score?: number;
  comment_count?: number;
  /** Yorumların içeriğindeki skorlardan hesaplanan aritmetik ortalama; yorum yoksa null. */
  avg_rating?: number | null;
  /** Viewer's own vote on this entry, batched into the list query. */
  my_vote?: -1 | 0 | 1;
  /** Son eklenen yorumun (deneyimin) ilk satırı (rating ve about temizlenmiş). */
  last_comment_excerpt?: string | null;
}

export const useEntries = (category: CategoryType, search: string) => {
  const { user, loading: authLoading } = useAuth();

  return useQuery({
    enabled: !authLoading,
    placeholderData: (prev) => prev,
    queryKey: ["entries", user?.id ?? "anon", category, search],
    queryFn: async (): Promise<EntryRow[]> => {
      const { data, error } = await (supabase as any).rpc("get_entries_feed", {
        _category: category,
        _search: search.trim(),
        _limit: 100,
      });
      if (error) throw error;

      const viewerId = user?.id ?? null;
      return ((data ?? []) as any[]).map((row) => {
        const profile = row.profile_user_id
          ? applyProfilePrivacy(
              {
                user_id: row.profile_user_id,
                username: row.profile_username,
                display_name: row.profile_display_name,
                avatar_url: row.profile_avatar_url,
                city: row.profile_city,
                occupation: row.profile_occupation,
                age: row.profile_age,
                bio: row.profile_bio,
                show_avatar: row.profile_show_avatar,
                show_display_name: row.profile_show_display_name,
                show_city: row.profile_show_city,
                show_occupation: row.profile_show_occupation,
                show_age: row.profile_show_age,
                show_bio: row.profile_show_bio,
                show_linked_accounts: row.profile_show_linked_accounts,
                signup_order: row.profile_signup_order,
              },
              viewerId,
            )
          : null;

        return {
          id: row.id,
          user_id: row.user_id,
          target: row.target,
          target_normalized: row.target_normalized,
          category: row.category,
          description: row.description,
          rating: row.rating,
          verified_target: row.verified_target,
          created_at: row.created_at,
          deleted_at: row.deleted_at,
          deleted_by: row.deleted_by,
          profiles: profile as any,
          vote_score: row.vote_score ?? 0,
          comment_count: row.comment_count ?? 0,
          avg_rating: row.avg_rating == null ? null : Number(row.avg_rating),
          my_vote: (row.my_vote ?? 0) as -1 | 0 | 1,
          last_comment_excerpt: row.last_comment_excerpt
            ?.split(/\r?\n/)
            .map((s: string) => s.trim())
            .find((s: string) => s.length > 0) ?? null,
        } satisfies EntryRow;
      });
    },
  });
};

export const useEntry = (id: string | undefined) => {
  const { user, loading: authLoading } = useAuth();

  return useQuery({
    queryKey: ["entry", id, user?.id ?? "anon"],
    enabled: !!id && !authLoading,
    queryFn: async (): Promise<EntryRow | null> => {
      if (!id) return null;
      const { data, error } = await supabase.from("entries").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const viewerId = user?.id ?? null;
      const [{ data: profile }, { data: votes }, { data: comments }] = await Promise.all([
        supabase.from("profiles").select(`${PROFILE_PRIVACY_FIELDS}, signup_order`).eq("user_id", data.user_id).maybeSingle(),
        supabase.from("votes").select("user_id, value").eq("entry_id", id),
        supabase.from("comments").select("content").eq("entry_id", id).is("deleted_at", null),
      ]);
      const score = (votes ?? []).reduce((acc, v) => acc + v.value, 0);
      const myVote = viewerId
        ? ((votes ?? []).find((v: any) => v.user_id === viewerId)?.value ?? 0)
        : 0;
      const avg = averageRating((comments ?? []).map((c) => c.content));
      const safeProfile = applyProfilePrivacy(profile as any, viewerId);
      return { ...(data as EntryRow), profiles: safeProfile as any, vote_score: score, avg_rating: avg, my_vote: myVote as -1 | 0 | 1 };
    },
  });
};
