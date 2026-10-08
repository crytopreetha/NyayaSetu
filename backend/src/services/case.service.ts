import { db } from '../config/db.js';
import { NotFoundError } from '../utils/errors.js';

export interface CreateCaseData {
  citizenId: string;
  title: string;
  description: string;
  category: string;
  caseNumber?: string;
  urgency?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  jurisdiction?: string;
}

export type StandardCaseStatus =
  | 'DRAFT'
  | 'DOCUMENT_UPLOADED'
  | 'AI_ANALYSIS'
  | 'AWAITING_LAWYER'
  | 'LAWYER_REVIEW'
  | 'LAWYER_ASSIGNED'
  | 'ACTION_REQUIRED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'CLOSED'
  | 'OPEN'
  | 'IN_REVIEW'
  | 'ACTIVE'
  | 'ASSIGNED';

export interface UpdateCaseData {
  title?: string;
  description?: string;
  category?: string;
  status?: StandardCaseStatus;
  urgency?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  jurisdiction?: string;
}

export interface ListCaseFilters {
  citizenId?: string;
  lawyerId?: string;
  status?: string;
  category?: string;
  urgency?: string;
  limit?: number;
  offset?: number;
}

export class CaseService {
  static async createCase(data: CreateCaseData) {
    const caseNumber = data.caseNumber || `NS-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const res = await db.query(
      `INSERT INTO cases (
        citizen_id, case_number, title, description, category, urgency, jurisdiction, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'DRAFT')
      RETURNING *;`,
      [
        data.citizenId,
        caseNumber,
        data.title.trim(),
        data.description.trim(),
        data.category.trim(),
        data.urgency || 'MEDIUM',
        data.jurisdiction?.trim() || null,
      ]
    );
    return res.rows[0];
  }

  static async getCaseById(id: string) {
    const res = await db.query(
      `SELECT 
        c.*,
        u.full_name AS citizen_name,
        u.email AS citizen_email,
        u.preferred_language AS citizen_language,
        lu.full_name AS lawyer_name,
        lu.email AS lawyer_email,
        l.bar_council_number AS lawyer_bar_id
      FROM cases c
      JOIN users u ON c.citizen_id = u.id
      LEFT JOIN lawyers l ON c.assigned_lawyer_id = l.id
      LEFT JOIN users lu ON l.id = lu.id
      WHERE c.id = $1;`,
      [id]
    );

    if (res.rows.length === 0) {
      throw new NotFoundError('Case', id);
    }
    return res.rows[0];
  }

  static async listCases(filters: ListCaseFilters = {}) {
    const { citizenId, lawyerId, status, category, urgency, limit = 20, offset = 0 } = filters;
    let query = `
      SELECT 
        c.*,
        u.full_name AS citizen_name,
        lu.full_name AS lawyer_name
      FROM cases c
      JOIN users u ON c.citizen_id = u.id
      LEFT JOIN lawyers l ON c.assigned_lawyer_id = l.id
      LEFT JOIN users lu ON l.id = lu.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (citizenId) {
      params.push(citizenId);
      query += ` AND c.citizen_id = $${params.length}`;
    }

    if (lawyerId) {
      params.push(lawyerId);
      query += ` AND c.assigned_lawyer_id = $${params.length}`;
    }

    if (status) {
      params.push(status);
      query += ` AND c.status = $${params.length}`;
    }

    if (category) {
      params.push(category);
      query += ` AND c.category = $${params.length}`;
    }

    if (urgency) {
      params.push(urgency);
      query += ` AND c.urgency = $${params.length}`;
    }

    params.push(limit, offset);
    query += ` ORDER BY c.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length};`;

    const res = await db.query(query, params);
    return res.rows;
  }

  static async updateCase(id: string, data: UpdateCaseData) {
    await this.getCaseById(id);
    const res = await db.query(
      `UPDATE cases
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           category = COALESCE($3, category),
           status = COALESCE($4, status),
           urgency = COALESCE($5, urgency),
           jurisdiction = COALESCE($6, jurisdiction)
       WHERE id = $7
       RETURNING *;`,
      [
        data.title?.trim() || null,
        data.description?.trim() || null,
        data.category?.trim() || null,
        data.status || null,
        data.urgency || null,
        data.jurisdiction?.trim() || null,
        id,
      ]
    );
    return res.rows[0];
  }

  static async assignLawyer(caseId: string, lawyerId: string | null) {
    await this.getCaseById(caseId);
    const newStatus = lawyerId ? 'LAWYER_ASSIGNED' : 'AWAITING_LAWYER';
    const res = await db.query(
      `UPDATE cases
       SET assigned_lawyer_id = $1,
           status = $2,
           updated_at = NOW()
       WHERE id = $3
       RETURNING *;`,
      [lawyerId, newStatus, caseId]
    );
    return res.rows[0];
  }

  static async updateStatus(caseId: string, status: StandardCaseStatus) {
    await this.getCaseById(caseId);
    const res = await db.query(
      `UPDATE cases
       SET status = $1,
           updated_at = NOW()
       WHERE id = $2
       RETURNING *;`,
      [status, caseId]
    );
    return res.rows[0];
  }
}
