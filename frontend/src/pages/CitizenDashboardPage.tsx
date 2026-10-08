import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Scale, FileText, Calendar, Bell, LogOut, Plus, Search,
  AlertTriangle, ArrowRight, ShieldCheck, FileCheck,
  ChevronRight, Phone, Award, CheckCircle2, Eye, RefreshCw,
  LayoutDashboard, Briefcase, BookOpen, Activity, Gavel,
  Star, Menu
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  AreaChart, Area, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import {
  DEMO_CITIZEN_CASES, DEMO_DOCUMENTS, DEMO_DEADLINES,
  DEMO_CASE_EVENTS, DEMO_NOTIFICATIONS, DEMO_LAWYER_PROFILES,
  DEMO_CASE_STATUS_CHART, DEMO_ACTIVITY_TIMELINE, DEMO_AI_ANALYSIS
} from '../lib/mockData';
import {
  StatusBadge, RiskBadge, DemoBadge,
  DeadlineCard, NotificationItem
} from '../components/ui';
import { DocumentViewer } from '../components/DocumentViewer';
import { DocumentUploadModal } from '../components/DocumentUploadModal';
import { LanguageSelector } from '../components/LanguageSelector';
import { useLanguage } from '../contexts/LanguageContext';

type Tab = 'overview' | 'cases' | 'documents' | 'timeline';

const NAV_ITEMS: { id: Tab; label: string; icon: React.ElementType; badge?: number }[] = [
  { id: 'overview',   label: 'Overview',    icon: LayoutDashboard },
  { id: 'cases',      label: 'My Cases',    icon: Briefcase,       badge: 3 },
  { id: 'documents',  label: 'Documents',   icon: BookOpen },
  { id: 'timeline',   label: 'Timeline',    icon: Activity },
];

// Scales of Justice SVG Icon
const ScalesIcon: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
  <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="30" y="6" width="4" height="44" rx="2" fill="currentColor"/>
    <rect x="8" y="6" width="48" height="3" rx="1.5" fill="currentColor"/>
    <circle cx="32" cy="6" r="3" fill="currentColor"/>
    {/* Left pan */}
    <line x1="12" y1="9" x2="20" y2="28" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <ellipse cx="16" cy="30" rx="10" ry="3" fill="currentColor" opacity="0.7"/>
    {/* Right pan */}
    <line x1="52" y1="9" x2="44" y2="24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <ellipse cx="48" cy="26" rx="10" ry="3" fill="currentColor" opacity="0.7"/>
    {/* Base */}
    <rect x="22" y="50" width="20" height="3" rx="1.5" fill="currentColor"/>
    <rect x="18" y="53" width="28" height="3" rx="1.5" fill="currentColor"/>
  </svg>
);

