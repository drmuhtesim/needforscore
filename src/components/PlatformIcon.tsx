import { Instagram, Phone, Globe2 } from "lucide-react";
import type { CategoryType } from "./CategorySidebar";
import scoreIcon from "@/assets/score-icon.jpeg";

interface Props {
  category: CategoryType;
  className?: string;
  withBg?: boolean;
}

const XIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z"/>
  </svg>
);

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.69a8.16 8.16 0 0 0 4.77 1.52V6.78a4.85 4.85 0 0 1-1.84-.09Z"/>
  </svg>
);

const meta: Record<Exclude<CategoryType, "score">, { Icon: any; color: string; bg: string }> = {
  all: { Icon: Globe2, color: "text-muted-foreground", bg: "bg-muted/40" },
  instagram: { Icon: Instagram, color: "text-[hsl(330_85%_60%)]", bg: "bg-[hsl(330_85%_60%/0.12)]" },
  tiktok: { Icon: TikTokIcon, color: "text-foreground", bg: "bg-foreground/10" },
  twitter: { Icon: XIcon, color: "text-foreground", bg: "bg-foreground/10" },
  phone: { Icon: Phone, color: "text-[hsl(145_70%_55%)]", bg: "bg-[hsl(145_70%_55%/0.12)]" },
};

const PlatformIcon = ({ category, className = "h-5 w-5", withBg = false }: Props) => {
  if (category === "score") {
    if (withBg) {
      return (
        <span className="inline-flex items-center justify-center rounded-md p-0.5 bg-[hsl(285_85%_60%/0.12)]">
          <img src={scoreIcon} alt="Score" className={`${className} rounded-md object-cover`} />
        </span>
      );
    }
    return <img src={scoreIcon} alt="Score" className={`${className} rounded-md object-cover`} />;
  }

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
