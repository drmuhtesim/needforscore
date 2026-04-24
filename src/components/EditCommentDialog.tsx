import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  commentId: string;
  entryId: string;
  initialContent: string;
}

const EditCommentDialog = ({ open, onOpenChange, commentId, entryId, initialContent }: Props) => {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setContent(initialContent);
  }, [open, initialContent]);

  const save = async () => {
    if (content.trim().length < 1) return;
    setSaving(true);
    const { error } = await supabase
      .from("comments")
      .update({ content: content.trim() })
      .eq("id", commentId);
    setSaving(false);
    if (error) {
      toast({ title: t("entry.failed"), description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: t("actions.updatedSuccess") });
    qc.invalidateQueries({ queryKey: ["comments", entryId] });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("actions.edit")}</DialogTitle>
        </DialogHeader>
        <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={6} maxLength={2000} />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("actions.cancel")}</Button>
          <Button onClick={save} disabled={saving || content.trim().length < 1}>
            {saving ? "..." : t("actions.save")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditCommentDialog;
