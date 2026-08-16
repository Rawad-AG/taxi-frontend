import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { en, ar, type Lang } from './dict';

export const STORAGE_KEY = 'drmtaxi.lang';

export function getInitialLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'en' || saved === 'ar') return saved;
  } catch {
    /* ignore */
  }
  return typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('ar') ? 'ar' : 'en';
}

export function applyDir(lang: Lang) {
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ar: { translation: ar },
  },
  lng: getInitialLang(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  missingKeyHandler: (_lng, _ns, key) => {
    if (import.meta.env.DEV) console.warn(`[i18n] missing key: ${key}`);
    return key;
  },
});

applyDir(i18n.language as Lang);

export function setLanguage(lang: Lang) {
  void i18n.changeLanguage(lang);
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* ignore */
  }
  applyDir(lang);
}

export default i18n;
