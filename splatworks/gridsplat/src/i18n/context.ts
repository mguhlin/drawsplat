import { createContext, useContext } from 'react';

import { type LanguageCode } from './translations';

export const languages: Array<{
  code: LanguageCode;
  label: string;
  dir: 'ltr' | 'rtl';
  htmlLang: string;
}> = [
  { code: 'en', label: 'English', dir: 'ltr', htmlLang: 'en' },
  { code: 'es', label: 'Español', dir: 'ltr', htmlLang: 'es' },
  { code: 'vi', label: 'Tiếng Việt', dir: 'ltr', htmlLang: 'vi' },
  { code: 'ar', label: 'العربية', dir: 'rtl', htmlLang: 'ar' },
  { code: 'zh', label: '中文', dir: 'ltr', htmlLang: 'zh' },
  { code: 'uh', label: 'हिन्दी / اردو', dir: 'ltr', htmlLang: 'hi' },
];

export const LANGUAGE_KEY = 'drawsplat.language';

export function normalizeLanguage(value: string | null | undefined): LanguageCode {
  const lang = (value || '').toLowerCase();
  if (lang.startsWith('es')) return 'es';
  if (lang.startsWith('vi')) return 'vi';
  if (lang.startsWith('ar')) return 'ar';
  if (lang.startsWith('zh')) return 'zh';
  if (lang === 'uh' || lang.startsWith('ur') || lang.startsWith('hi')) return 'uh';
  return 'en';
}

export function initialLanguage(): LanguageCode {
  if (typeof window === 'undefined') return 'en';

  try {
    const params = new URLSearchParams(window.location.search);
    return normalizeLanguage(
      params.get('lang') ||
        window.localStorage.getItem(LANGUAGE_KEY) ||
        window.navigator.language,
    );
  } catch {
    return 'en';
  }
}

export interface I18nValue {
  lang: LanguageCode;
  setLang: (code: LanguageCode) => void;
  t: (value: string, vars?: Record<string, string | number>) => string;
}

export const I18nContext = createContext<I18nValue | null>(null);

export function useI18n(): I18nValue {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }

  return context;
}
