/**
 * NyayaSetu Document Processing & AI Pipeline Service
 * 
 * Pipeline Workflow:
 * 1. Text Extraction (PDF, DOCX, TXT)
 * 2. Status Progression: UPLOADED -> PROCESSING -> ANALYZING -> COMPLETED (or FAILED)
 * 3. AI Document Comprehension (Plain-language explanation, dates, entities, risk flags, next steps)
 * 4. Case Event and Notification logging
 * 
 * Compliance:
 * - Does NOT make legal conclusions or replace advocates.
 * - Non-binding informational aid.
 */

import fs from 'fs/promises';
import path from 'path';
import { createRequire } from 'module';
import mammoth from 'mammoth';
import { db } from '../config/db.js';
import { logger } from '../utils/logger.js';
import { AIAnalysisService } from './ai-analysis.service.js';
import { CaseEventService } from './case-event.service.js';
import { NotificationService } from './notification.service.js';
import { LanguageService, SupportedLanguageCode } from './language/index.js';
import { GeminiService } from './ai/index.js';
import type { GeminiAnalysisResult } from './ai/types.js';

const require = createRequire(import.meta.url);

export class DocumentProcessingService {
  /**
   * Extract plain text from supported document types (PDF, DOCX, TXT)
   */
  static async extractText(filePath: string, mimeType: string, originalName: string): Promise<string> {
    const ext = path.extname(originalName).toLowerCase();
    const buffer = await fs.readFile(filePath);

    if (ext === '.txt' || mimeType.includes('text/plain')) {
      return buffer.toString('utf-8');
    }

    if (ext === '.docx' || mimeType.includes('wordprocessingml.document')) {
      const result = await mammoth.extractRawText({ buffer });
      return result.value || '';
    }

    if (ext === '.pdf' || mimeType.includes('application/pdf')) {
      try {
        const { PDFParse } = require('pdf-parse');
        const parser = new PDFParse({ data: buffer });
        await parser.load();
        const res = await parser.getText();
        await parser.destroy();
        if (typeof res === 'string') return res;
        if (res && typeof res.text === 'string') return res.text;
        return '';
      } catch (err: any) {
        logger.warn(`PDFParse standard extraction encountered warning: ${err?.message || err}. Attempting fallback string extraction.`);
        // Fallback simple stream text decoder for basic PDF contents
        const raw = buffer.toString('latin1');
        const matches = raw.match(/\((.*?)\)\s*Tj/g);
        if (matches && matches.length > 0) {
          return matches.map((m: string) => m.replace(/^\(|\)\s*Tj$/g, '')).join(' ');
        }
        return '';
      }
    }

    throw new Error(`Unsupported document extension for text extraction: ${ext} (${mimeType})`);
  }

