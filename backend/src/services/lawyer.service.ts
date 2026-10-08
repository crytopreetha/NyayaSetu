import { db } from '../config/db.js';
import { NotFoundError } from '../utils/errors.js';

export interface CreateLawyerData {
  id: string; // References users.id
  barCouncilNumber: string;
  bio?: string;
  specialization?: string[];
  experienceYears?: number;
  city: string;
  state: string;
  languagesSpoken?: string[];
}

export interface ListLawyerFilters {
  city?: string;
  state?: string;
  specialization?: string;
  language?: string;
  status?: string;
  isAvailable?: boolean;
  limit?: number;
  offset?: number;
}

export class LawyerService {
  static async createLawyer(data: CreateLawyerData) {
    const res = await db.query(
      `INSERT INTO lawyers (
        id, bar_council_number, bio, specialization, experience_years,
        city, state, languages_spoken, verification_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDING')
      RETURNING *;`,
      [
        data.id,
        data.barCouncilNumber.trim().toUpperCase(),
        data.bio || null,
        data.specialization || [],
        data.experienceYears || 0,
        data.city.trim(),
        data.state.trim(),
        data.languagesSpoken || ['en', 'hi'],
      ]
    );
    return res.rows[0];
  }

  static async getLawyerById(id: string) {
    const res = await db.query(
      `SELECT 
        l.*,
        u.email,
        u.full_name,
        u.phone,
        u.avatar_url,
        u.preferred_language
      FROM lawyers l
      JOIN users u ON l.id = u.id
      WHERE l.id = $1;`,
      [id]
    );

    if (res.rows.length === 0) {
      throw new NotFoundError('Lawyer', id);
    }
    return res.rows[0];
  }

  static async listLawyers(filters: ListLawyerFilters = {}) {
    const {
      city,
      state,
      specialization,
      language,
      status,
      isAvailable,
      limit = 20,
      offset = 0,
    } = filters;

    let query = `
      SELECT 
        l.*,
        u.email,
        u.full_name,
        u.avatar_url,
        u.phone
      FROM lawyers l
      JOIN users u ON l.id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (city) {
      params.push(city);
      query += ` AND LOWER(l.city) = LOWER($${params.length})`;
    }

    if (state) {
      params.push(state);
      query += ` AND LOWER(l.state) = LOWER($${params.length})`;
    }

    if (specialization) {
      params.push(specialization);
      query += ` AND $${params.length} = ANY(l.specialization)`;
    }

    if (language) {
      params.push(language);
      query += ` AND $${params.length} = ANY(l.languages_spoken)`;
    }

    if (status) {
      params.push(status);
      query += ` AND l.verification_status = $${params.length}`;
    }

    if (isAvailable !== undefined) {
      params.push(isAvailable);
      query += ` AND l.is_available = $${params.length}`;
    }

    params.push(limit, offset);
    query += ` ORDER BY l.rating DESC, l.experience_years DESC LIMIT $${params.length - 1} OFFSET $${params.length};`;

    const res = await db.query(query, params);
    return res.rows;
  }

  static async updateVerificationStatus(id: string, status: 'PENDING' | 'VERIFIED' | 'REJECTED') {
    await this.getLawyerById(id);
    const verifiedAt = status === 'VERIFIED' ? new Date().toISOString() : null;
    const res = await db.query(
      `UPDATE lawyers
       SET verification_status = $1,
           verified_at = $2
       WHERE id = $3
       RETURNING *;`,
      [status, verifiedAt, id]
    );
    return res.rows[0];
  }
}
