import { Instagram, Globe, Phone, Mail, Twitter, Video } from "lucide-react";

export type CategoryType = "all" | "instagram" | "tiktok" | "twitter" | "phone" | "email" | "website";

interface CategorySidebarProps {
  active: CategoryType;
  onChange: (cat: CategoryType) => void;
}

const categories: { id: CategoryType; label: string; icon: React.ReactNode; count: number }[] = [
  { id: "all", label: "Tümü", icon: <Globe className="h-4 w-4" />, count: 2847 },
  { id: "instagram", label: "Instagram", icon: <Instagram className="h-4 w-4" />, count: 892 },
  { id: "tiktok", label: "TikTok", icon: <Video className="h-4 w-4" />, count: 631 },
  { id: "twitter", label: "X (Twitter)", icon: <Twitter className="h-4 w-4" />, count: 445 },
  { id: "phone", label: "Telefon", icon: <Phone className="h-4 w-4" />, count: 389 },
  { id: "email", label: "E-posta", icon: <Mail className="h-4 w-4" />, count: 312 },
  { id: "website", label: "Web Sitesi", icon: <Globe className="h-4 w-4" />, count: 178 },
];

const CategorySidebar = ({ active, onChange }: CategorySidebarProps) => {
  return (
    <aside className="w-56 flex-shrink-0 border-r border-border bg-card/50 hidden lg:block">
      <div className="p-4">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Kategoriler</h3>
        <nav className="space-y-1">
          {categories.map((cat) => (
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
              <span className="flex-1 text-left">{cat.label}</span>
              <span className={`text-xs font-mono ${active === cat.id ? "text-primary" : "text-muted-foreground/60"}`}>
                {cat.count.toLocaleString()}
              </span>
            </button>
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default CategorySidebar;
