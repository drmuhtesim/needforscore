import { Instagram, Twitter, Music2, Phone, Mail, Globe, Globe2, Eye } from "lucide-react";
import type { CategoryType } from "./CategorySidebar";

interface Props {
  category: CategoryType;
  className?: string;
  /** Render with brand color background tint (rounded). */
  withBg?: boolean;
}

const meta: Record<CategoryType, { Icon: any; color: string; bg: string }> = {
  all: { Icon: Globe2, color: "text-muted-foreground", bg: "bg-muted/40" },
  score: { Icon: Eye, color: "text-[hsl(285_85%_65%)]", bg: "bg-[hsl(285_85%_65%/0.14)]" },
  instagram: { Icon: Instagram, color: "text-[hsl(330_85%_60%)]", bg: "bg-[hsl(330_85%_60%/0.12)]" },
  tiktok: { Icon: Music2, color: "text-[hsl(180_85%_55%)]", bg: "bg-[hsl(180_85%_55%/0.12)]" },
  twitter: { Icon: Twitter, color: "text-[hsl(210_15%_85%)]", bg: "bg-[hsl(210_15%_85%/0.1)]" },
  phone: { Icon: Phone, color: "text-[hsl(145_70%_55%)]", bg: "bg-[hsl(145_70%_55%/0.12)]" },
  email: { Icon: Mail, color: "text-[hsl(210_85%_60%)]", bg: "bg-[hsl(210_85%_60%/0.12)]" },
  website: { Icon: Globe, color: "text-[hsl(35_90%_60%)]", bg: "bg-[hsl(35_90%_60%/0.12)]" },
};

const PlatformIcon = ({ category, className = "h-4 w-4", withBg = false }: Props) => {
  const { Icon, color, bg } = meta[category];
  if (withBg) {
    return (
      <span className={`inline-flex items-center justify-center rounded-md p-1.5 ${bg}`}>
        <Icon className={`${className} ${color}`} />
      </span>
    );
  }
  return <Icon className={`${className} ${color}`} />;
};

export default PlatformIcon;
