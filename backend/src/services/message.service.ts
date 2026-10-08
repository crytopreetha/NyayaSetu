import { db } from '../config/db.js';

export interface CreateMessageData {
  caseId: string;
  senderId: string;
  content: string;
  attachments?: Array<Record<string, any>>;
}

export class MessageService {
  static async createMessage(data: CreateMessageData) {
    const res = await db.query(
      `INSERT INTO messages (
        case_id, sender_id, content, attachments
      ) VALUES ($1, $2, $3, $4)
      RETURNING *;`,
      [
        data.caseId,
        data.senderId,
        data.content.trim(),
        JSON.stringify(data.attachments || []),
      ]
    );
    return res.rows[0];
  }

  static async listMessagesByCase(caseId: string) {
    const res = await db.query(
      `SELECT 
        m.*,
        u.full_name AS sender_name,
        u.role AS sender_role,
        u.avatar_url AS sender_avatar
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.case_id = $1
      ORDER BY m.created_at ASC;`,
      [caseId]
    );
    return res.rows;
  }

  static async markMessagesAsRead(caseId: string, recipientId: string) {
    // Marks messages as read if sent by someone other than the recipient
    const res = await db.query(
      `UPDATE messages
       SET is_read = TRUE
       WHERE case_id = $1 AND sender_id != $2 AND is_read = FALSE
       RETURNING id;`,
      [caseId, recipientId]
    );
    return res.rowCount ?? 0;
  }
}
