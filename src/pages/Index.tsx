import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";
import CategorySidebar, { type CategoryType } from "@/components/CategorySidebar";
import MobileCategoryBar from "@/components/MobileCategoryBar";
import ReportTable from "@/components/ReportTable";
import MobileBottomBar from "@/components/MobileBottomBar";
import AddEntryDialog from "@/components/AddEntryDialog";
import { useAuth } from "@/contexts/AuthContext";
import { consumePendingAddEntry } from "@/lib/pendingAddEntry";
import { TrendingUp, Clock } from "lucide-react";
import SEO, { SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE } from "@/components/SEO";

const HOME_JSONLD = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/favicon.png`,
    sameAs: [],
    description:
      "Score (NeedForScore): Instagram, TikTok, X, telefon ve Score kullanıcılarına yönelik topluluk tabanlı puanlama ve dolandırıcılık ifşa platformu.",
  },
];

const Index = () => {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const [category, setCategory] = useState<CategoryType>("all");
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";
  const [searchQuery, setSearchQuery] = useState(initialQ);
  const [timeFilter, setTimeFilter] = useState<string>("24h");
  const [pendingTarget, setPendingTarget] = useState<string | null>(null);
  const [pendingCategory, setPendingCategory] = useState<Exclude<CategoryType, "all"> | undefined>(undefined);
  const [pendingOpen, setPendingOpen] = useState(false);

  // After signup/login, if there's a pending "add entry" intent, open the dialog
  // pre-filled with the original search query.
  useEffect(() => {
    if (loading || !user) return;
    const pending = consumePendingAddEntry();
    if (!pending) return;
    setPendingTarget(pending.target);
    setPendingCategory(pending.category as Exclude<CategoryType, "all"> | undefined);
    setPendingOpen(true);
  }, [user, loading]);

  // URL ?q= parametresi değişirse arama kutusunu senkronla (alt bardan gelirken)
  useEffect(() => {
    const q = searchParams.get("q") ?? "";
    setSearchQuery(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    if (q) setSearchParams({ q }, { replace: true });
    else setSearchParams({}, { replace: true });
  };

  const tfRaw = t("filters.timeFilters", { returnObjects: true });
  const timeFilters = Array.isArray(tfRaw) ? (tfRaw as string[]) : ["5m", "1h", "6h", "24h", "7d", "30d"];

  return (
    <div className="min-h-screen bg-background flex flex-col pb-14 lg:pb-0">
      <SEO
        title="Score — Dolandırıcılığa karşı topluluk puanlaması | NeedForScore"
        description="Instagram, TikTok, X, telefon ve Score kullanıcılarını puanla; dolandırıcıları ifşa et, güvenilir hesapları keşfet. Topluluk tabanlı OSINT platformu."
        canonical="/"
        image={DEFAULT_OG_IMAGE}
        jsonLd={HOME_JSONLD}
      />
      <Header />

      {pendingTarget && (
        <AddEntryDialog
          initialTarget={pendingTarget}
          initialCategory={pendingCategory}
          open={pendingOpen}
          onOpenChange={(o) => {
            setPendingOpen(o);
            if (!o) setPendingTarget(null);
          }}
        />
      )}

      {/* Hero — kompakt motto + arama */}
      <div className="relative overflow-hidden border-b border-border px-4 py-5 sm:py-7 bg-gradient-to-b from-primary/10 via-background to-background">
        {/* Ambient glow blobs (pulsing) */}
        <div aria-hidden className="hero-pulse-glow pointer-events-none absolute -top-16 -left-10 h-44 w-44 rounded-full bg-primary/25 blur-3xl" />
        <div aria-hidden className="hero-pulse-glow pointer-events-none absolute -bottom-16 -right-10 h-44 w-44 rounded-full bg-accent/25 blur-3xl" style={{ animationDelay: "1.2s" }} />

        <div className="relative max-w-3xl mx-auto text-center space-y-3 sm:space-y-4">
          <h1 className="font-bold tracking-tight leading-tight space-y-1">
            <span className="hero-line hero-line-1 block text-base sm:text-xl md:text-2xl text-foreground">
              {t("ticker.motto")}
            </span>
            <span className="hero-line hero-line-2 block text-sm sm:text-base md:text-lg hero-glow-accent">
              {t("ticker.mottoLine2")}
            </span>
          </h1>
          <SearchBar value={searchQuery} onSearch={handleSearch} />
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
