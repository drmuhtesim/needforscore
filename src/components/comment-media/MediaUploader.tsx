import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ImagePlus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

export interface PendingFile {
  file: File;
  previewUrl: string;
}

interface Props {
  files: PendingFile[];
  onChange: (files: PendingFile[]) => void;
  max?: number;
  disabled?: boolean;
}

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024; // 5MB

const MediaUploader = ({ files, onChange, max = 10, disabled }: Props) => {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handlePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!selected.length) return;
    if (files.length + selected.length > max) {
      toast({ title: t("entry.mediaTooMany"), variant: "destructive" });
      return;
    }
    setBusy(true);
    const next: PendingFile[] = [...files];
    for (const f of selected) {
      if (!ALLOWED.includes(f.type)) continue;
      if (f.size > MAX_BYTES) {
        toast({ title: t("entry.mediaTooBig"), variant: "destructive" });
        continue;
      }
      next.push({ file: f, previewUrl: URL.createObjectURL(f) });
    }
    onChange(next);
    setBusy(false);
  };

  const remove = (idx: number) => {
    const copy = files.slice();
    URL.revokeObjectURL(copy[idx].previewUrl);
    copy.splice(idx, 1);
    onChange(copy);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || busy || files.length >= max}
        >
          {busy ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <ImagePlus className="h-4 w-4 mr-1" />}
          {t("entry.addMedia")} ({files.length}/{max})
        </Button>
        <span className="text-[11px] text-muted-foreground">{t("entry.mediaHelp")}</span>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={handlePick}
      />
      {files.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {files.map((f, i) => (
            <div key={i} className="relative group rounded-md overflow-hidden border border-border bg-muted/40 aspect-square">
              <img src={f.previewUrl} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute top-1 right-1 inline-flex items-center justify-center w-6 h-6 rounded-full bg-background/80 text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="remove"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MediaUploader;
