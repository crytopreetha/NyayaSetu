import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { healthRouter } from './routes/health.routes.js';
import { languageRouter } from './routes/language.routes.js';
import { authRouter } from './routes/auth.routes.js';
import { userRouter } from './routes/user.routes.js';
import { caseRouter } from './routes/case.routes.js';
import { lawyerRouter } from './routes/lawyer.routes.js';
import { documentRouter } from './routes/document.routes.js';
import { caseAssistanceRouter } from './routes/case-assistance.routes.js';
import { messageRouter } from './routes/message.routes.js';
import { errorHandler } from './middleware/error.middleware.js';
import { authenticate } from './middleware/auth.middleware.js';
import { requireRole } from './middleware/role.middleware.js';

export const app = express();

// ── Security + Parsing middleware ─────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: true, // Dynamically reflects request origin to allow localhost, Vercel deployments, etc.
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Id', 'X-User-Role', 'Accept'],
    credentials: true,
  })
);
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Public routes ─────────────────────────────────────────────────────────────
app.use('/api', healthRouter);
app.use('/api', languageRouter);

// ── Auth routes (public — register, login; protected — logout, profile) ───────
app.use('/api/auth', authRouter);

// ── Protected API routes ──────────────────────────────────────────────────────
// All routes below require a valid JWT or test headers
app.use('/api/users', authenticate, userRouter);
app.use('/api/cases', authenticate, caseRouter);
app.use('/api/documents', authenticate, documentRouter);

// Lawyers directory is readable by everyone authenticated;
// lawyer profile management is restricted to LAWYER+ADMIN in the route handlers
app.use('/api/lawyers', authenticate, lawyerRouter);

// Case assistance requests and case-specific message threads
app.use('/api', authenticate, caseAssistanceRouter);
app.use('/api', authenticate, messageRouter);

// ── Fallback 404 handler ──────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: { message: 'Endpoint not found' },
  });
});

// ── Centralized error handler (must be last) ──────────────────────────────────
app.use(errorHandler);
