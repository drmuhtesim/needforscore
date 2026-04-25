import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Plus, ShieldAlert, ShieldCheck, ShieldQuestion } from "lucide-react";
import { z } from "zod";
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
type Status = "safe" | "suspicious" | "danger";

const categories: Cat[] = ["instagram", "tiktok", "twitter", "phone", "email", "website"];
const statuses: Status[] = ["safe", "suspicious", "danger"];

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
  const [status, setStatus] = useState<Status>("suspicious");
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
    setStatus("suspicious");
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
    const { data, error } = await supabase
      .from("entries")
      .insert({
        user_id: user.id,
        target: cleanTarget(target),
        target_normalized: normalizeTarget(target, category),
        category,
        status,
        description: description.trim(),
        rating,
      })
      .select("id")
      .single();
    setSubmitting(false);
    if (error) {
      const isDuplicate =
        (error as any)?.code === "23505" ||
        /duplicate key|unique constraint|entries_target_normalized_unique_active/i.test(error.message ?? "");
      toast({
        title: isDuplicate ? t("entry.duplicateTitle") : t("entry.failed"),
        description: isDuplicate ? t("entry.duplicateDesc") : error.message,
        variant: "destructive",
      });
      return;
    }
    toast({ title: t("entry.created") });
    qc.invalidateQueries({ queryKey: ["entries"] });
    setOpen(false);
    reset();
    if (data?.id) navigate(`/e/${data.id}`);
  };

  const statusMeta = {
    safe: { Icon: ShieldCheck, color: "text-safe", bg: "bg-safe/10 border-safe/40" },
    suspicious: { Icon: ShieldQuestion, color: "text-suspicious", bg: "bg-suspicious/10 border-suspicious/40" },
    danger: { Icon: ShieldAlert, color: "text-danger", bg: "bg-danger/10 border-danger/40" },
  } as const;

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" className="gap-1.5">
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
          {/* Category */}
          <div className="space-y-2">
            <Label>{t("entry.category")}</Label>
            <div className="grid grid-cols-3 gap-2">
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`flex items-center gap-2 px-2.5 py-2 rounded-md border text-xs transition-colors ${
                    category === c ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  <PlatformIcon category={c} className="h-3.5 w-3.5" />
                  {t(`categories.${c}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Target */}
          <div className="space-y-2">
            <Label htmlFor="target">{t("entry.target")}</Label>
            <Input
              id="target"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder={t(`entry.placeholder.${category}`)}
              className="font-mono"
            />
            {target.trim() && (
              <div className="text-xs">
                {formatValid ? (
                  <div className="flex items-center justify-between text-safe">
                    <span>✓ {t("entry.formatOk")}</span>
                    {profileUrl && (
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
                  <span className="text-danger">✗ {t("entry.formatBad")}</span>
                )}
              </div>
            )}
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>{t("entry.status")}</Label>
            <div className="grid grid-cols-3 gap-2">
              {statuses.map((s) => {
                const m = statusMeta[s];
                const active = status === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-md border text-xs font-medium transition-all ${
                      active ? `${m.bg} ${m.color}` : "border-border text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    <m.Icon className="h-3.5 w-3.5" />
                    {t(`status.${s}`)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rating */}
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

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="desc">{t("entry.description")}</Label>
            <Textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("entry.descPlaceholder")}
              rows={4}
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground text-right font-mono">{description.length}/2000</p>
          </div>

          <Button onClick={submit} disabled={submitting || !formatValid || description.trim().length < 10} className="w-full">
            {submitting ? t("entry.submitting") : t("entry.publish")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddEntryDialog;
