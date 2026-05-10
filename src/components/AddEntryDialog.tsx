import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Plus } from "lucide-react";
import { z } from "zod";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import PlatformIcon from "./PlatformIcon";
import MediaUploader, { type PendingFile } from "./comment-media/MediaUploader";
import type { CategoryType } from "./CategorySidebar";
import { buildProfileUrl, canonicalizeTarget, formatTargetPreview, normalizeTarget, validateTarget } from "@/lib/platforms";

type Cat = Exclude<CategoryType, "all">;

// Order requested: instagram, tiktok, x, score, phone
const categories: Cat[] = ["instagram", "tiktok", "twitter", "score", "phone"];

interface AddEntryDialogProps {
  trigger?: React.ReactNode;
  initialTarget?: string;
  initialCategory?: Cat;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const AddEntryDialog = ({ trigger, initialTarget, initialCategory, open: openProp, onOpenChange }: AddEntryDialogProps = {}) => {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [openInternal, setOpenInternal] = useState(false);
  const open = openProp ?? openInternal;
  const DEFAULT_CATEGORY: Cat = "instagram";
  const TARGET_MAX = 200;

  const sanitizeTarget = (raw: string | undefined | null): string => {
    if (!raw) return "";
    return raw.trim().slice(0, TARGET_MAX);
  };

  const sanitizeCategory = (raw: Cat | undefined): Cat => {
    if (raw && categories.includes(raw)) return raw;
    return DEFAULT_CATEGORY;
  };

  const [category, setCategory] = useState<Cat>(sanitizeCategory(initialCategory));
  const [target, setTarget] = useState(sanitizeTarget(initialTarget));
  const [about, setAbout] = useState("");
  const [rating, setRating] = useState(5);
  const [description, setDescription] = useState("");
  const [media, setMedia] = useState<PendingFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [scoreUserStatus, setScoreUserStatus] = useState<"idle" | "checking" | "exists" | "missing">("idle");

  // When the dialog is opened (controlled or uncontrolled) with an initialTarget,
  // sync the target/category fields so the search query auto-fills.
  // Trims whitespace, enforces a max length, and falls back to the default
  // category when the supplied one is missing or unknown.
  useEffect(() => {
    if (!open) return;
    if (initialTarget !== undefined) setTarget(sanitizeTarget(initialTarget));
    setCategory(sanitizeCategory(initialCategory));
  }, [open, initialTarget, initialCategory]);

  const setOpen = (next: boolean) => {
    setOpenInternal(next);
    onOpenChange?.(next);
  };

  const handleOpen = (next: boolean) => {
    if (next && !user) {
      navigate("/auth?mode=signin");
      return;
    }
    if (next && profile && !profile.email_verified) {
      toast({
        title: t("verify.requiredTitle"),
        description: t("verify.requiredDesc"),
        variant: "destructive",
      });
      return;
    }
    setOpen(next);
  };

  const formatValid = target.trim() ? validateTarget(target, category) : false;
  const profileUrl = formatValid ? buildProfileUrl(target, category) : null;

  // Detect what was pasted into the target field and adjust value/category
  // accordingly. Returns the cleaned value to set, or null to keep original.
  const handleTargetPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const raw = e.clipboardData.getData("text").trim();
    if (!raw) return;

    // Email — not supported, warn and let default paste happen for visibility.
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) {
      e.preventDefault();
      toast({ title: t("entry.invalidInput"), description: t("entry.pasteWarnEmail"), variant: "destructive" });
      return;
    }

