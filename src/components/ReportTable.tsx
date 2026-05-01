import { useMemo, useState, useEffect } from "react";
import { Shield, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import type { CategoryType } from "./CategorySidebar";
import { useEntries } from "@/hooks/useEntries";
import EntryCard from "./EntryCard";
import Pagination from "./Pagination";
import AddEntryDialog from "./AddEntryDialog";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ReportTableProps {
  category: CategoryType;
  searchQuery: string;
}

const PAGE_SIZE = 25;
const AUTO_OPEN_DELAY_MS = 700;

const ReportTable = ({ category, searchQuery }: ReportTableProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: entries = [], isLoading } = useEntries(category, searchQuery);
  const [page, setPage] = useState(1);
  const [ctaOpen, setCtaOpen] = useState(false);
  const [signupPromptOpen, setSignupPromptOpen] = useState(false);
  const [notFoundPromptOpen, setNotFoundPromptOpen] = useState(false);
  // Track which queries we've already auto-opened for, so we don't re-prompt
  // every time the user closes the dialog or re-renders happen.
  const [autoOpenedFor, setAutoOpenedFor] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [category, searchQuery, entries.length]);

  const pageCount = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
  const paged = useMemo(
    () => entries.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [entries, page]
  );

  const trimmedQuery = searchQuery.trim();
  const showSearchEmptyCta = !isLoading && entries.length === 0 && trimmedQuery.length > 0;

  // Heuristic: if search looks numeric/+ → phone, otherwise default instagram
  const guessedCategory = useMemo<Exclude<CategoryType, "all">>(() => {
    if (category !== "all") return category as Exclude<CategoryType, "all">;
    const q = trimmedQuery;
    if (/^[+\d\s\-()]+$/.test(q) && q.replace(/\D/g, "").length >= 7) return "phone";
    return "instagram";
  }, [category, trimmedQuery]);

  // Auto-open the neutral "not found" prompt first
  useEffect(() => {
    if (!showSearchEmptyCta) return;
    if (autoOpenedFor === trimmedQuery) return;
    const timer = setTimeout(() => {
      setAutoOpenedFor(trimmedQuery);
      setNotFoundPromptOpen(true);
    }, AUTO_OPEN_DELAY_MS);
    return () => clearTimeout(timer);
  }, [showSearchEmptyCta, trimmedQuery, autoOpenedFor]);

  const handleNotFoundYes = () => {
    setNotFoundPromptOpen(false);
    if (user) {
      setCtaOpen(true);
    } else {
      setSignupPromptOpen(true);
    }
  };

  // Reset auto-open tracking when query changes
  useEffect(() => {
    setAutoOpenedFor(null);
  }, [trimmedQuery, category]);

  return (
    <div className="px-3 sm:px-4 py-3">
      {/* Sütun başlıkları — sadece desktop */}
      <div className="hidden sm:grid grid-cols-[auto_1fr_auto_auto_auto] gap-3 px-3 pb-2 text-[10px] uppercase tracking-wider text-muted-foreground font-mono border-b border-border/60">
        <span className="w-[88px]">{t("table.target")}</span>
        <span />
        <span className="min-w-[68px] text-right pr-2">{t("table.rating")}</span>
        <span className="min-w-[52px] text-center">{t("table.comments")}</span>
        <span className="min-w-[80px] text-center">{t("table.votes")}</span>
      </div>

      <div className="flex flex-col gap-2 mt-2">
        {paged.map((e, i) => (
          <EntryCard key={e.id} entry={e} index={(page - 1) * PAGE_SIZE + i} />
        ))}
      </div>

      {showSearchEmptyCta && (
        <div className="my-6 mx-auto max-w-xl rounded-xl border border-primary/30 bg-gradient-to-b from-primary/10 via-card to-card p-6 text-center shadow-sm">
          <div className="mx-auto mb-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-foreground">
            {t("table.emptySearchTitle", { query: trimmedQuery })}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("table.emptySearchDesc")}
          </p>
          <div className="mt-4 flex items-center justify-center">
            {user ? (
              <AddEntryDialog
                initialTarget={trimmedQuery}
                initialCategory={guessedCategory}
                open={ctaOpen}
                onOpenChange={setCtaOpen}
                trigger={
                  <button
                    type="button"
                    className="inline-flex items-center px-5 py-2.5 text-sm font-bold rounded-md text-white bg-gradient-to-r from-[hsl(285_85%_60%)] via-[hsl(330_85%_60%)] to-[hsl(25_95%_60%)] shadow-md hover:opacity-90 transition-opacity"
                  >
                    {t("table.emptySearchCtaAuth")}
                  </button>
                }
              />
            ) : (
              <button
                type="button"
                onClick={() => setSignupPromptOpen(true)}
                className="inline-flex items-center px-5 py-2.5 text-sm font-bold rounded-md text-white bg-gradient-to-r from-[hsl(285_85%_60%)] via-[hsl(330_85%_60%)] to-[hsl(25_95%_60%)] shadow-md hover:opacity-90 transition-opacity"
              >
                {t("table.emptySearchCtaAnon")}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Anonim kullanıcı için üye ol diyaloğu */}
      <Dialog open={signupPromptOpen} onOpenChange={setSignupPromptOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {t("table.signupPromptTitle")}
            </DialogTitle>
            <DialogDescription>
              {t("table.signupPromptDesc", { query: trimmedQuery })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <button
              type="button"
              onClick={() => setSignupPromptOpen(false)}
              className="inline-flex items-center justify-center px-4 py-2 text-sm rounded-md border border-border text-muted-foreground hover:bg-secondary"
            >
              {t("table.signupPromptCancel")}
            </button>
            <Link
              to="/auth?mode=signup"
              className="inline-flex items-center justify-center px-5 py-2 text-sm font-bold rounded-md text-white bg-gradient-to-r from-[hsl(285_85%_60%)] via-[hsl(330_85%_60%)] to-[hsl(25_95%_60%)] shadow-md hover:opacity-90 transition-opacity"
            >
              {t("table.signupPromptCta")}
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {!isLoading && entries.length === 0 && !trimmedQuery && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Shield className="h-12 w-12 mb-3 opacity-30" />
          <p className="text-sm">{t("table.noResults")}</p>
        </div>
      )}
      {isLoading && (
        <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
          {t("table.loading")}
        </div>
      )}
      <Pagination page={page} pageCount={pageCount} onChange={setPage} />
    </div>
  );
};

export default ReportTable;
