import { Router } from 'express';
import { z } from 'zod';
import { db } from '../config/db.js';
import { CaseService } from '../services/case.service.js';
import { validate } from '../middleware/validate.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { ForbiddenError } from '../utils/errors.js';

export const caseRouter = Router();

// ── Schemas ───────────────────────────────────────────────────────────────────

const createCaseSchema = z.object({
  citizenId: z.string().uuid(),
  title: z.string().min(3).max(255),
  description: z.string().min(10),
  category: z.string().min(2).max(100),
  caseNumber: z.string().optional(),
  urgency: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional().default('MEDIUM'),
  jurisdiction: z.string().optional(),
});

export const caseStatusEnum = z.enum([
  'DRAFT',
  'DOCUMENT_UPLOADED',
  'AI_ANALYSIS',
  'AWAITING_LAWYER',
  'LAWYER_REVIEW',
  'LAWYER_ASSIGNED',
  'ACTION_REQUIRED',
  'IN_PROGRESS',
  'RESOLVED',
  'CLOSED',
  'OPEN',
  'IN_REVIEW',
  'ACTIVE',
  'ASSIGNED',
]);

const updateCaseSchema = z.object({
  title: z.string().min(3).max(255).optional(),
  description: z.string().min(10).optional(),
  category: z.string().min(2).max(100).optional(),
  status: caseStatusEnum.optional(),
  urgency: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  jurisdiction: z.string().optional(),
});

const assignLawyerSchema = z.object({
  lawyerId: z.string().uuid().nullable(),
});

// ── POST /api/cases — Citizen creates a case ──────────────────────────────────
caseRouter.post(
  '/',
  requireRole(['CITIZEN', 'ADMIN']),
  validate({ body: createCaseSchema }),
  async (req, res, next) => {
    try {
      // Citizen can only create cases for themselves
      if (req.user!.role === 'CITIZEN' && req.body.citizenId !== req.user!.id) {
        return next(new ForbiddenError('You can only create cases for your own account.'));
      }
      const newCase = await CaseService.createCase(req.body);
      res.status(201).json({ success: true, data: newCase });
    } catch (err) {
      next(err);
    }
  }
);

// ── GET /api/cases — List cases (role-filtered) ───────────────────────────────
caseRouter.get('/', async (req, res, next) => {
  try {
    const { citizenId, lawyerId, status, category, urgency, limit, offset } = req.query;

    // Citizens can only see their own cases
    const effectiveCitizenId =
      req.user!.role === 'CITIZEN' ? req.user!.id : (citizenId as string);

    // Lawyers can only see cases assigned to them (or filter by their lawyerId)
    const effectiveLawyerId =
      req.user!.role === 'LAWYER' ? req.user!.id : (lawyerId as string);

    const cases = await CaseService.listCases({
      citizenId: effectiveCitizenId,
      lawyerId: effectiveLawyerId,
      status: status as string,
      category: category as string,
      urgency: urgency as string,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
    });
    res.status(200).json({ success: true, data: cases });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/cases/:id — Get single case (with ownership check) ───────────────
caseRouter.get('/:id', async (req, res, next) => {
  try {
    const caseRecord = await CaseService.getCaseById(req.params.id);

    // Citizen can only view their own cases
    if (
      req.user!.role === 'CITIZEN' &&
      caseRecord.citizen_id !== req.user!.id
    ) {
      return next(new ForbiddenError('You do not have access to this case.'));
    }

    // Lawyer can view if assigned to the case OR has an active assistance request
    if (req.user!.role === 'LAWYER') {
      const isAssigned = caseRecord.assigned_lawyer_id === req.user!.id;
      if (!isAssigned) {
        const reqCheck = await db.query(
          `SELECT id FROM case_assistance_requests 
           WHERE case_id = $1 AND (lawyer_id = $2 OR lawyer_id IS NULL)
           LIMIT 1;`,
          [caseRecord.id, req.user!.id]
        );
        if (reqCheck.rows.length === 0) {
          return next(new ForbiddenError('You do not have access to this case.'));
        }
      }
    }

    res.status(200).json({ success: true, data: caseRecord });
  } catch (err) {
    next(err);
  }
});

// ── PUT /api/cases/:id — Update case ──────────────────────────────────────────
caseRouter.put(
  '/:id',
  validate({ body: updateCaseSchema }),
  async (req, res, next) => {
    try {
      const existing = await CaseService.getCaseById(req.params.id);

      // Citizens can only update their own draft/open cases
      if (req.user!.role === 'CITIZEN') {
        if (existing.citizen_id !== req.user!.id) {
          return next(new ForbiddenError('You do not have access to this case.'));
        }
      }

      // Lawyers can only update cases assigned to them
      if (req.user!.role === 'LAWYER' && existing.assigned_lawyer_id !== req.user!.id) {
        return next(new ForbiddenError('You are not the assigned lawyer for this case.'));
      }

      const updated = await CaseService.updateCase(req.params.id, req.body);
      res.status(200).json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }
);

// ── PATCH /api/cases/:id/status — Advance case status ─────────────────────────
caseRouter.patch(
  '/:id/status',
  validate({ body: z.object({ status: caseStatusEnum }) }),
  async (req, res, next) => {
    try {
      const existing = await CaseService.getCaseById(req.params.id);
      const user = req.user!;
      const isOwner = user.role === 'CITIZEN' && existing.citizen_id === user.id;
      const isAssignedLawyer = user.role === 'LAWYER' && existing.assigned_lawyer_id === user.id;
      const isAdmin = user.role === 'ADMIN';

      if (!isOwner && !isAssignedLawyer && !isAdmin) {
        return next(new ForbiddenError('You are not authorized to update status for this case.'));
      }

      const updated = await CaseService.updateStatus(req.params.id, req.body.status as any);
      res.status(200).json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }
);

// ── POST /api/cases/:id/assign — Assign lawyer (ADMIN or LAWYER only) ─────────
caseRouter.post(
  '/:id/assign',
  requireRole(['LAWYER', 'ADMIN']),
  validate({ body: assignLawyerSchema }),
  async (req, res, next) => {
    try {
      const updated = await CaseService.assignLawyer(req.params.id, req.body.lawyerId);
      res.status(200).json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }
);
