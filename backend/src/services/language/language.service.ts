import { TranslationProvider } from './providers/translation-provider.interface.js';
import { TemporaryProvider } from './providers/temporary.provider.js';
import { BhashiniProvider } from './providers/bhashini.provider.js';
import {
  SupportedLanguageCode,
  SUPPORTED_LANGUAGES,
  LanguageInfo,
  TranslationResult,
  LanguageDetectionResult,
} from './types.js';
import { logger } from '../../utils/logger.js';

export class LanguageService {
  private static provider: TranslationProvider = LanguageService.resolveProvider();
  
  // LRU-style translation cache: "src:tgt:text" -> translatedText
  private static cache = new Map<string, string>();
  private static readonly MAX_CACHE_SIZE = 1000;

  /**
   * Determine whether to use Bhashini or the clean Temporary provider
   */
  private static resolveProvider(): TranslationProvider {
    const bhashini = new BhashiniProvider();
    if (bhashini.isConfigured()) {
      logger.info('LanguageService: Active provider -> BhashiniProvider');
      return bhashini;
    }
    logger.info('LanguageService: Active provider -> TemporaryProvider (Local Legal Lexicon & Grammar Rules)');
    return new TemporaryProvider();
  }

  /**
   * Allows hot-swapping or testing provider implementation
   */
  public static setProvider(customProvider: TranslationProvider): void {
    LanguageService.provider = customProvider;
    LanguageService.cache.clear();
    logger.info(`LanguageService provider changed to: ${customProvider.name}`);
  }

  public static getProviderName(): string {
    return LanguageService.provider.name;
  }

  /**
   * Returns supported languages: en, hi, mr
   */
  public static getSupportedLanguages(): LanguageInfo[] {
    return SUPPORTED_LANGUAGES;
  }

  /**
   * Validates if a language code is among supported [en, hi, mr]
   */
  public static isSupported(code: string): code is SupportedLanguageCode {
    return ['en', 'hi', 'mr'].includes(code);
  }

  /**
   * Detects language of input text
   */
  public static async detectLanguage(text: string): Promise<LanguageDetectionResult> {
    const res = await LanguageService.provider.detectLanguage(text);
    const supported = LanguageService.isSupported(res.language);
    const validCode: SupportedLanguageCode = supported ? (res.language as SupportedLanguageCode) : 'en';

    return {
      language: validCode,
      rawDetectedLanguage: res.language,
      confidence: res.confidence,
      isSupported: supported,
    };
  }

  /**
   * Translate text from sourceLanguage to targetLanguage with in-memory caching
   */
  public static async translateText(
    text: string,
    sourceLanguage?: string,
    targetLanguage?: string
  ): Promise<TranslationResult> {
    if (!text || text.trim() === '') {
      return {
        translatedText: '',
        sourceLanguage: 'en',
        targetLanguage: 'en',
        provider: LanguageService.provider.name,
        cached: false,
      };
    }

    // Default targetLanguage to 'en' if not provided
    const target: SupportedLanguageCode =
      targetLanguage && LanguageService.isSupported(targetLanguage)
        ? (targetLanguage as SupportedLanguageCode)
        : 'en';

    // Auto-detect source if not specified
    let source: SupportedLanguageCode;
    if (sourceLanguage && LanguageService.isSupported(sourceLanguage)) {
      source = sourceLanguage as SupportedLanguageCode;
    } else {
      const detected = await LanguageService.detectLanguage(text);
      source = detected.language;
    }

    // If source and target are identical, return directly
    if (source === target) {
      return {
        translatedText: text,
        sourceLanguage: source,
        targetLanguage: target,
        provider: LanguageService.provider.name,
        cached: false,
      };
    }

    // Check cache
    const cacheKey = `${source}:${target}:${text.trim()}`;
    if (LanguageService.cache.has(cacheKey)) {
      return {
        translatedText: LanguageService.cache.get(cacheKey)!,
        sourceLanguage: source,
        targetLanguage: target,
        provider: LanguageService.provider.name,
        cached: true,
      };
    }

    // Translate via provider
    const translatedText = await LanguageService.provider.translateText(text, source, target);

    // Store in cache (manage cache size limit)
    if (LanguageService.cache.size >= LanguageService.MAX_CACHE_SIZE) {
      const oldestKey = LanguageService.cache.keys().next().value;
      if (oldestKey) LanguageService.cache.delete(oldestKey);
    }
    LanguageService.cache.set(cacheKey, translatedText);

    return {
      translatedText,
      sourceLanguage: source,
      targetLanguage: target,
      provider: LanguageService.provider.name,
      cached: false,
    };
  }

  /**
   * Helper to translate an entire AI analysis structure into the target language
   */
  public static async translateAnalysis(
    analysis: any,
    targetLanguage: SupportedLanguageCode
  ): Promise<any> {
    if (targetLanguage === 'en' || !analysis) {
      return analysis;
    }

    // Translate plain language summary
    const summaryRes = await LanguageService.translateText(
      analysis.plainLanguageSummary,
      'en',
      targetLanguage
    );

    // Translate risk indicator descriptions
    const translatedRisks = await Promise.all(
      (analysis.riskIndicators || []).map(async (risk: any) => {
        const trans = await LanguageService.translateText(risk.description, 'en', targetLanguage);
        return {
          ...risk,
          description: trans.translatedText,
        };
      })
    );

    // Translate suggested next steps
    const translatedSteps = await Promise.all(
      (analysis.suggestedNextSteps || []).map(async (step: any) => {
        const trans = await LanguageService.translateText(step, 'en', targetLanguage);
        return trans.translatedText;
      })
    );

    // Translate critical dates descriptions (keep date untouched)
    const translatedDates = await Promise.all(
      (analysis.criticalDates || []).map(async (d: any) => {
        const trans = await LanguageService.translateText(d.description, 'en', targetLanguage);
        return {
          ...d,
          description: trans.translatedText,
        };
      })
    );

    // Translate act relevance
    const translatedActs = await Promise.all(
      (analysis.applicableActsOrSections || []).map(async (act: any) => {
        const trans = await LanguageService.translateText(act.relevance, 'en', targetLanguage);
        return {
          ...act,
          relevance: trans.translatedText,
        };
      })
    );

    return {
      ...analysis,
      plainLanguageSummary: summaryRes.translatedText,
      riskIndicators: translatedRisks,
      suggestedNextSteps: translatedSteps,
      criticalDates: translatedDates,
      applicableActsOrSections: translatedActs,
    };
  }

  public static clearCache(): void {
    LanguageService.cache.clear();
  }
}
