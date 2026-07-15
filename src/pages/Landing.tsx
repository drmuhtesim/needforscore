import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Rocket,
  ShieldCheck,
  Users,
  Sparkles,
  Search,
  MessageSquare,
  Globe2,
  ArrowRight,
  FileText,
  Map as MapIcon,
  Coins,
  HelpCircle,
  Twitter,
  Github,
  Send,
  Menu,
  X,
  AlertTriangle,
  Instagram,
  Phone,
  Layers,
  Scale,
  Fingerprint,
  Zap,
  Camera,
  Star,
  CheckCircle2,
} from "lucide-react";
import { useState, FormEvent } from "react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import SEO, { SITE_URL, DEFAULT_OG_IMAGE } from "@/components/SEO";
import scoreLogo from "@/assets/score-logo.jpeg";

// Inline EN/TR strings keep the landing self-contained and independent of the
// app's translation namespace.
const COPY = {
  en: {
    nav: { mission: "Mission", why: "Why", how: "How", token: "$SCORE", roadmap: "Roadmap", faq: "FAQ" },
    launch: "Launch App",
    heroTag: "The trust layer for the social internet",
    heroTitle: "Expose scams. Reward trust. Own the signal.",
    heroSub:
      "NeedForScore is a community-run reputation network for Instagram, TikTok, X, phone numbers and $SCORE profiles. Search any identity in seconds. Share your experience in 30. Make the internet safer — together.",
    searchPlaceholder: "Search @username or a phone number",
    searchCta: "Search identity",
    heroCta: "Launch App",
    heroCta2: "Share your experience",
    heroCta3: "Read the Whitepaper",

    // Section 1 — Why NeedForScore is needed
    problemKicker: "01 · The problem",
    problemTitle: "Why NeedForScore has to exist",
    problemLead:
      "Billions of people interact daily with social handles and phone numbers they cannot verify. That trust gap has real consequences.",
    problemStats: [
      { k: "$1T+", label: "in global online fraud losses" },
      { k: "#1", label: "Instagram, most-abused platform for fake clinics & impersonation" },
      { k: "TR · IN · BR", label: "Phone fraud is the top scam type in emerging markets" },
      { k: "0", label: "Tools warn victims before it's too late" },
    ],
    founderKicker: "Founder's note",
    founderTitle: "Why we started this",
    founderBody:
      "As an anesthesiologist working at a private hospital in Istanbul, every week I meet patients who lost thousands of dollars to misleading clinic accounts on Instagram. Turkey welcomes more than 1.2 million health tourists a year — and most of those decisions are shaped by unregulated Instagram pages that no one can hold accountable. NeedForScore was built so the next patient reads the truth before they wire the money.",
    gapKicker: "Why existing solutions fall short",
    gaps: [
      {
        icon: Star,
        title: "Google Reviews / Trustpilot",
        body: "Business-only. You cannot search an Instagram handle or a phone number.",
      },
      {
        icon: Instagram,
        title: "Social platforms",
        body: "Content-focused. They have zero incentive to surface negative signal on their own users.",
      },
      {
        icon: AlertTriangle,
        title: "Fraud hotlines",
        body: "Reactive and slow. By the time a number is flagged, thousands are already victims.",
      },
    ],

    whyTitle: "Why NeedForScore",
    whyItems: [
      { icon: ShieldCheck, title: "Privacy-first", body: "Phone numbers are always masked in public. Full detail is only revealed to intentional searchers." },
      { icon: Users, title: "Community-owned", body: "95% of $SCORE supply belongs to the community. No VC dumps. No insider unlocks." },
      { icon: Search, title: "Real signal", body: "One-tap voting, comments, and risk badges surface scams before they spread." },
      { icon: Globe2, title: "Global by design", body: "Works across platforms, languages and countries — trust has no borders." },
    ],

    // Section 2 — How it works
    howKicker: "02 · How it works",
    howTitle: "A trust score for every identity — in 30 seconds",
    howSteps: [
      {
        icon: Fingerprint,
        title: "Permanent, un-fakeable profile",
        body: "Every social handle and phone number gets a persistent reputation page you can link, share, and return to.",
      },
      {
        icon: Zap,
        title: "1–10 trust score in under 30 seconds",
        body: "Users share their experience and rate the identity. Fast, standardized, mobile-first.",
      },
      {
        icon: Scale,
        title: "Weighted by rater trust",
        body: "Ratings are weighted by the rater's own $SCORE. Low-credibility voters have minimal impact on the target's score.",
      },
      {
        icon: Camera,
        title: "Evidence + moderation",
        body: "Screenshots and documents can be attached, moderated before they go live to prevent abuse and defamation.",
      },
      {
        icon: Layers,
        title: "Manipulation-resistant math",
        body: "Time-decay, evidence multipliers, and trust weighting produce a score that survives brigading and paid attacks.",
      },
      {
        icon: Sparkles,
        title: "Supported identities",
        body: "Instagram, X (Twitter), TikTok, phone numbers with country codes, and $SCORE user profiles.",
      },
    ],

    // Section 3 — Why different
    diffKicker: "03 · Why different",
    diffTitle: "Not another review site. A reputation layer on identities you already have.",
    diffItems: [
      {
        icon: Fingerprint,
        title: "Identity that already exists",
        body: "@username is already unique, permanent, and enforced by the platform. We don't create new identities — we add a reputation layer on top of existing ones, with zero verification cost.",
      },
      {
        icon: Scale,
        title: "Weighted trust, not anonymous noise",
        body: "Unlike traditional review sites, every rater has their own $SCORE. Trust flows both ways, forming a real trust graph instead of a shouting match.",
      },
      {
        icon: Users,
        title: "Individual-first, not business-first",
        body: "No competitor offers a real-time, scalable trust score at the level of an individual social handle or phone number. That's the gap $SCORE fills.",
      },
    ],

    // Token / $SCORE
    tokenTitle: "$SCORE — the Community Token",
    tokenBody:
      "$SCORE is a coordination layer — not the product. It aligns contributors, moderators and reporters worldwide around one mission: less fraud, more trust. Hold it, earn it, use it — it never buys you a better reputation.",
    tokenLink: "Explore $SCORE",
    tokenomicsTitle: "Tokenomics",
    tokenomicsBody: "A $SCORE supply distribution built for the long game — the community leads, insiders don't.",
    tokenomicsRows: [
      { label: "Community & Rewards", value: "60%" },
      { label: "Ecosystem & Growth", value: "20%" },
      { label: "Liquidity", value: "10%" },
      { label: "Treasury", value: "5%" },
      { label: "Core Contributors", value: "5%" },
    ],
    whitepaperTitle: "Whitepaper",
    whitepaperBody:
      "A deep dive into the protocol, reputation model, moderation architecture and long-term vision behind NeedForScore and $SCORE.",
    whitepaperCta: "Read the Whitepaper",
    roadmapTitle: "Roadmap",
    roadmapItems: [
      { period: "Q1", title: "Reputation core", body: "Multi-platform scoring, phone privacy, moderation tools." },
      { period: "Q2", title: "$SCORE launch", body: "Token launch, contributor rewards, on-chain identity link." },
      { period: "Q3", title: "Scale", body: "Global expansion, partner integrations, mobile app." },
      { period: "Q4", title: "Decentralize", body: "Community governance and open moderation guilds." },
    ],
    faqTitle: "FAQ",
    faqs: [
      { q: "Is NeedForScore free to use?", a: "Yes. Searching, reading and scoring are all free." },
      { q: "Do I need $SCORE to participate?", a: "No. The app is fully usable without it. $SCORE powers rewards, coordination and the trust graph — it never buys you a better score." },
      { q: "How do you protect privacy?", a: "Phone numbers are masked everywhere they appear publicly and phone pages are excluded from search engines. Full detail is only shown to intentional searchers." },
      { q: "How is fraud and defamation prevented?", a: "Rate limits, evidence-based moderation, community voting, time decay and rater-weighted scoring stop abuse before it spreads." },
      { q: "Which identities can I look up?", a: "Instagram, X (Twitter), TikTok, phone numbers with country codes, and $SCORE user profiles." },
      { q: "Can I rate someone anonymously?", a: "No pseudonym-only accounts. Every rater has a $SCORE profile so the trust graph stays legitimate." },
    ],
    partnersTitle: "Partners & Ecosystem",
    partnersBody: "Building alongside communities, wallets and platforms that share the same trust-first mission.",
    communityTitle: "Join the community",
    communityBody: "Contribute reports, vote on entries and help shape the future of digital trust.",
    footerTagline: "The trust layer for the social internet.",
    footerRights: "All rights reserved.",
  },
  tr: {
    nav: { mission: "Misyon", why: "Neden", how: "Nasıl", token: "$SCORE", roadmap: "Yol haritası", faq: "SSS" },
    launch: "Uygulamayı Aç",
    heroTag: "Sosyal internetin güven katmanı",
    heroTitle: "Dolandırıcıyı ifşa et. Güveni ödüllendir. Sinyali sen belirle.",
    heroSub:
      "NeedForScore; Instagram, TikTok, X, telefon numaraları ve $SCORE profilleri için topluluk yönetimli bir itibar ağıdır. Saniyeler içinde kimlik ara, 30 saniyede deneyimini paylaş. İnterneti birlikte güvenli hale getirelim.",
    searchPlaceholder: "@kullaniciadi veya telefon numarası ara",
    searchCta: "Kimlik ara",
    heroCta: "Uygulamayı Aç",
    heroCta2: "Deneyimini paylaş",
    heroCta3: "Whitepaper’ı Oku",

    problemKicker: "01 · Sorun",
    problemTitle: "NeedForScore neden var olmak zorunda?",
    problemLead:
      "Milyarlarca insan her gün doğrulayamadığı sosyal medya hesapları ve telefon numaraları ile etkileşime giriyor. Bu güven boşluğunun somut sonuçları var.",
    problemStats: [
      { k: "1T$+", label: "küresel çevrimiçi dolandırıcılık kaybı" },
      { k: "#1", label: "Instagram: sahte klinik & kimlik taklidi için en çok kullanılan platform" },
      { k: "TR · IN · BR", label: "Telefon dolandırıcılığı, gelişen pazarlarda 1 numaralı dolandırıcılık türü" },
      { k: "0", label: "Mağdurları önceden uyaracak bir mekanizma yok" },
    ],
    founderKicker: "Kurucudan",
    founderTitle: "Neden başladık",
    founderBody:
      "İstanbul’da özel bir hastanede anestezi uzmanı olarak, her hafta Instagram’daki yanıltıcı klinik hesapları yüzünden binlerce dolar kaybetmiş hastalarla karşılaşıyoruz. Türkiye yılda 1.2 milyondan fazla sağlık turisti ağırlıyor ve bu kararların büyük kısmı, hesap verebilir olmayan Instagram sayfaları tarafından şekillendiriliyor. NeedForScore’u, bir sonraki hasta parayı göndermeden önce gerçeği okuyabilsin diye kurduk.",
    gapKicker: "Mevcut çözümler neden yetersiz",
    gaps: [
      { icon: Star, title: "Google Reviews / Trustpilot", body: "İşletme odaklı. Bir Instagram kullanıcı adını veya telefon numarasını arayamazsın." },
      { icon: Instagram, title: "Sosyal platformlar", body: "İçerik odaklı. Kendi kullanıcıları hakkında olumsuz sinyali öne çıkarmak için hiçbir teşvikleri yok." },
      { icon: AlertTriangle, title: "Dolandırıcılık hatları", body: "Reaktif ve yavaş. Bir numara işaretlendiğinde binlerce kişi zaten mağdur olmuş oluyor." },
    ],

    whyTitle: "Neden NeedForScore",
    whyItems: [
      { icon: ShieldCheck, title: "Önce gizlilik", body: "Telefon numaraları her zaman maskelenir. Detay yalnızca kasıtlı aramada görünür." },
      { icon: Users, title: "Topluluğun malı", body: "$SCORE arzının %95’i topluluğa aittir. VC boşaltması yok, içeri kilit açma yok." },
      { icon: Search, title: "Gerçek sinyal", body: "Tek dokunuşla oy, yorum ve risk rozetleri dolandırıcılığı yayılmadan yakalar." },
      { icon: Globe2, title: "Global tasarım", body: "Platform, dil ve ülke fark etmez — güvenin sınırı yok." },
    ],

    howKicker: "02 · Nasıl çalışıyor",
    howTitle: "Her kimliğe bir güven skoru — 30 saniyede",
    howSteps: [
      { icon: Fingerprint, title: "Kalıcı, taklit edilemez profil", body: "Her sosyal kullanıcı adı ve telefon numarası için kalıcı bir itibar sayfası oluşturulur — linklenebilir, paylaşılabilir." },
      { icon: Zap, title: "30 saniyede 1–10 güven puanı", body: "Kullanıcılar deneyimlerini paylaşır ve puan verir. Hızlı, standart, mobil öncelikli." },
      { icon: Scale, title: "Değerlendiren de puanlanır", body: "Puanlar, değerlendirenin kendi $SCORE’una göre ağırlıklandırılır. Düşük güvenilirlikli oy, hedefin skorunu neredeyse etkilemez." },
      { icon: Camera, title: "Kanıt + moderasyon", body: "Ekran görüntüsü ve belge eklenebilir; yayınlanmadan önce moderasyondan geçer." },
      { icon: Layers, title: "Manipülasyona dirençli matematik", body: "Zaman aşımı, kanıt katsayıları ve güven ağırlıkları; brigading ve satın alınmış saldırılara dayanan bir skor üretir." },
      { icon: Sparkles, title: "Desteklenen kimlikler", body: "Instagram, X (Twitter), TikTok, ülke koduyla telefon numaraları ve $SCORE kullanıcı profilleri." },
    ],

    diffKicker: "03 · Neden farklı",
    diffTitle: "Sıradan bir yorum sitesi değil. Zaten sahip olduğun kimliklerin üstüne itibar katmanı.",
    diffItems: [
      { icon: Fingerprint, title: "Kimlik = zaten var olan bir şey", body: "@kullaniciadi zaten benzersiz, kalıcı ve platform tarafından zorunlu kılınıyor. Biz yeni kimlik yaratmıyoruz; var olanın üzerine sıfır doğrulama maliyetiyle itibar katmanı ekliyoruz." },
      { icon: Scale, title: "Anonim değil, ağırlıklı güven", body: "Değerlendirme yapan herkesin kendi $SCORE’u vardır. Güven çift yönlü akar — bağıranın değil, itibarlının sesi çıkar." },
      { icon: Users, title: "Bireysel odak, işletme değil", body: "Rakiplerin hiçbiri, bireysel sosyal hesap veya telefon numarası seviyesinde gerçek zamanlı, ölçeklenebilir bir güven skoru sunmuyor. $SCORE tam bu boşluğu dolduruyor." },
    ],

    tokenTitle: "$SCORE — Community Token",
    tokenBody:
      "$SCORE bir koordinasyon katmanıdır — ürün değildir. Katkı sağlayanları, moderatörleri ve raportörleri tek bir misyon etrafında hizalar: daha az dolandırıcılık, daha çok güven. Tutulur, kazanılır, kullanılır — ama hiçbir zaman daha iyi bir itibar satın almaz.",
    tokenLink: "$SCORE’u keşfet",
    tokenomicsTitle: "Tokenomik",
    tokenomicsBody: "$SCORE arz dağılımı uzun vadeli oyuna göre kurgulandı — topluluk önde, içeri kimse değil.",
    tokenomicsRows: [
      { label: "Topluluk & Ödüller", value: "60%" },
      { label: "Ekosistem & Büyüme", value: "20%" },
      { label: "Likidite", value: "10%" },
      { label: "Hazine", value: "5%" },
      { label: "Çekirdek Ekip", value: "5%" },
    ],
    whitepaperTitle: "Whitepaper",
    whitepaperBody:
      "Protokol, itibar modeli, moderasyon mimarisi ve $SCORE’un uzun vadeli vizyonuna derinlemesine bir bakış.",
    whitepaperCta: "Whitepaper’ı Oku",
    roadmapTitle: "Yol Haritası",
    roadmapItems: [
      { period: "Ç1", title: "İtibar çekirdeği", body: "Çoklu platform puanlama, telefon gizliliği, moderasyon araçları." },
      { period: "Ç2", title: "$SCORE lansmanı", body: "Token lansmanı, katkı ödülleri, on-chain kimlik bağı." },
      { period: "Ç3", title: "Büyüme", body: "Global yayılım, partner entegrasyonları, mobil uygulama." },
      { period: "Ç4", title: "Merkezi olmaktan çıkış", body: "Topluluk yönetimi ve açık moderasyon loncaları." },
    ],
    faqTitle: "SSS",
    faqs: [
      { q: "NeedForScore ücretsiz mi?", a: "Evet. Aramak, okumak ve puanlamak tamamen ücretsizdir." },
      { q: "Katılmak için $SCORE gerekli mi?", a: "Hayır. Uygulama tokensiz de tamamen çalışır. $SCORE; ödül, koordinasyon ve güven grafiğini destekler — hiçbir zaman daha iyi bir skor satın aldırmaz." },
      { q: "Gizliliği nasıl koruyorsunuz?", a: "Telefon numaraları herkese açık her yerde maskelenir ve telefon sayfaları arama motorlarından hariç tutulur. Detay yalnızca kasıtlı aramada görünür." },
      { q: "Suistimal ve iftira nasıl önlenir?", a: "Oran limitleri, kanıt bazlı moderasyon, topluluk oyları, zaman aşımı ve raportör ağırlıklı puanlama; suistimali yayılmadan durdurur." },
      { q: "Hangi kimlikleri arayabilirim?", a: "Instagram, X (Twitter), TikTok, ülke koduyla telefon numaraları ve $SCORE kullanıcı profilleri." },
      { q: "Anonim puanlama var mı?", a: "Rumuz-yalnız hesap yok. Her raportörün bir $SCORE profili vardır; güven grafiği bu şekilde meşru kalır." },
    ],
    partnersTitle: "Partnerler & Ekosistem",
    partnersBody: "Aynı güven öncelikli misyonu paylaşan topluluklar, cüzdanlar ve platformlarla birlikte inşa ediyoruz.",
    communityTitle: "Topluluğa katıl",
    communityBody: "Rapor gönder, girdilere oy ver ve dijital güvenin geleceğini şekillendir.",
    footerTagline: "Sosyal internetin güven katmanı.",
    footerRights: "Tüm hakları saklıdır.",
  },
} as const;

