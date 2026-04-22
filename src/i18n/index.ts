import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import tr from "./locales/tr.json";
import en from "./locales/en.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      tr: { translation: tr },
      en: { translation: en },
    },
    fallbackLng: "tr",
    supportedLngs: ["tr", "en"],
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "lang",
    },
  });

if (typeof document !== "undefined") {
  document.documentElement.lang = i18n.language?.startsWith("en") ? "en" : "tr";
  i18n.on("languageChanged", (lng) => {
    document.documentElement.lang = lng?.startsWith("en") ? "en" : "tr";
  });
}

export default i18n;
