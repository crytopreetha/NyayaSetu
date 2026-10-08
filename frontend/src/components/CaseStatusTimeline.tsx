import React from 'react';
import {
  FileEdit, Upload, Sparkles, UserSearch, FileSearch,
  UserCheck, AlertTriangle, PlayCircle, CheckCircle2, Archive
} from 'lucide-react';
import type { CaseStatus } from '../types/domain';

interface CaseStatusTimelineProps {
  currentStatus: CaseStatus | string;
  onStatusClick?: (status: CaseStatus) => void;
  interactive?: boolean;
}

interface StatusMeta {
  key: CaseStatus;
  label: string;
  shortLabel: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

export const CASE_STATUS_STAGES: StatusMeta[] = [
  {
    key: 'DRAFT',
    label: 'Case Initiated',
    shortLabel: 'Draft',
    description: 'Initial matter details documented by citizen.',
    icon: FileEdit,
    color: 'slate',
  },
  {
    key: 'DOCUMENT_UPLOADED',
    label: 'Documents Uploaded',
    shortLabel: 'Uploaded',
    description: 'Petitions, land extracts, or notices uploaded securely.',
    icon: Upload,
    color: 'blue',
  },
  {
    key: 'AI_ANALYSIS',
    label: 'AI Legal Analysis',
    shortLabel: 'AI Analysis',
    description: 'Automated comprehension, date extraction & evidence-based risk flags.',
    icon: Sparkles,
    color: 'indigo',
  },
  {
    key: 'AWAITING_LAWYER',
    label: 'Awaiting Advocate',
    shortLabel: 'Matching',
    description: 'Assistance request listed for verified advocate review.',
    icon: UserSearch,
    color: 'amber',
  },
  {
    key: 'LAWYER_REVIEW',
    label: 'Advocate Review',
    shortLabel: 'Review',
    description: 'Advocate is assessing claims, facts, and uploaded evidence.',
    icon: FileSearch,
    color: 'violet',
  },
  {
    key: 'LAWYER_ASSIGNED',
    label: 'Advocate Assigned',
    shortLabel: 'Assigned',
    description: 'Verified advocate representation confirmed on NyayaSetu.',
    icon: UserCheck,
    color: 'emerald',
  },
  {
    key: 'ACTION_REQUIRED',
    label: 'Action Required',
    shortLabel: 'Action Needed',
    description: 'Advocate requested clarification, physical verification, or additional records.',
    icon: AlertTriangle,
    color: 'rose',
  },
  {
    key: 'IN_PROGRESS',
    label: 'Work In Progress',
    shortLabel: 'In Progress',
    description: 'Hearing preparation, pleadings drafting, or mutual settlement talks.',
    icon: PlayCircle,
    color: 'cyan',
  },
  {
    key: 'RESOLVED',
    label: 'Matter Resolved',
    shortLabel: 'Resolved',
    description: 'Order issued, mutation entered, or legal settlement formalized.',
    icon: CheckCircle2,
    color: 'emerald',
  },
  {
    key: 'CLOSED',
    label: 'Case Closed',
    shortLabel: 'Closed',
    description: 'Dossier archived and proceedings concluded.',
    icon: Archive,
    color: 'slate',
  },
];

export const CaseStatusTimeline: React.FC<CaseStatusTimelineProps> = ({
  currentStatus,
  onStatusClick,
  interactive = false,
}) => {
  // Map any legacy status to standard stage index
  const normalizedStatus =
    currentStatus === 'OPEN'
      ? 'AWAITING_LAWYER'
      : currentStatus === 'IN_REVIEW'
      ? 'LAWYER_REVIEW'
      : currentStatus === 'ASSIGNED'
      ? 'LAWYER_ASSIGNED'
      : currentStatus === 'ACTIVE'
      ? 'IN_PROGRESS'
      : currentStatus;

  const currentIndex = CASE_STATUS_STAGES.findIndex((s) => s.key === normalizedStatus);
  const activeIdx = currentIndex >= 0 ? currentIndex : 0;
  const currentStageMeta = CASE_STATUS_STAGES[activeIdx] || CASE_STATUS_STAGES[0];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4">
      {/* ── Header with Current Stage Highlight ───────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Case Lifecycle Status
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              {currentStageMeta.label}
            </h3>
            <span
              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                currentStageMeta.key === 'ACTION_REQUIRED'
                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                  : currentStageMeta.key === 'RESOLVED' || currentStageMeta.key === 'LAWYER_ASSIGNED'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : currentStageMeta.key === 'AWAITING_LAWYER' || currentStageMeta.key === 'LAWYER_REVIEW'
                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                  : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
              }`}
            >
              Stage {activeIdx + 1} of {CASE_STATUS_STAGES.length}
            </span>
          </div>
        </div>
        <p className="text-xs text-slate-500 max-w-sm sm:text-right">
          {currentStageMeta.description}
        </p>
      </div>

      {/* ── Visual Stepper Bar ────────────────────────────────────────────── */}
      <div className="relative pt-2 pb-1">
        {/* Track Line */}
        <div className="hidden md:block absolute top-6 left-5 right-5 h-1 bg-slate-100 rounded-full">
          <div
            className="h-full bg-gradient-to-r from-brand-600 via-indigo-600 to-emerald-500 rounded-full transition-all duration-500"
            style={{
              width: `${(activeIdx / (CASE_STATUS_STAGES.length - 1)) * 100}%`,
            }}
          />
        </div>

        {/* Stages Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2 relative">
          {CASE_STATUS_STAGES.map((stage, idx) => {
            const isCompleted = idx < activeIdx;
            const isCurrent = idx === activeIdx;
            const Icon = stage.icon;

            return (
              <button
                key={stage.key}
                type="button"
                disabled={!interactive}
                onClick={() => onStatusClick && onStatusClick(stage.key)}
                className={`flex flex-col items-center text-center p-2 rounded-xl transition-all ${
                  isCurrent
                    ? 'bg-brand-50/80 border border-brand-200 ring-2 ring-brand-500/20 shadow-sm'
                    : isCompleted
                    ? 'hover:bg-slate-50/80'
                    : 'opacity-60 hover:opacity-100'
                } ${interactive ? 'cursor-pointer' : 'cursor-default'}`}
              >
                {/* Node Circle */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-transform ${
                    isCurrent
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-500/30 scale-110'
                      : isCompleted
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-400 border border-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                {/* Stage Label */}
                <span
                  className={`mt-2 text-[11px] font-semibold leading-tight line-clamp-1 ${
                    isCurrent
                      ? 'text-brand-900 font-bold'
                      : isCompleted
                      ? 'text-slate-700 font-medium'
                      : 'text-slate-400'
                  }`}
                >
                  {stage.shortLabel}
                </span>

                <span className="text-[9px] text-slate-400 mt-0.5">
                  {isCurrent ? 'Active' : isCompleted ? '✓ Done' : `Step ${idx + 1}`}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
