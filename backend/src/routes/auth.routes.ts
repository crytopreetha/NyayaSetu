import { Router } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/auth.service.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';

export const authRouter = Router();

// ── Schemas ───────────────────────────────────────────────────────────────────

const registerCitizenSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  fullName: z.string().min(2).max(150).trim(),
  phone: z.string().max(20).optional(),
  preferredLanguage: z.enum(['en', 'hi', 'mr']).optional().default('en'),
});

const registerLawyerSchema = registerCitizenSchema.extend({
  barCouncilNumber: z.string().min(3).max(50).trim(),
  bio: z.string().max(2000).optional(),
  specialization: z.array(z.string()).optional(),
  experienceYears: z.number().int().min(0).max(60).optional(),
  city: z.string().min(2).max(100).trim(),
  state: z.string().min(2).max(100).trim(),
  languagesSpoken: z.array(z.string()).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

// ── POST /api/auth/register/citizen ──────────────────────────────────────────
authRouter.post(
  '/register/citizen',
  validate({ body: registerCitizenSchema }),
  async (req, res, next) => {
    try {
      const result = await AuthService.registerCitizen(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

// ── POST /api/auth/register/lawyer ───────────────────────────────────────────
authRouter.post(
  '/register/lawyer',
  validate({ body: registerLawyerSchema }),
  async (req, res, next) => {
    try {
      const result = await AuthService.registerLawyer(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

// ── POST /api/auth/login ─────────────────────────────────────────────────────
authRouter.post('/login', validate({ body: loginSchema }), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await AuthService.login(email, password);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/auth/logout ────────────────────────────────────────────────────
// JWT is stateless — logout is handled client-side (delete token).
// This endpoint exists so the frontend can signal intent and clear server sessions
// if we add refresh tokens later.
authRouter.post('/logout', authenticate, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully. Please delete your token on the client.',
  });
});

// ── GET /api/auth/profile ────────────────────────────────────────────────────
authRouter.get('/profile', authenticate, async (req, res, next) => {
  try {
    const profile = await AuthService.getProfile(req.user!.id);
    res.status(200).json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
});
