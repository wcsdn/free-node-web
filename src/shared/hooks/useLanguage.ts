/**
 * 语言 Hook
 * 基于 Zustand store
 */

import { useAppStore } from '@/stores/useAppStore';
import { getTranslation } from '@/config/i18n/translations';
import type { TranslationKey } from '@/config/i18n/translations';

export const useLanguage = () => {
  const language = useAppStore((state) => state.language);
  const setLanguage = useAppStore((state) => state.setLanguage);

  const t = (key: TranslationKey) => {
    return getTranslation(language, key);
  };

  return { language, setLanguage, t };
};
