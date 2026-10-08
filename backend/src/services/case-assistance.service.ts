import { db } from '../config/db.js';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors.js';
import { CaseService, StandardCaseStatus } from './case.service.js';
import { CaseEventService } from './case-event.service.js';
import { NotificationService } from './notification.service.js';
import { MessageService } from './message.service.js';

export interface CreateAssistanceRequestInput {
  caseId: string;
  citizenId: string;
  lawyerId?: string | null;
  requestType?: 'LEGAL_ADVICE' | 'CASE_REPRESENTATION';
  message?: string;
}

export interface AssistanceRequestRecord {
  id: string;
  case_id: string;
  citizen_id: string;
  lawyer_id: string | null;
  request_type: string;
  status: 'NEW' | 'UNDER_REVIEW' | 'INFO_REQUESTED' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';
  message: string | null;
  lawyer_notes: string | null;
  created_at: string;
  updated_at: string;
  case_title?: string;
  case_number?: string;
  case_category?: string;
  case_status?: string;
  citizen_name?: string;
  citizen_email?: string;
  citizen_phone?: string;
  citizen_language?: string;
  lawyer_name?: string;
  lawyer_bar_id?: string;
  documents_count?: number;
}

export class CaseAssistanceService {
  /**
   * Citizen creates a case assistance request (direct to lawyer or open pool)
   */
  static async createRequest(input: CreateAssistanceRequestInput): Promise<AssistanceRequestRecord> {
    const caseRecord = await CaseService.getCaseById(input.caseId);

    if (caseRecord.citizen_id !== input.citizenId) {
      throw new ForbiddenError('You can only request assistance for your own cases.');
    }

    // Check if an active request already exists for this case & lawyer
    const existingReq = await db.query(
      `SELECT id, status FROM case_assistance_requests 
       WHERE case_id = $1 AND status IN ('NEW', 'UNDER_REVIEW', 'INFO_REQUESTED')
       LIMIT 1;`,
      [input.caseId]
    );

    if (existingReq.rows.length > 0) {
      throw new BadRequestError('An active assistance request is already pending for this case.');
    }

    const requestType = input.requestType || 'LEGAL_ADVICE';
    const initialStatus = 'NEW';
    const nextCaseStatus: StandardCaseStatus = input.lawyerId ? 'AWAITING_LAWYER' : 'AWAITING_LAWYER';

    const insertRes = await db.query(
      `INSERT INTO case_assistance_requests (
        case_id, citizen_id, lawyer_id, request_type, status, message
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;`,
      [
        input.caseId,
        input.citizenId,
        input.lawyerId || null,
        requestType,
        initialStatus,
        input.message?.trim() || null,
      ]
    );

    const request = insertRes.rows[0];

    // Transition case status
    await CaseService.updateStatus(input.caseId, nextCaseStatus);

    // Log timeline event
    await CaseEventService.createEvent({
      caseId: input.caseId,
      eventType: 'ASSISTANCE_REQUESTED',
      title: input.lawyerId ? 'Assistance Requested from Advocate' : 'Case Listed for Advocate Matching',
      description: input.message?.trim() || `Citizen submitted a request for ${requestType.replace('_', ' ').toLowerCase()}.`,
      actorId: input.citizenId,
      metadata: { requestId: request.id, lawyerId: input.lawyerId, requestType },
    });

    // Notify specific lawyer if assigned
    if (input.lawyerId) {
      try {
        await NotificationService.createNotification({
          userId: input.lawyerId,
          type: 'CASE_ASSIGNMENT',
          title: 'New Legal Advice Request',
          message: `Citizen requested advice for Case #${caseRecord.case_number} ("${caseRecord.title}").`,
          linkUrl: `/lawyer/dashboard?tab=requests&requestId=${request.id}`,
        });
      } catch (err) {
        console.warn('Could not send notification to lawyer:', err);
      }
    }

    return this.getRequestById(request.id);
  }

  /**
   * Retrieve request by ID with rich joined case details
   */
  static async getRequestById(id: string): Promise<AssistanceRequestRecord> {
    const res = await db.query(
      `SELECT 
        r.*,
        c.title AS case_title,
        c.case_number,
        c.category AS case_category,
        c.status AS case_status,
        c.urgency AS case_urgency,
        u.full_name AS citizen_name,
        u.email AS citizen_email,
        u.phone AS citizen_phone,
        u.preferred_language AS citizen_language,
        lu.full_name AS lawyer_name,
        l.bar_council_number AS lawyer_bar_id,
        (SELECT COUNT(*) FROM documents d WHERE d.case_id = r.case_id) AS documents_count
      FROM case_assistance_requests r
      JOIN cases c ON r.case_id = c.id
      JOIN users u ON r.citizen_id = u.id
      LEFT JOIN lawyers l ON r.lawyer_id = l.id
      LEFT JOIN users lu ON l.id = lu.id
      WHERE r.id = $1;`,
      [id]
    );

    if (res.rows.length === 0) {
      throw new NotFoundError('Case Assistance Request', id);
    }
    return res.rows[0];
  }

