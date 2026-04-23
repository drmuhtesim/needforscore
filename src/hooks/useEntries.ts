import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CategoryType } from "@/components/CategorySidebar";

export interface EntryRow {
  id: string;
  user_id: string;
  target: string;
  target_normalized: string;
  category: Exclude<CategoryType, "all">;
  status: "safe" | "suspicious" | "danger";
  description: string;
  rating: number;
  verified_target: boolean;
  created_at: string;
  profiles?: { username: string; display_name: string | null; avatar_url: string | null } | null;
  vote_score?: number;
  comment_count?: number;
}

export const useEntries = (category: CategoryType, search: string) => {
  return useQuery({
    queryKey: ["entries", category, search],
    queryFn: async (): Promise<EntryRow[]> => {
      let q = supabase
        .from("entries")
        .select("*")
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
        supabase.from("profiles").select("user_id, username, display_name, avatar_url").in("user_id", userIds),
        supabase.from("votes").select("entry_id, value").in("entry_id", ids),
        supabase.from("comments").select("entry_id").in("entry_id", ids),
      ]);

      const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));
      const voteMap = new Map<string, number>();
      (votes ?? []).forEach((v) => {
        if (!v.entry_id) return;
        voteMap.set(v.entry_id, (voteMap.get(v.entry_id) ?? 0) + v.value);
      });
      const commentMap = new Map<string, number>();
      (comments ?? []).forEach((c) => {
        commentMap.set(c.entry_id, (commentMap.get(c.entry_id) ?? 0) + 1);
      });

      return entries.map((e) => ({
        ...e,
        profiles: (profileMap.get(e.user_id) as any) ?? null,
        vote_score: voteMap.get(e.id) ?? 0,
        comment_count: commentMap.get(e.id) ?? 0,
      }));
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
      const [{ data: profile }, { data: votes }] = await Promise.all([
        supabase.from("profiles").select("user_id, username, display_name, avatar_url").eq("user_id", data.user_id).maybeSingle(),
        supabase.from("votes").select("value").eq("entry_id", id),
      ]);
      const score = (votes ?? []).reduce((acc, v) => acc + v.value, 0);
      return { ...(data as EntryRow), profiles: profile as any, vote_score: score };
    },
  });
};
