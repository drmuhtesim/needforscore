import { useEffect, useState } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface Props {
  entryId?: string;
  commentId?: string;
  /** Optional initial computed score; component still fetches own vote. */
  initialScore?: number;
  /**
   * Optional viewer's own vote (-1|0|1). When provided, the component skips
   * its own fetch — used by the entry list where votes are batched in
   * `useEntries`. Reduces 25× redundant `select` calls per page load.
   */
  initialMyVote?: -1 | 0 | 1;
  size?: "sm" | "md";
}

const VoteButtons = ({ entryId, commentId, initialScore = 0, initialMyVote, size = "sm" }: Props) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [score, setScore] = useState(initialScore);
  const [my, setMy] = useState<-1 | 0 | 1>(initialMyVote ?? 0);
  const [loading, setLoading] = useState(false);

  useEffect(() => setScore(initialScore), [initialScore]);
  useEffect(() => {
    if (initialMyVote !== undefined) setMy(initialMyVote);
  }, [initialMyVote]);

  useEffect(() => {
    // Skip the per-row vote lookup when the parent already provided it.
    if (initialMyVote !== undefined) return;
    if (!user) {
      setMy(0);
      return;
    }
    let cancelled = false;
    (async () => {
      let q = supabase.from("votes").select("value").eq("user_id", user.id);
      q = entryId ? q.eq("entry_id", entryId) : q.eq("comment_id", commentId!);
      const { data } = await q.maybeSingle();
      if (!cancelled) setMy(((data?.value as -1 | 1) ?? 0) as -1 | 0 | 1);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, entryId, commentId, initialMyVote]);

  const cast = async (value: 1 | -1) => {
    if (!user) {
      navigate("/auth?mode=signin");
      return;
    }
    if (loading) return;
    setLoading(true);
    const prev = my;
    const target = prev === value ? 0 : value;
    setMy(target as -1 | 0 | 1);
    setScore((s) => s - prev + target);

    try {
      if (target === 0) {
        let q = supabase.from("votes").delete().eq("user_id", user.id);
        q = entryId ? q.eq("entry_id", entryId) : q.eq("comment_id", commentId!);
        const { error } = await q;
        if (error) throw error;
      } else {
        const row: any = { user_id: user.id, value: target };
        if (entryId) row.entry_id = entryId;
        else row.comment_id = commentId;
        // upsert by deleting then inserting to handle conflict on partial unique index
        let del = supabase.from("votes").delete().eq("user_id", user.id);
        del = entryId ? del.eq("entry_id", entryId) : del.eq("comment_id", commentId!);
        await del;
        const { error } = await supabase.from("votes").insert(row);
        if (error) throw error;
      }
    } catch (e: any) {
      setMy(prev);
      setScore((s) => s - target + prev);
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  const textSize = size === "sm" ? "text-xs" : "text-sm";

  return (
    <div className={`inline-flex items-center gap-1 ${textSize} font-mono`}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          cast(1);
        }}
        className={`p-1 rounded hover:bg-secondary transition-colors ${my === 1 ? "text-safe" : "text-muted-foreground"}`}
        aria-label="Upvote"
      >
        <ThumbsUp className={iconSize} />
      </button>
      <span className={score > 0 ? "text-safe" : score < 0 ? "text-danger" : "text-muted-foreground"}>
        {score > 0 ? `+${score}` : score}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          cast(-1);
        }}
        className={`p-1 rounded hover:bg-secondary transition-colors ${my === -1 ? "text-danger" : "text-muted-foreground"}`}
        aria-label="Downvote"
      >
        <ThumbsDown className={iconSize} />
      </button>
    </div>
  );
};

export default VoteButtons;
