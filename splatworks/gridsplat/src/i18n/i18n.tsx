import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { translations, type LanguageCode } from './translations';
import {
  I18nContext,
  type I18nValue,
  initialLanguage,
  languages,
  LANGUAGE_KEY,
} from './context';

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LanguageCode>(initialLanguage);

  useEffect(() => {
    const config = languages.find((item) => item.code === lang) ?? languages[0];
    document.documentElement.lang = config.htmlLang;
    document.documentElement.dir = config.dir;
  }, [lang]);

  const setLang = useCallback((code: LanguageCode) => {
    setLangState(code);
    try {
      window.localStorage.setItem(LANGUAGE_KEY, code);
    } catch {
      // localStorage may be blocked; language still applies for this session.
    }
  }, []);

  const t = useCallback(
    (value: string, vars?: Record<string, string | number>) => {
      const table = lang === 'en' ? undefined : translations[lang];
      let result = table?.[value] ?? value;

      if (vars) {
        result = result.replace(/\{([^}]+)\}/g, (match, key) =>
          vars[key] !== undefined ? String(vars[key]) : match,
        );
      }

      return result;
    },
    [lang],
  );

  const value = useMemo<I18nValue>(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
