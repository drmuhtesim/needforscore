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
    const text = `${content.trim()}\n\n${rating}/10`;
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

      {/* Rating - dikkat çekici */}
      {(() => {
        const level =
          rating <= 2
            ? { key: "danger", color: "hsl(0 80% 55%)", emoji: "🚨", ring: "ring-danger/40", text: "text-danger" }
            : rating <= 4
            ? { key: "suspicious", color: "hsl(25 95% 55%)", emoji: "⚠️", ring: "ring-suspicious/40", text: "text-suspicious" }
            : rating <= 6
            ? { key: "neutral", color: "hsl(45 95% 55%)", emoji: "😐", ring: "ring-warning/40", text: "text-warning" }
            : rating <= 8
            ? { key: "safe", color: "hsl(145 75% 45%)", emoji: "✅", ring: "ring-safe/40", text: "text-safe" }
            : { key: "trusted", color: "hsl(160 80% 45%)", emoji: "💎", ring: "ring-safe/60", text: "text-safe" };
        const pct = ((rating - 1) / 9) * 100;
        return (
          <div
            className={`relative space-y-3 rounded-lg border-2 p-4 ring-2 ${level.ring} bg-gradient-to-br from-secondary/40 via-background to-secondary/20 shadow-[0_0_24px_-8px_hsl(var(--primary)/0.4)] transition-all`}
            style={{ borderColor: level.color }}
          >
            <div className="absolute -top-2.5 left-3 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-gradient-to-r from-[hsl(285_85%_60%)] via-[hsl(330_85%_60%)] to-[hsl(25_95%_60%)] text-white shadow-md">
              ★ {t("entry.ratingImportant")}
            </div>

            <div className="flex items-start justify-between gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-base font-bold block">{t("entry.yourScore")}</label>
                <p className="text-xs text-muted-foreground leading-snug max-w-xs">
                  {t("entry.ratingExplain")}
                </p>
              </div>
              <div className="flex flex-col items-center shrink-0">
                <div
                  className="flex items-baseline font-mono font-extrabold tabular-nums leading-none"
                  style={{ color: level.color, textShadow: `0 0 18px ${level.color}66` }}
                >
                  <span className="text-4xl">{rating}</span>
                  <span className="text-base text-muted-foreground">/10</span>
                </div>
                <div className={`mt-1 text-[11px] font-semibold ${level.text} flex items-center gap-1`}>
                  <span>{level.emoji}</span>
                  <span>{t(`entry.ratingLevel.${level.key}`)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <input
                type="range"
                min={1}
                max={10}
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="w-full h-2 cursor-pointer appearance-none rounded-full"
                style={{
                  background: `linear-gradient(to right, ${level.color} 0%, ${level.color} ${pct}%, hsl(var(--muted)) ${pct}%, hsl(var(--muted)) 100%)`,
                  accentColor: level.color,
                }}
              />
              <div className="flex justify-between text-[10px] font-mono uppercase tracking-wider">
                <span className="text-danger">1 · {t("entry.ratingScaleLow")}</span>
                <span className="text-warning">5 · {t("entry.ratingScaleMid")}</span>
                <span className="text-safe">10 · {t("entry.ratingScaleHigh")}</span>
              </div>
            </div>
          </div>
        );
      })()}

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
