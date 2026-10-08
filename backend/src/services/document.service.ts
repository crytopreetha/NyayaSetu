import { db } from '../config/db.js';
import { NotFoundError, ForbiddenError } from '../utils/errors.js';
import { DocumentProcessingService } from './document-processing.service.js';

export interface CreateDocumentData {
  caseId: string;
  uploadedBy: string;
  originalName: string;
  storagePath: string;
  mimeType: string;
  fileSizeBytes: number;
  detectedLanguage?: string;
  extractedText?: string;
}

export class DocumentService {
  /**
   * Verify that a user is authorized to access a case
   */
  static async checkUserAuthorizedForCase(caseId: string, userId: string, userRole: string): Promise<any> {
    if (userRole === 'ADMIN') return true;

    const res = await db.query(
      `SELECT c.id, c.citizen_id, c.assigned_lawyer_id 
       FROM cases c 
       WHERE c.id = $1;`,
      [caseId]
    );

    if (res.rows.length === 0) {
      throw new NotFoundError('Case', caseId);
    }

    const c = res.rows[0];

    // Citizen owner
    if (c.citizen_id === userId) return c;

    // Assigned lawyer (assigned_lawyer_id matches user id)
    if (c.assigned_lawyer_id === userId) return c;

    // Lawyer with active assistance request (for reviewing before accepting or once accepted)
    if (userRole === 'LAWYER') {
      const reqCheck = await db.query(
        `SELECT id FROM case_assistance_requests 
         WHERE case_id = $1 AND (lawyer_id = $2 OR lawyer_id IS NULL) 
         AND status IN ('NEW', 'UNDER_REVIEW', 'ACCEPTED', 'INFO_REQUESTED')
         LIMIT 1;`,
        [caseId, userId]
      );
      if (reqCheck.rows.length > 0) return c;
    }

    throw new ForbiddenError('You are not authorized to access or upload documents for this case.');
  }

  /**
   * Verify that a user is authorized to access a specific document
   */
  static async checkUserAuthorizedForDocument(documentId: string, userId: string, userRole: string): Promise<any> {
    if (userRole === 'ADMIN') {
      return this.getDocumentById(documentId);
    }

    const doc = await this.getDocumentById(documentId);
    await this.checkUserAuthorizedForCase(doc.case_id, userId, userRole);
    return doc;
  }

  /**
   * Create document record and trigger processing pipeline
   */
  static async createDocument(data: CreateDocumentData) {
    const res = await db.query(
      `INSERT INTO documents (
        case_id, uploaded_by, original_name, storage_path, mime_type,
        file_size_bytes, detected_language, extracted_text, processing_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'UPLOADED')
      RETURNING *;`,
      [
        data.caseId,
        data.uploadedBy,
        data.originalName,
        data.storagePath,
        data.mimeType,
        data.fileSizeBytes,
        data.detectedLanguage || null,
        data.extractedText || null,
      ]
    );

    const doc = res.rows[0];

    // Asynchronously trigger text extraction & AI pipeline
    setImmediate(() => {
      DocumentProcessingService.processDocument(doc.id).catch((err) => {
        console.error(`Pipeline failure for document ${doc.id}:`, err);
      });
    });

    return doc;
  }

  static async getDocumentById(id: string) {
    const res = await db.query('SELECT * FROM documents WHERE id = $1;', [id]);
    if (res.rows.length === 0) {
      throw new NotFoundError('Document', id);
    }
    return res.rows[0];
  }

  static async listDocumentsByCase(caseId: string) {
    const res = await db.query(
      `SELECT d.id, d.case_id, d.uploaded_by, d.original_name, d.mime_type, 
              d.file_size_bytes, d.detected_language, d.processing_status, d.created_at,
              a.plain_language_summary, a.confidence_score, a.document_type
       FROM documents d
       LEFT JOIN ai_analysis a ON a.document_id = d.id
       WHERE d.case_id = $1 
       ORDER BY d.created_at DESC;`,
      [caseId]
    );
    return res.rows;
  }

  static async updateProcessingStatus(
    id: string,
    status: 'UPLOADED' | 'PROCESSING' | 'ANALYZING' | 'COMPLETED' | 'FAILED',
    extractedText?: string,
    detectedLanguage?: string
  ) {
    await this.getDocumentById(id);
    const res = await db.query(
      `UPDATE documents
       SET processing_status = $1,
           extracted_text = COALESCE($2, extracted_text),
           detected_language = COALESCE($3, detected_language)
       WHERE id = $4
       RETURNING *;`,
      [status, extractedText || null, detectedLanguage || null, id]
    );
    return res.rows[0];
  }
}
