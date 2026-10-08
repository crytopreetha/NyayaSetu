import { Router } from 'express';
import { z } from 'zod';
import { CaseAssistanceService } from '../services/case-assistance.service.js';
import { validate } from '../middleware/validate.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { ForbiddenError } from '../utils/errors.js';

export const caseAssistanceRouter = Router();

// ── Validation Schemas ────────────────────────────────────────────────────────

const createRequestSchema = z.object({
  lawyerId: z.string().uuid().optional().nullable(),
  requestType: z.enum(['LEGAL_ADVICE', 'CASE_REPRESENTATION']).optional().default('LEGAL_ADVICE'),
  message: z.string().optional(),
});

const acceptCaseSchema = z.object({
  notes: z.string().optional(),
});

const requestInfoSchema = z.object({
  message: z.string().min(5, 'Please provide details on what information is needed.'),
});

const declineCaseSchema = z.object({
  reason: z.string().optional(),
});

// ── CITIZEN: Request Assistance on a Case ──────────────────────────────────────
caseAssistanceRouter.post(
  '/cases/:caseId/assistance-requests',
  requireRole(['CITIZEN', 'ADMIN']),
  validate({ body: createRequestSchema }),
  async (req, res, next) => {
    try {
      const user = req.user!;
      const { caseId } = req.params;

      const request = await CaseAssistanceService.createRequest({
        caseId,
        citizenId: user.id,
        lawyerId: req.body.lawyerId || null,
        requestType: req.body.requestType,
        message: req.body.message,
      });

      res.status(201).json({
        success: true,
        message: 'Case assistance request submitted successfully. Advocate will review your dossier.',
        data: request,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ── CITIZEN / LAWYER: List Assistance Requests for a Case ─────────────────────
caseAssistanceRouter.get(
  '/cases/:caseId/assistance-requests',
  async (req, res, next) => {
    try {
      const { caseId } = req.params;
      const requests = await CaseAssistanceService.listRequestsForCase(caseId);
      res.status(200).json({ success: true, data: requests });
    } catch (err) {
      next(err);
    }
  }
);

// ── LAWYER: List Requests for Dashboard (New, Pending, Active, Completed) ──────
caseAssistanceRouter.get(
  '/assistance-requests/lawyer',
  requireRole(['LAWYER', 'ADMIN']),
  async (req, res, next) => {
    try {
      const lawyerId = req.user!.id;
      const tab = req.query.tab as 'new' | 'pending' | 'active' | 'completed' | 'all' | undefined;
      const requests = await CaseAssistanceService.listRequestsForLawyer(lawyerId, tab);
      res.status(200).json({ success: true, data: requests });
    } catch (err) {
      next(err);
    }
  }
);

// ── LAWYER: Review Request ────────────────────────────────────────────────────
caseAssistanceRouter.post(
  '/assistance-requests/:id/review',
  requireRole(['LAWYER', 'ADMIN']),
  async (req, res, next) => {
    try {
      const lawyerId = req.user!.id;
      const request = await CaseAssistanceService.reviewRequest(req.params.id, lawyerId);
      res.status(200).json({
        success: true,
        message: 'Case marked under advocate review.',
        data: request,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ── LAWYER: Accept Case ───────────────────────────────────────────────────────
caseAssistanceRouter.post(
  '/assistance-requests/:id/accept',
  requireRole(['LAWYER', 'ADMIN']),
  validate({ body: acceptCaseSchema }),
  async (req, res, next) => {
    try {
      const lawyerId = req.user!.id;
      const request = await CaseAssistanceService.acceptCase(
        req.params.id,
        lawyerId,
        req.body.notes
      );
      res.status(200).json({
        success: true,
        message: 'Case accepted! Status updated to LAWYER_ASSIGNED. Full collaboration active.',
        data: request,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ── LAWYER: Request More Information ──────────────────────────────────────────
caseAssistanceRouter.post(
  '/assistance-requests/:id/request-info',
  requireRole(['LAWYER', 'ADMIN']),
  validate({ body: requestInfoSchema }),
  async (req, res, next) => {
    try {
      const lawyerId = req.user!.id;
      const request = await CaseAssistanceService.requestMoreInfo(
        req.params.id,
        lawyerId,
        req.body.message
      );
      res.status(200).json({
        success: true,
        message: 'Clarification request posted to case thread and citizen notified.',
        data: request,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ── LAWYER: Decline Case ──────────────────────────────────────────────────────
caseAssistanceRouter.post(
  '/assistance-requests/:id/decline',
  requireRole(['LAWYER', 'ADMIN']),
  validate({ body: declineCaseSchema }),
  async (req, res, next) => {
    try {
      const lawyerId = req.user!.id;
      const request = await CaseAssistanceService.declineCase(
        req.params.id,
        lawyerId,
        req.body.reason
      );
      res.status(200).json({
        success: true,
        message: 'Request declined.',
        data: request,
      });
    } catch (err) {
      next(err);
    }
  }
);