  /**
   * Lawyer reviews the case request
   */
  static async reviewRequest(requestId: string, lawyerId: string): Promise<AssistanceRequestRecord> {
    const req = await this.getRequestById(requestId);

    // If request had no specific lawyer, claiming it sets lawyer_id
    await db.query(
      `UPDATE case_assistance_requests
       SET status = 'UNDER_REVIEW',
           lawyer_id = COALESCE(lawyer_id, $1),
           updated_at = NOW()
       WHERE id = $2;`,
      [lawyerId, requestId]
    );

    // Update case status to LAWYER_REVIEW
    await CaseService.updateStatus(req.case_id, 'LAWYER_REVIEW');

    // Case timeline event
    await CaseEventService.createEvent({
      caseId: req.case_id,
      eventType: 'LAWYER_REVIEW',
      title: 'Advocate Review In Progress',
      description: 'Advocate is currently inspecting case dossier, facts, and uploaded evidence.',
      actorId: lawyerId,
    });

    // Notify citizen
    await NotificationService.createNotification({
      userId: req.citizen_id,
      type: 'CASE_STATUS',
      title: 'Advocate Reviewing Your Case',
      message: `An advocate is currently reviewing your case documents for Case #${req.case_number}.`,
      linkUrl: `/citizen/cases/${req.case_id}`,
    });

    return this.getRequestById(requestId);
  }

  /**
   * Lawyer accepts the case
   */
  static async acceptCase(requestId: string, lawyerId: string, notes?: string): Promise<AssistanceRequestRecord> {
    const req = await this.getRequestById(requestId);

    // Update request
    await db.query(
      `UPDATE case_assistance_requests
       SET status = 'ACCEPTED',
           lawyer_id = $1,
           lawyer_notes = $2,
           updated_at = NOW()
       WHERE id = $3;`,
      [lawyerId, notes?.trim() || null, requestId]
    );

    // Assign lawyer to case and set status to LAWYER_ASSIGNED
    await CaseService.assignLawyer(req.case_id, lawyerId);

    // Timeline event
    await CaseEventService.createEvent({
      caseId: req.case_id,
      eventType: 'LAWYER_ASSIGNED',
      title: 'Advocate Representation Confirmed',
      description: notes?.trim() || 'Advocate has formally accepted the case representation request.',
      actorId: lawyerId,
      metadata: { requestId, lawyerId },
    });

    // Notify citizen
    await NotificationService.createNotification({
      userId: req.citizen_id,
      type: 'CASE_ASSIGNMENT',
      title: 'Advocate Assigned to Your Case!',
      message: `Your advocate has accepted Case #${req.case_number}. Secure case communication and document collaboration are now active.`,
      linkUrl: `/citizen/cases/${req.case_id}`,
    });

    return this.getRequestById(requestId);
  }

  /**
   * Lawyer requests more information
   */
  static async requestMoreInfo(requestId: string, lawyerId: string, queryMessage: string): Promise<AssistanceRequestRecord> {
    if (!queryMessage || queryMessage.trim().length === 0) {
      throw new BadRequestError('Please provide details on what information or document is required.');
    }

    const req = await this.getRequestById(requestId);

    await db.query(
      `UPDATE case_assistance_requests
       SET status = 'INFO_REQUESTED',
           lawyer_id = COALESCE(lawyer_id, $1),
           lawyer_notes = $2,
           updated_at = NOW()
       WHERE id = $3;`,
      [lawyerId, queryMessage.trim(), requestId]
    );

    // Update case status to ACTION_REQUIRED
    await CaseService.updateStatus(req.case_id, 'ACTION_REQUIRED');

    // Automatically post message into case message thread
    try {
      await MessageService.createMessage({
        caseId: req.case_id,
        senderId: lawyerId,
        content: `[Advocate Clarification Request]: ${queryMessage.trim()}`,
      });
    } catch (msgErr) {
      console.warn('Could not post clarification to message thread:', msgErr);
    }

    // Timeline event
    await CaseEventService.createEvent({
      caseId: req.case_id,
      eventType: 'ACTION_REQUIRED',
      title: 'Advocate Requested Clarification',
      description: queryMessage.trim(),
      actorId: lawyerId,
    });

    // Notify citizen
    await NotificationService.createNotification({
      userId: req.citizen_id,
      type: 'CASE_STATUS',
      title: 'Action Required: Advocate Clarification',
      message: `Your advocate requested additional details for Case #${req.case_number}: "${queryMessage.slice(0, 100)}..."`,
      linkUrl: `/citizen/cases/${req.case_id}`,
    });

    return this.getRequestById(requestId);
  }

