import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import PlatformIcon from "./PlatformIcon";
import type { CategoryType } from "./CategorySidebar";
import { buildProfileUrl, cleanTarget, normalizeTarget, validateTarget } from "@/lib/platforms";

type Cat = Exclude<CategoryType, "all">;

// Order requested: instagram, tiktok, x, score, phone
const categories: Cat[] = ["instagram", "tiktok", "twitter", "score", "phone"];

interface AddEntryDialogProps {
  trigger?: React.ReactNode;
}

const AddEntryDialog = ({ trigger }: AddEntryDialogProps = {}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<Cat>("instagram");
  const [target, setTarget] = useState("");
  const [rating, setRating] = useState(5);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleOpen = (next: boolean) => {
    if (next && !user) {
      navigate("/auth?mode=signin");
      return;
    }
    setOpen(next);
  };

  const formatValid = target.trim() ? validateTarget(target, category) : false;
  const profileUrl = formatValid ? buildProfileUrl(target, category) : null;

  const reset = () => {
    setCategory("instagram");
    setTarget("");
    setRating(5);
    setDescription("");
  };

  const submit = async () => {
    if (!user) return;
    const schema = z.object({
      target: z.string().trim().min(1).max(200),
      description: z.string().trim().min(10).max(2000),
      rating: z.number().int().min(1).max(10),
    });
    const parsed = schema.safeParse({ target, description, rating });
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

    const cleanedTarget = category === "phone" ? target : cleanTarget(target).toLowerCase();

    const { data, error } = await supabase
      .from("entries")
      .insert({
        user_id: user.id,
        target: cleanedTarget,
        target_normalized: normalized,
        category: category as any,
        description: description.trim(),
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
      const firstComment = `${description.trim()}\n\n${rating}/10`;
      await supabase.from("comments").insert({
        entry_id: data.id,
        user_id: user.id,
        content: firstComment,
        is_target_response: false,
      });
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("entry.addTitle")}</DialogTitle>
          <DialogDescription>{t("entry.addDesc")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
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
            <div className="flex items-center justify-between">
              <Label htmlFor="rating">{t("entry.rating")}</Label>
              <span className="text-sm font-mono text-primary">{rating}/10</span>
            </div>
            <input
              id="rating"
              type="range"
              min={1}
              max={10}
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>

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
          </div>

          <Button
            onClick={submit}
            disabled={submitting || !formatValid || description.trim().length < 10}
            className="w-full bg-gradient-to-r from-[hsl(285_85%_60%)] via-[hsl(330_85%_60%)] to-[hsl(25_95%_60%)] text-white border-0 hover:opacity-90"
          >
            {submitting ? t("entry.submitting") : t("entry.publish")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddEntryDialog;
