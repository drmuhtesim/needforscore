import { useTranslation } from "react-i18next";
import { Languages } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();
  const current = i18n.language?.startsWith("en") ? "en" : "tr";

  const change = (lng: "tr" | "en") => {
    i18n.changeLanguage(lng);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="inline-flex items-center gap-1.5 px-2.5 py-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors text-xs font-semibold uppercase"
          aria-label={t("language.label")}
        >
          <Languages className="h-4 w-4" />
          <span>{current}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        <DropdownMenuItem onClick={() => change("tr")} className={current === "tr" ? "bg-secondary" : ""}>
          🇹🇷 {t("language.tr")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => change("en")} className={current === "en" ? "bg-secondary" : ""}>
          🇬🇧 {t("language.en")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
