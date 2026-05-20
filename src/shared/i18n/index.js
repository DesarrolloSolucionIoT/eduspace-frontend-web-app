import { createI18n } from 'vue-i18n';
import es from './locales/es.json';
import en from './locales/en.json';

const SUPPORTED = ['es', 'en'];
const STORAGE_KEY = 'eduspace.locale';

function detectInitialLocale() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && SUPPORTED.includes(stored)) return stored;
  const nav = (navigator.language || 'es').toLowerCase().split('-')[0];
  return SUPPORTED.includes(nav) ? nav : 'es';
}

const i18n = createI18n({
  legacy: true,
  globalInjection: true,
  locale: detectInitialLocale(),
  fallbackLocale: 'es',
  messages: { es, en },
});

export function setLocale(locale) {
  if (!SUPPORTED.includes(locale)) return;
  i18n.global.locale = locale;
  localStorage.setItem(STORAGE_KEY, locale);
  document.documentElement.setAttribute('lang', locale);
}

export const SUPPORTED_LOCALES = SUPPORTED;
export default i18n;
