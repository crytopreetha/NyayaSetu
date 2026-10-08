import { Router } from 'express';
import { z } from 'zod';
import { LanguageService } from '../services/language/language.service.js';
import { validate } from '../middleware/validate.middleware.js';

export const languageRouter = Router();

const translateSchema = z.object({
  text: z.string().min(1, 'Text to translate is required').max(10000),
  sourceLanguage: z.enum(['en', 'hi', 'mr']).optional(),
  targetLanguage: z.enum(['en', 'hi', 'mr']),
});

const detectSchema = z.object({
  text: z.string().min(1, 'Text is required').max(10000),
});

/**
 * GET /api/languages
 * Public endpoint to list supported languages
 */
languageRouter.get('/languages', (_req, res) => {
  const languages = LanguageService.getSupportedLanguages();
  res.status(200).json({
    success: true,
    data: languages,
    meta: {
      provider: LanguageService.getProviderName(),
      disclaimer: 'Translations are non-binding informational aids provided for citizen comprehension. Not certified legal translations.',
    },
  });
});

/**
 * POST /api/language/translate
 * Public endpoint for text translation (cached server-side)
 */
languageRouter.post(
  '/language/translate',
  validate({ body: translateSchema }),
  async (req, res, next) => {
    try {
      const { text, sourceLanguage, targetLanguage } = req.body;
      const result = await LanguageService.translateText(text, sourceLanguage, targetLanguage);

      res.status(200).json({
        success: true,
        data: result,
        meta: {
          disclaimer: 'Informational assistance only. This translation is not certified legal advice or a certified translation.',
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/language/detect
 * Public endpoint to identify language of input text
 */
languageRouter.post(
  '/language/detect',
  validate({ body: detectSchema }),
  async (req, res, next) => {
    try {
      const { text } = req.body;
      const result = await LanguageService.detectLanguage(text);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);
