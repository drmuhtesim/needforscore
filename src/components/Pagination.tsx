import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  page: number; // 1-indexed
  pageCount: number;
  onChange: (page: number) => void;
}

const Pagination = ({ page, pageCount, onChange }: Props) => {
  const { t } = useTranslation();
  if (pageCount <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 py-6">
      <Button
        size="sm"
        variant="outline"
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        {t("entry.prev")}
      </Button>
      <span className="text-xs font-mono text-muted-foreground">
        {t("entry.page")} {page} {t("entry.of")} {pageCount}
      </span>
      <Button
        size="sm"
        variant="outline"
        onClick={() => onChange(Math.min(pageCount, page + 1))}
        disabled={page === pageCount}
      >
        {t("entry.next")}
        <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );
};

export default Pagination;
