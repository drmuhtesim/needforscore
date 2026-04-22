import { Instagram, Globe, Phone, Mail, Twitter, Video } from "lucide-react";
import { useTranslation } from "react-i18next";

export type CategoryType = "all" | "instagram" | "tiktok" | "twitter" | "phone" | "email" | "website";

interface CategorySidebarProps {
  active: CategoryType;
  onChange: (cat: CategoryType) => void;
}

const categoryMeta: { id: CategoryType; key: string; icon: React.ReactNode; count: number }[] = [
  { id: "all", key: "all", icon: <Globe className="h-4 w-4" />, count: 2847 },
  { id: "instagram", key: "instagram", icon: <Instagram className="h-4 w-4" />, count: 892 },
  { id: "tiktok", key: "tiktok", icon: <Video className="h-4 w-4" />, count: 631 },
  { id: "twitter", key: "twitter", icon: <Twitter className="h-4 w-4" />, count: 445 },
  { id: "phone", key: "phone", icon: <Phone className="h-4 w-4" />, count: 389 },
  { id: "email", key: "email", icon: <Mail className="h-4 w-4" />, count: 312 },
  { id: "website", key: "website", icon: <Globe className="h-4 w-4" />, count: 178 },
];

const CategorySidebar = ({ active, onChange }: CategorySidebarProps) => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith("en") ? "en-US" : "tr-TR";

  return (
    <aside className="w-56 flex-shrink-0 border-r border-border bg-card/50 hidden lg:block">
      <div className="p-4">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          {t("categories.title")}
        </h3>
        <nav className="space-y-1">
          {categoryMeta.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onChange(cat.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all ${
                active === cat.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              {cat.icon}
              <span className="flex-1 text-left">{t(`categories.${cat.key}`)}</span>
              <span className={`text-xs font-mono ${active === cat.id ? "text-primary" : "text-muted-foreground/60"}`}>
                {cat.count.toLocaleString(locale)}
              </span>
            </button>
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default CategorySidebar;
