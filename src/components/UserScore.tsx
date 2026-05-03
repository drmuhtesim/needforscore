import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  userId?: string | null;
  username?: string | null;
  size?: "sm" | "md";
}

// Cache: userId -> avg rating (number) or null if no qualifying entries
const cache = new Map<string, number | null>();
const inflight = new Map<string, Promise<number | null>>();

/**
 * Average rating of entries opened by this user, restricted to entries that
 * have at least one comment from someone OTHER than the entry owner.
 * If none of the user's entries have such third-party engagement, returns null
 * so the score chip is hidden in the UI.
 */
const fetchAvg = async (userId: string): Promise<number | null> => {
  if (cache.has(userId)) return cache.get(userId)!;
  if (inflight.has(userId)) return inflight.get(userId)!;
  const p = (async () => {
    const { data: entries } = await supabase
      .from("entries")
      .select("id, rating")
      .eq("user_id", userId)
      .is("deleted_at", null);
    const rows = (entries ?? []) as { id: string; rating: number }[];
    if (rows.length === 0) {
      cache.set(userId, null);
      return null;
    }
    const ids = rows.map((e) => e.id);
    const { data: comments } = await supabase
      .from("comments")
      .select("entry_id")
      .in("entry_id", ids)
      .neq("user_id", userId)
      .is("deleted_at", null);
    const engaged = new Set((comments ?? []).map((c: any) => c.entry_id as string));
    const eligible = rows.filter((e) => engaged.has(e.id));
    if (eligible.length === 0) {
      cache.set(userId, null);
      return null;
    }
    const avg = eligible.reduce((s, r) => s + (r.rating ?? 0), 0) / eligible.length;
    cache.set(userId, avg);
    return avg;
  })();
  inflight.set(userId, p);
  try {
    return await p;
  } finally {
    inflight.delete(userId);
  }
};

const resolveUserId = async (username: string): Promise<string | null> => {
  const key = `u:${username}`;
  if (cache.has(key)) return (cache.get(key) as any) as string | null;
  const { data } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("username", username)
    .maybeSingle();
  const uid = data?.user_id ?? null;
  cache.set(key, uid as any);
  return uid;
};

const UserScore = ({ userId, username, size = "sm" }: Props) => {
  const [avg, setAvg] = useState<number | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let uid = userId ?? null;
      if (!uid && username) uid = await resolveUserId(username);
      if (!uid) {
        if (!cancelled) setAvg(null);
        return;
      }
      const v = await fetchAvg(uid);
      if (!cancelled) setAvg(v);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, username]);

  if (avg === undefined || avg === null) return null;

  const sizeCls = size === "md" ? "text-sm" : "text-xs";
  const iconCls = size === "md" ? "h-3.5 w-3.5" : "h-3 w-3";

  return (
    <span
      className={`inline-flex items-center gap-0.5 font-mono text-yellow-400 ${sizeCls}`}
      title="Açtığı başlıkların ortalama puanı"
    >
      <Star className={`${iconCls} fill-current`} />
      {avg.toFixed(1)}
    </span>
  );
};

export default UserScore;
