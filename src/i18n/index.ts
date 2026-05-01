import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import tr from "./locales/tr.json";
import en from "./locales/en.json";
import ar from "./locales/ar.json";

const RTL_LANGS = ["ar"];

const normalizeLang = (lng?: string): "tr" | "en" | "ar" => {
  if (!lng) return "tr";
  if (lng.startsWith("en")) return "en";
  if (lng.startsWith("ar")) return "ar";
  return "tr";
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      tr: { translation: tr },
      en: { translation: en },
      ar: { translation: ar },
    },
    fallbackLng: "tr",
    supportedLngs: ["tr", "en", "ar"],
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "lang",
    },
  });

const applyDir = (lng?: string) => {
  if (typeof document === "undefined") return;
  const norm = normalizeLang(lng);
  document.documentElement.lang = norm;
  document.documentElement.dir = RTL_LANGS.includes(norm) ? "rtl" : "ltr";
};

if (typeof document !== "undefined") {
  applyDir(i18n.language);
  i18n.on("languageChanged", applyDir);
}

export default i18n;
