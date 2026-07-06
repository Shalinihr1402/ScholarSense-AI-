import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en/translation.json";
import kn from "./locales/kn/translation.json";
import hi from "./locales/hi/translation.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      kn: { translation: kn },
      hi: { translation: hi },
    },
    fallbackLng: "en",
    lng: localStorage.getItem("scholarsense_lang") || "en",
    interpolation: { escapeValue: false },
  });

export default i18n;
