import { Router, Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { DocumentService } from '../services/document.service.js';
import { AIAnalysisService } from './../services/ai-analysis.service.js';
import { LanguageService, SupportedLanguageCode } from '../services/language/index.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { documentUpload } from '../middleware/upload.middleware.js';
import { BadRequestError, NotFoundError } from '../utils/errors.js';

export const documentRouter = Router({ mergeParams: true });

/**
 * POST /api/documents/upload
 * Upload a document attached to a case (PDF, DOCX, TXT)
 */
documentRouter.post(
  '/upload',
  authenticate,
  documentUpload.single('file'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user!;
      const file = req.file;
      const caseId = req.body.caseId;

      if (!file) {
        throw new BadRequestError('No file uploaded. Please provide a document file under key "file".');
      }

      if (!caseId) {
        // If file was written by multer, remove it on validation failure
        if (file.path && fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
        throw new BadRequestError('Case ID is required. Please provide "caseId".');
      }

      // Check user authorization for case
      await DocumentService.checkUserAuthorizedForCase(caseId, user.id, user.role);

      // Create document in DB (status starts at 'UPLOADED' and triggers pipeline)
      const doc = await DocumentService.createDocument({
        caseId,
        uploadedBy: user.id,
        originalName: file.originalname,
        storagePath: file.path,
        mimeType: file.mimetype,
        fileSizeBytes: file.size,
      });

      res.status(201).json({
        success: true,
        message: 'Document uploaded successfully and queued for AI extraction pipeline.',
        data: {
          id: doc.id,
          caseId: doc.case_id,
          originalName: doc.original_name,
          mimeType: doc.mime_type,
          fileSizeBytes: doc.file_size_bytes,
          processingStatus: doc.processing_status,
          createdAt: doc.created_at,
        },
      });
    } catch (err) {
      // Clean up orphaned upload on error
      if (req.file?.path && fs.existsSync(req.file.path)) {
        try {
          fs.unlinkSync(req.file.path);
        } catch {}
      }
      next(err);
    }
  }
);

/**
 * GET /api/documents/case/:caseId
 * List all documents for a case
 */
documentRouter.get(
  '/case/:caseId',
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user!;
      const { caseId } = req.params;

      await DocumentService.checkUserAuthorizedForCase(caseId, user.id, user.role);
      const docs = await DocumentService.listDocumentsByCase(caseId);

      res.status(200).json({ success: true, data: docs });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/documents/:id/status
 * Check current processing status of a document
 */
documentRouter.get(
  '/:id/status',
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user!;
      const doc = await DocumentService.checkUserAuthorizedForDocument(req.params.id, user.id, user.role);

      let analysis = null;
      if (doc.processing_status === 'COMPLETED') {
        try {
          analysis = await AIAnalysisService.getAnalysisByDocumentId(doc.id);
          const requestedLang = req.query.lang as string;
          if (analysis && requestedLang && LanguageService.isSupported(requestedLang)) {
            analysis = await LanguageService.translateAnalysis(
              {
                plainLanguageSummary: analysis.plain_language_summary,
                riskIndicators: analysis.risk_indicators,
                suggestedNextSteps: analysis.suggested_next_steps,
                criticalDates: analysis.critical_dates,
                applicableActsOrSections: analysis.applicable_acts_or_sections,
                keyEntities: analysis.key_entities,
                documentType: analysis.document_type,
              },
              requestedLang as SupportedLanguageCode
            );
          }
        } catch {
          // Analysis may still be inserting
        }
      }

      res.status(200).json({
        success: true,
        data: {
          id: doc.id,
          caseId: doc.case_id,
          originalName: doc.original_name,
          mimeType: doc.mime_type,
          fileSizeBytes: doc.file_size_bytes,
          processingStatus: doc.processing_status,
          detectedLanguage: doc.detected_language,
          hasExtractedText: Boolean(doc.extracted_text),
          createdAt: doc.created_at,
          analysis,
        },
        meta: {
          disclaimer: 'Informational assistance only. This AI-generated explanation is not certified legal advice or a certified translation. Consult a verified advocate for legal representation.',
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/documents/:id/download
 * Secure authorized download of document
 */
documentRouter.get(
  '/:id/download',
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user!;
      const doc = await DocumentService.checkUserAuthorizedForDocument(req.params.id, user.id, user.role);

      if (!fs.existsSync(doc.storage_path)) {
        throw new NotFoundError('Stored document file on server', doc.id);
      }

      res.setHeader('Content-Type', doc.mime_type || 'application/octet-stream');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${encodeURIComponent(doc.original_name)}"`
      );

      const fileStream = fs.createReadStream(doc.storage_path);
      fileStream.pipe(res);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/documents/:id
 * Retrieve document details and extracted text
 */
documentRouter.get(
  '/:id',
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user!;
      const doc = await DocumentService.checkUserAuthorizedForDocument(req.params.id, user.id, user.role);

      let analysis = null;
      try {
        analysis = await AIAnalysisService.getAnalysisByDocumentId(doc.id);
        const requestedLang = req.query.lang as string;
        if (analysis && requestedLang && LanguageService.isSupported(requestedLang)) {
          analysis = await LanguageService.translateAnalysis(
            {
              plainLanguageSummary: analysis.plain_language_summary,
              riskIndicators: analysis.risk_indicators,
              suggestedNextSteps: analysis.suggested_next_steps,
              criticalDates: analysis.critical_dates,
              applicableActsOrSections: analysis.applicable_acts_or_sections,
              keyEntities: analysis.key_entities,
              documentType: analysis.document_type,
            },
            requestedLang as SupportedLanguageCode
          );
        }
      } catch {}

      res.status(200).json({
        success: true,
        data: {
          id: doc.id,
          caseId: doc.case_id,
          originalName: doc.original_name,
          mimeType: doc.mime_type,
          fileSizeBytes: doc.file_size_bytes,
          detectedLanguage: doc.detected_language,
          processingStatus: doc.processing_status,
          extractedText: doc.extracted_text,
          createdAt: doc.created_at,
          analysis,
        },
        meta: {
          disclaimer: 'Informational assistance only. This AI-generated explanation is not certified legal advice or a certified translation. Consult a verified advocate for legal representation.',
        },
      });
    } catch (err) {
      next(err);
    }
  }
);
