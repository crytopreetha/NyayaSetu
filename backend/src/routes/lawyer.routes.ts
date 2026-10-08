import { Router } from 'express';
import { z } from 'zod';
import { LawyerService } from '../services/lawyer.service.js';
import { validate } from '../middleware/validate.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';

export const lawyerRouter = Router();

const createLawyerSchema = z.object({
  id: z.string().uuid(),
  barCouncilNumber: z.string().min(3).max(100),
  bio: z.string().optional(),
  specialization: z.array(z.string()).default([]),
  experienceYears: z.number().int().min(0).default(0),
  city: z.string().min(2).max(100),
  state: z.string().min(2).max(100),
  languagesSpoken: z.array(z.string()).default(['en', 'hi']),
});

const statusSchema = z.object({
  status: z.enum(['PENDING', 'VERIFIED', 'REJECTED']),
});

lawyerRouter.post('/', validate({ body: createLawyerSchema }), async (req, res, next) => {
  try {
    const lawyer = await LawyerService.createLawyer(req.body);
    res.status(201).json({ success: true, data: lawyer });
  } catch (err) {
    next(err);
  }
});

lawyerRouter.get('/', async (req, res, next) => {
  try {
    const { city, state, specialization, language, status, isAvailable, limit, offset } = req.query;
    const lawyers = await LawyerService.listLawyers({
      city: city as string,
      state: state as string,
      specialization: specialization as string,
      language: language as string,
      status: status as string,
      isAvailable: isAvailable !== undefined ? isAvailable === 'true' : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
    });
    res.status(200).json({ success: true, data: lawyers });
  } catch (err) {
    next(err);
  }
});

lawyerRouter.get('/:id', async (req, res, next) => {
  try {
    const lawyer = await LawyerService.getLawyerById(req.params.id);
    res.status(200).json({ success: true, data: lawyer });
  } catch (err) {
    next(err);
  }
});

lawyerRouter.patch('/:id/status', requireRole(['ADMIN']), validate({ body: statusSchema }), async (req, res, next) => {
  try {
    const lawyer = await LawyerService.updateVerificationStatus(req.params.id, req.body.status);
    res.status(200).json({ success: true, data: lawyer });
  } catch (err) {
    next(err);
  }
});
