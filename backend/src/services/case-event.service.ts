import { db } from '../config/db.js';

export interface CreateCaseEventData {
  caseId: string;
  actorId?: string;
  eventType: string;
  title: string;
  description?: string;
  eventDate?: string;
  metadata?: Record<string, any>;
}

export class CaseEventService {
  static async createEvent(data: CreateCaseEventData) {
    const res = await db.query(
      `INSERT INTO case_events (
        case_id, actor_id, event_type, title, description, event_date, metadata
      ) VALUES ($1, $2, $3, $4, $5, COALESCE($6, NOW()), $7)
      RETURNING *;`,
      [
        data.caseId,
        data.actorId || null,
        data.eventType.trim(),
        data.title.trim(),
        data.description?.trim() || null,
        data.eventDate || null,
        JSON.stringify(data.metadata || {}),
      ]
    );
    return res.rows[0];
  }

  static async listEventsByCase(caseId: string) {
    const res = await db.query(
      `SELECT 
        ce.*,
        u.full_name AS actor_name,
        u.role AS actor_role
      FROM case_events ce
      LEFT JOIN users u ON ce.actor_id = u.id
      WHERE ce.case_id = $1
      ORDER BY ce.event_date DESC, ce.created_at DESC;`,
      [caseId]
    );
    return res.rows;
  }
}
