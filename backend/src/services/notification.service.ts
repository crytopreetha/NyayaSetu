import { db } from '../config/db.js';
import { NotFoundError } from '../utils/errors.js';

export interface CreateNotificationData {
  userId: string;
  title: string;
  message: string;
  type: string;
  linkUrl?: string;
}

export class NotificationService {
  static async createNotification(data: CreateNotificationData) {
    const res = await db.query(
      `INSERT INTO notifications (
        user_id, title, message, type, link_url
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *;`,
      [
        data.userId,
        data.title.trim(),
        data.message.trim(),
        data.type.trim(),
        data.linkUrl?.trim() || null,
      ]
    );
    return res.rows[0];
  }

  static async listNotificationsByUser(userId: string, unreadOnly = false) {
    let query = 'SELECT * FROM notifications WHERE user_id = $1';
    const params: any[] = [userId];

    if (unreadOnly) {
      query += ' AND is_read = FALSE';
    }

    query += ' ORDER BY created_at DESC LIMIT 50;';

    const res = await db.query(query, params);
    return res.rows;
  }

  static async markAsRead(id: string, userId: string) {
    const res = await db.query(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE id = $1 AND user_id = $2
       RETURNING *;`,
      [id, userId]
    );

    if (res.rows.length === 0) {
      throw new NotFoundError('Notification', id);
    }
    return res.rows[0];
  }

  static async markAllAsRead(userId: string) {
    const res = await db.query(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE user_id = $1 AND is_read = FALSE
       RETURNING id;`,
      [userId]
    );
    return res.rowCount ?? 0;
  }
}