  /**
   * Lawyer declines request
   */
  static async declineCase(requestId: string, lawyerId: string, reason?: string): Promise<AssistanceRequestRecord> {
    const req = await this.getRequestById(requestId);

    await db.query(
      `UPDATE case_assistance_requests
       SET status = 'DECLINED',
           lawyer_notes = $1,
           updated_at = NOW()
       WHERE id = $2;`,
      [reason?.trim() || 'Advocate unavailable or outside practice domain.', requestId]
    );

    // Revert case status to AWAITING_LAWYER so citizen can request another advocate
    await CaseService.updateStatus(req.case_id, 'AWAITING_LAWYER');

    // Timeline event
    await CaseEventService.createEvent({
      caseId: req.case_id,
      eventType: 'CASE_UPDATED',
      title: 'Request Declined by Advocate',
      description: reason?.trim() || 'Advocate was unable to accept representation due to scheduling/jurisdiction.',
      actorId: lawyerId,
    });

    // Notify citizen
    await NotificationService.createNotification({
      userId: req.citizen_id,
      type: 'CASE_STATUS',
      title: 'Advocate Unavailable',
      message: `The advocate was unable to accept Case #${req.case_number}. You can find and request another verified advocate.`,
      linkUrl: `/citizen/cases/${req.case_id}`,
    });

    return this.getRequestById(requestId);
  }

  /**
   * List assistance requests for a lawyer dashboard:
   * Categorized into: NEW, PENDING (under review), ACTIVE, COMPLETED
   */
  static async listRequestsForLawyer(
    lawyerId: string,
    tab?: 'new' | 'pending' | 'active' | 'completed' | 'all'
  ): Promise<AssistanceRequestRecord[]> {
    let whereClause = `WHERE (r.lawyer_id = $1 OR (r.lawyer_id IS NULL AND r.status = 'NEW'))`;
    const params: any[] = [lawyerId];

    if (tab === 'new') {
      whereClause += ` AND r.status = 'NEW'`;
    } else if (tab === 'pending') {
      whereClause += ` AND r.status IN ('UNDER_REVIEW', 'INFO_REQUESTED')`;
    } else if (tab === 'active') {
      whereClause += ` AND r.status = 'ACCEPTED' AND c.status IN ('LAWYER_ASSIGNED', 'IN_PROGRESS', 'ACTION_REQUIRED')`;
    } else if (tab === 'completed') {
      whereClause += ` AND (r.status = 'DECLINED' OR c.status IN ('RESOLVED', 'CLOSED'))`;
    }

    const res = await db.query(
      `SELECT 
        r.*,
        c.title AS case_title,
        c.case_number,
        c.category AS case_category,
        c.status AS case_status,
        c.urgency AS case_urgency,
        u.full_name AS citizen_name,
        u.email AS citizen_email,
        u.phone AS citizen_phone,
        u.preferred_language AS citizen_language,
        (SELECT COUNT(*) FROM documents d WHERE d.case_id = r.case_id) AS documents_count
      FROM case_assistance_requests r
      JOIN cases c ON r.case_id = c.id
      JOIN users u ON r.citizen_id = u.id
      ${whereClause}
      ORDER BY r.created_at DESC;`,
      params
    );

    return res.rows;
  }

  /**
   * List assistance requests for a specific case
   */
  static async listRequestsForCase(caseId: string): Promise<AssistanceRequestRecord[]> {
    const res = await db.query(
      `SELECT 
        r.*,
        lu.full_name AS lawyer_name,
        l.bar_council_number AS lawyer_bar_id,
        l.city AS lawyer_city,
        l.rating AS lawyer_rating
      FROM case_assistance_requests r
      LEFT JOIN lawyers l ON r.lawyer_id = l.id
      LEFT JOIN users lu ON l.id = lu.id
      WHERE r.case_id = $1
      ORDER BY r.created_at DESC;`,
      [caseId]
    );

    return res.rows;
  }
}