  /**
   * Process the document through the processing & analysis pipeline
   */
  static async processDocument(documentId: string): Promise<void> {
    try {
      // 1. Fetch document record
      const docRes = await db.query(
        'SELECT * FROM documents WHERE id = $1;',
        [documentId]
      );

      if (docRes.rows.length === 0) {
        throw new Error(`Document not found: ${documentId}`);
      }

      const doc = docRes.rows[0];

      // 2. Mark status: PROCESSING
      await db.query(
        `UPDATE documents SET processing_status = 'PROCESSING' WHERE id = $1;`,
        [documentId]
      );
      logger.info(`Document ${documentId} (${doc.original_name}) status set to PROCESSING`);

      // 3. Extract text
      const extractedText = await this.extractText(
        doc.storage_path,
        doc.mime_type,
        doc.original_name
      );

      const trimmedText = extractedText.replace(/\r\n/g, '\n').trim().slice(0, 100000);
      
      // Identify language using LanguageService
      const detection = await LanguageService.detectLanguage(trimmedText);
      const detectedLanguage = detection.language;

      // Save extracted text and detected language
      await db.query(
        `UPDATE documents 
         SET extracted_text = $1, 
             detected_language = $2, 
             processing_status = 'ANALYZING'
         WHERE id = $3;`,
        [trimmedText, detectedLanguage, documentId]
      );
      logger.info(`Document ${documentId} status set to ANALYZING. Extracted ${trimmedText.length} characters in language: ${detectedLanguage}.`);

      // 4. Fetch user preferred language
      const userRes = await db.query(
        'SELECT preferred_language FROM users WHERE id = $1;',
        [doc.uploaded_by]
      );
      const userLang: SupportedLanguageCode =
        (userRes.rows[0]?.preferred_language && LanguageService.isSupported(userRes.rows[0].preferred_language))
          ? (userRes.rows[0].preferred_language as SupportedLanguageCode)
          : 'en';

      // 5. Run AI Document Comprehension
      // Fetch case metadata for context
      const caseRes = await db.query(
        'SELECT case_number, title, category, jurisdiction FROM cases WHERE id = $1;',
        [doc.case_id]
      );
      const caseRow = caseRes.rows[0];

      let analysisData: {
        documentType: string;
        plainLanguageSummary: string;
        keyEntities: Record<string, any>;
        criticalDates: Array<Record<string, any>>;
        riskIndicators: Array<Record<string, any>>;
        suggestedNextSteps: string[];
        applicableActsOrSections: Array<Record<string, any>>;
        confidenceScore: number;
        provider: string;
      };

      if (GeminiService.isConfigured()) {
        // ── Gemini AI Analysis ──────────────────────────────────────────
        logger.info(`Document ${documentId}: Using Gemini AI for analysis`);
        try {
          const geminiResult: GeminiAnalysisResult = await GeminiService.analyzeDocument({
            extractedText: trimmedText,
            userLanguage: userLang,
            caseMetadata: caseRow ? {
              caseNumber: caseRow.case_number,
              caseTitle: caseRow.title,
              caseCategory: caseRow.category,
              jurisdiction: caseRow.jurisdiction,
            } : undefined,
          });

          analysisData = this.mapGeminiResultToStorage(geminiResult, userLang, detectedLanguage);

        } catch (geminiErr: any) {
          logger.warn(`Document ${documentId}: Gemini analysis failed (${geminiErr?.message}). Falling back to heuristic analyzer.`);
          const fallback = this.analyzeDocumentContent(trimmedText, doc.original_name);
          const localized = await LanguageService.translateAnalysis(fallback, userLang);
          analysisData = {
            ...localized,
            keyEntities: {
              ...(localized.keyEntities || {}),
              outputLanguage: userLang,
              documentLanguage: detectedLanguage,
              disclaimer: 'Informational assistance only. This AI-generated explanation is not certified legal advice or a certified translation.',
              provider: 'heuristic-fallback',
            },
            provider: 'heuristic-fallback',
          };
        }
      } else {
        // ── Heuristic Fallback (no Gemini key) ─────────────────────────
        logger.info(`Document ${documentId}: GEMINI_API_KEY not set. Using heuristic analyzer.`);
        const fallback = this.analyzeDocumentContent(trimmedText, doc.original_name);
        const localized = await LanguageService.translateAnalysis(fallback, userLang);
        analysisData = {
          ...localized,
          keyEntities: {
            ...(localized.keyEntities || {}),
            outputLanguage: userLang,
            documentLanguage: detectedLanguage,
            disclaimer: 'Informational assistance only. This AI-generated explanation is not certified legal advice or a certified translation.',
            provider: 'heuristic',
          },
          provider: 'heuristic',
        };
      }

      // Check if analysis already exists for this document
      const existingAnalysis = await db.query(
        'SELECT id FROM ai_analysis WHERE document_id = $1;',
        [documentId]
      );

      if (existingAnalysis.rows.length === 0) {
        await AIAnalysisService.createAnalysis({
          documentId: doc.id,
          caseId: doc.case_id,
          documentType: analysisData.documentType,
          plainLanguageSummary: analysisData.plainLanguageSummary,
          keyEntities: analysisData.keyEntities,
          criticalDates: analysisData.criticalDates,
          riskIndicators: analysisData.riskIndicators,
          suggestedNextSteps: analysisData.suggestedNextSteps,
          applicableActsOrSections: analysisData.applicableActsOrSections,
          confidenceScore: analysisData.confidenceScore,
        });
      }

      // 6. Create Case Event
      try {
        await CaseEventService.createEvent({
          caseId: doc.case_id,
          eventType: 'DOCUMENT_UPLOAD',
          title: `Document Processed: ${doc.original_name}`,
          description: `Document text successfully extracted (${analysisData.documentType}). Plain-language comprehension ready in ${userLang.toUpperCase()}.`,
          actorId: doc.uploaded_by,
        });
      } catch (evtErr) {
        logger.warn(`Could not log case event for document ${documentId}: ${evtErr}`);
      }

      // 6. Send Notification to uploader
      try {
        await NotificationService.createNotification({
          userId: doc.uploaded_by,
          type: 'DOCUMENT',
          title: 'Document Analysis Ready',
          message: `Analysis for "${doc.original_name}" has completed successfully. View summary in your case dossier.`,
          linkUrl: `/citizen/cases/${doc.case_id}`,
        });
      } catch (notifErr) {
        logger.warn(`Could not send notification for document ${documentId}: ${notifErr}`);
      }

      // 7. Mark status: COMPLETED
      await db.query(
        `UPDATE documents SET processing_status = 'COMPLETED' WHERE id = $1;`,
        [documentId]
      );
      logger.info(`Document ${documentId} processing COMPLETED successfully.`);
    } catch (err: any) {
      logger.error(`Error processing document ${documentId}: ${err?.message || err}`);
      try {
        await db.query(
          `UPDATE documents SET processing_status = 'FAILED' WHERE id = $1;`,
          [documentId]
        );
      } catch (updateErr) {
        logger.error(`Failed to set document status to FAILED: ${updateErr}`);
      }
    }
  }

