import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type Status = "safe" | "suspicious" | "danger";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  entryId: string;
  initial: { description: string; rating: number; status: Status };
}

const EditEntryDialog = ({ open, onOpenChange, entryId, initial }: Props) => {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [description, setDescription] = useState(initial.description);
  const [rating, setRating] = useState<number>(initial.rating);
  const [status, setStatus] = useState<Status>(initial.status);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setDescription(initial.description);
      setRating(initial.rating);
      setStatus(initial.status);
    }
  }, [open, initial]);

  const save = async () => {
    if (description.trim().length < 10) {
      toast({ title: t("entry.invalidInput"), variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("entries")
      .update({ description: description.trim(), rating, status })
      .eq("id", entryId);
    setSaving(false);
    if (error) {
      toast({ title: t("entry.failed"), description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: t("actions.updatedSuccess") });
    qc.invalidateQueries({ queryKey: ["entry", entryId] });
    qc.invalidateQueries({ queryKey: ["entries"] });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("actions.edit")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">{t("entry.status")}</Label>
            <div className="flex gap-2 mt-2">
              {(["safe", "suspicious", "danger"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`flex-1 px-3 py-2 rounded-md text-xs font-semibold uppercase border transition-colors ${
                    status === s
                      ? `border-${s === "safe" ? "safe" : s === "danger" ? "danger" : "suspicious"} bg-${s === "safe" ? "safe" : s === "danger" ? "danger" : "suspicious"}/10 text-${s === "safe" ? "safe" : s === "danger" ? "danger" : "suspicious"}`
                      : "border-border text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  {t(`status.${s}`)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">{t("entry.rating")}: {rating}/10</Label>
            <Input
              type="range"
              min={1}
              max={10}
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              className="mt-2"
            />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">{t("entry.description")}</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="mt-2"
              maxLength={4000}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>{t("actions.cancel")}</Button>
            <Button onClick={save} disabled={saving || description.trim().length < 10}>
              {saving ? "..." : t("actions.save")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditEntryDialog;
