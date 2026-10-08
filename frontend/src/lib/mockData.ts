/**
 * NyayaSetu Mock/Demo Data
 * ⚡ ALL DATA IN THIS FILE IS DEMO/PLACEHOLDER DATA
 * Used when backend endpoints for cases/documents/analysis are not yet live.
 * Every mock object is tagged with isDemo: true where applicable.
 */

import type {
  Case, Document, AIAnalysis, Deadline, CaseEvent,
  Message, Notification, LawyerProfile, ChartDataPoint, TimeSeriesPoint,
} from '../types/domain';

// ── Demo Cases ────────────────────────────────────────────────────────────────

export const DEMO_CITIZEN_CASES: Case[] = [
  {
    id: 'demo-case-1',
    caseNumber: 'NS-2026-00142',
    title: 'Agricultural Land Title Verification — Pune',
    description: 'Verification of 7/12 extract and mutation entries for agricultural land parcel in Haveli taluka. Dispute over boundary demarcation with neighboring plot holder.',
    category: 'LAND_DISPUTE',
    status: 'IN_PROGRESS',
    citizenId: 'demo-citizen-1',
    citizenName: 'Rajesh Sharma',
    assignedLawyerId: 'demo-lawyer-1',
    lawyerName: 'Adv. Priya Deshmukh',
    riskLevel: 'HIGH',
    createdAt: '2026-09-15T10:30:00Z',
    updatedAt: '2026-10-06T14:20:00Z',
  },
  {
    id: 'demo-case-2',
    caseNumber: 'NS-2026-00156',
    title: 'Consumer Complaint — Defective Home Appliance',
    description: 'Consumer forum complaint regarding defective washing machine purchased from authorized dealer. Manufacturer refusing replacement despite warranty.',
    category: 'CONSUMER',
    status: 'OPEN',
    citizenId: 'demo-citizen-1',
    citizenName: 'Rajesh Sharma',
    assignedLawyerId: null,
    lawyerName: null,
    riskLevel: 'LOW',
    createdAt: '2026-10-01T08:00:00Z',
    updatedAt: '2026-10-04T11:45:00Z',
  },
  {
    id: 'demo-case-3',
    caseNumber: 'NS-2026-00098',
    title: 'Property Registration Dispute — Nagpur',
    description: 'Challenge to property registration due to forged power of attorney. Sub-registrar office has flagged the transaction.',
    category: 'PROPERTY',
    status: 'IN_REVIEW',
    citizenId: 'demo-citizen-1',
    citizenName: 'Rajesh Sharma',
    assignedLawyerId: 'demo-lawyer-2',
    lawyerName: 'Adv. Vikram Joshi',
    riskLevel: 'CRITICAL',
    createdAt: '2026-08-20T12:00:00Z',
    updatedAt: '2026-10-05T09:30:00Z',
  },
  {
    id: 'demo-case-4',
    caseNumber: 'NS-2026-00201',
    title: 'Labour Wage Dispute — Factory Workers',
    description: 'Unpaid overtime wages for 3 months. Labour commissioner complaint filed.',
    category: 'LABOUR',
    status: 'ASSIGNED',
    citizenId: 'demo-citizen-1',
    citizenName: 'Rajesh Sharma',
    assignedLawyerId: 'demo-lawyer-1',
    lawyerName: 'Adv. Priya Deshmukh',
    riskLevel: 'MEDIUM',
    createdAt: '2026-10-03T16:00:00Z',
    updatedAt: '2026-10-07T08:00:00Z',
  },
];

// ── Demo Documents ────────────────────────────────────────────────────────────

