import { Link } from "react-router-dom";
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
} from "lucide-react";
import { useState } from "react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import SEO, { SITE_URL, DEFAULT_OG_IMAGE } from "@/components/SEO";
import scoreLogo from "@/assets/score-logo.jpeg";

// Inline EN/TR strings keep the landing self-contained and independent of the
// app's translation namespace.
const COPY = {
  en: {
    nav: { mission: "Mission", why: "Why", token: "Token", roadmap: "Roadmap", faq: "FAQ" },
    launch: "Launch App",
    heroTag: "The trust layer for the social internet",
    heroTitle: "Expose scams. Reward trust. Own the signal.",
    heroSub:
      "NeedForScore is a community-run reputation network for Instagram, TikTok, X, phone numbers and everyone in between. Score the good. Flag the bad. Make the internet safer — together.",
    heroCta: "Launch App",
    heroCta2: "Read the Whitepaper",
    missionTitle: "Our Mission",
    missionBody:
      "Online fraud steals billions every year and erodes trust in every message, DM and call. We're building an open, community-owned reputation layer where verified experience — not paid promotion — decides who gets trusted.",
    whyTitle: "Why NeedForScore",
    whyItems: [
      { icon: ShieldCheck, title: "Privacy-first", body: "Phone numbers are always masked in public. Full detail is only revealed to intentional searchers." },
      { icon: Users, title: "Community-owned", body: "95% of supply belongs to the community. No VC dumps. No insider unlocks." },
      { icon: Search, title: "Real signal", body: "One-tap voting, comments, and risk badges surface scams before they spread." },
      { icon: Globe2, title: "Global by design", body: "Works across platforms, languages and countries — trust has no borders." },
    ],
    tokenTitle: "Community Token",
    tokenBody:
      "The $SCORE Community Token is a coordination layer — not the product. It exists to align contributors, moderators and reporters worldwide around one mission: less fraud, more trust.",
    tokenLink: "Explore the Token",
    tokenomicsTitle: "Tokenomics",
    tokenomicsBody: "A supply distribution built for the long game — the community leads, insiders don't.",
    tokenomicsRows: [
      { label: "Community & Rewards", value: "60%" },
      { label: "Ecosystem & Growth", value: "20%" },
      { label: "Liquidity", value: "10%" },
      { label: "Treasury", value: "5%" },
      { label: "Core Contributors", value: "5%" },
    ],
    whitepaperTitle: "Whitepaper",
    whitepaperBody:
      "A deep dive into the protocol, reputation model, moderation architecture and long-term vision behind NeedForScore.",
    whitepaperCta: "Read the Whitepaper",
    roadmapTitle: "Roadmap",
    roadmapItems: [
      { period: "Q1", title: "Reputation core", body: "Multi-platform scoring, phone privacy, moderation tools." },
      { period: "Q2", title: "Community Token", body: "Token launch, contributor rewards, on-chain identity link." },
      { period: "Q3", title: "Scale", body: "Global expansion, partner integrations, mobile app." },
      { period: "Q4", title: "Decentralize", body: "Community governance and open moderation guilds." },
    ],
    faqTitle: "FAQ",
    faqs: [
      { q: "Is NeedForScore free to use?", a: "Yes. Searching, reading and scoring are all free." },
      { q: "Do I need the token to participate?", a: "No. The app is fully usable without it. The token powers rewards and coordination." },
      { q: "How do you protect privacy?", a: "Phone numbers are masked everywhere they appear publicly and phone pages are excluded from search engines." },
      { q: "How is fraud prevented?", a: "Rate limits, moderation, community voting and reputation checks stop abuse before it spreads." },
    ],
    partnersTitle: "Partners & Ecosystem",
    partnersBody: "Building alongside communities, wallets and platforms that share the same trust-first mission.",
    communityTitle: "Join the community",
    communityBody: "Contribute reports, vote on entries and help shape the future of digital trust.",
    footerTagline: "The trust layer for the social internet.",
    footerRights: "All rights reserved.",
  },
  tr: {
    nav: { mission: "Misyon", why: "Neden", token: "Token", roadmap: "Yol haritası", faq: "SSS" },
    launch: "Uygulamayı Aç",
    heroTag: "Sosyal internetin güven katmanı",
    heroTitle: "Dolandırıcıyı ifşa et. Güveni ödüllendir. Sinyali sen belirle.",
    heroSub:
      "NeedForScore; Instagram, TikTok, X, telefon numaraları ve fazlası için topluluk yönetimli bir itibar ağıdır. İyiyi puanla, kötüyü işaretle. İnterneti birlikte güvenli hale getirelim.",
    heroCta: "Uygulamayı Aç",
    heroCta2: "Whitepaper’ı Oku",
    missionTitle: "Misyonumuz",
    missionBody:
      "Çevrimiçi dolandırıcılık her yıl milyarlarca dolar çalıyor ve her mesaja, DM’e, aramaya olan güveni aşındırıyor. Ücretli tanıtımın değil, doğrulanmış deneyimin belirlediği açık ve topluluk sahipli bir itibar katmanı inşa ediyoruz.",
    whyTitle: "Neden NeedForScore",
    whyItems: [
      { icon: ShieldCheck, title: "Önce gizlilik", body: "Telefon numaraları her zaman maskelenir. Detay yalnızca kasıtlı aramada görünür." },
      { icon: Users, title: "Topluluğun malı", body: "Arzın %95’i topluluğa aittir. VC boşaltması yok, içeri kilit açma yok." },
      { icon: Search, title: "Gerçek sinyal", body: "Tek dokunuşla oy, yorum ve risk rozetleri dolandırıcılığı yayılmadan yakalar." },
      { icon: Globe2, title: "Global tasarım", body: "Platform, dil ve ülke fark etmez — güvenin sınırı yok." },
    ],
    tokenTitle: "Community Token",
    tokenBody:
      "$SCORE Community Token bir koordinasyon katmanıdır — ürün değildir. Katkı sağlayanları, moderatörleri ve raportörleri tek bir misyon etrafında hizalar: daha az dolandırıcılık, daha çok güven.",
    tokenLink: "Token’ı keşfet",
    tokenomicsTitle: "Tokenomik",
    tokenomicsBody: "Uzun vadeli oyuna göre kurgulanmış arz dağılımı — topluluk önde, içeri kimse değil.",
    tokenomicsRows: [
      { label: "Topluluk & Ödüller", value: "60%" },
      { label: "Ekosistem & Büyüme", value: "20%" },
      { label: "Likidite", value: "10%" },
      { label: "Hazine", value: "5%" },
      { label: "Çekirdek Ekip", value: "5%" },
    ],
    whitepaperTitle: "Whitepaper",
    whitepaperBody:
      "Protokol, itibar modeli, moderasyon mimarisi ve uzun vadeli vizyona derinlemesine bir bakış.",
    whitepaperCta: "Whitepaper’ı Oku",
    roadmapTitle: "Yol Haritası",
    roadmapItems: [
      { period: "Ç1", title: "İtibar çekirdeği", body: "Çoklu platform puanlama, telefon gizliliği, moderasyon araçları." },
      { period: "Ç2", title: "Community Token", body: "Token lansmanı, katkı ödülleri, on-chain kimlik bağı." },
      { period: "Ç3", title: "Büyüme", body: "Global yayılım, partner entegrasyonları, mobil uygulama." },
      { period: "Ç4", title: "Merkezi olmaktan çıkış", body: "Topluluk yönetimi ve açık moderasyon loncaları." },
    ],
    faqTitle: "SSS",
    faqs: [
      { q: "NeedForScore ücretsiz mi?", a: "Evet. Aramak, okumak ve puanlamak tamamen ücretsizdir." },
      { q: "Katılmak için token gerekli mi?", a: "Hayır. Uygulama tokensiz de tamamen çalışır. Token; ödül ve koordinasyonu sağlar." },
      { q: "Gizliliği nasıl koruyorsunuz?", a: "Telefon numaraları herkese açık her yerde maskelenir ve telefon sayfaları arama motorlarından hariç tutulur." },
      { q: "Suistimal nasıl önlenir?", a: "Oran limitleri, moderasyon, topluluk oyları ve itibar kontrolleri suistimali yayılmadan durdurur." },
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
    description: "Community-run reputation network exposing scams across Instagram, TikTok, X and phone numbers.",
  },
];

const Section = ({ id, children, className = "" }: { id?: string; children: React.ReactNode; className?: string }) => (
  <section id={id} className={`relative max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 ${className}`}>
    {children}
  </section>
);

const Landing = () => {
  const { i18n } = useTranslation();
  const lang = (i18n.language?.startsWith("tr") ? "tr" : "en") as "en" | "tr";
  const t = COPY[lang];
  const [menu, setMenu] = useState(false);

  return (
    <div className="min-h-screen bg-[#040b0a] text-foreground antialiased overflow-x-hidden">
      <SEO
        title="NeedForScore — The trust layer for the social internet"
        description="Community-run reputation network. Expose scams, reward trust, own the signal across Instagram, TikTok, X and phone numbers."
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
            <a href="#token" className="hover:text-emerald-200 transition-colors">{t.nav.token}</a>
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
            {(["mission", "why", "token", "roadmap", "faq"] as const).map((k) => (
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
          <p className="mt-6 text-lg sm:text-xl text-emerald-100/70 max-w-2xl leading-relaxed">{t.heroSub}</p>

          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              to="/app"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-bold text-[#04110d] bg-gradient-to-r from-emerald-300 to-teal-300 shadow-[0_0_40px_rgba(16,185,129,0.55)] hover:shadow-[0_0_60px_rgba(16,185,129,0.85)] transition-all"
            >
              <Rocket className="h-4 w-4" />
              {t.heroCta}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#whitepaper"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-semibold border border-emerald-400/30 text-emerald-100 hover:bg-emerald-500/10 transition-colors"
            >
              <FileText className="h-4 w-4" />
              {t.heroCta2}
            </a>
          </div>

          {/* Metric strip */}
          <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl">
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
            <div className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-400/80 mb-4">01 · Mission</div>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-emerald-50">{t.missionTitle}</h2>
            <p className="mt-5 text-lg text-emerald-100/70 leading-relaxed">{t.missionBody}</p>
          </div>
          <div className="relative rounded-3xl border border-emerald-400/20 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 p-8 backdrop-blur-xl">
            <ShieldCheck className="h-10 w-10 text-emerald-300 mb-4" />
            <div className="text-2xl font-bold text-emerald-100">Verified experience beats paid promotion.</div>
            <div className="mt-4 text-emerald-100/60">Every score, comment and flag comes from a real person. No bots. No sponsored trust.</div>
          </div>
        </div>
      </Section>

      {/* Why */}
      <Section id="why">
        <div className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-400/80 mb-4">02 · Why</div>
        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-emerald-50 max-w-3xl">{t.whyTitle}</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {t.whyItems.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="group rounded-3xl border border-emerald-400/15 bg-gradient-to-br from-emerald-500/[0.07] to-transparent p-6 backdrop-blur-md hover:border-emerald-400/40 transition-colors"
            >
              <Icon className="h-7 w-7 text-emerald-300 mb-4" />
              <div className="text-xl font-bold text-emerald-50">{title}</div>
              <div className="mt-2 text-emerald-100/60">{body}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* Token */}
      <Section id="token">
        <div className="rounded-[2rem] border border-emerald-400/20 bg-gradient-to-br from-emerald-500/15 via-teal-500/5 to-transparent p-8 sm:p-14 backdrop-blur-xl relative overflow-hidden">
          <div aria-hidden className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="relative">
            <div className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-400/80 mb-4">03 · Token</div>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-emerald-50">{t.tokenTitle}</h2>
            <p className="mt-5 text-lg text-emerald-100/70 max-w-2xl leading-relaxed">{t.tokenBody}</p>
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
        <div className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-400/80 mb-4">04 · Tokenomics</div>
        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-emerald-50">{t.tokenomicsTitle}</h2>
        <p className="mt-4 text-lg text-emerald-100/70 max-w-2xl">{t.tokenomicsBody}</p>

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
            <div className="mt-3 text-emerald-100/60">Architecture, reputation math, moderation guilds and long-term governance.</div>
            <Link
              to="/community-token/whitepaper"
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold border border-emerald-400/30 text-emerald-100 hover:bg-emerald-500/10 transition-colors"
            >
              {t.whitepaperCta}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="order-1 lg:order-2">
            <div className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-400/80 mb-4">05 · Whitepaper</div>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-emerald-50">{t.whitepaperTitle}</h2>
            <p className="mt-5 text-lg text-emerald-100/70 leading-relaxed">{t.whitepaperBody}</p>
          </div>
        </div>
      </Section>

      {/* Roadmap */}
      <Section id="roadmap">
        <div className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-400/80 mb-4">06 · Roadmap</div>
        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-emerald-50">{t.roadmapTitle}</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {t.roadmapItems.map((r) => (
            <div
              key={r.period}
              className="rounded-3xl border border-emerald-400/15 bg-emerald-500/[0.05] p-6 backdrop-blur-md"
            >
              <div className="text-xs font-bold text-emerald-300/80 font-mono">{r.period}</div>
              <div className="mt-3 text-xl font-bold text-emerald-50">{r.title}</div>
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
        <div className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-400/80 mb-4">07 · FAQ</div>
        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-emerald-50">{t.faqTitle}</h2>
        <div className="mt-10 divide-y divide-emerald-400/10 rounded-3xl border border-emerald-400/15 bg-emerald-500/[0.04] backdrop-blur-md">
          {t.faqs.map((f, i) => (
            <details key={i} className="group p-6">
              <summary className="flex cursor-pointer items-start justify-between gap-6 text-left">
                <span className="text-lg font-semibold text-emerald-50">{f.q}</span>
                <HelpCircle className="h-5 w-5 text-emerald-300 transition-transform group-open:rotate-45" />
              </summary>
              <p className="mt-3 text-emerald-100/70 leading-relaxed">{f.a}</p>
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
        <div className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-400/80 mb-4">08 · Partners</div>
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
