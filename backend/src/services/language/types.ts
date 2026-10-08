/**
 * NyayaSetu Multilingual Language Service Types
 * Supported: English (en), Hindi (hi), Marathi (mr)
 */

export type SupportedLanguageCode = 'en' | 'hi' | 'mr';

export interface LanguageInfo {
  code: SupportedLanguageCode;
  name: string;
  nativeName: string;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
  },
  {
    code: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी',
  },
];

export interface TranslationResult {
  translatedText: string;
  sourceLanguage: SupportedLanguageCode;
  targetLanguage: SupportedLanguageCode;
  provider: string;
  cached: boolean;
}

export interface LanguageDetectionResult {
  language: SupportedLanguageCode;
  rawDetectedLanguage: string;
  confidence: number;
  isSupported: boolean;
}
