/**
 * NyayaSetu — Gemini AI Document Analysis Service
 *
 * Uses the Google Gemini API to analyze legal documents and produce
 * structured, citizen-friendly explanations with evidence-based risk flags.
 *
 * The Gemini API key is loaded exclusively from the backend environment
 * and is NEVER exposed to the frontend, API responses, or git.
 *
 * When no Gemini key is configured, the service falls back gracefully
 * to the existing heuristic analyzer.
 */

import { GoogleGenAI } from '@google/genai';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { buildSystemInstruction, buildUserPrompt } from './prompt-builder.js';
import type {
  AnalysisInput,
  GeminiAnalysisResult,
  RiskIndicator,
  IdentifiedParty,
  ImportantDate,
  Deadline,
  Claim,
  SectionMentioned,
} from './types.js';

// ── Constants ───────────────────────────────────────────────────────────────

const GEMINI_MODEL = 'gemini-2.5-flash';
const FALLBACK_MODEL = 'gemini-1.5-flash';
const MAX_INPUT_CHARS = 100_000;
const REQUEST_TIMEOUT_MS = 120_000; // 2 minutes

// ── Service ─────────────────────────────────────────────────────────────────

export class GeminiService {

  /**
   * Returns true if a Gemini API key is configured in the environment.
   */
  static isConfigured(): boolean {
    return Boolean(env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim().length > 0);
  }

  /**
   * Analyze a legal document using Gemini AI.
   *
   * @throws Error if the key is missing, input is empty, or API fails.
   */
  static async analyzeDocument(input: AnalysisInput): Promise<GeminiAnalysisResult> {
    // ── Guard: API key ────────────────────────────────────────────────────
    if (!GeminiService.isConfigured()) {
      throw new Error(
        'GEMINI_API_KEY is not configured. Set it in backend/.env to enable AI analysis.'
      );
    }

    // ── Guard: Empty document ─────────────────────────────────────────────
    const trimmedText = (input.extractedText || '').trim();
    if (trimmedText.length === 0) {
      throw new Error('Document text is empty. Cannot perform AI analysis on an empty document.');
    }

    // ── Guard: Very large document — truncate with warning ────────────────
    if (trimmedText.length > MAX_INPUT_CHARS) {
      logger.warn(
        `Document text exceeds ${MAX_INPUT_CHARS} chars (${trimmedText.length}). Truncating for Gemini analysis.`
      );
      input = { ...input, extractedText: trimmedText.slice(0, MAX_INPUT_CHARS) };
    }

    // ── Build prompts ─────────────────────────────────────────────────────
    const systemInstruction = buildSystemInstruction();
    const userPrompt = buildUserPrompt(input);

    // ── Call Gemini ──────────────────────────────────────────────────────
    logger.info(`GeminiService: Starting analysis (model=${GEMINI_MODEL}, lang=${input.userLanguage}, textLen=${input.extractedText.length})`);

    const genAI = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

    try {
      const callModel = async (modelName: string) => {
        return Promise.race([
          genAI.models.generateContent({
            model: modelName,
            contents: userPrompt,
            config: {
              systemInstruction,
              temperature: 0.2,
              topP: 0.8,
              topK: 40,
              maxOutputTokens: 8192,
              responseMimeType: 'application/json',
            },
          }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Gemini API request timed out after 2 minutes.')), REQUEST_TIMEOUT_MS)
          ),
        ]);
      };

      let response: any;
      try {
        response = await callModel(GEMINI_MODEL);
      } catch (firstErr: any) {
        if (firstErr?.message?.includes('not found') || firstErr?.message?.includes('404') || firstErr?.message?.includes('no longer available')) {
          logger.warn(`GeminiService: Model ${GEMINI_MODEL} failed, falling back to ${FALLBACK_MODEL}`);
          response = await callModel(FALLBACK_MODEL);
        } else {
          throw firstErr;
        }
      }

      // ── Extract text response ─────────────────────────────────────────
      const rawText = response.text?.trim();
      if (!rawText) {
        throw new Error('Gemini returned an empty response.');
      }

      logger.debug(`GeminiService: Raw response length = ${rawText.length}`);

      // ── Parse JSON ────────────────────────────────────────────────────
      const parsed = GeminiService.safeParseJson(rawText);
      const validated = GeminiService.validateAndNormalize(parsed);

      logger.info(`GeminiService: Analysis complete. DocumentType="${validated.documentType}", Risks=${validated.riskIndicators.length}, Parties=${validated.parties.length}`);

      return validated;

    } catch (err: any) {
      // Distinguish API errors from parse errors
      const message = err?.message || 'Unknown Gemini API error';

      if (message.includes('timed out')) {
        logger.error('GeminiService: Request timed out.');
        throw new Error('AI analysis timed out. The document may be too large or the service is temporarily busy.');
      }

      if (message.includes('429') || message.includes('RESOURCE_EXHAUSTED')) {
        logger.error('GeminiService: Rate limit exceeded.');
        throw new Error('AI service rate limit exceeded. Please try again in a few minutes.');
      }

      if (message.includes('403') || message.includes('PERMISSION_DENIED')) {
        logger.error('GeminiService: Invalid API key or permission denied.');
        throw new Error('AI service authentication failed. Please verify the Gemini API key.');
      }

      logger.error(`GeminiService: API error — ${message}`);
      throw new Error(`AI analysis failed: ${message}`);
    }
  }

