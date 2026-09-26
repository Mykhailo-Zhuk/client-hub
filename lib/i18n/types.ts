import { en } from './dictionaries';

export type Locale = 'en' | 'uk';

export type TranslationKey = keyof typeof en;
