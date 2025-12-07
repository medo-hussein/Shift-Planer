import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enTranslations from "../locales/en/translation.json";
import arTranslations from "../locales/ar/translation.json";
  i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: enTranslations,
    },
    ar: {
      translation: arTranslations,  
    },
  },
  lng: "ar",
  fallbackLng: "ar",
  interpolation: {
    escapeValue: false,
  },
});
console.log(i18n.language);

export default i18n;
