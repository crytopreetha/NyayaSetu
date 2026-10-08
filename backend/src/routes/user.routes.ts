import { Router } from 'express';
import { z } from 'zod';
import { UserService } from '../services/user.service.js';
import { validate } from '../middleware/validate.middleware.js';

export const userRouter = Router();

const createUserSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2).max(150),
  role: z.enum(['CITIZEN', 'LAWYER', 'ADMIN']).optional().default('CITIZEN'),
  phone: z.string().optional(),
  preferredLanguage: z.enum(['en', 'hi', 'mr']).optional().default('en'),
  authId: z.string().uuid().optional(),
  avatarUrl: z.string().url().optional(),
});

const updateUserSchema = z.object({
  fullName: z.string().min(2).max(150).optional(),
  phone: z.string().optional(),
  preferredLanguage: z.enum(['en', 'hi', 'mr']).optional(),
  avatarUrl: z.string().url().optional(),
});

// Update current user's preferred language
userRouter.patch('/me/language', async (req, res, next) => {
  try {
    const { language } = req.body;
    if (!language || !['en', 'hi', 'mr'].includes(language)) {
      return res.status(400).json({
        success: false,
        error: { message: `Invalid language '${language}'. Supported: 'en', 'hi', 'mr'` },
      });
    }
    const user = await UserService.updateUserLanguage(req.user!.id, language);
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

userRouter.post('/', validate({ body: createUserSchema }), async (req, res, next) => {
  try {
    const user = await UserService.createUser(req.body);
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

userRouter.get('/', async (req, res, next) => {
  try {
    const { role, limit, offset } = req.query;
    const users = await UserService.listUsers({
      role: role as string,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
    });
    res.status(200).json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
});

userRouter.get('/:id', async (req, res, next) => {
  try {
    const user = await UserService.getUserById(req.params.id);
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

userRouter.put('/:id', validate({ body: updateUserSchema }), async (req, res, next) => {
  try {
    const user = await UserService.updateUser(req.params.id, req.body);
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});