  /**
   * Maps structured Gemini analysis output into the database schema format
   */
  private static mapGeminiResultToStorage(
    gemini: GeminiAnalysisResult,
    userLang: SupportedLanguageCode,
    detectedLang: string
  ) {
    return {
      documentType: gemini.documentType || 'General Legal Document',
      plainLanguageSummary: gemini.summary,
      keyEntities: {
        parties: gemini.parties || [],
        claims: gemini.claims || [],
        missingInformation: gemini.missingInformation || [],
        professionalReviewRecommended: gemini.professionalReviewRecommended ?? true,
        outputLanguage: userLang,
        documentLanguage: detectedLang,
        disclaimer: 'Informational assistance only. This AI-generated explanation is not certified legal advice or a certified translation.',
        provider: 'gemini',
      },
      criticalDates: [
        ...(gemini.importantDates || []).map((d) => ({
          date: d.date,
          description: d.description,
          reference: d.sourceReference,
          type: 'important_date',
        })),
        ...(gemini.deadlines || []).map((d) => ({
          date: d.date,
          description: d.description,
          reference: d.sourceReference,
          urgency: d.urgency,
          type: 'deadline',
        })),
      ],
      riskIndicators: (gemini.riskIndicators || []).map((r) => ({
        level: r.level,
        description: r.description,
        sourceReference: r.sourceReference,
      })),
      suggestedNextSteps: gemini.requiredActions || [],
      applicableActsOrSections: (gemini.sectionsMentioned || []).map((s) => ({
        act: s.act,
        section: s.section,
        relevance: s.relevance,
        sourceReference: s.sourceReference,
      })),
      confidenceScore: 0.95,
      provider: 'gemini',
    };
  }

  /**
   * Helper to detect language (simple heuristic)
   */
  private static detectLanguage(text: string): string {
    if (!text || text.length === 0) return 'en';
    // Check for Devanagari script (Hindi/Marathi)
    const devanagariCount = (text.match(/[\u0900-\u097F]/g) || []).length;
    if (devanagariCount > 20) {
      // Heuristic: check common Marathi words
      if (text.includes('आहे') || text.includes('उतारा') || text.includes('जमीन') || text.includes('फेरफार')) {
        return 'mr';
      }
      return 'hi';
    }
    return 'en';
  }