const LANDING_JSONLD = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "NeedForScore",
    url: SITE_URL,
    logo: `${SITE_URL}/favicon.png`,
    description: "Community-run reputation network exposing scams across Instagram, TikTok, X and phone numbers. Powered by $SCORE.",
  },
];

const Section = ({ id, children, className = "" }: { id?: string; children: React.ReactNode; className?: string }) => (
  <section id={id} className={`relative max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 ${className}`}>
    {children}
  </section>
);

// Renders "$SCORE" with a subtle accent wherever it appears in copy.
const withScoreAccent = (text: string) => {
  const parts = text.split(/(\$SCORE)/g);
  return parts.map((p, i) =>
    p === "$SCORE" ? (
      <span
        key={i}
        className="font-extrabold bg-gradient-to-r from-emerald-300 to-teal-200 bg-clip-text text-transparent tracking-tight"
      >
        $SCORE
      </span>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
};

const Landing = () => {
  const { i18n } = useTranslation();
  const lang = (i18n.language?.startsWith("tr") ? "tr" : "en") as "en" | "tr";
  const t = COPY[lang];
  const [menu, setMenu] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) {
      navigate("/app");
      return;
    }
    navigate(`/app?q=${encodeURIComponent(q)}`);
  };

  return (
    <div className="min-h-screen bg-[#040b0a] text-foreground antialiased overflow-x-hidden">
      <SEO
        title="NeedForScore — The trust layer for the social internet"
        description="Community-run reputation network. Expose scams, reward trust, own the signal across Instagram, TikTok, X and phone numbers. Powered by $SCORE."
        canonical="/"
        image={DEFAULT_OG_IMAGE}
        jsonLd={LANDING_JSONLD}
      />

      {/* Ambient background */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-emerald-500/25 blur-[140px]" />
        <div className="absolute top-1/3 -right-40 h-[520px] w-[520px] rounded-full bg-teal-400/20 blur-[140px]" />
        <div className="absolute bottom-0 left-1/3 h-[420px] w-[420px] rounded-full bg-emerald-300/10 blur-[140px]" />
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(16,185,129,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,.6) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      {/* Nav */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#040b0a]/70 border-b border-emerald-500/15">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={scoreLogo} alt="NeedForScore" width={32} height={32} className="h-8 w-8 rounded-lg" />
            <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-emerald-300 via-teal-200 to-emerald-400 bg-clip-text text-transparent">
              NeedForScore
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-sm text-emerald-100/70">
            <a href="#mission" className="hover:text-emerald-200 transition-colors">{t.nav.mission}</a>
            <a href="#why" className="hover:text-emerald-200 transition-colors">{t.nav.why}</a>
            <a href="#how" className="hover:text-emerald-200 transition-colors">{t.nav.how}</a>
            <a href="#token" className="hover:text-emerald-200 transition-colors font-bold text-emerald-200">{t.nav.token}</a>
            <a href="#roadmap" className="hover:text-emerald-200 transition-colors">{t.nav.roadmap}</a>
            <a href="#faq" className="hover:text-emerald-200 transition-colors">{t.nav.faq}</a>
          </nav>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Link
              to="/app"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-[#04110d] bg-gradient-to-r from-emerald-300 to-teal-300 shadow-[0_0_30px_rgba(16,185,129,0.45)] hover:shadow-[0_0_45px_rgba(16,185,129,0.75)] transition-all"
            >
              <Rocket className="h-4 w-4" />
              {t.launch}
            </Link>
            <button className="md:hidden p-2 text-emerald-100" onClick={() => setMenu(!menu)} aria-label="Menu">
              {menu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {menu && (
          <div className="md:hidden border-t border-emerald-500/15 bg-[#040b0a]/95 px-4 py-4 space-y-3">
            {(["mission", "why", "how", "token", "roadmap", "faq"] as const).map((k) => (
              <a key={k} href={`#${k}`} onClick={() => setMenu(false)} className="block text-sm text-emerald-100/80">
                {t.nav[k]}
              </a>
            ))}
            <Link
              to="/app"
              onClick={() => setMenu(false)}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-[#04110d] bg-gradient-to-r from-emerald-300 to-teal-300"
            >
              <Rocket className="h-4 w-4" />
              {t.launch}
            </Link>
          </div>
        )}
      </header>

      {/* Hero */}
      <Section className="!py-20 sm:!py-28">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 text-emerald-300 text-xs font-bold mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            {t.heroTag}
          </div>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05]">
            <span className="bg-gradient-to-br from-white via-emerald-100 to-emerald-300 bg-clip-text text-transparent">
              {t.heroTitle}
            </span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-emerald-100/70 max-w-2xl leading-relaxed">
            {withScoreAccent(t.heroSub)}
          </p>

          {/* Primary CTA: search identity */}
          <form
            onSubmit={onSearch}
            className="mt-9 flex flex-col sm:flex-row gap-2 max-w-2xl rounded-2xl border border-emerald-400/25 bg-emerald-500/[0.06] p-2 backdrop-blur-md focus-within:border-emerald-300/60 transition-colors"
            role="search"
            aria-label={t.searchCta}
          >
            <div className="flex items-center gap-2 flex-1 px-3">
              <Search className="h-5 w-5 text-emerald-300 shrink-0" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                aria-label={t.searchPlaceholder}
                className="flex-1 bg-transparent outline-none text-emerald-50 placeholder:text-emerald-100/40 py-3 text-base"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-[#04110d] bg-gradient-to-r from-emerald-300 to-teal-300 shadow-[0_0_30px_rgba(16,185,129,0.45)] hover:shadow-[0_0_45px_rgba(16,185,129,0.75)] transition-all"
            >
              {t.searchCta}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/app"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold border border-emerald-400/30 text-emerald-100 hover:bg-emerald-500/10 transition-colors"
            >
              <MessageSquare className="h-4 w-4" />
              {t.heroCta2}
            </Link>
            <a
              href="#whitepaper"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold border border-emerald-400/20 text-emerald-100/80 hover:bg-emerald-500/10 transition-colors"
            >
              <FileText className="h-4 w-4" />
              {t.heroCta3}
            </a>
          </div>

          {/* Trust badge legend */}
          <div className="mt-8 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-emerald-100/50 mr-1 uppercase tracking-widest">Trust badges</span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-emerald-400/40 bg-emerald-500/15 text-emerald-200 font-bold">
              <CheckCircle2 className="h-3.5 w-3.5" /> 9.2 · Safe
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-amber-400/40 bg-amber-500/10 text-amber-200 font-bold">
              <AlertTriangle className="h-3.5 w-3.5" /> 5.1 · Suspicious
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-red-400/40 bg-red-500/10 text-red-200 font-bold">
              <AlertTriangle className="h-3.5 w-3.5" /> 1.8 · Dangerous
            </span>
          </div>

          {/* Metric strip */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl">
            {[
              { k: "5", label: "Platforms" },
              { k: "95%", label: "Community owned" },
              { k: "0", label: "VC unlocks" },
              { k: "24/7", label: "Moderation" },
            ].map((m) => (
              <div key={m.label} className="rounded-2xl border border-emerald-400/15 bg-emerald-500/5 backdrop-blur px-4 py-4">
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-200 font-mono">{m.k}</div>
                <div className="text-xs uppercase tracking-widest text-emerald-100/50 mt-1">{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Mission */}
      <Section id="mission">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-400/80 mb-4">00 · Mission</div>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-emerald-50">Our mission</h2>
            <p className="mt-5 text-lg text-emerald-100/70 leading-relaxed">
              Online fraud steals billions every year and erodes trust in every message, DM and call. We're building an
              open, community-owned reputation layer where verified experience — not paid promotion — decides who gets
              trusted. {withScoreAccent("$SCORE")} is the coordination layer that makes that community global.
            </p>
          </div>
          <div className="relative rounded-3xl border border-emerald-400/20 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 p-8 backdrop-blur-xl">
            <ShieldCheck className="h-10 w-10 text-emerald-300 mb-4" />
            <div className="text-2xl font-bold text-emerald-100">Verified experience beats paid promotion.</div>
            <div className="mt-4 text-emerald-100/60">Every score, comment and flag comes from a real person with a $SCORE profile. No bots. No sponsored trust.</div>
          </div>
        </div>
      </Section>

      {/* Section 1 — The problem */}
      <Section id="problem">
        <div className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-400/80 mb-4">{t.problemKicker}</div>
        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-emerald-50 max-w-4xl">{t.problemTitle}</h2>
        <p className="mt-5 text-lg text-emerald-100/70 max-w-3xl leading-relaxed">{t.problemLead}</p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {t.problemStats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-red-400/20 bg-red-500/[0.04] p-5 backdrop-blur-md">
              <div className="text-3xl font-extrabold text-red-200 font-mono">{s.k}</div>
              <div className="mt-2 text-sm text-emerald-100/70 leading-snug">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Founder story */}
        <div className="mt-14 rounded-3xl border border-emerald-400/20 bg-gradient-to-br from-emerald-500/10 to-transparent p-8 sm:p-10 backdrop-blur-xl">
          <div className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-400/80 mb-3">{t.founderKicker}</div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-50">{t.founderTitle}</h3>
          <p className="mt-5 text-emerald-100/75 leading-relaxed text-lg">{t.founderBody}</p>
        </div>

        {/* Why existing solutions fall short */}
        <div className="mt-14">
          <div className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-400/80 mb-4">{t.gapKicker}</div>
          <div className="grid gap-4 sm:grid-cols-3">
            {t.gaps.map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-3xl border border-emerald-400/15 bg-emerald-500/[0.05] p-6 backdrop-blur-md">
                <Icon className="h-6 w-6 text-emerald-300 mb-3" />
                <div className="text-lg font-bold text-emerald-50">{title}</div>
                <div className="mt-2 text-sm text-emerald-100/60 leading-relaxed">{body}</div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Why */}
      <Section id="why">
        <div className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-400/80 mb-4">Why us</div>
        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-emerald-50 max-w-3xl">{t.whyTitle}</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {t.whyItems.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="group rounded-3xl border border-emerald-400/15 bg-gradient-to-br from-emerald-500/[0.07] to-transparent p-6 backdrop-blur-md hover:border-emerald-400/40 transition-colors"
            >
              <Icon className="h-7 w-7 text-emerald-300 mb-4" />
              <div className="text-xl font-bold text-emerald-50">{title}</div>
              <div className="mt-2 text-emerald-100/60">{withScoreAccent(body)}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* Section 2 — How it works */}
      <Section id="how">
        <div className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-400/80 mb-4">{t.howKicker}</div>
        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-emerald-50 max-w-3xl">{t.howTitle}</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {t.howSteps.map(({ icon: Icon, title, body }, i) => (
            <div key={title} className="relative rounded-3xl border border-emerald-400/15 bg-emerald-500/[0.05] p-6 backdrop-blur-md hover:border-emerald-400/40 transition-colors">
              <div className="absolute top-4 right-5 text-xs font-mono text-emerald-300/60">0{i + 1}</div>
              <Icon className="h-7 w-7 text-emerald-300 mb-4" />
              <div className="text-lg font-bold text-emerald-50">{title}</div>
              <div className="mt-2 text-sm text-emerald-100/60 leading-relaxed">{withScoreAccent(body)}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* Section 3 — Why different */}
      <Section id="different">
        <div className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-400/80 mb-4">{t.diffKicker}</div>
        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-emerald-50 max-w-4xl">{t.diffTitle}</h2>
        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {t.diffItems.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-3xl border border-emerald-400/20 bg-gradient-to-br from-emerald-500/10 to-transparent p-6 backdrop-blur-md">
              <Icon className="h-8 w-8 text-emerald-300 mb-4" />
              <div className="text-xl font-bold text-emerald-50">{title}</div>
              <div className="mt-3 text-emerald-100/70 leading-relaxed">{withScoreAccent(body)}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* Token — $SCORE */}
      <Section id="token">
        <div className="rounded-[2rem] border border-emerald-400/20 bg-gradient-to-br from-emerald-500/15 via-teal-500/5 to-transparent p-8 sm:p-14 backdrop-blur-xl relative overflow-hidden">
          <div aria-hidden className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="relative">
            <div className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-400/80 mb-4">04 · $SCORE</div>
            <h2 className="text-4xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-200 via-emerald-300 to-teal-200 bg-clip-text text-transparent">
              {t.tokenTitle}
            </h2>
            <p className="mt-5 text-lg text-emerald-100/70 max-w-2xl leading-relaxed">
              {withScoreAccent(t.tokenBody)}
            </p>
            <Link
              to="/community-token"
              className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-[#04110d] bg-gradient-to-r from-emerald-300 to-teal-300 hover:shadow-[0_0_40px_rgba(16,185,129,0.6)] transition-all"
            >
              <Coins className="h-4 w-4" />
              {t.tokenLink}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </Section>

      {/* Tokenomics */}
      <Section id="tokenomics">
        <div className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-400/80 mb-4">05 · Tokenomics</div>
        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-emerald-50">{t.tokenomicsTitle}</h2>
        <p className="mt-4 text-lg text-emerald-100/70 max-w-2xl">{withScoreAccent(t.tokenomicsBody)}</p>

        <div className="mt-10 grid lg:grid-cols-5 gap-4">
          {t.tokenomicsRows.map((row, i) => (
            <div
              key={row.label}
              className="rounded-2xl border border-emerald-400/15 bg-emerald-500/[0.06] p-5 backdrop-blur-md"
              style={{ opacity: 1 - i * 0.06 }}
            >
              <div className="text-3xl font-extrabold text-emerald-200 font-mono">{row.value}</div>
              <div className="mt-2 text-sm text-emerald-100/70">{row.label}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* Whitepaper */}
      <Section id="whitepaper">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div className="order-2 lg:order-1 rounded-3xl border border-emerald-400/20 bg-gradient-to-br from-emerald-500/10 to-transparent p-8 backdrop-blur-md">
            <FileText className="h-10 w-10 text-emerald-300 mb-4" />
            <div className="text-2xl font-bold text-emerald-100">The full protocol, on paper.</div>
            <div className="mt-3 text-emerald-100/60">Architecture, reputation math, moderation guilds and long-term $SCORE governance.</div>
            <Link
              to="/community-token/whitepaper"
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold border border-emerald-400/30 text-emerald-100 hover:bg-emerald-500/10 transition-colors"
            >
              {t.whitepaperCta}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="order-1 lg:order-2">
            <div className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-400/80 mb-4">06 · Whitepaper</div>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-emerald-50">{t.whitepaperTitle}</h2>
            <p className="mt-5 text-lg text-emerald-100/70 leading-relaxed">{withScoreAccent(t.whitepaperBody)}</p>
          </div>
        </div>
      </Section>

      {/* Roadmap */}
      <Section id="roadmap">
        <div className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-400/80 mb-4">07 · Roadmap</div>
        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-emerald-50">{t.roadmapTitle}</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {t.roadmapItems.map((r) => (
            <div
              key={r.period}
              className="rounded-3xl border border-emerald-400/15 bg-emerald-500/[0.05] p-6 backdrop-blur-md"
            >
              <div className="text-xs font-bold text-emerald-300/80 font-mono">{r.period}</div>
              <div className="mt-3 text-xl font-bold text-emerald-50">{withScoreAccent(r.title)}</div>
              <div className="mt-2 text-sm text-emerald-100/60">{r.body}</div>
            </div>
          ))}
        </div>
        <div className="mt-8">
          <Link to="/community-token/roadmap" className="inline-flex items-center gap-1 text-emerald-300 hover:text-emerald-200 text-sm font-semibold">
            <MapIcon className="h-4 w-4" /> Full roadmap <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </Section>

      {/* FAQ */}
      <Section id="faq">
        <div className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-400/80 mb-4">08 · FAQ</div>
        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-emerald-50">{t.faqTitle}</h2>
        <div className="mt-10 divide-y divide-emerald-400/10 rounded-3xl border border-emerald-400/15 bg-emerald-500/[0.04] backdrop-blur-md">
          {t.faqs.map((f, i) => (
            <details key={i} className="group p-6">
              <summary className="flex cursor-pointer items-start justify-between gap-6 text-left">
                <span className="text-lg font-semibold text-emerald-50">{withScoreAccent(f.q)}</span>
                <HelpCircle className="h-5 w-5 text-emerald-300 transition-transform group-open:rotate-45" />
              </summary>
              <p className="mt-3 text-emerald-100/70 leading-relaxed">{withScoreAccent(f.a)}</p>
            </details>
          ))}
        </div>
        <div className="mt-6">
          <Link to="/community-token/faq" className="text-emerald-300 hover:text-emerald-200 text-sm font-semibold">
            Full FAQ <ArrowRight className="inline h-3.5 w-3.5" />
          </Link>
        </div>
      </Section>

      {/* Partners */}
      <Section id="partners">
        <div className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-400/80 mb-4">09 · Partners</div>
        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-emerald-50 max-w-3xl">{t.partnersTitle}</h2>
        <p className="mt-4 text-lg text-emerald-100/70 max-w-2xl">{t.partnersBody}</p>
        <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {["Trust DAO", "OSINT Guild", "SafeChain", "OpenReport"].map((p) => (
            <div
              key={p}
              className="h-24 rounded-2xl border border-emerald-400/15 bg-emerald-500/[0.04] flex items-center justify-center text-emerald-200/80 font-bold tracking-wide backdrop-blur-md"
            >
              {p}
            </div>
          ))}
        </div>
      </Section>

      {/* Community CTA */}
      <Section id="community" className="!pb-24">
        <div className="relative overflow-hidden rounded-[2rem] border border-emerald-400/25 bg-gradient-to-br from-emerald-500/25 via-teal-500/10 to-transparent p-10 sm:p-16 text-center backdrop-blur-xl">
          <div aria-hidden className="absolute -top-24 left-1/2 -translate-x-1/2 h-72 w-72 rounded-full bg-emerald-400/30 blur-3xl" />
          <div className="relative">
            <MessageSquare className="mx-auto h-10 w-10 text-emerald-300 mb-5" />
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-emerald-50">{t.communityTitle}</h2>
            <p className="mt-4 text-lg text-emerald-100/75 max-w-2xl mx-auto">{t.communityBody}</p>
            <div className="mt-8 flex flex-wrap gap-3 justify-center">
              <Link
                to="/app"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-bold text-[#04110d] bg-gradient-to-r from-emerald-300 to-teal-300 shadow-[0_0_40px_rgba(16,185,129,0.55)]"
              >
                <Rocket className="h-4 w-4" />
                {t.launch}
              </Link>
              <a
                href="https://x.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold border border-emerald-400/30 text-emerald-100 hover:bg-emerald-500/10"
              >
                <Twitter className="h-4 w-4" /> X
              </a>
              <a
                href="https://t.me"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold border border-emerald-400/30 text-emerald-100 hover:bg-emerald-500/10"
              >
                <Send className="h-4 w-4" /> Telegram
              </a>
            </div>
          </div>
        </div>
      </Section>

      {/* Footer */}
      <footer className="border-t border-emerald-500/15 bg-[#040b0a]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <img src={scoreLogo} alt="NeedForScore" width={28} height={28} className="h-7 w-7 rounded-lg" />
              <span className="font-extrabold text-emerald-100">NeedForScore</span>
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 font-bold text-emerald-200">$SCORE</span>
            </div>
            <div className="text-sm text-emerald-100/50 mt-2">{t.footerTagline}</div>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <Link to="/terms" className="text-emerald-100/60 hover:text-emerald-200">Terms</Link>
            <Link to="/privacy" className="text-emerald-100/60 hover:text-emerald-200">Privacy</Link>
            <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="text-emerald-100/60 hover:text-emerald-200 inline-flex items-center gap-1"><Twitter className="h-4 w-4" /> X</a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-emerald-100/60 hover:text-emerald-200 inline-flex items-center gap-1"><Github className="h-4 w-4" /> GitHub</a>
          </div>
        </div>
        <div className="border-t border-emerald-500/10 py-4 text-center text-xs text-emerald-100/40">
          © {new Date().getFullYear()} NeedForScore. {t.footerRights}
        </div>
      </footer>
    </div>
  );
};

export default Landing;