  // ── JSON Parsing ──────────────────────────────────────────────────────────

  /**
   * Safely parse the Gemini response as JSON, handling markdown fences
   * and other formatting artifacts.
   */
  private static safeParseJson(raw: string): any {
    let cleaned = raw.trim();

    // Strip markdown code fences if present
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?\s*```$/, '');
    }

    // Strip leading/trailing whitespace again
    cleaned = cleaned.trim();

    try {
      return JSON.parse(cleaned);
    } catch (e1) {
      // Try to extract the first JSON object from the response
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          return JSON.parse(match[0]);
        } catch (e2) {
          throw new Error(
            `Failed to parse Gemini response as JSON. Raw length: ${raw.length}. Parse errors: ${(e1 as Error).message}`
          );
        }
      }
      throw new Error(
        `Gemini response is not valid JSON. Raw length: ${raw.length}. Error: ${(e1 as Error).message}`
      );
    }
  }

  // ── Validation & Normalization ────────────────────────────────────────────

  /**
   * Validates and normalizes the parsed JSON into the GeminiAnalysisResult type.
   * Provides safe defaults for any missing or malformed fields so the app
   * never crashes on unexpected AI output.
   */
  private static validateAndNormalize(raw: any): GeminiAnalysisResult {
    if (!raw || typeof raw !== 'object') {
      return GeminiService.emptyResult('Could not determine — AI response was malformed.');
    }

    return {
      documentType: GeminiService.safeString(raw.documentType, 'Unknown Document Type'),
      summary: GeminiService.safeString(raw.summary, 'Summary could not be generated from this document.'),
      parties: GeminiService.safeArray<IdentifiedParty>(raw.parties, (p) => ({
        name: GeminiService.safeString(p.name, 'Unknown'),
        role: GeminiService.safeString(p.role, 'Unknown'),
        sourceReference: p.sourceReference || null,
      })),
      importantDates: GeminiService.safeArray<ImportantDate>(raw.importantDates, (d) => ({
        date: GeminiService.safeString(d.date, ''),
        description: GeminiService.safeString(d.description, ''),
        sourceReference: d.sourceReference || null,
      })),
      deadlines: GeminiService.safeArray<Deadline>(raw.deadlines, (d) => ({
        date: GeminiService.safeString(d.date, ''),
        description: GeminiService.safeString(d.description, ''),
        urgency: GeminiService.safeRiskLevel(d.urgency),
        sourceReference: d.sourceReference || null,
      })),
      claims: GeminiService.safeArray<Claim>(raw.claims, (c) => ({
        description: GeminiService.safeString(c.description, ''),
        sourceReference: c.sourceReference || null,
      })),
      sectionsMentioned: GeminiService.safeArray<SectionMentioned>(raw.sectionsMentioned, (s) => ({
        act: GeminiService.safeString(s.act, ''),
        section: GeminiService.safeString(s.section, ''),
        relevance: GeminiService.safeString(s.relevance, ''),
        sourceReference: s.sourceReference || null,
      })),
      requiredActions: GeminiService.safeStringArray(raw.requiredActions),
      missingInformation: GeminiService.safeStringArray(raw.missingInformation),
      riskIndicators: GeminiService.safeArray<RiskIndicator>(raw.riskIndicators, (r) => ({
        level: GeminiService.safeRiskLevel(r.level),
        description: GeminiService.safeString(r.description, ''),
        sourceReference: r.sourceReference || null,
      })),
      professionalReviewRecommended: typeof raw.professionalReviewRecommended === 'boolean'
        ? raw.professionalReviewRecommended
        : true,
    };
  }

  // ── Utility Helpers ───────────────────────────────────────────────────────

  private static safeString(val: any, fallback: string): string {
    if (typeof val === 'string' && val.trim().length > 0) return val.trim();
    return fallback;
  }

  private static safeRiskLevel(val: any): 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL' {
    const upper = String(val || '').toUpperCase();
    if (['HIGH', 'MEDIUM', 'LOW', 'INFORMATIONAL'].includes(upper)) {
      return upper as any;
    }
    return 'INFORMATIONAL';
  }

  private static safeArray<T>(arr: any, mapper: (item: any) => T): T[] {
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((item: any) => item && typeof item === 'object')
      .map(mapper);
  }

  private static safeStringArray(arr: any): string[] {
    if (!Array.isArray(arr)) return [];
    return arr.filter((s: any) => typeof s === 'string' && s.trim().length > 0).map((s: string) => s.trim());
  }

  private static emptyResult(message: string): GeminiAnalysisResult {
    return {
      documentType: 'Unknown',
      summary: message,
      parties: [],
      importantDates: [],
      deadlines: [],
      claims: [],
      sectionsMentioned: [],
      requiredActions: [],
      missingInformation: [message],
      riskIndicators: [],
      professionalReviewRecommended: true,
    };
  }
}
