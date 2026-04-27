import { Globe2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import PlatformIcon from "./PlatformIcon";
import type { CategoryType } from "./CategorySidebar";

interface Props {
  active: CategoryType;
  onChange: (cat: CategoryType) => void;
}

const categories: CategoryType[] = ["all", "score", "instagram", "tiktok", "twitter", "phone", "email", "website"];

const MobileCategoryBar = ({ active, onChange }: Props) => {
  const { t } = useTranslation();

  return (
    <div className="lg:hidden border-b border-border bg-card/50">
      <div className="flex items-center gap-1 overflow-x-auto px-2 py-2 scrollbar-none">
        {categories.map((cat) => {
          const isActive = active === cat;
          return (
            <button
              key={cat}
              onClick={() => onChange(cat)}
              aria-label={t(`categories.${cat}`)}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] px-2 py-1.5 rounded-md flex-shrink-0 transition-all ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              {cat === "all" ? <Globe2 className="h-5 w-5" /> : <PlatformIcon category={cat} />}
              <span className="text-[10px] leading-none font-medium">{t(`categories.${cat}`)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MobileCategoryBar;
