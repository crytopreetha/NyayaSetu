import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import {
  SupportedLanguage,
  SUPPORTED_LANGUAGES,
  LanguageOption,
  TRANSLATIONS,
} from '../lib/translations';
import { useAuth } from './AuthContext';
import { userApi, languageApi } from '../lib/api';

const LANG_STORAGE_KEY = 'nyayasetu_preferred_lang';

interface LanguageContextValue {
  currentLanguage: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
  languages: LanguageOption[];
  t: (key: string, params?: Record<string, string | number>) => string;
  translateDynamic: (text: string, targetLang?: SupportedLanguage) => Promise<string>;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  // Initialize from localStorage or fallback to English
  const [currentLanguage, setCurrentLanguageState] = useState<SupportedLanguage>(() => {
    try {
      const stored = localStorage.getItem(LANG_STORAGE_KEY) as SupportedLanguage | null;
      if (stored && ['en', 'hi', 'mr'].includes(stored)) {
        return stored;
      }
    } catch {}
    return 'en';
  });

  // Sync with logged-in user profile on auth change
  useEffect(() => {
    if (user?.preferredLanguage && ['en', 'hi', 'mr'].includes(user.preferredLanguage)) {
      const userLang = user.preferredLanguage as SupportedLanguage;
      if (userLang !== currentLanguage) {
        setCurrentLanguageState(userLang);
        try {
          localStorage.setItem(LANG_STORAGE_KEY, userLang);
        } catch {}
      }
    }
  }, [user?.preferredLanguage]);

  const setLanguage = useCallback(
    async (lang: SupportedLanguage) => {
      if (!['en', 'hi', 'mr'].includes(lang)) return;

      setCurrentLanguageState(lang);
      try {
        localStorage.setItem(LANG_STORAGE_KEY, lang);
      } catch {}

      // If user is authenticated, persist to backend profile
      if (user) {
        try {
          await userApi.updateLanguage(lang);
          // Also update user in localStorage for consistency
          const userJson = localStorage.getItem('nyayasetu_user');
          if (userJson) {
            const parsed = JSON.parse(userJson);
            parsed.preferredLanguage = lang;
            localStorage.setItem('nyayasetu_user', JSON.stringify(parsed));
          }
        } catch (err) {
          console.warn('Could not persist language preference to backend profile:', err);
        }
      }
    },
    [user]
  );

  /**
   * Translate key with fallback to English
   */
  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const langDict = TRANSLATIONS[currentLanguage] || TRANSLATIONS.en;
      let text = langDict[key] || TRANSLATIONS.en[key] || key;

      if (params) {
        for (const [paramKey, paramVal] of Object.entries(params)) {
          text = text.replace(new RegExp(`{${paramKey}}`, 'g'), String(paramVal));
        }
      }

      return text;
    },
    [currentLanguage]
  );

  /**
   * Translate arbitrary dynamic text via backend Language API
   */
  const translateDynamic = useCallback(
    async (text: string, targetLang?: SupportedLanguage): Promise<string> => {
      const target = targetLang || currentLanguage;
      if (target === 'en') return text;

      try {
        const res = await languageApi.translate(text, target);
        return res.translatedText || text;
      } catch {
        return text;
      }
    },
    [currentLanguage]
  );

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        setLanguage,
        languages: SUPPORTED_LANGUAGES,
        t,
        translateDynamic,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextValue => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within <LanguageProvider>');
  }
  return ctx;
};
