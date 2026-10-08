import { db } from '../config/db.js';
import { NotFoundError } from '../utils/errors.js';

export interface CreateDeadlineData {
  caseId: string;
  createdBy?: string;
  title: string;
  description?: string;
  dueDate: string; // YYYY-MM-DD
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  isAiInferred?: boolean;
}

export class DeadlineService {
  static async createDeadline(data: CreateDeadlineData) {
    const res = await db.query(
      `INSERT INTO case_deadlines (
        case_id, created_by, title, description, due_date, priority, status, is_ai_inferred
      ) VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', $7)
      RETURNING *;`,
      [
        data.caseId,
        data.createdBy || null,
        data.title.trim(),
        data.description?.trim() || null,
        data.dueDate,
        data.priority || 'MEDIUM',
        data.isAiInferred ?? false,
      ]
    );
    return res.rows[0];
  }

  static async getDeadlineById(id: string) {
    const res = await db.query('SELECT * FROM case_deadlines WHERE id = $1;', [id]);
    if (res.rows.length === 0) {
      throw new NotFoundError('Case Deadline', id);
    }
    return res.rows[0];
  }

  static async listDeadlinesByCase(caseId: string) {
    const res = await db.query(
      'SELECT * FROM case_deadlines WHERE case_id = $1 ORDER BY due_date ASC;',
      [caseId]
    );
    return res.rows;
  }

  static async updateDeadlineStatus(id: string, status: 'PENDING' | 'COMPLETED' | 'MISSED') {
    await this.getDeadlineById(id);
    const res = await db.query(
      `UPDATE case_deadlines
       SET status = $1
       WHERE id = $2
       RETURNING *;`,
      [status, id]
    );
    return res.rows[0];
  }
}
