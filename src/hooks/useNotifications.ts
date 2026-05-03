import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type NotificationKind =
  | "message"
  | "entry_comment"
  | "comment_reply"
  | "thread_comment";

export interface AppNotification {
  id: string;
  recipient_id: string;
  actor_id: string | null;
  kind: NotificationKind;
  entry_id: string | null;
  comment_id: string | null;
  conversation_id: string | null;
  message_id: string | null;
  read_at: string | null;
  created_at: string;
  actor?: { username: string; display_name: string | null; avatar_url: string | null } | null;
  entry?: { id: string; target: string; category: string } | null;
}

export const useNotifications = (limit = 20) => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["notifications", user?.id, limit],
    enabled: !!user,
    queryFn: async (): Promise<AppNotification[]> => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("recipient_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      const list = (data ?? []) as AppNotification[];
      const actorIds = Array.from(new Set(list.map((n) => n.actor_id).filter(Boolean))) as string[];
      const entryIds = Array.from(new Set(list.map((n) => n.entry_id).filter(Boolean))) as string[];
      const [profilesRes, entriesRes] = await Promise.all([
        actorIds.length
          ? supabase.from("profiles").select("user_id, username, display_name, avatar_url").in("user_id", actorIds)
          : Promise.resolve({ data: [] as any[] }),
        entryIds.length
          ? supabase.from("entries").select("id, target, category").in("id", entryIds)
          : Promise.resolve({ data: [] as any[] }),
      ]);
      const pMap = new Map((profilesRes.data ?? []).map((p: any) => [p.user_id, p]));
      const eMap = new Map((entriesRes.data ?? []).map((e: any) => [e.id, e]));
      return list.map((n) => ({
        ...n,
        actor: n.actor_id ? pMap.get(n.actor_id) ?? null : null,
        entry: n.entry_id ? eMap.get(n.entry_id) ?? null : null,
      }));
    },
  });

  // Realtime
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("notifications-rt")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `recipient_id=eq.${user.id}` },
        () => {
          qc.invalidateQueries({ queryKey: ["notifications"] });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, qc]);

  const unreadCount = useMemo(
    () => (query.data ?? []).filter((n) => !n.read_at).length,
    [query.data]
  );

  const markAllRead = async () => {
    if (!user) return;
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("recipient_id", user.id)
      .is("read_at", null);
    qc.invalidateQueries({ queryKey: ["notifications"] });
  };

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["notifications"] });
  };

  return { notifications: query.data ?? [], loading: query.isLoading, unreadCount, markAllRead, markRead };
};
