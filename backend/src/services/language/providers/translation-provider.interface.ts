/**
 * Translation Provider Abstraction Interface
 * Defines standard contract allowing seamless swapping between TemporaryProvider and BhashiniProvider
 */

export interface TranslationProvider {
  readonly name: string;

  /**
   * Translate text between source and target language
   */
  translateText(
    text: string,
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<string>;

  /**
   * Detect the language of a given text
   */
  detectLanguage(text: string): Promise<{ language: string; confidence: number }>;

  /**
   * Check if the provider has necessary API keys/configuration
   */
  isConfigured(): boolean;
}
