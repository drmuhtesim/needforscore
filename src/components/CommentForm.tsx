import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { Star, Send, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import MediaUploader, { type PendingFile } from "./comment-media/MediaUploader";

interface Props {
  entryId: string;
  canReplyAsTarget: boolean;
  remaining: number; // remaining experiences user can post on this entry
}

const CommentForm = ({ entryId, canReplyAsTarget, remaining }: Props) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(5);
  const [asTarget, setAsTarget] = useState(false);
  const [media, setMedia] = useState<PendingFile[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [posting, setPosting] = useState(false);

  const reachedLimit = remaining <= 0;
  const canSubmit = !!user && !reachedLimit && content.trim().length >= 1 && content.trim().length <= 2000;

  const openConfirm = () => {
    if (!canSubmit) return;
    setConfirmOpen(true);
  };

  const submit = async () => {
    if (!user) return;
    setConfirmOpen(false);
    setPosting(true);
    // 1) insert comment with rating embedded into content footer (rating is on entry root; for replies we embed)
    // We do not have a rating column on comments; encode it as a leading line. Voting uses VoteButtons separately.
    const text = `${content.trim()}\n\n— ${t("entry.yourScore")}: ${rating}/10`;
    const { data: inserted, error } = await supabase
      .from("comments")
      .insert({ entry_id: entryId, user_id: user.id, content: text, is_target_response: asTarget })
      .select("id")
      .single();
    if (error || !inserted) {
      setPosting(false);
      toast({ title: t("entry.failed"), description: error?.message ?? "", variant: "destructive" });
      return;
    }
    // 2) upload media + insert metadata rows (status defaults to 'pending')
    if (media.length > 0) {
      for (const m of media) {
        const ext = m.file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${user.id}/${inserted.id}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("comment-media")
          .upload(path, m.file, { contentType: m.file.type, upsert: false });
        if (upErr) {
          toast({ title: t("entry.failed"), description: upErr.message, variant: "destructive" });
          continue;
        }
        const { error: metaErr } = await supabase.from("comment_media").insert({
          comment_id: inserted.id,
          user_id: user.id,
          storage_path: path,
        });
        if (metaErr) {
          toast({ title: t("entry.failed"), description: metaErr.message, variant: "destructive" });
        }
      }
      toast({ title: t("entry.mediaUploaded") });
    }
    setPosting(false);
    setContent("");
    setMedia([]);
    setAsTarget(false);
    setRating(5);
    qc.invalidateQueries({ queryKey: ["comments", entryId] });
  };

  if (reachedLimit) {
    return (
      <div className="border border-border rounded-md p-4 mb-5 text-sm text-muted-foreground">
        {t("entry.limitReached")}
      </div>
    );
  }

  return (
    <div className="border border-border/60 rounded-xl p-5 bg-card/40 mb-8 space-y-4">
      <div>
        <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
          {t("entry.yourExperience")}
        </label>
        <Textarea
          className="mt-2"
          rows={4}
          maxLength={2000}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t("entry.commentPlaceholder")}
        />
        <p className="text-[11px] text-muted-foreground text-right font-mono mt-1">{content.length}/2000</p>
      </div>

      {/* Rating */}
      <div>
        <div className="flex items-center justify-between">
          <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            {t("entry.yourScore")}
          </label>
          <span className="inline-flex items-center gap-1 text-sm font-mono text-suspicious">
            <Star className="h-3.5 w-3.5 fill-current" />
            {rating}/10
          </span>
        </div>
        <input
          type="range"
          min={1}
          max={10}
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className="w-full accent-primary mt-2"
        />
      </div>

      {/* Media uploader */}
      <MediaUploader files={media} onChange={setMedia} max={10} />

      <div className="flex items-center justify-between gap-2">
        {canReplyAsTarget ? (
          <label className="inline-flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={asTarget}
              onChange={(e) => setAsTarget(e.target.checked)}
              className="accent-primary"
            />
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            {t("entry.replyAsTarget")}
          </label>
        ) : (
          <span />
        )}
        <Button onClick={openConfirm} disabled={!canSubmit || posting}>
          <Send className="h-4 w-4 mr-1" />
          {posting ? "..." : t("entry.postComment")}
        </Button>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("entry.confirmRatingTitle", { rating })}</AlertDialogTitle>
            <AlertDialogDescription>{t("entry.confirmRatingDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("actions.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={submit}>{t("entry.confirmAndPost")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CommentForm;
