import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../utils/errors.js';
import { AuthService } from '../services/auth.service.js';
import { supabase } from '../config/supabase.js';
import { db } from '../config/db.js';

export interface AuthUser {
  id: string;
  role: 'CITIZEN' | 'LAWYER' | 'ADMIN';
  email: string;
  fullName: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// ── authenticate ─────────────────────────────────────────────────────────────
// Priority: 1) Local JWT Bearer  2) Supabase Bearer  3) Dev test headers
export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    // 1. Bearer JWT token (local or Supabase)
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      // 1a. Try local JWT first
      try {
        const payload = AuthService.verifyToken(token);
        req.user = {
          id: payload.sub,
          role: payload.role,
          email: payload.email,
          fullName: payload.fullName,
        };
        return next();
      } catch {
        // Not a local JWT — fall through to Supabase check
      }

      // 1b. Try Supabase JWT
      if (supabase) {
        const { data, error } = await supabase.auth.getUser(token);
        if (!error && data?.user) {
          const userRes = await db.query(
            `SELECT id, role, email, full_name
             FROM users WHERE auth_id = $1 OR email = $2 LIMIT 1;`,
            [data.user.id, data.user.email]
          );

          if (userRes.rows.length > 0) {
            const u = userRes.rows[0];
            req.user = {
              id: u.id,
              role: u.role,
              email: u.email,
              fullName: u.full_name,
            };
            return next();
          }
        }
      }

      throw new UnauthorizedError('Token is invalid or has expired. Please log in again.');
    }

    // 2. Development / Test header injection (only in non-production)
    const testUserId = req.headers['x-user-id'] as string;
    const testUserRole = req.headers['x-user-role'] as 'CITIZEN' | 'LAWYER' | 'ADMIN';

    if (testUserId && process.env.NODE_ENV !== 'production') {
      const userRes = await db.query(
        'SELECT id, role, email, full_name FROM users WHERE id = $1 LIMIT 1',
        [testUserId]
      );

      if (userRes.rows.length > 0) {
        const u = userRes.rows[0];
        req.user = {
          id: u.id,
          role: u.role,
          email: u.email,
          fullName: u.full_name,
        };
        return next();
      }

      // Synthetic test user (when ID doesn't exist in DB)
      req.user = {
        id: testUserId,
        role: testUserRole || 'CITIZEN',
        email: 'test@example.com',
        fullName: 'Test User',
      };
      return next();
    }

    throw new UnauthorizedError('Authentication required. Please log in.');
  } catch (error) {
    next(error);
  }
};

// ── optionalAuthenticate ─────────────────────────────────────────────────────
// Attaches user if valid token/header present — does NOT block if missing.
export const optionalAuthenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const payload = AuthService.verifyToken(token);
        req.user = {
          id: payload.sub,
          role: payload.role,
          email: payload.email,
          fullName: payload.fullName,
        };
      } catch {
        // Invalid token — silently ignore for optional routes
      }
    }

    const testUserId = req.headers['x-user-id'] as string;
    if (!req.user && testUserId && process.env.NODE_ENV !== 'production') {
      const userRes = await db.query(
        'SELECT id, role, email, full_name FROM users WHERE id = $1 LIMIT 1',
        [testUserId]
      );
      if (userRes.rows.length > 0) {
        const u = userRes.rows[0];
        req.user = { id: u.id, role: u.role, email: u.email, fullName: u.full_name };
      }
    }

    next();
  } catch {
    next();
  }
};