    // URL — try to extract a known platform handle.
    if (/^https?:\/\//i.test(raw) || /^(www\.)?(instagram|tiktok|x|twitter)\.com\//i.test(raw)) {
      e.preventDefault();
      try {
        const url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
        const host = url.hostname.replace(/^www\./, "").toLowerCase();
        const seg = url.pathname.split("/").filter(Boolean)[0]?.replace(/^@/, "") ?? "";

        let nextCategory: Cat | null = null;
        if (host.endsWith("instagram.com")) nextCategory = "instagram";
        else if (host.endsWith("tiktok.com")) nextCategory = "tiktok";
        else if (host === "x.com" || host.endsWith("twitter.com")) nextCategory = "twitter";

        if (nextCategory && seg) {
          setCategory(nextCategory);
          setTarget(seg.toLowerCase());
          toast({
            title: t("entry.pasteDetectedTitle"),
            description: t("entry.pasteDetectedUrl", { category: t(`categories.${nextCategory}`, { defaultValue: nextCategory }) }),
          });
          return;
        }
        toast({ title: t("entry.invalidInput"), description: t("entry.pasteWarnUnknownUrl"), variant: "destructive" });
      } catch {
        toast({ title: t("entry.invalidInput"), description: t("entry.pasteWarnUnknownUrl"), variant: "destructive" });
      }
      return;
    }

    // Phone-like pasted into a non-phone category.
    if (category !== "phone" && /^[+\d][\d\s().-]{6,}$/.test(raw)) {
      // don't preventDefault — let user keep the value, but suggest switching.
      toast({ title: t("entry.invalidInput"), description: t("entry.pasteWarnPhone"), variant: "destructive" });
      return;
    }

