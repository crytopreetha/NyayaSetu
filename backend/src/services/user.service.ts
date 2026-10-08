import { db } from '../config/db.js';
import { NotFoundError } from '../utils/errors.js';

export interface CreateUserData {
  email: string;
  fullName: string;
  role?: 'CITIZEN' | 'LAWYER' | 'ADMIN';
  phone?: string;
  preferredLanguage?: string;
  authId?: string;
  avatarUrl?: string;
}

export interface UpdateUserData {
  fullName?: string;
  phone?: string;
  preferredLanguage?: string;
  avatarUrl?: string;
}

export class UserService {
  static async createUser(data: CreateUserData) {
    const validLanguages = ['en', 'hi', 'mr'];
    const chosenLang = data.preferredLanguage && validLanguages.includes(data.preferredLanguage)
      ? data.preferredLanguage
      : 'en';

    const res = await db.query(
      `INSERT INTO users (
        email, full_name, role, phone, preferred_language, auth_id, avatar_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;`,
      [
        data.email.toLowerCase().trim(),
        data.fullName.trim(),
        data.role || 'CITIZEN',
        data.phone || null,
        chosenLang,
        data.authId || null,
        data.avatarUrl || null,
      ]
    );
    return res.rows[0];
  }

  static async updateUserLanguage(userId: string, language: string) {
    const validLanguages = ['en', 'hi', 'mr'];
    if (!validLanguages.includes(language)) {
      throw new Error(`Unsupported language code: '${language}'. Supported languages: en, hi, mr`);
    }
    const res = await db.query(
      `UPDATE users
       SET preferred_language = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, email, full_name, role, preferred_language;`,
      [language, userId]
    );
    if (res.rows.length === 0) {
      throw new NotFoundError('User', userId);
    }
    return res.rows[0];
  }

  static async getUserById(id: string) {
    const res = await db.query('SELECT * FROM users WHERE id = $1;', [id]);
    if (res.rows.length === 0) {
      throw new NotFoundError('User', id);
    }
    return res.rows[0];
  }

  static async getUserByEmail(email: string) {
    const res = await db.query('SELECT * FROM users WHERE email = $1;', [email.toLowerCase().trim()]);
    return res.rows[0] || null;
  }

  static async updateUser(id: string, data: UpdateUserData) {
    const user = await this.getUserById(id);
    const res = await db.query(
      `UPDATE users
       SET full_name = COALESCE($1, full_name),
           phone = COALESCE($2, phone),
           preferred_language = COALESCE($3, preferred_language),
           avatar_url = COALESCE($4, avatar_url)
       WHERE id = $5
       RETURNING *;`,
      [
        data.fullName?.trim() || null,
        data.phone || null,
        data.preferredLanguage || null,
        data.avatarUrl || null,
        id,
      ]
    );
    return res.rows[0];
  }

  static async listUsers(filters: { role?: string; limit?: number; offset?: number } = {}) {
    const { role, limit = 20, offset = 0 } = filters;
    let query = 'SELECT * FROM users';
    const params: any[] = [];

    if (role) {
      params.push(role);
      query += ` WHERE role = $${params.length}`;
    }

    params.push(limit, offset);
    query += ` ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length};`;

    const res = await db.query(query, params);
    return res.rows;
  }
}
