import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import tr from "./locales/tr.json";
import en from "./locales/en.json";

const normalizeLang = (lng?: string): "tr" | "en" => {
  if (!lng) return "en";
  if (lng.startsWith("tr")) return "tr";
  return "en";
};

/**
 * Geo-aware default language detector.
 * - If user is in Turkey → Turkish
 * - Otherwise → English
 * Result is cached in localStorage so we only call the geo API once per visitor
 * (unless the user explicitly picks a language via the switcher, which overrides).
 */
const geoDetector = {
  name: "geoDefault",
  lookup(): string | undefined {
    if (typeof window === "undefined") return undefined;
    try {
      // Honour an explicit user choice.
      const stored = localStorage.getItem("lang");
      if (stored) return undefined; // let localStorage detector handle it

      // Use cached geo result if present.
      const cachedGeo = localStorage.getItem("score-geo-lang");
      if (cachedGeo === "tr" || cachedGeo === "en") return cachedGeo;

      // Quick synchronous heuristic: timezone.
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      const isTRTimezone = tz === "Europe/Istanbul" || tz === "Asia/Istanbul" || tz === "Turkey";
      const initial = isTRTimezone ? "tr" : "en";

      // Kick off an async refinement using a free IP geo service; cache for next visit.
      void (async () => {
        try {
          const res = await fetch("https://ipapi.co/country/", { cache: "no-store" });
          if (!res.ok) return;
          const country = (await res.text()).trim().toUpperCase();
          const next = country === "TR" ? "tr" : "en";
          localStorage.setItem("score-geo-lang", next);
        } catch {
          /* ignore */
        }
      })();

      return initial;
    } catch {
      return undefined;
    }
  },
  cacheUserLanguage() {
    /* no-op: only the localStorage detector should persist explicit choices */
  },
};

const detector = new LanguageDetector();
detector.addDetector(geoDetector);

i18n
  .use(detector)
  .use(initReactI18next)
  .init({
    resources: {
      tr: { translation: tr },
      en: { translation: en },
    },
    fallbackLng: "en",
    supportedLngs: ["tr", "en"],
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
    detection: {
      order: ["localStorage", "geoDefault", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "lang",
    },
  });

const applyDir = (lng?: string) => {
  if (typeof document === "undefined") return;
  const norm = normalizeLang(lng);
  document.documentElement.lang = norm;
  document.documentElement.dir = "ltr";
};

if (typeof document !== "undefined") {
  applyDir(i18n.language);
  i18n.on("languageChanged", applyDir);
}

export default i18n;