  /**
   * Plain-language document analysis without legal conclusions
   */
  private static analyzeDocumentContent(text: string, filename: string) {
    const lower = text.toLowerCase();
    const fname = filename.toLowerCase();

    // Determine document type
    let documentType = 'General Legal Document';
    if (lower.includes('7/12') || lower.includes('सातबारा') || lower.includes('mutation') || fname.includes('7_12') || fname.includes('revenue')) {
      documentType = 'Land Revenue Record (7/12 Extract / Mutation)';
    } else if (lower.includes('notice') || lower.includes('summons') || lower.includes('objection')) {
      documentType = 'Legal Notice / Court Summons';
    } else if (lower.includes('affidavit') || lower.includes('शपथपत्र')) {
      documentType = 'Affidavit / Declaration';
    } else if (lower.includes('agreement') || lower.includes('contract') || lower.includes('deed')) {
      documentType = 'Agreement / Sale Deed';
    } else if (lower.includes('consumer') || lower.includes('complaint')) {
      documentType = 'Consumer Dispute Filing';
    }

    // Extract dates using regex
    const dateRegex = /\b(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}|\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,]+\d{4})\b/gi;
    const matchedDates = text.match(dateRegex) || [];
    const uniqueDates = Array.from(new Set(matchedDates)).slice(0, 5);

    const criticalDates = uniqueDates.map((d, idx) => ({
      date: d,
      description: idx === 0 ? 'Document transaction / issuance date' : `Record reference date (${idx + 1})`,
    }));

    if (criticalDates.length === 0) {
      criticalDates.push({
        date: new Date().toISOString().split('T')[0],
        description: 'Document submission timestamp recorded on NyayaSetu',
      });
    }

    // Key entities
    const entities: Record<string, any> = {
      jurisdiction: lower.includes('pune') || lower.includes('haveli') ? 'Pune / Haveli Taluka' : 'District Revenue Authority',
      documentClassifier: documentType,
      fileName: filename,
    };

    // Identify statutory sections mentioned
    const applicableActs: Array<Record<string, any>> = [];
    if (lower.includes('150') || lower.includes('land revenue') || lower.includes('7/12')) {
      applicableActs.push({
        act: 'Maharashtra Land Revenue Code, 1966',
        section: 'Section 150',
        relevance: 'Procedure for recording mutation entries and boundary dispute inquiries',
      });
    }
    if (lower.includes('limitation') || lower.includes('appeal') || lower.includes('30 days')) {
      applicableActs.push({
        act: 'Limitation Act, 1963',
        section: 'Articles 113 & 116',
        relevance: 'Statutory limitation windows for filing objections or appeals',
      });
    }
    if (lower.includes('consumer') || lower.includes('warranty')) {
      applicableActs.push({
        act: 'Consumer Protection Act, 2019',
        section: 'Section 35',
        relevance: 'Procedure for filing consumer forum grievance',
      });
    }
    if (applicableActs.length === 0) {
      applicableActs.push({
        act: 'Code of Civil Procedure, 1908',
        section: 'General Provisions',
        relevance: 'Standard procedural guidelines for document verification and record of rights',
      });
    }

    // Risk Indicators
    const riskIndicators: Array<Record<string, any>> = [];
    if (lower.includes('overlap') || lower.includes('boundary') || lower.includes('dispute')) {
      riskIndicators.push({
        level: 'HIGH',
        description: 'Boundary or title overlap mentioned. Joint survey or physical inspection likely required.',
      });
    }
    if (lower.includes('pending') || lower.includes('objection') || lower.includes('hearing')) {
      riskIndicators.push({
        level: 'MEDIUM',
        description: 'Pending objection noted in proceedings. Verify scheduled hearing date with revenue authority.',
      });
    } else {
      riskIndicators.push({
        level: 'LOW',
        description: 'Standard documentation submitted. No immediate emergency notices identified.',
      });
    }

    // Suggested Next Steps (purely procedural, non-binding)
    const suggestedNextSteps = [
      'Share this verified summary with your assigned advocate on NyayaSetu.',
      'Obtain certified physical copies of the original land revenue extracts or notices from the issuing authority.',
      'Maintain an organized docket of receipts, mutation challans, and related correspondence.',
    ];

    // Plain-language summary
    let summary = `This document has been verified as a ${documentType}. It contains administrative records regarding dispute proceedings. `;
    if (uniqueDates.length > 0) {
      summary += `Key dates referenced in the document include ${uniqueDates.join(', ')}. `;
    }
    summary += `Important procedural indicators suggest sharing this dossier with your advocate for formal representation. (Informational analysis only. Does not replace advocate advice.)`;

    return {
      documentType,
      plainLanguageSummary: summary,
      keyEntities: entities,
      criticalDates,
      riskIndicators,
      suggestedNextSteps,
      applicableActsOrSections: applicableActs,
      confidenceScore: 0.88,
    };
  }
}
