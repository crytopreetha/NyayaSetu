import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../config/db.js';
import { env } from '../config/env.js';
import { BadRequestError, UnauthorizedError, ConflictError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

const SALT_ROUNDS = 12;

export interface RegisterCitizenData {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  preferredLanguage?: string;
}

export interface RegisterLawyerData extends RegisterCitizenData {
  barCouncilNumber: string;
  bio?: string;
  specialization?: string[];
  experienceYears?: number;
  city: string;
  state: string;
  languagesSpoken?: string[];
}

export interface AuthTokenPayload {
  sub: string;      // user UUID
  email: string;
  role: 'CITIZEN' | 'LAWYER' | 'ADMIN';
  fullName: string;
  iat?: number;
  exp?: number;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: 'CITIZEN' | 'LAWYER' | 'ADMIN';
    preferredLanguage: string;
    avatarUrl: string | null;
  };
}

// ── helpers ──────────────────────────────────────────────────────────────────

function signToken(payload: Omit<AuthTokenPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

function buildAuthResponse(row: any, token: string): AuthResponse {
  return {
    token,
    user: {
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      role: row.role,
      preferredLanguage: row.preferred_language,
      avatarUrl: row.avatar_url ?? null,
    },
  };
}

// ── AuthService ───────────────────────────────────────────────────────────────

export class AuthService {
  /**
   * Register a new citizen account.
   * Throws ConflictError if email already exists.
   */
  static async registerCitizen(data: RegisterCitizenData): Promise<AuthResponse> {
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [
      data.email.toLowerCase().trim(),
    ]);
    if (existing.rows.length > 0) {
      throw new ConflictError('An account with this email already exists.');
    }

    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

    const res = await db.query(
      `INSERT INTO users
         (email, full_name, role, phone, preferred_language, password_hash)
       VALUES ($1, $2, 'CITIZEN', $3, $4, $5)
       RETURNING id, email, full_name, role, preferred_language, avatar_url;`,
      [
        data.email.toLowerCase().trim(),
        data.fullName.trim(),
        data.phone ?? null,
        (data.preferredLanguage && ['en', 'hi', 'mr'].includes(data.preferredLanguage)) ? data.preferredLanguage : 'en',
        passwordHash,
      ]
    );

    const row = res.rows[0];
    const token = signToken({ sub: row.id, email: row.email, role: row.role, fullName: row.full_name });
    logger.info('New citizen registered', { userId: row.id });
    return buildAuthResponse(row, token);
  }

  /**
   * Register a new lawyer account.
   * Creates the user row first, then the lawyers profile row.
   */
  static async registerLawyer(data: RegisterLawyerData): Promise<AuthResponse> {
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [
      data.email.toLowerCase().trim(),
    ]);
    if (existing.rows.length > 0) {
      throw new ConflictError('An account with this email already exists.');
    }

    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
    const client = await db.getClient();

    try {
      await client.query('BEGIN');

      // 1. Insert user row
      const userRes = await client.query(
        `INSERT INTO users
           (email, full_name, role, phone, preferred_language, password_hash)
         VALUES ($1, $2, 'LAWYER', $3, $4, $5)
         RETURNING id, email, full_name, role, preferred_language, avatar_url;`,
        [
          data.email.toLowerCase().trim(),
          data.fullName.trim(),
          data.phone ?? null,
          (data.preferredLanguage && ['en', 'hi', 'mr'].includes(data.preferredLanguage)) ? data.preferredLanguage : 'en',
          passwordHash,
        ]
      );
      const userRow = userRes.rows[0];

      // 2. Insert lawyers profile row
      await client.query(
        `INSERT INTO lawyers
           (id, bar_council_number, bio, specialization, experience_years,
            city, state, languages_spoken, verification_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDING');`,
        [
          userRow.id,
          data.barCouncilNumber.trim().toUpperCase(),
          data.bio ?? null,
          data.specialization ?? [],
          data.experienceYears ?? 0,
          data.city.trim(),
          data.state.trim(),
          data.languagesSpoken ?? ['en', 'hi'],
        ]
      );

      await client.query('COMMIT');

      const token = signToken({
        sub: userRow.id,
        email: userRow.email,
        role: userRow.role,
        fullName: userRow.full_name,
      });
      logger.info('New lawyer registered', { userId: userRow.id });
      return buildAuthResponse(userRow, token);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Validate email+password, return JWT token on success.
   * Never leaks which field is wrong.
   */
  static async login(email: string, password: string): Promise<AuthResponse> {
    const res = await db.query(
      `SELECT id, email, full_name, role, preferred_language, avatar_url, password_hash
       FROM users WHERE email = $1 LIMIT 1;`,
      [email.toLowerCase().trim()]
    );

    const row = res.rows[0];
    const dummyHash = '$2a$12$invalidhashforhidingtimingatk'; // constant-time guard

    const hashToCheck: string = row?.password_hash ?? dummyHash;
    const matches = await bcrypt.compare(password, hashToCheck);

    if (!row || !matches) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    if (!row.password_hash) {
      // Account registered via Supabase OAuth — no local password set
      throw new UnauthorizedError('This account uses social login. Please sign in with your provider.');
    }

    const token = signToken({
      sub: row.id,
      email: row.email,
      role: row.role,
      fullName: row.full_name,
    });

    logger.info('User logged in', { userId: row.id, role: row.role });
    return buildAuthResponse(row, token);
  }

  /**
   * Verify a JWT token and return the payload.
   * Throws UnauthorizedError for invalid or expired tokens.
   */
  static verifyToken(token: string): AuthTokenPayload {
    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as AuthTokenPayload;
      return payload;
    } catch {
      throw new UnauthorizedError('Token is invalid or has expired. Please log in again.');
    }
  }

  /**
   * Get full profile of authenticated user.
   */
  static async getProfile(userId: string) {
    const res = await db.query(
      `SELECT id, email, full_name, role, phone, preferred_language,
              avatar_url, created_at, updated_at
       FROM users WHERE id = $1 LIMIT 1;`,
      [userId]
    );
    if (res.rows.length === 0) {
      throw new UnauthorizedError('User account not found.');
    }
    const row = res.rows[0];
    // Strip password_hash — never return it
    const { password_hash, ...safeUser } = row;
    return safeUser;
  }
}
