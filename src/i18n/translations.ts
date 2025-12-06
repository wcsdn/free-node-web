import { en, type TranslationKey } from './en';
import { zh } from './zh';

export type Language = 'en' | 'zh';

export const translations = {
  en,
  zh,
} as const;

export const getTranslation = (lang: Language, key: TranslationKey): string => {
  return translations[lang][key] || translations.en[key];
};

export type { TranslationKey };