export const DEMO_DOCUMENTS: Document[] = [
  {
    id: 'demo-doc-1',
    caseId: 'demo-case-1',
    originalName: '7_12_Extract_Haveli.pdf',
    fileType: 'application/pdf',
    fileSize: 2340000,
    uploadedBy: 'demo-citizen-1',
    uploadedAt: '2026-09-15T10:35:00Z',
    status: 'COMPLETED',
  },
  {
    id: 'demo-doc-2',
    caseId: 'demo-case-1',
    originalName: 'Mutation_Entry_2024.pdf',
    fileType: 'application/pdf',
    fileSize: 1560000,
    uploadedBy: 'demo-citizen-1',
    uploadedAt: '2026-09-16T09:00:00Z',
    status: 'COMPLETED',
  },
  {
    id: 'demo-doc-3',
    caseId: 'demo-case-3',
    originalName: 'Power_of_Attorney.pdf',
    fileType: 'application/pdf',
    fileSize: 890000,
    uploadedBy: 'demo-citizen-1',
    uploadedAt: '2026-08-21T14:00:00Z',
    status: 'COMPLETED',
  },
];

// ── Demo AI Analysis ──────────────────────────────────────────────────────────
// ⚠️ This is DEMO data. Not real legal analysis.

export const DEMO_AI_ANALYSIS: AIAnalysis = {
  id: 'demo-analysis-1',
  documentId: 'demo-doc-1',
  summary: '⚡ DEMO — This is placeholder AI analysis, not real legal advice. The actual Gemini AI analysis will be integrated in a future phase.',
  extractedDates: [
    { date: '2024-03-15', description: 'Mutation entry date (demo)' },
    { date: '2026-12-31', description: 'Limitation period expiry (demo)' },
    { date: '2026-11-15', description: 'Next hearing date (demo)' },
  ],
  extractedParties: ['Rajesh Sharma (Demo)', 'State Revenue Department (Demo)', 'Adjacent Plot Holder (Demo)'],
  riskIndicators: [
    { level: 'HIGH', description: 'Boundary overlap detected in survey records (demo)' },
    { level: 'MEDIUM', description: 'Mutation entry pending verification (demo)' },
    { level: 'LOW', description: 'All revenue receipts available (demo)' },
  ],
  recommendedActions: [
    'File objection before Tahsildar within 30 days (demo)',
    'Obtain certified copy of survey map (demo)',
    'Request joint survey with revenue officials (demo)',
  ],
  legalSections: [
    'Maharashtra Land Revenue Code, 1966 — Section 150 (demo)',
    'Transfer of Property Act, 1882 — Section 54 (demo)',
  ],
  confidence: 0.82,
  analyzedAt: '2026-09-15T11:00:00Z',
  isDemo: true,
};

// ── Demo Deadlines ────────────────────────────────────────────────────────────

export const DEMO_DEADLINES: Deadline[] = [
  {
    id: 'demo-dl-1',
    caseId: 'demo-case-1',
    caseNumber: 'NS-2026-00142',
    title: 'File objection before Tahsildar',
    description: 'Deadline to file formal written objection regarding land boundary dispute',
    dueDate: '2026-10-20T00:00:00Z',
    status: 'UPCOMING',
    priority: 'HIGH',
  },
  {
    id: 'demo-dl-2',
    caseId: 'demo-case-3',
    caseNumber: 'NS-2026-00098',
    title: 'Submit documents to Sub-Registrar',
    description: 'Provide original sale deed and identity proof to sub-registrar office',
    dueDate: '2026-10-12T00:00:00Z',
    status: 'UPCOMING',
    priority: 'CRITICAL',
  },
  {
    id: 'demo-dl-3',
    caseId: 'demo-case-2',
    caseNumber: 'NS-2026-00156',
    title: 'Consumer Forum hearing',
    description: 'Attend hearing at District Consumer Forum',
    dueDate: '2026-10-25T00:00:00Z',
    status: 'UPCOMING',
    priority: 'MEDIUM',
  },
  {
    id: 'demo-dl-4',
    caseId: 'demo-case-1',
    caseNumber: 'NS-2026-00142',
    title: 'Revenue department response',
    description: 'Expected response from Haveli taluka revenue department',
    dueDate: '2026-11-05T00:00:00Z',
    status: 'UPCOMING',
    priority: 'LOW',
  },
];

// ── Demo Case Events (Timeline) ───────────────────────────────────────────────

