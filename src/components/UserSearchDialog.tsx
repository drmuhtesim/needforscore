import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { looksLikeUrl } from "@/lib/socialUrlParser";
import { resolveSocialUrl } from "@/lib/resolveSocialUrl";
import { categoryToSegment } from "@/lib/entitySlugs";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const UserSearchDialog = ({ open, onOpenChange }: Props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    if (!open) { setQ(""); setResolving(false); }
  }, [open]);

  const handleSocialUrl = async (raw: string): Promise<boolean> => {
    if (!looksLikeUrl(raw)) return false;
    setResolving(true);
    try {
      const { result } = await resolveSocialUrl(raw);
      if (!result || !result.username) {
        toast({ title: t("search.parseError") as string, variant: "destructive" });
        return true;
      }
      onOpenChange(false);
      if (result.category) {
        const seg = categoryToSegment[result.category];
        navigate(`/?q=${encodeURIComponent(result.username)}&cat=${seg}`);
      } else {
        navigate(`/?q=${encodeURIComponent(result.username)}`);
      }
      return true;
    } finally {
      setResolving(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;
    if (await handleSocialUrl(term)) return;
    onOpenChange(false);
    navigate(`/?q=${encodeURIComponent(term)}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("search.button")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              autoFocus
              inputMode="url"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onPaste={(e) => {
                const pasted = e.clipboardData.getData("text").trim();
                if (!pasted || !looksLikeUrl(pasted)) return;
                e.preventDefault();
                setQ(pasted);
                setTimeout(() => { void handleSocialUrl(pasted); }, 0);
              }}
              placeholder={t("search.placeholder") as string}
              className="pl-9 font-mono"
            />
            {resolving && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
          <button
            type="submit"
            disabled={resolving}
            className="w-full inline-flex items-center justify-center px-5 py-2.5 text-sm font-bold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {t("search.button")}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UserSearchDialog;
