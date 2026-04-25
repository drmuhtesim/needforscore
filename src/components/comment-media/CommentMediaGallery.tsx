import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Clock, Check, X as XIcon, ShieldCheck } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

export interface MediaRow {
  id: string;
  comment_id: string;
  user_id: string;
  storage_path: string;
  status: "pending" | "approved" | "rejected";
}

interface Props {
  media: MediaRow[];
  isOwner: boolean;
  isModerator: boolean;
  commentId: string;
}

const CommentMediaGallery = ({ media, isOwner, isModerator, commentId }: Props) => {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [acting, setActing] = useState<string | null>(null);

  // Show approved to everyone; pending/rejected only to owner or mod (RLS already enforces row access)
  const visible = media.filter((m) => m.status === "approved" || isOwner || isModerator);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const next: Record<string, string> = {};
      await Promise.all(
        visible.map(async (m) => {
          const { data } = await supabase.storage
            .from("comment-media")
            .createSignedUrl(m.storage_path, 60 * 30);
          if (data?.signedUrl) next[m.id] = data.signedUrl;
        })
      );
      if (!cancelled) setUrls(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [visible.map((m) => m.id).join("|")]);

  if (visible.length === 0) return null;

  const setStatus = async (id: string, status: "approved" | "rejected") => {
    setActing(id);
    const { error } = await supabase
      .from("comment_media")
      .update({ status, moderator_id: (await supabase.auth.getUser()).data.user?.id })
      .eq("id", id);
    setActing(null);
    if (error) {
      toast({ title: t("entry.failed"), description: error.message, variant: "destructive" });
      return;
    }
    qc.invalidateQueries({ queryKey: ["comment-media", commentId] });
  };

  return (
    <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2">
      {visible.map((m) => {
        const isPending = m.status === "pending";
        const isRejected = m.status === "rejected";
        return (
          <div
            key={m.id}
            className={`relative rounded-md overflow-hidden border aspect-square bg-muted/30 ${
              isPending ? "border-suspicious/40" : isRejected ? "border-danger/40 opacity-60" : "border-border"
            }`}
          >
            {urls[m.id] ? (
              <img src={urls[m.id]} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full" />
            )}
            {isPending && (
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/70 via-black/20 to-transparent">
                <div className="w-full px-2 py-1 text-[10px] font-mono text-suspicious-foreground bg-suspicious/80 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {t("entry.mediaPending")}
                </div>
              </div>
            )}
            {isRejected && (
              <div className="absolute inset-0 flex items-end">
                <div className="w-full px-2 py-1 text-[10px] font-mono text-destructive-foreground bg-danger/80">
                  {t("entry.mediaRejected")}
                </div>
              </div>
            )}
            {!isPending && !isRejected && (
              <div className="absolute top-1 right-1 inline-flex items-center gap-1 rounded-full bg-background/80 px-1.5 py-0.5 text-[10px] text-safe">
                <ShieldCheck className="h-3 w-3" />
                {t("entry.mediaApproved")}
              </div>
            )}
            {isModerator && isPending && (
              <div className="absolute top-1 left-1 flex gap-1">
                <Button
                  size="sm"
                  variant="default"
                  className="h-6 px-2 text-[10px]"
                  disabled={acting === m.id}
                  onClick={() => setStatus(m.id, "approved")}
                >
                  <Check className="h-3 w-3 mr-0.5" />
                  {t("entry.mediaModApprove")}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-6 px-2 text-[10px]"
                  disabled={acting === m.id}
                  onClick={() => setStatus(m.id, "rejected")}
                >
                  <XIcon className="h-3 w-3 mr-0.5" />
                  {t("entry.mediaModReject")}
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default CommentMediaGallery;
