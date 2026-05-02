import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CategoryType } from "@/components/CategorySidebar";
import { averageRating, cleanCommentContent } from "@/lib/commentRating";

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
  /** Son eklenen yorumun (deneyimin) ilk satırı (rating ve about temizlenmiş). */
  last_comment_excerpt?: string | null;
}

export const useEntries = (category: CategoryType, search: string) => {
  return useQuery({
    queryKey: ["entries", category, search],
    queryFn: async (): Promise<EntryRow[]> => {
      let q = supabase
        .from("entries")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(100);

      if (category !== "all") q = q.eq("category", category);
      if (search.trim()) {
        const s = search.trim().toLowerCase();
        q = q.ilike("target_normalized", `%${s}%`);
      }
      const { data, error } = await q;
      if (error) throw error;
      const entries = (data ?? []) as EntryRow[];
      if (entries.length === 0) return entries;

      const userIds = Array.from(new Set(entries.map((e) => e.user_id)));
      const ids = entries.map((e) => e.id);

      const [{ data: profiles }, { data: votes }, { data: comments }] = await Promise.all([
        supabase.from("profiles").select("user_id, username, display_name, avatar_url, signup_order").in("user_id", userIds),
        supabase.from("votes").select("entry_id, value").in("entry_id", ids),
        supabase.from("comments").select("entry_id, content, created_at").in("entry_id", ids).is("deleted_at", null),
      ]);

      const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));
      const voteMap = new Map<string, number>();
      (votes ?? []).forEach((v) => {
        if (!v.entry_id) return;
        voteMap.set(v.entry_id, (voteMap.get(v.entry_id) ?? 0) + v.value);
      });
      const commentMap = new Map<string, number>();
      const commentContentMap = new Map<string, string[]>();
      const lastActivityMap = new Map<string, number>();
      (comments ?? []).forEach((c) => {
        commentMap.set(c.entry_id, (commentMap.get(c.entry_id) ?? 0) + 1);
        const arr = commentContentMap.get(c.entry_id) ?? [];
        arr.push(c.content);
        commentContentMap.set(c.entry_id, arr);
        const ts = c.created_at ? new Date(c.created_at).getTime() : 0;
        const prev = lastActivityMap.get(c.entry_id) ?? 0;
        if (ts > prev) lastActivityMap.set(c.entry_id, ts);
      });

      const enriched = entries.map((e) => ({
        ...e,
        profiles: (profileMap.get(e.user_id) as any) ?? null,
        vote_score: voteMap.get(e.id) ?? 0,
        comment_count: commentMap.get(e.id) ?? 0,
        avg_rating: averageRating(commentContentMap.get(e.id) ?? []),
      }));

      // En son yorum/deneyim eklenen başlık en üstte; yorumu olmayanlar için entry'nin oluşturulma tarihi kullanılır.
      enriched.sort((a, b) => {
        const aTs = lastActivityMap.get(a.id) ?? new Date(a.created_at).getTime();
        const bTs = lastActivityMap.get(b.id) ?? new Date(b.created_at).getTime();
        return bTs - aTs;
      });

      return enriched;
    },
  });
};

export const useEntry = (id: string | undefined) => {
  return useQuery({
    queryKey: ["entry", id],
    enabled: !!id,
    queryFn: async (): Promise<EntryRow | null> => {
      if (!id) return null;
      const { data, error } = await supabase.from("entries").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const [{ data: profile }, { data: votes }, { data: comments }] = await Promise.all([
        supabase.from("profiles").select("user_id, username, display_name, avatar_url, signup_order").eq("user_id", data.user_id).maybeSingle(),
        supabase.from("votes").select("value").eq("entry_id", id),
        supabase.from("comments").select("content").eq("entry_id", id).is("deleted_at", null),
      ]);
      const score = (votes ?? []).reduce((acc, v) => acc + v.value, 0);
      const avg = averageRating((comments ?? []).map((c) => c.content));
      return { ...(data as EntryRow), profiles: profile as any, vote_score: score, avg_rating: avg };
    },
  });
};
