import { useState } from "react";
import { useTranslation } from "react-i18next";
import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";
import CategorySidebar, { type CategoryType } from "@/components/CategorySidebar";
import ReportTable from "@/components/ReportTable";
import { TrendingUp, Clock } from "lucide-react";

const Index = () => {
  const { t } = useTranslation();
  const [category, setCategory] = useState<CategoryType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState<string>("24h");

  const tfRaw = t("filters.timeFilters", { returnObjects: true });
  const timeFilters = Array.isArray(tfRaw) ? (tfRaw as string[]) : ["5m", "1h", "6h", "24h", "7d", "30d"];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      {/* Ticker Bar */}
      <div className="border-b border-border bg-card/30 overflow-hidden">
        <div className="flex items-center gap-6 px-4 py-2 text-xs animate-marquee whitespace-nowrap">
          <span className="text-danger">⚠️ {t("ticker.bankFraud")}</span>
          <span className="text-muted-foreground">•</span>
          <span className="text-safe">✅ {t("ticker.safeApproved")}</span>
          <span className="text-muted-foreground">•</span>
          <span className="text-danger">🚨 {t("ticker.phishing")}</span>
          <span className="text-muted-foreground">•</span>
          <span className="text-suspicious">⚡ {t("ticker.suspicious")}</span>
        </div>
      </div>

      {/* Hero Search */}
      <div className="px-4 py-10 lg:py-14 border-b border-border">
        <div className="max-w-3xl mx-auto text-center space-y-5">
          <SearchBar onSearch={setSearchQuery} />
        </div>
      </div>


      {/* Main Content */}
      <div className="flex flex-1">
        <CategorySidebar active={category} onChange={setCategory} />

        <main className="flex-1 min-w-0">
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
    </div>
  );
};

export default Index;
