import { Globe2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import PlatformIcon from "./PlatformIcon";

export type CategoryType = "all" | "score" | "instagram" | "tiktok" | "twitter" | "phone" | "email" | "website";

interface CategorySidebarProps {
  active: CategoryType;
  onChange: (cat: CategoryType) => void;
}

const categories: CategoryType[] = ["all", "score", "instagram", "tiktok", "twitter", "phone", "email", "website"];

const CategorySidebar = ({ active, onChange }: CategorySidebarProps) => {
  const { t } = useTranslation();

  return (
    <aside className="w-56 flex-shrink-0 border-r border-border bg-card/50 hidden lg:block">
      {/* sticky: header (h-14 = 3.5rem) altında sabit, kendi içinde gerekirse scroll yapar */}
      <div className="sticky top-14 max-h-[calc(100vh-3.5rem)] overflow-y-auto p-4">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          {t("categories.title")}
        </h3>
        <nav className="space-y-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onChange(cat)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all ${
                active === cat
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              {cat === "all" ? <Globe2 className="h-5 w-5" /> : <PlatformIcon category={cat} />}
              <span className="flex-1 text-left">{t(`categories.${cat}`)}</span>
            </button>
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default CategorySidebar;
