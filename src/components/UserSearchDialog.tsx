import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

/**
 * Mobil alt bardan açılan arama diyaloğu.
 * Üstteki SearchBar ile aynı davranır: sorguyu ana sayfaya yönlendirir,
 * orada tüm başlıklar içinde arama yapılır ve sonuç bulunamazsa
 * "bununla ilgili bir sonuç bulunamadı" CTA'sı gösterilir.
 */
const UserSearchDialog = ({ open, onOpenChange }: Props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;
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
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("search.placeholder") as string}
              className="pl-9 font-mono"
            />
          </div>
          <button
            type="submit"
            className="w-full inline-flex items-center justify-center px-5 py-2.5 text-sm font-bold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {t("search.button")}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UserSearchDialog;
