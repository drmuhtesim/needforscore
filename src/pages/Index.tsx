import { useState } from "react";
import { useTranslation } from "react-i18next";
import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";
import CategorySidebar, { type CategoryType } from "@/components/CategorySidebar";
import MobileCategoryBar from "@/components/MobileCategoryBar";
import ReportTable from "@/components/ReportTable";
import MobileBottomBar from "@/components/MobileBottomBar";
import { TrendingUp, Clock } from "lucide-react";

const Index = () => {
  const { t } = useTranslation();
  const [category, setCategory] = useState<CategoryType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState<string>("24h");

  const tfRaw = t("filters.timeFilters", { returnObjects: true });
  const timeFilters = Array.isArray(tfRaw) ? (tfRaw as string[]) : ["5m", "1h", "6h", "24h", "7d", "30d"];

  return (
    <div className="min-h-screen bg-background flex flex-col pb-14 lg:pb-0">
      <Header />

      {/* Hero — büyük motto + arama */}
      <div className="relative overflow-hidden border-b border-border px-4 py-10 sm:py-14 bg-gradient-to-b from-primary/10 via-background to-background">
        {/* Ambient glow blobs (pulsing) */}
        <div aria-hidden className="hero-pulse-glow pointer-events-none absolute -top-24 -left-16 h-72 w-72 rounded-full bg-primary/30 blur-3xl" />
        <div aria-hidden className="hero-pulse-glow pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-accent/30 blur-3xl" style={{ animationDelay: "1.2s" }} />
        <div aria-hidden className="hero-pulse-glow pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-40 w-[60%] rounded-full bg-warning/20 blur-3xl" style={{ animationDelay: "0.6s" }} />

        <div className="relative max-w-5xl mx-auto text-center space-y-5 sm:space-y-6">
          <h1 className="font-bold tracking-tight leading-none">
            <span className="hero-line hero-line-1 block hero-neon-vertical-wrap">
              <span className="hero-neon-vertical whitespace-nowrap block">
                {t("ticker.motto")}
              </span>
            </span>
            <span className="hero-line hero-line-2 block mt-4 text-base sm:text-2xl lg:text-3xl">
              <span className="hero-glow-accent">{t("ticker.mottoLine2")}</span>
            </span>
          </h1>
          <SearchBar onSearch={setSearchQuery} />
        </div>
      </div>


      {/* Main Content */}
      <div className="flex flex-1">
        <CategorySidebar active={category} onChange={setCategory} />

        <main className="flex-1 min-w-0">
          {/* Mobile horizontal category bar */}
          <MobileCategoryBar active={category} onChange={setCategory} />

          {/* Filters Bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">{t("filters.featured")}</span>
              <div className="flex items-center gap-1 ml-3">
                {timeFilters.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTimeFilter(t)}
                    className={`px-2.5 py-1 text-xs rounded font-mono transition-colors ${
                      timeFilter === t
                        ? "bg-primary/15 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t("filters.lastUpdate")}</span>
            </div>
          </div>

          {/* Table */}
          <ReportTable category={category} searchQuery={searchQuery} />
        </main>
      </div>
      <MobileBottomBar />
    </div>
  );
};

export default Index;
