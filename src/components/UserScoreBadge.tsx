import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  userId?: string | null;
}

const cache = new Map<string, number | null>();
const inflight = new Map<string, Promise<number | null>>();

/** Same rule as UserScore: only count entries that have engagement from others. */
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

const toneFor = (v: number) => {
  if (v >= 7) return "border-primary/40 text-primary bg-primary/5";
  if (v >= 4) return "border-suspicious/40 text-suspicious bg-suspicious/5";
  return "border-danger/40 text-danger bg-danger/5";
};

const UserScoreBadge = ({ userId }: Props) => {
  const [avg, setAvg] = useState<number | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!userId) {
        if (!cancelled) setAvg(null);
        return;
      }
      const v = await fetchAvg(userId);
      if (!cancelled) setAvg(v);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (avg === undefined || avg === null) return null;

  return (
    <span
      className={`inline-flex items-center font-mono text-xs px-2 py-0.5 rounded-md border ${toneFor(avg)}`}
      title="Ortalama puan"
    >
      {avg.toFixed(1)}
    </span>
  );
};

export default UserScoreBadge;
