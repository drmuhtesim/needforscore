import { useState } from "react";
import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";
import CategorySidebar, { type CategoryType } from "@/components/CategorySidebar";
import ReportTable from "@/components/ReportTable";
import StatsBar from "@/components/StatsBar";
import { Shield, TrendingUp, Clock } from "lucide-react";

const Index = () => {
  const [category, setCategory] = useState<CategoryType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState<string>("24h");

  const timeFilters = ["5D", "1S", "6S", "24S", "7G", "30G"];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      {/* Ticker Bar */}
      <div className="border-b border-border bg-card/30 overflow-hidden">
        <div className="flex items-center gap-6 px-4 py-2 text-xs animate-marquee whitespace-nowrap">
          <span className="text-danger">🚨 @sahtemagaza_tr - 142 rapor</span>
          <span className="text-muted-foreground">•</span>
          <span className="text-danger">⚠️ 05XX 123 45 67 - Banka dolandırıcılığı</span>
          <span className="text-muted-foreground">•</span>
          <span className="text-safe">✅ @guvenilir_satis - Güvenli onay</span>
          <span className="text-muted-foreground">•</span>
          <span className="text-danger">🚨 info@kampanya-ozel.com - 567 rapor</span>
          <span className="text-muted-foreground">•</span>
          <span className="text-suspicious">⚡ @xtrader_signals - Şüpheli</span>
        </div>
      </div>

      {/* Hero Search */}
      <div className="px-4 py-10 lg:py-14 border-b border-border">
        <div className="max-w-3xl mx-auto text-center space-y-5">
          <div className="flex items-center justify-center gap-2 text-primary">
            <Shield className="h-5 w-5 animate-pulse-glow" />
            <span className="text-xs font-mono uppercase tracking-widest">Kullanıcı Deneyimi Odaklı OSINT</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">
            İşlem yapmadan önce{" "}
            <span className="text-primary glow-text-green">araştır</span>
          </h1>
          <p className="text-muted-foreground text-sm max-w-lg mx-auto">
            Sosyal medya hesapları, telefon numaraları, e-postalar ve web siteleri hakkında
            topluluk deneyimlerini keşfedin. Dolandırıcılıklara karşı korunun.
          </p>
          <SearchBar onSearch={setSearchQuery} />
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 lg:px-6 py-4 border-b border-border">
        <StatsBar />
      </div>

      {/* Main Content */}
      <div className="flex flex-1">
        <CategorySidebar active={category} onChange={setCategory} />

        <main className="flex-1 min-w-0">
          {/* Filters Bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Trend Raporlar</span>
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
              <span className="hidden sm:inline">Son güncelleme: az önce</span>
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