export const DEMO_CASE_EVENTS: CaseEvent[] = [
  {
    id: 'demo-evt-1',
    caseId: 'demo-case-1',
    type: 'STATUS_CHANGE',
    title: 'Case created',
    description: 'Case NS-2026-00142 was created by citizen',
    createdAt: '2026-09-15T10:30:00Z',
  },
  {
    id: 'demo-evt-2',
    caseId: 'demo-case-1',
    type: 'DOCUMENT_UPLOAD',
    title: '7/12 Extract uploaded',
    description: 'Document "7_12_Extract_Haveli.pdf" was uploaded',
    createdAt: '2026-09-15T10:35:00Z',
  },
  {
    id: 'demo-evt-3',
    caseId: 'demo-case-1',
    type: 'AI_ANALYSIS',
    title: 'AI analysis completed (demo)',
    description: 'Automated document analysis identified key dates and risk indicators',
    createdAt: '2026-09-15T11:00:00Z',
  },
  {
    id: 'demo-evt-4',
    caseId: 'demo-case-1',
    type: 'LAWYER_ASSIGNED',
    title: 'Lawyer assigned',
    description: 'Adv. Priya Deshmukh was assigned to the case',
    createdBy: 'System',
    createdAt: '2026-09-18T09:00:00Z',
  },
  {
    id: 'demo-evt-5',
    caseId: 'demo-case-1',
    type: 'STATUS_CHANGE',
    title: 'Status changed to IN_PROGRESS',
    description: 'Lawyer accepted the case and began review',
    createdAt: '2026-09-20T14:00:00Z',
  },
  {
    id: 'demo-evt-6',
    caseId: 'demo-case-1',
    type: 'DEADLINE_SET',
    title: 'Deadline set: File objection before Tahsildar',
    description: 'Due by October 20, 2026',
    createdAt: '2026-09-22T10:00:00Z',
  },
  {
    id: 'demo-evt-7',
    caseId: 'demo-case-1',
    type: 'MESSAGE',
    title: 'New message from Adv. Priya Deshmukh',
    description: 'Lawyer shared preliminary assessment',
    createdAt: '2026-10-02T16:30:00Z',
  },
];

// ── Demo Messages ─────────────────────────────────────────────────────────────

export const DEMO_MESSAGES: Message[] = [
  {
    id: 'demo-msg-1',
    caseId: 'demo-case-1',
    senderId: 'demo-lawyer-1',
    senderName: 'Adv. Priya Deshmukh',
    senderRole: 'LAWYER',
    content: 'Rajesh ji, I have reviewed your 7/12 extract. The mutation entries appear to be in order, but the boundary coordinates need verification. I recommend we request a joint survey.',
    createdAt: '2026-10-02T16:30:00Z',
  },
  {
    id: 'demo-msg-2',
    caseId: 'demo-case-1',
    senderId: 'demo-citizen-1',
    senderName: 'Rajesh Sharma',
    senderRole: 'CITIZEN',
    content: 'Thank you, Madam. How do I request the joint survey? Do I need to visit the taluka office?',
    createdAt: '2026-10-03T09:15:00Z',
  },
  {
    id: 'demo-msg-3',
    caseId: 'demo-case-1',
    senderId: 'demo-lawyer-1',
    senderName: 'Adv. Priya Deshmukh',
    senderRole: 'LAWYER',
    content: 'I will draft the application for you. You will need to submit it at the Haveli taluka office with a copy of your Aadhaar and the original 7/12 extract. I will share the draft by tomorrow.',
    createdAt: '2026-10-03T10:00:00Z',
  },
];

// ── Demo Notifications ────────────────────────────────────────────────────────

