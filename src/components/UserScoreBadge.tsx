import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  userId?: string | null;
}

const cache = new Map<string, number | null>();
const inflight = new Map<string, Promise<number | null>>();

const fetchAvg = async (userId: string): Promise<number | null> => {
  if (cache.has(userId)) return cache.get(userId)!;
  if (inflight.has(userId)) return inflight.get(userId)!;
  const p = (async () => {
    const { data } = await supabase
      .from("entries")
      .select("rating")
      .eq("user_id", userId)
      .is("deleted_at", null);
    const rows = (data ?? []) as { rating: number }[];
    if (rows.length === 0) {
      cache.set(userId, null);
      return null;
    }
    const avg = rows.reduce((s, r) => s + (r.rating ?? 0), 0) / rows.length;
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
