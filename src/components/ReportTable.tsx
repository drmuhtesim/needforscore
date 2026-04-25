import { useMemo, useState, useEffect } from "react";
import { Shield } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { CategoryType } from "./CategorySidebar";
import { useEntries } from "@/hooks/useEntries";
import EntryRow from "./EntryRow";
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

  // Reset to page 1 whenever the underlying list changes shape
  useEffect(() => {
    setPage(1);
  }, [category, searchQuery, entries.length]);

  const pageCount = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
  const paged = useMemo(
    () => entries.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [entries, page]
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
            <th className="text-left py-3 px-4 font-semibold">{t("table.target")}</th>
            <th className="text-left py-3 px-4 font-semibold">{t("table.status")}</th>
            <th className="text-center py-3 px-4 font-semibold hidden sm:table-cell">{t("table.rating")}</th>
            <th className="text-center py-3 px-4 font-semibold hidden md:table-cell">{t("table.votes")}</th>
            <th className="text-center py-3 px-4 font-semibold hidden md:table-cell">{t("table.comments")}</th>
          </tr>
        </thead>
        <tbody>
          {paged.map((e, i) => (
            <EntryRow key={e.id} entry={e} index={(page - 1) * PAGE_SIZE + i} />
          ))}
        </tbody>
      </table>
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
