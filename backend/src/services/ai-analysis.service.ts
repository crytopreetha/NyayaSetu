import { db } from '../config/db.js';
import { NotFoundError } from '../utils/errors.js';

export interface CreateAIAnalysisData {
  documentId: string;
  caseId: string;
  documentType?: string;
  plainLanguageSummary: string;
  keyEntities?: Record<string, any>;
  criticalDates?: Array<Record<string, any>>;
  riskIndicators?: Array<Record<string, any>>;
  suggestedNextSteps?: string[];
  applicableActsOrSections?: Array<Record<string, any>>;
  confidenceScore?: number;
}

export class AIAnalysisService {
  static async createAnalysis(data: CreateAIAnalysisData) {
    const res = await db.query(
      `INSERT INTO ai_analysis (
        document_id, case_id, document_type, plain_language_summary,
        key_entities, critical_dates, risk_indicators, suggested_next_steps,
        applicable_acts_or_sections, confidence_score
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *;`,
      [
        data.documentId,
        data.caseId,
        data.documentType || null,
        data.plainLanguageSummary,
        JSON.stringify(data.keyEntities || {}),
        JSON.stringify(data.criticalDates || []),
        JSON.stringify(data.riskIndicators || []),
        JSON.stringify(data.suggestedNextSteps || []),
        JSON.stringify(data.applicableActsOrSections || []),
        data.confidenceScore ?? 0.9,
      ]
    );
    return res.rows[0];
  }

  static async getAnalysisByDocumentId(documentId: string) {
    const res = await db.query('SELECT * FROM ai_analysis WHERE document_id = $1;', [documentId]);
    if (res.rows.length === 0) {
      throw new NotFoundError('AI Analysis for document', documentId);
    }
    return res.rows[0];
  }

  static async listAnalysisByCase(caseId: string) {
    const res = await db.query(
      'SELECT * FROM ai_analysis WHERE case_id = $1 ORDER BY created_at DESC;',
      [caseId]
    );
    return res.rows;
  }

  static async updateLawyerReview(id: string, notes: string) {
    const res = await db.query(
      `UPDATE ai_analysis
       SET lawyer_reviewed = TRUE,
           lawyer_notes = $1
       WHERE id = $2
       RETURNING *;`,
      [notes, id]
    );
    if (res.rows.length === 0) {
      throw new NotFoundError('AI Analysis', id);
    }
    return res.rows[0];
  }
}
