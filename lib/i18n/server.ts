import { cookies } from 'next/headers';
import type { Locale, TranslationKey } from './types';
import { en, uk } from './dictionaries';

const dictionaries: Record<Locale, Record<TranslationKey, string>> = {
  en,
  uk,
};

export async function getServerLocale(): Promise<Locale> {
  try {
    const cookieStore = await cookies();
    const c = cookieStore.get('ch_locale')?.value;
    return c === 'uk' ? 'uk' : 'en';
  } catch {
    return 'en';
  }
}

export async function getServerTranslation(): Promise<{
  locale: Locale;
  t: (key: TranslationKey, fallback?: string) => string;
}> {
  const locale = await getServerLocale();
  const dict = dictionaries[locale] ?? dictionaries.en;
  return {
    locale,
    t: (key: TranslationKey, fallback?: string) =>
      dict[key] ?? dictionaries.en[key] ?? fallback ?? key,
  };
}