    // Strip leading @ on handle pastes.
    if (raw.startsWith("@")) {
      e.preventDefault();
      setTarget(raw.slice(1).toLowerCase());
      toast({ title: t("entry.pasteDetectedTitle"), description: t("entry.pasteDetectedHandle") });
    }
  };

  const reset = () => {
    setCategory("instagram");
    setTarget("");
    setAbout("");
    setRating(5);
    setDescription("");
    media.forEach((m) => URL.revokeObjectURL(m.previewUrl));
    setMedia([]);
  };

  const submit = async () => {
    if (!user) return;
    const schema = z.object({
      target: z.string().trim().min(1).max(200),
      about: z.string().trim().min(5).max(30),
      description: z.string().trim().min(10).max(2000),
      rating: z.number().int().min(1).max(10),
    });
    const parsed = schema.safeParse({ target, about, description, rating });
    if (!parsed.success || !formatValid) {
      toast({ title: t("entry.invalidInput"), description: t("entry.checkFields"), variant: "destructive" });
      return;
    }
    setSubmitting(true);

    const normalized = normalizeTarget(target, category);

    if (category === "score") {
      const { data: existing } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("username", normalized)
        .maybeSingle();
      if (!existing) {
        setSubmitting(false);
        toast({
          title: t("entry.scoreUserMissingTitle"),
          description: t("entry.scoreUserMissingDesc"),
          variant: "destructive",
        });
        return;
      }
    }

    const { data: existingEntry } = await supabase
      .from("entries")
      .select("id")
      .eq("category", category as any)
      .eq("target_normalized", normalized)
      .is("deleted_at", null)
      .maybeSingle();
    if (existingEntry) {
      setSubmitting(false);
      toast({
        title: t("entry.duplicateTitle"),
        description: t("entry.duplicateDesc"),
        variant: "destructive",
      });
      setOpen(false);
      navigate(`/e/${existingEntry.id}`);
      return;
    }

    const cleanedTarget = canonicalizeTarget(target, category);
    const fullDescription = `**${about.trim()}**\n\n${description.trim()}`;

    const { data, error } = await supabase
      .from("entries")
      .insert({
        user_id: user.id,
        target: cleanedTarget,
        target_normalized: normalized,
        category: category as any,
        description: fullDescription,
        rating,
      })
      .select("id")
      .single();
    if (error) {
      setSubmitting(false);
      const isDuplicate =
        (error as any)?.code === "23505" ||
        /duplicate key|unique constraint/i.test(error.message ?? "");
      toast({
        title: isDuplicate ? t("entry.duplicateTitle") : t("entry.failed"),
        description: isDuplicate ? t("entry.duplicateDesc") : error.message,
        variant: "destructive",
      });
      return;
    }

    if (data?.id) {
      const firstComment = `${fullDescription}\n\n${rating}/10`;
      const { data: insertedComment } = await supabase
        .from("comments")
        .insert({
          entry_id: data.id,
          user_id: user.id,
          content: firstComment,
          is_target_response: false,
        })
        .select("id")
        .single();

      // Upload media attached to the first comment
      if (insertedComment?.id && media.length > 0) {
        for (const m of media) {
          const ext = m.file.name.split(".").pop()?.toLowerCase() || "jpg";
          const path = `${user.id}/${insertedComment.id}/${crypto.randomUUID()}.${ext}`;
          const { error: upErr } = await supabase.storage
            .from("comment-media")
            .upload(path, m.file, { contentType: m.file.type, upsert: false });
          if (upErr) {
            toast({ title: t("entry.failed"), description: upErr.message, variant: "destructive" });
            continue;
          }
          await supabase.from("comment_media").insert({
            comment_id: insertedComment.id,
            user_id: user.id,
            storage_path: path,
          });
        }
      }
    }

    setSubmitting(false);
    toast({ title: t("entry.created") });
    qc.invalidateQueries({ queryKey: ["entries"] });
    setOpen(false);
    reset();
    if (data?.id) navigate(`/e/${data.id}`);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button
            size="sm"
            className="gap-1.5 bg-gradient-to-r from-[hsl(285_85%_60%)] via-[hsl(330_85%_60%)] to-[hsl(25_95%_60%)] text-white border-0 hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            {t("entry.add")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[92vh] sm:max-h-[88vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-4 sm:px-6 pt-5 pb-3 border-b border-border/40 shrink-0">
          <DialogTitle>{t("entry.addTitle")}</DialogTitle>
          <DialogDescription className="text-xs">{t("entry.addDesc")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto px-4 sm:px-6 py-4 flex-1 min-h-0">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t("entry.category")}</Label>
              <span className="text-xs font-mono text-muted-foreground">{t(`categories.${category}`)}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => {
                const active = category === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setCategory(c);
                      setTarget("");
                    }}
                    aria-label={t(`categories.${c}`)}
                    title={t(`categories.${c}`) as string}
                    className={`h-10 w-10 inline-flex items-center justify-center rounded-md border transition-all ${
                      active
                        ? "border-primary bg-primary/10 ring-2 ring-primary/40"
                        : "border-border hover:bg-secondary"
                    }`}
                  >
                    <PlatformIcon category={c} className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="target">{t("entry.target")}</Label>
            {category === "phone" ? (
              <div className="phone-input-wrapper">
                <PhoneInput
                  international
                  defaultCountry="TR"
                  value={target}
                  onChange={(v) => setTarget(v ?? "")}
                  placeholder={t(`entry.placeholder.phone`) as string}
                  className="font-mono"
                />
              </div>
            ) : (
              <Input
                id="target"
                value={target}
                onChange={(e) => setTarget(e.target.value.toLowerCase())}
                onPaste={handleTargetPaste}
                placeholder={t(`entry.placeholder.${category}`)}
                className="font-mono"
                autoCapitalize="off"
                autoCorrect="off"
              />
            )}
            {target.trim() && (
              <div className="text-xs">
                {formatValid ? (
                  <div className="flex items-center justify-between text-safe">
                    <span>✓ {t("entry.formatOk")}</span>
                    {profileUrl && category !== "score" && (
                      <a
                        href={profileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        {t("entry.openProfile")} <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                ) : (
                  <span className="text-danger">
                    ✗ {category === "phone" ? t("entry.phoneInvalid") : t("entry.formatBad")}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="about">{t("entry.about")}</Label>
            {(() => {
              const len = about.trim().length;
              const tooShort = len > 0 && len < 5;
              const tooLong = len > 30;
              const valid = len >= 5 && len <= 30;
              const ringClass = tooShort || tooLong
                ? "border-danger focus-visible:ring-danger"
                : valid
                ? "border-safe focus-visible:ring-safe"
                : "";
              const helpClass = tooShort || tooLong
                ? "text-danger"
                : valid
                ? "text-safe"
                : "text-muted-foreground";
              const counterClass = tooLong
                ? "text-danger"
                : valid
                ? "text-safe"
                : "text-muted-foreground";
              return (
                <>
                  <Input
                    id="about"
                    value={about}
                    onChange={(e) => setAbout(e.target.value.slice(0, 30))}
                    placeholder={t("entry.aboutPlaceholder") as string}
                    maxLength={30}
                    aria-invalid={tooShort || tooLong}
                    className={ringClass}
                  />
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className={helpClass}>
                      {valid
                        ? (t("entry.aboutOk") as string)
                        : tooShort
                        ? (t("entry.aboutTooShort") as string)
                        : tooLong
                        ? (t("entry.aboutTooLong") as string)
                        : (t("entry.aboutHelp") as string)}
                    </span>
                    <span className={counterClass}>{about.length}/30</span>
                  </div>
                </>
              );
            })()}
          </div>

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
                    <Label htmlFor="rating" className="text-base font-bold">
                      {t("entry.rating")}
                    </Label>
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
                    id="rating"
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

          <div className="space-y-2">
            <Label htmlFor="desc">{t("entry.description")}</Label>
            <Textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("entry.descPlaceholder")}
              rows={8}
              maxLength={2000}
              className="min-h-[180px] resize-y"
            />
            <p className="text-xs text-muted-foreground text-right font-mono">{description.length}/2000</p>
            <MediaUploader files={media} onChange={setMedia} max={10} disabled={submitting} />
          </div>
        </div>

        <div className="px-4 sm:px-6 py-3 border-t border-border/40 bg-background/95 backdrop-blur shrink-0">
          <Button
            onClick={() => setConfirmOpen(true)}
            disabled={submitting || !formatValid || description.trim().length < 10 || about.trim().length < 5 || about.trim().length > 30}
            className="w-full bg-gradient-to-r from-[hsl(285_85%_60%)] via-[hsl(330_85%_60%)] to-[hsl(25_95%_60%)] text-white border-0 hover:opacity-90"
          >
            {submitting ? t("entry.submitting") : t("entry.publish")}
          </Button>
        </div>
      </DialogContent>

      {/* Onay penceresi: hedef + kategori + about önizlemesi */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("entry.confirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("entry.confirmDesc")}</AlertDialogDescription>
          </AlertDialogHeader>

          <div className="rounded-md border border-border bg-muted/30 p-3 space-y-2 text-sm">
            <div className="flex items-start justify-between gap-3">
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-mono">
                {t("entry.confirmTargetLabel")}
              </span>
              <span className="font-mono font-semibold text-right break-all max-w-[70%]">
                {formatTargetPreview(target, category)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-mono">
                {t("entry.confirmCategoryLabel")}
              </span>
              <span className="font-semibold capitalize">{category}</span>
            </div>
            <div className="flex items-start justify-between gap-3">
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-mono">
                {t("entry.confirmAboutLabel")}
              </span>
              <span className="text-right max-w-[70%] break-words">
                {about.trim().length > 80 ? `${about.trim().slice(0, 80)}…` : about.trim()}
              </span>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>{t("entry.confirmCancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                setConfirmOpen(false);
                await submit();
              }}
              className="bg-gradient-to-r from-[hsl(285_85%_60%)] via-[hsl(330_85%_60%)] to-[hsl(25_95%_60%)] text-white border-0 hover:opacity-90"
            >
              {t("entry.confirmPublish")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};

export default AddEntryDialog;
