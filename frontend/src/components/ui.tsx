/**
 * NyayaSetu UI Components — Shared reusable building blocks
 */
import React from 'react';
import { Link } from 'react-router-dom';
import {
  Scale, AlertTriangle, CheckCircle, Clock, Info, FileText,
  AlertCircle, Shield, Loader2, Inbox,
} from 'lucide-react';
import type { CaseStatus, RiskLevel } from '../types/domain';

// ── Status Badge ──────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<CaseStatus, { label: string; bg: string; text: string; dot: string }> = {
  DRAFT: { label: 'Draft', bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' },
  DOCUMENT_UPLOADED: { label: 'Doc Uploaded', bg: 'bg-sky-50', text: 'text-sky-700', dot: 'bg-sky-500' },
  AI_ANALYSIS: { label: 'AI Analysis', bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
  AWAITING_LAWYER: { label: 'Awaiting Lawyer', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  LAWYER_REVIEW: { label: 'In Review', bg: 'bg-indigo-50', text: 'text-indigo-700', dot: 'bg-indigo-500' },
  LAWYER_ASSIGNED: { label: 'Lawyer Assigned', bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  ACTION_REQUIRED: { label: 'Action Required', bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500' },
  IN_PROGRESS: { label: 'In Progress', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  RESOLVED: { label: 'Resolved', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  CLOSED: { label: 'Closed', bg: 'bg-slate-100', text: 'text-slate-500', dot: 'bg-slate-400' },
  // Backwards compatibility
  OPEN: { label: 'Open', bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  IN_REVIEW: { label: 'In Review', bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
  ASSIGNED: { label: 'Assigned', bg: 'bg-indigo-50', text: 'text-indigo-700', dot: 'bg-indigo-500' },
  ACTIVE: { label: 'Active', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
};

export const StatusBadge: React.FC<{ status: CaseStatus; size?: 'sm' | 'md' }> = ({ status, size = 'sm' }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;
  return (
    <span className={`badge ${cfg.bg} ${cfg.text} ${size === 'md' ? 'px-3 py-1 text-xs' : 'px-2 py-0.5 text-[11px]'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

// ── Risk Badge ────────────────────────────────────────────────────────────────

const RISK_CONFIG: Record<RiskLevel, { label: string; bg: string; text: string; icon: React.ElementType }> = {
  LOW: { label: 'Low Risk', bg: 'bg-emerald-50', text: 'text-emerald-700', icon: CheckCircle },
  MEDIUM: { label: 'Medium Risk', bg: 'bg-amber-50', text: 'text-amber-700', icon: Info },
  HIGH: { label: 'High Risk', bg: 'bg-orange-50', text: 'text-orange-700', icon: AlertTriangle },
  CRITICAL: { label: 'Critical', bg: 'bg-red-50', text: 'text-red-700', icon: AlertCircle },
};

export const RiskBadge: React.FC<{ level: RiskLevel; size?: 'sm' | 'md' }> = ({ level, size = 'sm' }) => {
  const cfg = RISK_CONFIG[level] || RISK_CONFIG.LOW;
  const Icon = cfg.icon;
  return (
    <span className={`badge ${cfg.bg} ${cfg.text} ${size === 'md' ? 'px-3 py-1 text-xs' : ''}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
};

// ── Demo Indicator ────────────────────────────────────────────────────────────

export const DemoBadge: React.FC<{ className?: string }> = ({ className = '' }) => (
  <span className={`inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md ${className}`}>
    ⚡ Demo Data
  </span>
);

// ── Stat Card ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number | string;
  change?: string;
  color: string;
  bgColor: string;
  borderColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ icon: Icon, label, value, change, color, bgColor, borderColor = 'border-slate-200/80' }) => (
  <div className={`stat-card ${borderColor}`}>
    <div className="flex items-center justify-between">
      <div className={`w-10 h-10 rounded-xl ${bgColor} flex items-center justify-center`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      {change && (
        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
          {change}
        </span>
      )}
    </div>
    <p className="text-2xl font-bold text-slate-900">{value}</p>
    <p className="text-xs text-slate-500 font-medium">{label}</p>
  </div>
);

// ── Section Header ────────────────────────────────────────────────────────────

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: { label: string; to: string };
  isDemo?: boolean;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle, action, isDemo }) => (
  <div className="flex items-center justify-between">
    <div>
      <div className="flex items-center gap-2">
        <h2 className="section-title">{title}</h2>
        {isDemo && <DemoBadge />}
      </div>
      {subtitle && <p className="section-subtitle mt-0.5">{subtitle}</p>}
    </div>
    {action && (
      <Link to={action.to} className="text-xs font-semibold text-brand-500 hover:text-brand-600 transition-colors">
        {action.label} →
      </Link>
    )}
  </div>
);

// ── Loading State ─────────────────────────────────────────────────────────────

export const LoadingSpinner: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <div className="flex flex-col items-center justify-center py-16 gap-4 animate-fade-in">
    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-500 to-indigo-600 flex items-center justify-center animate-pulse-soft">
      <Scale className="w-6 h-6 text-amber-300" />
    </div>
    <p className="text-sm text-slate-500 font-medium">{message}</p>
  </div>
);

export const SkeletonCard: React.FC = () => (
  <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-3">
    <div className="skeleton h-4 w-2/3 rounded" />
    <div className="skeleton h-3 w-full rounded" />
    <div className="skeleton h-3 w-4/5 rounded" />
    <div className="flex gap-2 pt-1">
      <div className="skeleton h-5 w-16 rounded-full" />
      <div className="skeleton h-5 w-20 rounded-full" />
    </div>
  </div>
);

export const PageLoader: React.FC = () => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center">
    <LoadingSpinner message="Loading page..." />
  </div>
);

// ── Error State ───────────────────────────────────────────────────────────────

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
}) => (
  <div className="flex flex-col items-center justify-center py-16 gap-4 animate-fade-in">
    <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
      <AlertCircle className="w-7 h-7 text-red-500" />
    </div>
    <div className="text-center max-w-sm">
      <h3 className="font-bold text-slate-900">{title}</h3>
      <p className="text-sm text-slate-500 mt-1">{message}</p>
    </div>
    {onRetry && (
      <button onClick={onRetry} className="btn-primary text-sm">
        Try Again
      </button>
    )}
  </div>
);

// ── Empty State ───────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon?: React.ElementType;
  title: string;
  message: string;
  action?: { label: string; onClick: () => void };
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon = Inbox, title, message, action }) => (
  <div className="flex flex-col items-center justify-center py-12 gap-4 animate-fade-in">
    <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
      <Icon className="w-7 h-7 text-slate-400" />
    </div>
    <div className="text-center max-w-sm">
      <h3 className="font-semibold text-slate-700">{title}</h3>
      <p className="text-sm text-slate-500 mt-1">{message}</p>
    </div>
    {action && (
      <button onClick={action.onClick} className="btn-primary text-sm">
        {action.label}
      </button>
    )}
  </div>
);

// ── Saffron Divider (tricolor-inspired) ───────────────────────────────────────

export const SaffronDivider: React.FC = () => <div className="saffron-line w-full" />;

// ── Document Card ─────────────────────────────────────────────────────────────

export const DocumentCard: React.FC<{ doc: { originalName: string; fileSize: number; uploadedAt: string; status: string } }> = ({ doc }) => (
  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80 hover:bg-slate-100 transition-colors cursor-pointer">
    <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
      <FileText className="w-4 h-4 text-blue-600" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-slate-900 truncate">{doc.originalName}</p>
      <p className="text-xs text-slate-500">
        {(doc.fileSize / 1024 / 1024).toFixed(1)} MB · {new Date(doc.uploadedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
      </p>
    </div>
    <span className={`badge ${doc.status === 'ANALYZED' ? 'bg-emerald-50 text-emerald-700' : doc.status === 'PROCESSING' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
      {doc.status === 'ANALYZED' && <CheckCircle className="w-3 h-3" />}
      {doc.status === 'PROCESSING' && <Loader2 className="w-3 h-3 animate-spin" />}
      {doc.status}
    </span>
  </div>
);

// ── Deadline Card ─────────────────────────────────────────────────────────────

export const DeadlineCard: React.FC<{ deadline: { title: string; dueDate: string; priority: RiskLevel; caseNumber?: string } }> = ({ deadline }) => {
  const daysLeft = Math.ceil((new Date(deadline.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const isUrgent = daysLeft <= 3;

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${isUrgent ? 'bg-red-50/50 border-red-200/60' : 'bg-white border-slate-200/80 hover:bg-slate-50'}`}>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isUrgent ? 'bg-red-100' : 'bg-amber-50'}`}>
        <Clock className={`w-4 h-4 ${isUrgent ? 'text-red-600' : 'text-amber-600'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900">{deadline.title}</p>
        <p className="text-xs text-slate-500">
          {deadline.caseNumber && <span className="font-mono">{deadline.caseNumber} · </span>}
          {new Date(deadline.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <span className={`text-xs font-bold ${isUrgent ? 'text-red-600' : daysLeft <= 7 ? 'text-amber-600' : 'text-slate-500'}`}>
          {daysLeft <= 0 ? 'Overdue' : `${daysLeft}d left`}
        </span>
        <RiskBadge level={deadline.priority} />
      </div>
    </div>
  );
};

// ── Notification Item ─────────────────────────────────────────────────────────

const NOTIF_ICONS: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  CASE_UPDATE: { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
  DEADLINE: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
  DOCUMENT: { icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50' },
  MESSAGE: { icon: Shield, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  SYSTEM: { icon: Info, color: 'text-slate-600', bg: 'bg-slate-100' },
};

export const NotificationItem: React.FC<{ notification: { type: string; title: string; body: string; isRead: boolean; createdAt: string } }> = ({ notification }) => {
  const cfg = NOTIF_ICONS[notification.type] || NOTIF_ICONS.SYSTEM;
  const Icon = cfg.icon;
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl transition-colors cursor-pointer ${notification.isRead ? 'bg-white hover:bg-slate-50' : 'bg-blue-50/40 hover:bg-blue-50/60'}`}>
      <div className={`w-8 h-8 rounded-lg ${cfg.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
        <Icon className={`w-4 h-4 ${cfg.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${notification.isRead ? 'text-slate-700' : 'text-slate-900 font-semibold'}`}>{notification.title}</p>
        <p className="text-xs text-slate-500 mt-0.5">{notification.body}</p>
        <p className="text-[11px] text-slate-400 mt-1">{new Date(notification.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
      </div>
      {!notification.isRead && <span className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />}
    </div>
  );
};
