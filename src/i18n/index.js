import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import es from "./locales/es.json";
import en from "./locales/en.json";

const resources = {
  es: { translation: es },
  en: { translation: en },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "es",
    supportedLngs: ["es", "en"],

    // Default language
    lng: "es",

    interpolation: {
      escapeValue: false, // React already escapes values
    },

    detection: {
      // Order of detection
      order: ["localStorage", "navigator", "htmlTag"],
      // Cache user language on
      caches: ["localStorage"],
      // Key to use in localStorage
      lookupLocalStorage: "racoon-lms-lang",
    },

    react: {
      useSuspense: false,
    },
  });

export default i18n;

/**
 * Helper to change language programmatically
 * @param {'es' | 'en'} lang
 */
export const changeLanguage = (lang) => {
  i18n.changeLanguage(lang);
};

/**
 * Get current language
 * @returns {'es' | 'en'}
 */
export const getCurrentLanguage = () => {
  return i18n.language;
};
