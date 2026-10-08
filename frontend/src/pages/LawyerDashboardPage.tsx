import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase, LogOut,
  Clock, Calendar, ShieldCheck, ChevronRight,
  Award, Edit3, AlertCircle, CheckCircle2,
  FileSearch, UserCheck, MessageSquare, Send, X, RefreshCw,
  ExternalLink
} from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer,
  XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import {
  DEMO_CITIZEN_CASES, DEMO_DEADLINES,
  DEMO_CASE_STATUS_CHART, DEMO_CASE_CATEGORY_CHART
} from '../lib/mockData';
import {
  StatusBadge, RiskBadge, DemoBadge
} from '../components/ui';
import { LanguageSelector } from '../components/LanguageSelector';
import { assistanceRequestApi, caseApi } from '../lib/api';
import type { Case, CaseStatus } from '../types/domain';

// Initial Mock Requests for offline/demo reliability
const INITIAL_DEMO_REQUESTS: any[] = [
  {
    id: 'req-demo-1',
    case_id: 'demo-case-1',
    citizen_id: 'demo-citizen-1',
    case_title: 'Agricultural Land Title & Mutation Dispute — Haveli',
    case_number: 'NS-719530-244',
    case_category: 'LAND_DISPUTE',
    case_status: 'AWAITING_LAWYER',
    case_urgency: 'HIGH',
    citizen_name: 'Rajesh Sharma',
    citizen_phone: '+91 98230 11223',
    citizen_language: 'hi',
    request_type: 'LEGAL_ADVICE',
    status: 'NEW',
    message: 'Need urgent advice regarding 7/12 mutation entry notice issued by Haveli Tahsildar with scheduled hearing date.',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    documents_count: 2,
  },
  {
    id: 'req-demo-2',
    case_id: 'demo-case-2',
    citizen_id: 'demo-citizen-2',
    case_title: 'Ancestorial Partition Deed Injunction Suit',
    case_number: 'NS-482109-102',
    case_category: 'PROPERTY',
    case_status: 'LAWYER_REVIEW',
    case_urgency: 'MEDIUM',
    citizen_name: 'Sneha Patil',
    citizen_phone: '+91 94220 55441',
    citizen_language: 'mr',
    request_type: 'CASE_REPRESENTATION',
    status: 'UNDER_REVIEW',
    message: 'Seeking representation before Pune District Civil Court for temporary injunction stay order.',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    documents_count: 3,
  },
  {
    id: 'req-demo-3',
    case_id: 'demo-case-3',
    citizen_id: 'demo-citizen-3',
    case_title: 'Unfair Trade Practice Claim against Builder',
    case_number: 'NS-991204-511',
    case_category: 'CONSUMER',
    case_status: 'LAWYER_ASSIGNED',
    case_urgency: 'MEDIUM',
    citizen_name: 'Amit Joshi',
    citizen_phone: '+91 99210 33445',
    citizen_language: 'en',
    request_type: 'CASE_REPRESENTATION',
    status: 'ACCEPTED',
    message: 'Delayed possession of apartment unit beyond RERA agreed limitation date.',
    created_at: new Date(Date.now() - 3600000 * 72).toISOString(),
    documents_count: 1,
  },
];

type MainTab = 'requests' | 'analytics' | 'deadlines' | 'notes';
type WorkflowTab = 'new_requests' | 'pending_review' | 'active_cases' | 'completed_cases';

