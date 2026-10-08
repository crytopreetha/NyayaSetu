import { Router } from 'express';
import { z } from 'zod';
import { db } from '../config/db.js';
import { MessageService } from '../services/message.service.js';
import { CaseService } from '../services/case.service.js';
import { NotificationService } from '../services/notification.service.js';
import { validate } from '../middleware/validate.middleware.js';
import { ForbiddenError, NotFoundError } from '../utils/errors.js';

export const messageRouter = Router();

const sendMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(5000),
  attachments: z.array(z.record(z.any())).optional(),
});

/**
 * Helper to enforce strict authorization for case messaging:
 * Only citizen assigned to case, assigned lawyer, or admin can access.
 */
async function checkCaseMessagingAccess(caseId: string, userId: string, userRole: string) {
  if (userRole === 'ADMIN') return true;

  const caseRes = await db.query(
    `SELECT id, citizen_id, assigned_lawyer_id, case_number, title 
     FROM cases 
     WHERE id = $1;`,
    [caseId]
  );

  if (caseRes.rows.length === 0) {
    throw new NotFoundError('Case', caseId);
  }

  const c = caseRes.rows[0];
  const isCitizen = c.citizen_id === userId;
  const isLawyer = c.assigned_lawyer_id === userId;

  if (!isCitizen && !isLawyer) {
    throw new ForbiddenError(
      'Access denied. Only the citizen and assigned advocate have authorized access to this confidential conversation.'
    );
  }

  return c;
}

// ── GET /api/cases/:caseId/messages — Retrieve conversation ───────────────────
messageRouter.get('/cases/:caseId/messages', async (req, res, next) => {
  try {
    const user = req.user!;
    const { caseId } = req.params;

    // Strict access check
    await checkCaseMessagingAccess(caseId, user.id, user.role);

    const messages = await MessageService.listMessagesByCase(caseId);

    // Mark messages as read for this user
    await MessageService.markMessagesAsRead(caseId, user.id);

    res.status(200).json({ success: true, data: messages });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/cases/:caseId/messages — Post a message ─────────────────────────
messageRouter.post(
  '/cases/:caseId/messages',
  validate({ body: sendMessageSchema }),
  async (req, res, next) => {
    try {
      const user = req.user!;
      const { caseId } = req.params;

      // Strict access check
      const caseRecord = await checkCaseMessagingAccess(caseId, user.id, user.role);

      const msg = await MessageService.createMessage({
        caseId,
        senderId: user.id,
        content: req.body.content,
        attachments: req.body.attachments,
      });

      // Notify the other party
      const recipientId =
        user.id === caseRecord.citizen_id
          ? caseRecord.assigned_lawyer_id
          : caseRecord.citizen_id;

      if (recipientId) {
        try {
          await NotificationService.createNotification({
            userId: recipientId,
            type: 'COMMUNICATION',
            title: `New message on Case #${caseRecord.case_number}`,
            message: `${user.role === 'LAWYER' ? 'Advocate' : 'Citizen'} sent: "${req.body.content.slice(0, 80)}..."`,
            linkUrl: user.role === 'LAWYER' ? `/citizen/cases/${caseId}` : `/lawyer/dashboard?tab=cases&caseId=${caseId}`,
          });
        } catch (notifErr) {
          console.warn('Could not send message notification:', notifErr);
        }
      }

      res.status(201).json({
        success: true,
        message: 'Message delivered securely.',
        data: msg,
      });
    } catch (err) {
      next(err);
    }
  }
);
