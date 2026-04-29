import { useMemo, useState, useEffect } from "react";
import { Shield } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { CategoryType } from "./CategorySidebar";
import { useEntries } from "@/hooks/useEntries";
import EntryCard from "./EntryCard";
import Pagination from "./Pagination";

interface ReportTableProps {
  category: CategoryType;
  searchQuery: string;
}

const PAGE_SIZE = 25;

const ReportTable = ({ category, searchQuery }: ReportTableProps) => {
  const { t } = useTranslation();
  const { data: entries = [], isLoading } = useEntries(category, searchQuery);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [category, searchQuery, entries.length]);

  const pageCount = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
  const paged = useMemo(
    () => entries.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [entries, page]
  );

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

      {!isLoading && entries.length === 0 && (
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