export const LawyerDashboardPage: React.FC = () => {
  const { user, logout } = useAuth();

  // Navigation tab states
  const [activeTab, setActiveTab] = useState<MainTab>('requests');
  const [workflowTab, setWorkflowTab] = useState<WorkflowTab>('new_requests');

  // Case & Request states
  const [requestsList, setRequestsList] = useState<any[]>(INITIAL_DEMO_REQUESTS);
  const [casesList, setCasesList] = useState<Case[]>(DEMO_CITIZEN_CASES);
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Interactive Action Dialogs (Request Info / Decline)
  const [selectedReqForInfo, setSelectedReqForInfo] = useState<any | null>(null);
  const [infoMessage, setInfoMessage] = useState<string>('');
  const [selectedReqForDecline, setSelectedReqForDecline] = useState<any | null>(null);
  const [declineReason, setDeclineReason] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Advocate Quick Notes
  const [notes, setNotes] = useState<{ id: string; title: string; text: string; date: string }[]>([
    {
      id: 'n1',
      title: '7/12 Revenue Hearing Preparation',
      text: 'Need certified map for Haveli parcel 142/B before next Monday.',
      date: 'Today, 11:30 AM',
    },
    {
      id: 'n2',
      title: 'Consumer Forum Written Arguments',
      text: 'Draft replacement demand notice citing Section 35 Consumer Protection Act.',
      date: 'Yesterday, 4:15 PM',
    },
  ]);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteText, setNewNoteText] = useState('');

  // Load real backend requests & cases
  const fetchDashboardData = async () => {
    try {
      const [backendRequests, backendCases] = await Promise.all([
        assistanceRequestApi.listForLawyer('all').catch(() => null),
        caseApi.list({ lawyerId: user?.id }).catch(() => null),
      ]);

      if (backendRequests && backendRequests.length > 0) {
        setRequestsList(backendRequests);
      }
      if (backendCases && backendCases.length > 0) {
        setCasesList(backendCases);
      }
    } catch (err) {
      console.warn('Dashboard fetch fallback:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user?.id]);

  // ── Action Handlers ──────────────────────────────────────────────────────────

  // 1. [Review]
  const handleReview = async (requestId: string) => {
    setActionLoading(true);
    try {
      if (!requestId.startsWith('req-demo')) {
        await assistanceRequestApi.review(requestId);
      }
      setRequestsList((prev) =>
        prev.map((r) =>
          r.id === requestId
            ? { ...r, status: 'UNDER_REVIEW', case_status: 'LAWYER_REVIEW' }
            : r
        )
      );
      setFeedbackMessage({
        type: 'success',
        text: 'Case marked under advocate review. Status updated to LAWYER_REVIEW.',
      });
      setWorkflowTab('pending_review');
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err?.message || 'Could not mark case for review.' });
    } finally {
      setActionLoading(false);
    }
  };

  // 2. [Accept Case]
  const handleAccept = async (requestId: string, notesText?: string) => {
    setActionLoading(true);
    try {
      if (!requestId.startsWith('req-demo')) {
        await assistanceRequestApi.accept(requestId, notesText);
      }
      const req = requestsList.find((r) => r.id === requestId);
      setRequestsList((prev) =>
        prev.map((r) =>
          r.id === requestId
            ? { ...r, status: 'ACCEPTED', case_status: 'LAWYER_ASSIGNED', lawyer_id: user?.id }
            : r
        )
      );

      // Add to active cases
      if (req) {
        setCasesList((prev) => [
          {
            id: req.case_id,
            caseNumber: req.case_number || 'NS-NEW',
            title: req.case_title || 'Assigned Matter',
            description: req.message || 'Case representation accepted.',
            category: (req.case_category as any) || 'CIVIL',
            status: 'LAWYER_ASSIGNED',
            citizenId: req.citizen_id,
            citizenName: req.citizen_name,
            assignedLawyerId: user?.id,
            lawyerName: user?.fullName || 'Advocate',
            riskLevel: req.case_urgency || 'MEDIUM',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          ...prev.filter((c) => c.id !== req.case_id),
        ]);
      }

      setFeedbackMessage({
        type: 'success',
        text: 'Case Accepted! Status is now LAWYER_ASSIGNED. Full document & chat collaboration active.',
      });
      setWorkflowTab('active_cases');
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err?.message || 'Could not accept case.' });
    } finally {
      setActionLoading(false);
    }
  };

  // 3. [Request More Information]
  const handleSubmitRequestInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReqForInfo || !infoMessage.trim()) return;

    setActionLoading(true);
    try {
      const requestId = selectedReqForInfo.id;
      if (!requestId.startsWith('req-demo')) {
        await assistanceRequestApi.requestInfo(requestId, infoMessage.trim());
      }
      setRequestsList((prev) =>
        prev.map((r) =>
          r.id === requestId
            ? { ...r, status: 'INFO_REQUESTED', case_status: 'ACTION_REQUIRED', lawyer_notes: infoMessage.trim() }
            : r
        )
      );
      setFeedbackMessage({
        type: 'success',
        text: 'Clarification query sent to citizen. Case status updated to ACTION_REQUIRED.',
      });
      setSelectedReqForInfo(null);
      setInfoMessage('');
      setWorkflowTab('pending_review');
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err?.message || 'Failed to send request.' });
    } finally {
      setActionLoading(false);
    }
  };

  // 4. [Decline]
  const handleSubmitDecline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReqForDecline) return;

    setActionLoading(true);
    try {
      const requestId = selectedReqForDecline.id;
      if (!requestId.startsWith('req-demo')) {
        await assistanceRequestApi.decline(requestId, declineReason.trim());
      }
      setRequestsList((prev) =>
        prev.map((r) =>
          r.id === requestId
            ? { ...r, status: 'DECLINED', case_status: 'AWAITING_LAWYER', lawyer_notes: declineReason.trim() }
            : r
        )
      );
      setFeedbackMessage({
        type: 'success',
        text: 'Assistance request declined. Citizen has been notified.',
      });
      setSelectedReqForDecline(null);
      setDeclineReason('');
      setWorkflowTab('completed_cases');
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err?.message || 'Failed to decline request.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Quick Status Transition for Active Cases
  const handleAdvanceCaseStatus = async (caseId: string, newStatus: CaseStatus) => {
    try {
      if (!caseId.startsWith('demo-')) {
        await caseApi.updateStatus(caseId, newStatus);
      }
      setCasesList((prev) =>
        prev.map((c) => (c.id === caseId ? { ...c, status: newStatus } : c))
      );
      setRequestsList((prev) =>
        prev.map((r) => (r.case_id === caseId ? { ...r, case_status: newStatus } : r))
      );
      setFeedbackMessage({
        type: 'success',
        text: `Case status updated to ${newStatus}.`,
      });
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err?.message || 'Failed to update status.' });
    }
  };

  // ── Notes Handlers ───────────────────────────────────────────────────────────
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim() || !newNoteText.trim()) return;
    setNotes([
      {
        id: `note-${Date.now()}`,
        title: newNoteTitle.trim(),
        text: newNoteText.trim(),
        date: 'Just now',
      },
      ...notes,
    ]);
    setNewNoteTitle('');
    setNewNoteText('');
  };

  // ── Workflow Tab Buckets ─────────────────────────────────────────────────────
  const newRequests = requestsList.filter((r) => r.status === 'NEW');
  const pendingReview = requestsList.filter(
    (r) => r.status === 'UNDER_REVIEW' || r.status === 'INFO_REQUESTED'
  );
  const activeCases = casesList.filter(
    (c) =>
      c.status === 'LAWYER_ASSIGNED' ||
      c.status === 'IN_PROGRESS' ||
      c.status === 'ACTION_REQUIRED' ||
      c.status === 'ASSIGNED' ||
      c.status === 'ACTIVE'
  );
  const completedCases = casesList.filter(
    (c) => c.status === 'RESOLVED' || c.status === 'CLOSED'
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      <div className="saffron-line w-full" />

      {/* ── Advocate Top Header ───────────────────────────────────────────── */}
      <header className="bg-slate-950/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-700 to-purple-800 flex items-center justify-center text-white shadow-sm">
                <Briefcase className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <span className="font-extrabold text-xl tracking-tight text-white">NyayaSetu</span>
                <span className="text-xs ml-1.5 px-2 py-0.5 bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30 rounded">
                  अधिवक्ता पोर्टल
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-xl">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-300">Bar Council ID:</span>
              <strong className="text-white font-mono">MH/1234/2015</strong>
            </div>

            <LanguageSelector variant="dropdown" className="hidden md:inline-flex" />

            {loadingData && (
              <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-indigo-400 font-medium">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Syncing...</span>
              </div>
            )}

            <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-white">{user?.fullName || 'Adv. Priya Deshmukh'}</p>
                <p className="text-[11px] text-slate-400">High Court Advocate</p>
              </div>
              <button
                onClick={logout}
                id="lawyer-logout-btn"
                className="flex items-center gap-1.5 text-slate-400 hover:text-red-400 p-2 rounded-xl hover:bg-slate-800 transition-colors text-xs font-semibold"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Dashboard Workspace ───────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6 flex-1">
        {/* Feedback Alert */}
        {feedbackMessage && (
          <div
            className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between gap-3 animate-fade-in ${
              feedbackMessage.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-800 text-emerald-200'
                : 'bg-rose-950/60 border-rose-800 text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedbackMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              )}
              <span>{feedbackMessage.text}</span>
            </div>
            <button
              onClick={() => setFeedbackMessage(null)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── Advocate Welcome Header ──────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-950 border border-indigo-900/60 p-6 sm:p-8 shadow-2xl">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
                <Award className="w-3.5 h-3.5 text-amber-300" />
                <span>Verified Legal Practitioner Workspace</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                Advocate Workspace — {user?.fullName || 'Adv. Priya Deshmukh'} ⚖️
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm max-w-2xl leading-relaxed">
                Review citizen legal assistance requests, accept representation, clarify missing evidence, and collaborate securely with clients.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300 flex items-center gap-2">
                <DemoBadge />
                <span>Jurisdiction: Pune / Haveli District</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Key Metrics Grid ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => { setActiveTab('requests'); setWorkflowTab('new_requests'); }}
            className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-indigo-500/50 rounded-2xl p-5 space-y-2 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                <Clock className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                Incoming
              </span>
            </div>
            <p className="text-2xl font-bold text-white">{newRequests.length}</p>
            <p className="text-xs text-slate-400">New Requests</p>
          </div>

          <div
            onClick={() => { setActiveTab('requests'); setWorkflowTab('pending_review'); }}
            className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-indigo-500/50 rounded-2xl p-5 space-y-2 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                <FileSearch className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                Reviewing
              </span>
            </div>
            <p className="text-2xl font-bold text-white">{pendingReview.length}</p>
            <p className="text-xs text-slate-400">Pending Review</p>
          </div>

          <div
            onClick={() => { setActiveTab('requests'); setWorkflowTab('active_cases'); }}
            className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/50 rounded-2xl p-5 space-y-2 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <UserCheck className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                Assigned
              </span>
            </div>
            <p className="text-2xl font-bold text-white">{activeCases.length}</p>
            <p className="text-xs text-slate-400">Active Cases</p>
          </div>

          <div
            onClick={() => { setActiveTab('requests'); setWorkflowTab('completed_cases'); }}
            className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-500/50 rounded-2xl p-5 space-y-2 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full">
                Concluded
              </span>
            </div>
            <p className="text-2xl font-bold text-white">{completedCases.length}</p>
            <p className="text-xs text-slate-400">Completed Cases</p>
          </div>
        </div>

        {/* ── Main Navigation Tabs ─────────────────────────────────────────── */}
        <div className="flex border-b border-slate-800 gap-2 text-xs sm:text-sm font-semibold">
          <button
            onClick={() => setActiveTab('requests')}
            className={`pb-3 px-3 transition-colors flex items-center gap-2 ${
              activeTab === 'requests'
                ? 'text-indigo-400 border-b-2 border-indigo-400 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Case Representation & Requests</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`pb-3 px-3 transition-colors flex items-center gap-2 ${
              activeTab === 'analytics'
                ? 'text-indigo-400 border-b-2 border-indigo-400 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Workload Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab('deadlines')}
            className={`pb-3 px-3 transition-colors flex items-center gap-2 ${
              activeTab === 'deadlines'
                ? 'text-indigo-400 border-b-2 border-indigo-400 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Statutory Deadlines</span>
          </button>

          <button
            onClick={() => setActiveTab('notes')}
            className={`pb-3 px-3 transition-colors flex items-center gap-2 ${
              activeTab === 'notes'
                ? 'text-indigo-400 border-b-2 border-indigo-400 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>Advocate Notes</span>
          </button>
        </div>

        {/* ── Tab 1: Case Representation & Requests Workflow ─────────────────── */}
        {activeTab === 'requests' && (
          <div className="space-y-6">
            {/* 4 Workflow Sub-Tabs as specified by User */}
            <div className="bg-slate-800/60 p-1.5 rounded-2xl border border-slate-700/80 grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs font-semibold">
              <button
                onClick={() => setWorkflowTab('new_requests')}
                className={`py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
                  workflowTab === 'new_requests'
                    ? 'bg-brand-600 text-white font-bold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <span>New Requests</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-bold">
                  {newRequests.length}
                </span>
              </button>

              <button
                onClick={() => setWorkflowTab('pending_review')}
                className={`py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
                  workflowTab === 'pending_review'
                    ? 'bg-brand-600 text-white font-bold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <span>Pending Review</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-bold">
                  {pendingReview.length}
                </span>
              </button>

              <button
                onClick={() => setWorkflowTab('active_cases')}
                className={`py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
                  workflowTab === 'active_cases'
                    ? 'bg-brand-600 text-white font-bold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <span>Active Cases</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-bold">
                  {activeCases.length}
                </span>
              </button>

              <button
                onClick={() => setWorkflowTab('completed_cases')}
                className={`py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
                  workflowTab === 'completed_cases'
                    ? 'bg-brand-600 text-white font-bold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <span>Completed Cases</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-bold">
                  {completedCases.length}
                </span>
              </button>
            </div>

            {/* Sub-Tab 1: NEW REQUESTS */}
            {workflowTab === 'new_requests' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Incoming Case Assistance Requests
                  </h3>
                  <span className="text-xs text-slate-400">
                    Review facts and decide whether to accept representation
                  </span>
                </div>

                {newRequests.length === 0 ? (
                  <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-12 text-center space-y-2">
                    <Clock className="w-10 h-10 text-slate-500 mx-auto" />
                    <p className="text-sm font-bold text-white">No New Requests</p>
                    <p className="text-xs text-slate-400">
                      When citizens submit legal advice or representation requests, they will appear here.
                    </p>
                  </div>
                ) : (
                  newRequests.map((req) => (
                    <div
                      key={req.id}
                      className="bg-slate-800/80 border border-slate-700/80 hover:border-slate-600 rounded-2xl p-5 space-y-4 shadow-lg transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                              {req.case_number}
                            </span>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                              {(req.case_category || 'GENERAL').replace('_', ' ')}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              {req.request_type?.replace('_', ' ') || 'LEGAL ADVICE'}
                            </span>
                          </div>
                          <h4 className="text-base font-bold text-white">{req.case_title}</h4>
                          <p className="text-xs text-slate-300">
                            Client: <strong className="text-white">{req.citizen_name}</strong> · Tel: {req.citizen_phone || 'Protected'} · Preferred Lang: {req.citizen_language?.toUpperCase() || 'EN'}
                          </p>
                        </div>

                        <div className="text-right text-xs text-slate-400">
                          <span>{req.documents_count || 1} Document(s) attached</span>
                        </div>
                      </div>

                      {req.message && (
                        <div className="p-3.5 bg-slate-900/80 border border-slate-700/60 rounded-xl text-xs text-slate-300 leading-relaxed">
                          <span className="text-[11px] font-bold text-amber-400 block mb-1">Citizen's Note:</span>
                          "{req.message}"
                        </div>
                      )}

                      {/* 4 Required Action Buttons: [Review], [Accept Case], [Request More Information], [Decline] */}
                      <div className="pt-2 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-3">
                        <Link
                          to={`/citizen/cases/${req.case_id}`}
                          className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>View Case Dossier</span>
                        </Link>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleReview(req.id)}
                            disabled={actionLoading}
                            className="px-3 py-1.5 text-xs font-bold bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 rounded-xl transition-all"
                          >
                            Review
                          </button>

                          <button
                            type="button"
                            onClick={() => handleAccept(req.id)}
                            disabled={actionLoading}
                            className="px-4 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md transition-all flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Accept Case</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedReqForInfo(req)}
                            disabled={actionLoading}
                            className="px-3 py-1.5 text-xs font-bold bg-amber-600/30 hover:bg-amber-600/50 text-amber-200 border border-amber-500/40 rounded-xl transition-all"
                          >
                            Request More Information
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedReqForDecline(req)}
                            disabled={actionLoading}
                            className="px-3 py-1.5 text-xs font-bold bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/40 rounded-xl transition-all"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Sub-Tab 2: PENDING REVIEW */}
            {workflowTab === 'pending_review' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Cases Under Advocate Review
                  </h3>
                  <span className="text-xs text-slate-400">
                    Inspecting evidence or awaiting citizen clarification
                  </span>
                </div>

                {pendingReview.length === 0 ? (
                  <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-12 text-center space-y-2">
                    <FileSearch className="w-10 h-10 text-slate-500 mx-auto" />
                    <p className="text-sm font-bold text-white">No Cases Currently Under Review</p>
                    <p className="text-xs text-slate-400">
                      When you click "Review" or request more information on a case, it appears here.
                    </p>
                  </div>
                ) : (
                  pendingReview.map((req) => (
                    <div
                      key={req.id}
                      className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 space-y-4 shadow-lg transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                              {req.case_number}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              {req.status === 'INFO_REQUESTED' ? 'Clarification Requested' : 'Under Review'}
                            </span>
                          </div>
                          <h4 className="text-base font-bold text-white">{req.case_title}</h4>
                          <p className="text-xs text-slate-300">
                            Client: <strong className="text-white">{req.citizen_name}</strong>
                          </p>
                        </div>

                        <Link
                          to={`/citizen/cases/${req.case_id}`}
                          className="px-3 py-1.5 text-xs font-bold bg-slate-700 hover:bg-slate-600 text-white rounded-xl flex items-center gap-1.5 self-start"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Open Case File</span>
                        </Link>
                      </div>

                      {req.lawyer_notes && (
                        <div className="p-3 bg-indigo-950/40 border border-indigo-800/60 rounded-xl text-xs text-indigo-200">
                          <span className="font-bold block mb-0.5">Your Clarification Query:</span>
                          "{req.lawyer_notes}"
                        </div>
                      )}

                      {/* Action buttons from pending review: Can Accept or Decline */}
                      <div className="pt-2 border-t border-slate-700/60 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleAccept(req.id)}
                          disabled={actionLoading}
                          className="px-4 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md transition-all flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Accept Case</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedReqForDecline(req)}
                          disabled={actionLoading}
                          className="px-3 py-1.5 text-xs font-bold bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/40 rounded-xl transition-all"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Sub-Tab 3: ACTIVE CASES */}
            {workflowTab === 'active_cases' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Active Assigned Cases (LAWYER_ASSIGNED)
                  </h3>
                  <span className="text-xs text-slate-400">
                    Authorized representation, pleading preparation & client messaging
                  </span>
                </div>

                {activeCases.length === 0 ? (
                  <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-12 text-center space-y-2">
                    <UserCheck className="w-10 h-10 text-slate-500 mx-auto" />
                    <p className="text-sm font-bold text-white">No Active Assigned Cases</p>
                    <p className="text-xs text-slate-400">
                      Accepted cases will be listed here with direct access to documents and chat.
                    </p>
                  </div>
                ) : (
                  activeCases.map((c) => (
                    <div
                      key={c.id}
                      className="bg-slate-800/80 border border-slate-700/80 hover:border-slate-600 rounded-2xl p-5 space-y-4 shadow-lg transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                              {c.caseNumber}
                            </span>
                            <StatusBadge status={c.status} />
                            {c.riskLevel && <RiskBadge level={c.riskLevel} />}
                          </div>
                          <h4 className="text-base font-bold text-white">{c.title}</h4>
                          <p className="text-xs text-slate-300">
                            Client: <strong className="text-white">{c.citizenName || 'Verified Citizen'}</strong> · Category: {c.category.replace('_', ' ')}
                          </p>
                        </div>

                        <Link
                          to={`/citizen/cases/${c.id}`}
                          className="px-4 py-2 text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white rounded-xl shadow-md flex items-center gap-2 self-start transition-all"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Open Dossier & Chat</span>
                        </Link>
                      </div>

                      <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                        {c.description}
                      </p>

                      {/* Advance Case Status Controls */}
                      <div className="pt-3 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <span className="text-slate-400">Advance Case Status:</span>
                        <div className="flex flex-wrap items-center gap-2">
                          {c.status !== 'IN_PROGRESS' && (
                            <button
                              type="button"
                              onClick={() => handleAdvanceCaseStatus(c.id, 'IN_PROGRESS')}
                              className="px-2.5 py-1 text-xs font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800 rounded-lg hover:bg-cyan-900 transition-colors"
                            >
                              Mark In Progress
                            </button>
                          )}

                          {c.status !== 'ACTION_REQUIRED' && (
                            <button
                              type="button"
                              onClick={() => handleAdvanceCaseStatus(c.id, 'ACTION_REQUIRED')}
                              className="px-2.5 py-1 text-xs font-semibold bg-rose-950 text-rose-300 border border-rose-800 rounded-lg hover:bg-rose-900 transition-colors"
                            >
                              Request Client Action
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleAdvanceCaseStatus(c.id, 'RESOLVED')}
                            className="px-2.5 py-1 text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800 rounded-lg hover:bg-emerald-900 transition-colors"
                          >
                            Mark Resolved
                          </button>

                          <button
                            type="button"
                            onClick={() => handleAdvanceCaseStatus(c.id, 'CLOSED')}
                            className="px-2.5 py-1 text-xs font-semibold bg-slate-700 text-slate-300 border border-slate-600 rounded-lg hover:bg-slate-600 transition-colors"
                          >
                            Close Case
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Sub-Tab 4: COMPLETED CASES */}
            {workflowTab === 'completed_cases' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Concluded & Resolved Cases
                  </h3>
                  <span className="text-xs text-slate-400">
                    Archived matters and recorded resolution orders
                  </span>
                </div>

                {completedCases.length === 0 ? (
                  <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-12 text-center space-y-2">
                    <CheckCircle2 className="w-10 h-10 text-slate-500 mx-auto" />
                    <p className="text-sm font-bold text-white">No Completed Cases Yet</p>
                    <p className="text-xs text-slate-400">
                      Resolved or closed cases will be recorded here for archival auditing.
                    </p>
                  </div>
                ) : (
                  completedCases.map((c) => (
                    <div
                      key={c.id}
                      className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5 space-y-3 opacity-90"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-400 bg-slate-700 px-2 py-0.5 rounded">
                            {c.caseNumber}
                          </span>
                          <StatusBadge status={c.status} />
                        </div>
                        <span className="text-xs text-slate-400">
                          Resolved on {new Date().toLocaleDateString('en-IN')}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white">{c.title}</h4>
                      <p className="text-xs text-slate-400">{c.description}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Tab 2: Workload & Analytics ────────────────────────────────────── */}
        {activeTab === 'analytics' && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Category Breakdown Bar Chart */}
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">Cases by Category</h3>
                  <DemoBadge />
                </div>
                <div className="h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={DEMO_CASE_CATEGORY_CHART}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                      <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} name="Cases" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Status Breakdown Donut */}
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">Cases by Status</h3>
                  <DemoBadge />
                </div>
                <div className="h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={DEMO_CASE_STATUS_CHART}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {DEMO_CASE_STATUS_CHART.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab 3: Deadlines ───────────────────────────────────────────────── */}
        {activeTab === 'deadlines' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Statutory & Procedural Deadlines</h2>
                <p className="text-xs text-slate-400">Court dates, rejoinder filings, and limitation expiry notifications</p>
              </div>
              <DemoBadge />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {DEMO_DEADLINES.map((dl) => (
                <div key={dl.id} className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-300">{dl.caseNumber}</span>
                    <RiskBadge level={dl.priority} />
                  </div>
                  <h4 className="font-bold text-white text-sm">{dl.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{dl.description}</p>
                  <div className="pt-2 flex items-center justify-between border-t border-slate-700 text-xs">
                    <span className="text-amber-400 font-semibold">
                      Due: {new Date(dl.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <Link
                      to={`/citizen/cases/${dl.caseId}`}
                      className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                    >
                      <span>View Matter</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Tab 4: Advocate Notes ─────────────────────────────────────────── */}
        {activeTab === 'notes' && (
          <div className="space-y-6 animate-fade-in">
            <form onSubmit={handleAddNote} className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-white">Add Confidential Practice Note</h3>
              <input
                type="text"
                placeholder="Note subject (e.g. Sub-Registrar Hearing Prep)..."
                value={newNoteTitle}
                onChange={(e) => setNewNoteTitle(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
              <textarea
                rows={3}
                placeholder="Confidential notes, citation references, or action reminders..."
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-sm"
              >
                Save Note
              </button>
            </form>

            <div className="grid sm:grid-cols-2 gap-4">
              {notes.map((n) => (
                <div key={n.id} className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white">{n.title}</h4>
                    <span className="text-[10px] text-slate-400">{n.date}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{n.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ── Modal: Request More Information ─────────────────────────────────── */}
      {selectedReqForInfo && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-fade-in">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Request Clarification / Documents</h3>
                <p className="text-xs text-slate-400">
                  Case #{selectedReqForInfo.case_number} · Client: {selectedReqForInfo.citizen_name}
                </p>
              </div>
              <button
                onClick={() => setSelectedReqForInfo(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitRequestInfo} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Required Information or Document Details
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Specify what document or factual clarification is needed (e.g. certified Ferfar extract, original tax receipt)..."
                  value={infoMessage}
                  onChange={(e) => setInfoMessage(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedReqForInfo(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !infoMessage.trim()}
                  className="px-5 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white rounded-xl shadow-md disabled:opacity-50 flex items-center gap-1.5"
                >
                  {actionLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Send Request (ACTION_REQUIRED)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Decline Assistance Request ───────────────────────────────── */}
      {selectedReqForDecline && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-fade-in">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Decline Case Assistance</h3>
                <p className="text-xs text-slate-400">
                  Case #{selectedReqForDecline.case_number} · Client: {selectedReqForDecline.citizen_name}
                </p>
              </div>
              <button
                onClick={() => setSelectedReqForDecline(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitDecline} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Reason for Declining (Optional feedback for citizen)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Jurisdiction outside practice area, current caseload full, conflicting interest..."
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedReqForDecline(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-md disabled:opacity-50"
                >
                  Confirm Decline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        <p>© 2026 NyayaSetu · Advocate Workspace · Bar Council of Maharashtra & Goa Pilot</p>
      </footer>
    </div>
  );
};