export const DEMO_NOTIFICATIONS: Notification[] = [
  {
    id: 'demo-notif-1',
    userId: 'demo-citizen-1',
    type: 'DEADLINE',
    title: 'Deadline approaching',
    body: 'Submit documents to Sub-Registrar by Oct 12, 2026',
    isRead: false,
    caseId: 'demo-case-3',
    createdAt: '2026-10-08T08:00:00Z',
  },
  {
    id: 'demo-notif-2',
    userId: 'demo-citizen-1',
    type: 'MESSAGE',
    title: 'New message from lawyer',
    body: 'Adv. Priya Deshmukh sent a message on case NS-2026-00142',
    isRead: false,
    caseId: 'demo-case-1',
    createdAt: '2026-10-03T10:00:00Z',
  },
  {
    id: 'demo-notif-3',
    userId: 'demo-citizen-1',
    type: 'CASE_UPDATE',
    title: 'Case status updated',
    body: 'Case NS-2026-00201 has been assigned to a lawyer',
    isRead: true,
    caseId: 'demo-case-4',
    createdAt: '2026-10-07T08:00:00Z',
  },
];

// ── Demo Lawyer Profiles ──────────────────────────────────────────────────────

export const DEMO_LAWYER_PROFILES: LawyerProfile[] = [
  {
    id: 'demo-lawyer-1',
    userId: 'demo-lawyer-user-1',
    fullName: 'Adv. Priya Deshmukh',
    email: 'priya.deshmukh@demo.com',
    phone: '+91 98765 43210',
    barCouncilNumber: 'MH/1234/2015',
    specialization: ['Land Disputes', 'Property Law', 'Civil Litigation'],
    experienceYears: 11,
    city: 'Pune',
    state: 'Maharashtra',
    bio: 'Experienced advocate specializing in land revenue and property disputes in Western Maharashtra. Former assistant to District Judge, Pune.',
    isVerified: true,
    rating: 4.8,
    casesHandled: 234,
  },
  {
    id: 'demo-lawyer-2',
    userId: 'demo-lawyer-user-2',
    fullName: 'Adv. Vikram Joshi',
    email: 'vikram.joshi@demo.com',
    barCouncilNumber: 'MH/5678/2012',
    specialization: ['Criminal Law', 'Property Law', 'Cyber Crime'],
    experienceYears: 14,
    city: 'Nagpur',
    state: 'Maharashtra',
    bio: 'Senior criminal and property law practitioner at Nagpur High Court.',
    isVerified: true,
    rating: 4.6,
    casesHandled: 387,
  },
];

// ── Chart Data (Demo) ─────────────────────────────────────────────────────────

export const DEMO_CASE_STATUS_CHART: ChartDataPoint[] = [
  { name: 'Open', value: 3, fill: '#3b82f6' },
  { name: 'In Progress', value: 5, fill: '#f59e0b' },
  { name: 'In Review', value: 2, fill: '#8b5cf6' },
  { name: 'Resolved', value: 8, fill: '#10b981' },
  { name: 'Closed', value: 4, fill: '#64748b' },
];

export const DEMO_CASE_CATEGORY_CHART: ChartDataPoint[] = [
  { name: 'Land Disputes', value: 8, fill: '#e8590c' },
  { name: 'Property', value: 5, fill: '#1e3a8a' },
  { name: 'Consumer', value: 4, fill: '#059669' },
  { name: 'Labour', value: 3, fill: '#d97706' },
  { name: 'Family Law', value: 2, fill: '#8b5cf6' },
  { name: 'Criminal', value: 1, fill: '#ef4444' },
];

export const DEMO_ACTIVITY_TIMELINE: TimeSeriesPoint[] = [
  { date: 'Sep 1', cases: 2, resolved: 0 },
  { date: 'Sep 8', cases: 3, resolved: 1 },
  { date: 'Sep 15', cases: 5, resolved: 1 },
  { date: 'Sep 22', cases: 4, resolved: 2 },
  { date: 'Sep 29', cases: 6, resolved: 3 },
  { date: 'Oct 1', cases: 7, resolved: 2 },
  { date: 'Oct 5', cases: 5, resolved: 4 },
  { date: 'Oct 8', cases: 8, resolved: 3 },
];

export const DEMO_DEADLINE_DISTRIBUTION: ChartDataPoint[] = [
  { name: 'This Week', value: 2, fill: '#ef4444' },
  { name: 'Next Week', value: 3, fill: '#f59e0b' },
  { name: 'This Month', value: 5, fill: '#3b82f6' },
  { name: 'Next Month', value: 4, fill: '#10b981' },
];
