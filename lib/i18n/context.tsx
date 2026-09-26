'use client';

import React, { createContext, useContext, useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Locale, TranslationKey } from './types';
import { en, uk } from './dictionaries';

const dictionaries: Record<Locale, Record<TranslationKey, string>> = {
  en,
  uk,
};

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  locale: 'en',
  setLocale: () => {},
  t: (key: TranslationKey, fallback?: string) => en[key] ?? fallback ?? key,
});

export function LanguageProvider({
  children,
  initialLocale = 'en',
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    // Check localStorage on mount in case it differs from cookie
    try {
      const saved = localStorage.getItem('ch_locale') as Locale | null;
      if (saved && (saved === 'en' || saved === 'uk') && saved !== locale) {
        setLocaleState(saved);
        document.documentElement.lang = saved;
      } else {
        document.documentElement.lang = locale;
      }
    } catch {
      // ignore in restricted environments
    }
  }, [locale]);

  const setLocale = (newLocale: Locale) => {
    if (newLocale === locale) return;
    setLocaleState(newLocale);

    try {
      localStorage.setItem('ch_locale', newLocale);
      document.cookie = `ch_locale=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
      document.documentElement.lang = newLocale;
    } catch {
      // ignore
    }

    startTransition(() => {
      router.refresh();
    });
  };

  const t = (key: TranslationKey, fallback?: string): string => {
    const dict = dictionaries[locale] ?? dictionaries.en;
    return dict[key] ?? dictionaries.en[key] ?? fallback ?? key;
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