export const CitizenDashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [docList, setDocList] = useState<any[]>(DEMO_DOCUMENTS);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedViewerDoc, setSelectedViewerDoc] = useState<any | null>(null);

  const handleUploadSuccess = (uploadedDoc: any) => {
    const newDoc = {
      id: uploadedDoc.id,
      caseId: uploadedDoc.caseId,
      originalName: uploadedDoc.originalName,
      fileType: uploadedDoc.mimeType,
      fileSize: uploadedDoc.fileSizeBytes,
      uploadedBy: user?.id || 'citizen',
      uploadedAt: uploadedDoc.createdAt || new Date().toISOString(),
      status: uploadedDoc.processingStatus || 'UPLOADED',
    };
    setDocList((prev) => [newDoc, ...prev]);
    setSelectedViewerDoc(newDoc);
  };

  const cases = DEMO_CITIZEN_CASES.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeCasesCount = DEMO_CITIZEN_CASES.filter(
    (c) => c.status !== 'RESOLVED' && c.status !== 'CLOSED'
  ).length;
  const urgentDeadlinesCount = DEMO_DEADLINES.filter(
    (d) => d.priority === 'CRITICAL' || d.priority === 'HIGH'
  ).length;
  const assignedLawyer = DEMO_LAWYER_PROFILES[0];

  const initials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex flex-col">
      {/* ── Tricolor Accent ─────────────────────────────────────────────────── */}
      <div className="saffron-line w-full flex-shrink-0" />

      <div className="flex flex-1 overflow-hidden">
        {/* ══════════════════════════════════════════════════════════════════════
            SIDEBAR
        ══════════════════════════════════════════════════════════════════════ */}
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside
          className={`fixed lg:static inset-y-0 left-0 z-50 lg:z-auto w-64 bg-[#0f2340] flex flex-col transition-transform duration-300
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        >
          {/* Logo */}
          <div className="px-6 py-6 border-b border-white/10">
            <Link to="/" className="flex items-center gap-3" onClick={() => setSidebarOpen(false)}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg flex-shrink-0">
                <ScalesIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-law text-white font-bold text-lg leading-tight">NyayaSetu</h1>
                <p className="text-amber-400/80 text-[10px] font-medium tracking-widest uppercase">Citizen Portal</p>
              </div>
            </Link>
          </div>

          {/* User Card */}
          <div className="px-4 py-4 mx-4 mt-4 rounded-xl bg-white/8 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow">
                {initials(user?.fullName || 'Citizen User')}
              </div>
              <div className="min-w-0">
                <p className="text-white font-semibold text-sm truncate">{user?.fullName || 'Citizen User'}</p>
                <p className="text-slate-400 text-[11px] truncate">{user?.email}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-400/20">
              <ShieldCheck className="w-3 h-3 text-emerald-400 flex-shrink-0" />
              <span className="text-emerald-400 text-[10px] font-semibold tracking-wide">VERIFIED CITIZEN</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest px-3 mb-3">Navigation</p>
            {NAV_ITEMS.map(({ id, label, icon: Icon, badge }) => (
              <button
                key={id}
                onClick={() => { setActiveTab(id); setSidebarOpen(false); }}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
                  ${activeTab === id
                    ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/8'}`}
              >
                <span className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  {label}
                </span>
                {badge && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full
                    ${activeTab === id ? 'bg-white/20 text-white' : 'bg-amber-500/20 text-amber-400'}`}>
                    {badge}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Language + Logout */}
          <div className="px-4 pb-6 space-y-2 border-t border-white/10 pt-4">
            <div className="px-3">
              <LanguageSelector variant="dropdown" className="w-full" />
            </div>
            <button
              onClick={logout}
              id="citizen-logout-btn"
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* ══════════════════════════════════════════════════════════════════════
            MAIN CONTENT
        ══════════════════════════════════════════════════════════════════════ */}
        <div className="flex-1 flex flex-col min-w-0 overflow-auto">
          {/* ── Top Header Bar ──────────────────────────────────────────────── */}
          <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
            <div className="px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {/* Mobile menu toggle */}
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100"
                >
                  <Menu className="w-5 h-5" />
                </button>

                {/* Breadcrumb */}
                <div className="hidden sm:flex items-center gap-2 text-sm">
                  <span className="text-slate-400">NyayaSetu</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                  <span className="text-slate-700 font-semibold">
                    {NAV_ITEMS.find(n => n.id === activeTab)?.label}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Notifications */}
                <div className="relative p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
                </div>

                {/* Date badge */}
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
                  <Calendar className="w-3.5 h-3.5 text-[#1e3a5f]" />
                  {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
            </div>
          </header>

          {/* ── Page Body ──────────────────────────────────────────────────── */}
          <main className="flex-1 p-4 sm:p-6 space-y-6">

            {/* ── Welcome Hero Banner ──────────────────────────────────────── */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0f2340] via-[#1e3a5f] to-[#0f2340] text-white shadow-xl">
              {/* decorative scales watermark */}
              <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-5 pointer-events-none">
                <ScalesIcon className="w-48 h-48 text-white" />
              </div>
              {/* Gold top border */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600" />

              <div className="relative z-10 px-6 py-6 sm:px-8 sm:py-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/25 text-emerald-300 text-xs font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {t('dashboard.verifiedWorkspace')}
                  </div>
                  <h1 className="font-law text-2xl sm:text-3xl font-bold text-white">
                    Namaste, {user?.fullName?.split(' ')[0] || 'Citizen'} 🙏
                  </h1>
                  <p className="text-slate-300 text-sm max-w-xl leading-relaxed">
                    {t('dashboard.welcomeSub')}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => alert('Case submission form will open here.')}
                    className="btn-gold flex items-center gap-2 whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" />
                    New Case Filing
                  </button>
                  <div className="px-3 py-2 rounded-lg bg-white/8 border border-white/15 text-xs text-slate-300 flex items-center gap-2">
                    <DemoBadge />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Stats Row ─────────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  icon: Briefcase, label: 'Active Cases', value: activeCasesCount,
                  sub: '+1 this month', color: 'text-[#1e3a5f]', bg: 'bg-blue-50', border: 'border-blue-100',
                  iconBg: 'bg-[#1e3a5f]'
                },
                {
                  icon: AlertTriangle, label: 'Urgent Deadlines', value: urgentDeadlinesCount,
                  sub: 'Action required', color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-100',
                  iconBg: 'bg-rose-600'
                },
                {
                  icon: FileCheck, label: 'AI-Analyzed Docs', value: DEMO_DOCUMENTS.length,
                  sub: '100% verified', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-100',
                  iconBg: 'bg-emerald-600'
                },
                {
                  icon: Scale, label: 'Assigned Advocates', value: 1,
                  sub: 'Bar Council verified', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-100',
                  iconBg: 'bg-amber-600'
                },
              ].map(({ icon: Icon, label, value, sub, color, iconBg, border }) => (
                <div key={label} className={`bg-white rounded-xl border ${border} p-5 shadow-sm hover:shadow-md transition-all duration-200`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shadow-sm`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className={`text-3xl font-bold font-law ${color}`}>{value}</span>
                  </div>
                  <p className="text-slate-700 font-semibold text-sm">{label}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{sub}</p>
                </div>
              ))}
            </div>

            {/* ── Pending Action Alert ─────────────────────────────────────── */}
            <div className="bg-amber-50 border-l-4 border-amber-500 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Gavel className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-amber-900">Action Required: File Written Objection</h3>
                    <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold border border-red-200">
                      12 Days Left
                    </span>
                  </div>
                  <p className="text-xs text-amber-800/80 mt-0.5">
                    Case <strong className="font-mono">NS-2026-00142</strong> — Adv. Priya Deshmukh has prepared the draft. Please sign and review before Oct 20, 2026.
                  </p>
                </div>
              </div>
              <Link
                to="/citizen/cases/demo-case-1"
                className="btn-amber text-xs whitespace-nowrap self-end sm:self-center flex items-center gap-1.5"
              >
                Review & Sign <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* ── Tab Navigation ────────────────────────────────────────────── */}
            <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm w-fit">
              {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150
                    ${activeTab === id
                      ? 'bg-[#0f2340] text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>

            {/* ════════════════════════════════════════════════════════════════
                OVERVIEW TAB
            ════════════════════════════════════════════════════════════════ */}
            {activeTab === 'overview' && (
              <div className="grid lg:grid-cols-12 gap-6 animate-fade-in">
                {/* Left: Cases + Charts */}
                <div className="lg:col-span-8 space-y-6">

                  {/* Active Cases */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                      <div>
                        <h2 className="font-law font-bold text-slate-900 text-base">Active Legal Cases</h2>
                        <p className="text-xs text-slate-500 mt-0.5">Track progress, deadlines, and assigned advocates</p>
                      </div>
                      <DemoBadge />
                    </div>

                    <div className="p-4 border-b border-slate-100 flex gap-3">
                      <div className="relative flex-1">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          placeholder="Search cases..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg w-full focus:outline-none focus:border-[#1e3a5f]"
                        />
                      </div>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none"
                      >
                        <option value="ALL">All Statuses</option>
                        <option value="OPEN">Open</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="IN_REVIEW">In Review</option>
                        <option value="ASSIGNED">Assigned</option>
                      </select>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {cases.map((c) => (
                        <Link
                          key={c.id}
                          to={`/citizen/cases/${c.id}`}
                          className="block px-6 py-4 hover:bg-slate-50/80 transition-colors group"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                <span className="font-mono text-xs font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                                  {c.caseNumber}
                                </span>
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                                  {c.category.replace('_', ' ')}
                                </span>
                                <StatusBadge status={c.status} />
                                {c.riskLevel && <RiskBadge level={c.riskLevel} />}
                              </div>
                              <h3 className="font-bold text-slate-900 group-hover:text-[#1e3a5f] transition-colors">
                                {c.title}
                              </h3>
                              <p className="text-xs text-slate-500 mt-1 line-clamp-1">{c.description}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2 flex-shrink-0">
                              <span className="text-[10px] text-slate-400">
                                {new Date(c.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                              </span>
                              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#1e3a5f] group-hover:translate-x-0.5 transition-all" />
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                            <Award className="w-3.5 h-3.5 text-amber-600" />
                            <span>Advocate: <strong className="text-slate-700">{c.lawyerName || 'Matching in progress...'}</strong></span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Charts */}
                  <div className="grid md:grid-cols-2 gap-5">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-slate-900 text-sm">Case Status Distribution</h3>
                        <DemoBadge />
                      </div>
                      <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={DEMO_CASE_STATUS_CHART}
                              cx="50%" cy="50%"
                              innerRadius={45} outerRadius={72}
                              paddingAngle={4} dataKey="value"
                            >
                              {DEMO_CASE_STATUS_CHART.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '11px' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex flex-wrap justify-center gap-3 text-[11px] text-slate-600">
                        {DEMO_CASE_STATUS_CHART.map((item) => (
                          <div key={item.name} className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.fill }} />
                            <span>{item.name}: {item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-slate-900 text-sm">Case Progress Trend</h3>
                        <DemoBadge />
                      </div>
                      <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={DEMO_ACTIVITY_TIMELINE}>
                            <defs>
                              <linearGradient id="colorCases" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%"  stopColor="#1e3a5f" stopOpacity={0.35}/>
                                <stop offset="95%" stopColor="#1e3a5f" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#94a3b8' }} />
                            <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '11px' }} />
                            <Area type="monotone" dataKey="cases" stroke="#1e3a5f" strokeWidth={2} fillOpacity={1} fill="url(#colorCases)" name="Active Cases" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Sidebar Panels */}
                <div className="lg:col-span-4 space-y-5">

                  {/* Deadlines */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#1e3a5f]" />
                        <h3 className="font-semibold text-slate-900 text-sm">Upcoming Deadlines</h3>
                      </div>
                      <span className="text-xs bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full border border-red-200">
                        {DEMO_DEADLINES.length} Due
                      </span>
                    </div>
                    <div className="p-4 space-y-2.5">
                      {DEMO_DEADLINES.slice(0, 3).map((dl) => (
                        <DeadlineCard key={dl.id} deadline={dl} />
                      ))}
                    </div>
                    <button
                      onClick={() => setActiveTab('cases')}
                      className="w-full text-center text-xs font-semibold text-[#1e3a5f] hover:text-[#0f2340] py-3 border-t border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      View All Court Dates →
                    </button>
                  </div>

                  {/* Advocate Card */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-3 bg-[#0f2340] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Scale className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-bold text-white uppercase tracking-wider">Legal Counsel</span>
                      </div>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                        <ShieldCheck className="w-2.5 h-2.5" /> Verified
                      </span>
                    </div>
                    <div className="p-5 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1e3a5f] to-indigo-700 text-white flex items-center justify-center font-bold text-base shadow">
                          PD
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900">{assignedLawyer.fullName}</h4>
                          <p className="text-xs text-slate-500 font-mono">BCI: {assignedLawyer.barCouncilNumber}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                            <span className="text-xs font-semibold text-amber-700">{assignedLawyer.rating}</span>
                            <span className="text-xs text-slate-400">• {assignedLawyer.experienceYears} yrs exp</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {assignedLawyer.specialization?.map((s) => (
                          <span key={s} className="text-[10px] bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded font-medium">
                            {s}
                          </span>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <Link
                          to="/citizen/cases/demo-case-1"
                          className="btn-primary text-xs flex-1 text-center py-2.5 flex items-center justify-center gap-1.5"
                        >
                          <Phone className="w-3.5 h-3.5" /> Message Advocate
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Notifications */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-slate-600" />
                        <h3 className="font-semibold text-slate-900 text-sm">Notifications</h3>
                      </div>
                      <span className="text-[11px] text-slate-400">Auto-synced</span>
                    </div>
                    <div className="p-4 space-y-2">
                      {DEMO_NOTIFICATIONS.map((notif) => (
                        <NotificationItem key={notif.id} notification={notif} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ════════════════════════════════════════════════════════════════
                CASES TAB
            ════════════════════════════════════════════════════════════════ */}
            {activeTab === 'cases' && (
              <div className="space-y-5 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="font-law text-xl font-bold text-slate-900">All Registered Cases</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Complete record of submitted legal inquiries and dispute files</p>
                  </div>
                  <input
                    type="text"
                    placeholder="Filter by title or number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg w-full sm:w-60 focus:outline-none focus:border-[#1e3a5f]"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {cases.map((c) => (
                    <div key={c.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-[#1e3a5f]/40 transition-all">
                      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                        <span className="font-mono text-xs font-bold bg-slate-100 text-slate-800 px-2.5 py-1 rounded">
                          {c.caseNumber}
                        </span>
                        <StatusBadge status={c.status} size="md" />
                      </div>
                      <div className="p-5 space-y-3">
                        <div>
                          <h3 className="font-bold text-slate-900">{c.title}</h3>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{c.description}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-slate-50 rounded-lg px-3 py-2">
                            <p className="text-slate-400 text-[10px] uppercase font-semibold">Category</p>
                            <p className="text-slate-800 font-semibold mt-0.5">{c.category}</p>
                          </div>
                          <div className="bg-slate-50 rounded-lg px-3 py-2">
                            <p className="text-slate-400 text-[10px] uppercase font-semibold">Risk</p>
                            <div className="mt-0.5">{c.riskLevel && <RiskBadge level={c.riskLevel} />}</div>
                          </div>
                        </div>
                        <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Award className="w-3.5 h-3.5 text-amber-600" />
                            <span>{c.lawyerName || 'Unassigned'}</span>
                          </div>
                          <Link
                            to={`/citizen/cases/${c.id}`}
                            className="btn-primary text-xs flex items-center gap-1.5 py-2"
                          >
                            Open Details <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ════════════════════════════════════════════════════════════════
                DOCUMENTS TAB
            ════════════════════════════════════════════════════════════════ */}
            {activeTab === 'documents' && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
                  <div>
                    <h2 className="font-law font-bold text-slate-900">Legal Document Repository</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Secure digital repository with AI validation and text extraction</p>
                  </div>
                  <button
                    onClick={() => setIsUploadModalOpen(true)}
                    className="btn-primary text-xs flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Upload Document
                  </button>
                </div>

                <div className="divide-y divide-slate-100">
                  {docList.map((doc) => {
                    const status = doc.status || doc.processingStatus || 'COMPLETED';
                    const isProcessing = ['UPLOADED', 'PROCESSING', 'ANALYZING'].includes(status);
                    return (
                      <div
                        key={doc.id}
                        onClick={() => setSelectedViewerDoc(doc)}
                        className="px-6 py-4 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between gap-4 group"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1e3a5f] flex items-center justify-center flex-shrink-0 group-hover:bg-[#1e3a5f] group-hover:text-white transition-colors">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="truncate">
                            <h4 className="font-semibold text-sm text-slate-900 truncate group-hover:text-[#1e3a5f] transition-colors">
                              {doc.originalName}
                            </h4>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {((doc.fileSize || doc.fileSizeBytes || 0) / 1024 / 1024).toFixed(2)} MB
                              &nbsp;·&nbsp;
                              {new Date(doc.uploadedAt || doc.createdAt || Date.now()).toLocaleDateString('en-IN')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 border
                            ${status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : status === 'FAILED' ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                            {isProcessing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                            {status === 'COMPLETED' ? 'AI Analyzed' : status}
                          </span>
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedViewerDoc(doc); }}
                            className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-[#1e3a5f] hover:border-[#1e3a5f] transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ════════════════════════════════════════════════════════════════
                TIMELINE TAB
            ════════════════════════════════════════════════════════════════ */}
            {activeTab === 'timeline' && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
                  <div>
                    <h2 className="font-law font-bold text-slate-900">Case Milestone Timeline</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Chronological history of filings, hearings, and document reviews</p>
                  </div>
                  <DemoBadge />
                </div>

                <div className="p-6">
                  <div className="relative pl-8 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-amber-400 before:via-[#1e3a5f] before:to-slate-200">
                    {DEMO_CASE_EVENTS.map((evt, i) => (
                      <div key={evt.id} className="relative">
                        <div className={`absolute -left-5 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white shadow
                          ${i === 0 ? 'bg-amber-500' : 'bg-[#1e3a5f]'}`} />
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 hover:border-[#1e3a5f]/30 transition-colors">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                            <h4 className="font-bold text-sm text-slate-900">{evt.title}</h4>
                            <span className="text-[11px] text-slate-400 flex-shrink-0">
                              {new Date(evt.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                          {evt.description && (
                            <p className="text-xs text-slate-500 leading-relaxed">{evt.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </main>

          {/* ── Footer ──────────────────────────────────────────────────────── */}
          <footer className="bg-white border-t border-slate-200 py-4">
            <div className="px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <ScalesIcon className="w-4 h-4 text-amber-600" />
                <span>© 2026 NyayaSetu — नागरिक पोर्टल</span>
              </div>
              <span className="text-center">Statutory Notice: AI summaries are for guidance only. Consult your verified advocate for legal advice.</span>
            </div>
          </footer>
        </div>
      </div>

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      {selectedViewerDoc && (
        <DocumentViewer
          documentId={selectedViewerDoc.id}
          initialData={{
            originalName: selectedViewerDoc.originalName,
            fileSizeBytes: selectedViewerDoc.fileSize || selectedViewerDoc.fileSizeBytes || 0,
            mimeType: selectedViewerDoc.fileType || selectedViewerDoc.mimeType || 'application/pdf',
            processingStatus: selectedViewerDoc.status || selectedViewerDoc.processingStatus || 'COMPLETED',
            detectedLanguage: 'en',
            extractedText: selectedViewerDoc.extractedText || (selectedViewerDoc.id.startsWith('demo-')
              ? 'महाराष्ट्र शासन महसूल व वन विभाग\nगावाचे नाव: हवेली, गट क्र. २४\nभोगवटदार: राजेश शर्मा\nक्षेत्र: १.२ हेक्टर आर\nफेरफार क्र. २२४५: शेजारील जमिनीचे सीमांकन वाद' : undefined),
            analysis: selectedViewerDoc.analysis || (selectedViewerDoc.id.startsWith('demo-') ? DEMO_AI_ANALYSIS : undefined),
            createdAt: selectedViewerDoc.uploadedAt || selectedViewerDoc.createdAt,
          }}
          onClose={() => setSelectedViewerDoc(null)}
        />
      )}

      <DocumentUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
};
