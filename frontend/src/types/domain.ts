/**
 * NyayaSetu Domain Types
 * Shared types for cases, documents, lawyers, and all domain entities.
 */

// ── Enums ─────────────────────────────────────────────────────────────────────

export type CaseStatus =
  | 'DRAFT'
  | 'DOCUMENT_UPLOADED'
  | 'AI_ANALYSIS'
  | 'AWAITING_LAWYER'
  | 'LAWYER_REVIEW'
  | 'LAWYER_ASSIGNED'
  | 'ACTION_REQUIRED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'CLOSED'
  | 'OPEN'
  | 'IN_REVIEW'
  | 'ASSIGNED'
  | 'ACTIVE';

export type AssistanceRequestStatus =
  | 'NEW'
  | 'UNDER_REVIEW'
  | 'INFO_REQUESTED'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'CANCELLED';

export interface CaseAssistanceRequest {
  id: string;
  caseId: string;
  citizenId: string;
  lawyerId?: string | null;
  requestType: 'LEGAL_ADVICE' | 'CASE_REPRESENTATION';
  status: AssistanceRequestStatus;
  message?: string | null;
  lawyerNotes?: string | null;
  createdAt: string;
  updatedAt: string;
  caseTitle?: string;
  caseNumber?: string;
  caseCategory?: string;
  caseStatus?: CaseStatus;
  caseUrgency?: RiskLevel;
  citizenName?: string;
  citizenEmail?: string;
  citizenPhone?: string;
  citizenLanguage?: string;
  lawyerName?: string;
  lawyerBarId?: string;
  documentsCount?: number;
}
export type CaseCategory = 'LAND_DISPUTE' | 'FAMILY_LAW' | 'CRIMINAL' | 'LABOUR' | 'CONSUMER' | 'PROPERTY' | 'CIVIL' | 'OTHER';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type UserRole = 'CITIZEN' | 'LAWYER' | 'ADMIN';

// ── Case ──────────────────────────────────────────────────────────────────────

export interface Case {
  id: string;
  caseNumber: string;
  title: string;
  description: string;
  category: CaseCategory;
  status: CaseStatus;
  citizenId: string;
  citizenName?: string;
  assignedLawyerId?: string | null;
  lawyerName?: string | null;
  riskLevel?: RiskLevel;
  createdAt: string;
  updatedAt: string;
}

// ── Document ──────────────────────────────────────────────────────────────────

export type DocumentProcessingStatus = 'UPLOADED' | 'PROCESSING' | 'ANALYZING' | 'COMPLETED' | 'FAILED';

export interface Document {
  id: string;
  caseId: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: string;
  status: DocumentProcessingStatus;
  detectedLanguage?: string;
  extractedText?: string;
  analysis?: AIAnalysis;
}

// ── AI Analysis ───────────────────────────────────────────────────────────────

export interface AIAnalysis {
  id: string;
  documentId: string;
  summary: string;
  extractedDates: { date: string; description: string }[];
  extractedParties: string[];
  riskIndicators: { level: RiskLevel; description: string }[];
  recommendedActions: string[];
  legalSections: string[];
  confidence: number;
  analyzedAt: string;
  isDemo?: boolean; // clearly marks mock/demo data
}

// ── Deadline ──────────────────────────────────────────────────────────────────

export interface Deadline {
  id: string;
  caseId: string;
  caseNumber?: string;
  title: string;
  description?: string;
  dueDate: string;
  status: 'UPCOMING' | 'OVERDUE' | 'COMPLETED';
  priority: RiskLevel;
}

// ── Case Event ────────────────────────────────────────────────────────────────

export interface CaseEvent {
  id: string;
  caseId: string;
  type: 'STATUS_CHANGE' | 'DOCUMENT_UPLOAD' | 'LAWYER_ASSIGNED' | 'AI_ANALYSIS' | 'DEADLINE_SET' | 'MESSAGE' | 'HEARING' | 'NOTE';
  title: string;
  description?: string;
  createdBy?: string;
  createdAt: string;
}

// ── Message ───────────────────────────────────────────────────────────────────

export interface Message {
  id: string;
  caseId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  content: string;
  createdAt: string;
}

// ── Notification ──────────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  userId: string;
  type: 'CASE_UPDATE' | 'DEADLINE' | 'DOCUMENT' | 'MESSAGE' | 'SYSTEM';
  title: string;
  body: string;
  isRead: boolean;
  caseId?: string;
  createdAt: string;
}

// ── Lawyer Profile ────────────────────────────────────────────────────────────

export interface LawyerProfile {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone?: string;
  barCouncilNumber: string;
  specialization: string[];
  experienceYears: number;
  city: string;
  state: string;
  bio?: string;
  isVerified: boolean;
  rating?: number;
  casesHandled?: number;
}

// ── Dashboard Stats ───────────────────────────────────────────────────────────

export interface CitizenDashboardStats {
  activeCases: number;
  pendingActions: number;
  upcomingDeadlines: number;
  resolvedCases: number;
}

export interface LawyerDashboardStats {
  totalActiveCases: number;
  newCasesThisWeek: number;
  pendingResponses: number;
  casesResolved: number;
}

// ── Chart Data ────────────────────────────────────────────────────────────────

export interface ChartDataPoint {
  name: string;
  value: number;
  fill?: string;
}

export interface TimeSeriesPoint {
  date: string;
  cases: number;
  resolved?: number;
}
