import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Scale, FileText, Calendar, Bell, LogOut, Plus, Search,
  AlertTriangle, Clock, ArrowRight, ShieldCheck, FileCheck,
  ChevronRight, Phone, Award, CheckCircle2, Eye, RefreshCw
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
  StatusBadge, RiskBadge, DemoBadge, StatCard,
  SectionHeader, DeadlineCard, NotificationItem
} from '../components/ui';
import { DocumentViewer } from '../components/DocumentViewer';
import { DocumentUploadModal } from '../components/DocumentUploadModal';
import { LanguageSelector } from '../components/LanguageSelector';
import { useLanguage } from '../contexts/LanguageContext';

export const CitizenDashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'overview' | 'cases' | 'documents' | 'timeline'>('overview');

  // Documents state
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

  // Filter cases
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* ── Top Tricolor Accent Line ──────────────────────────────────────── */}
      <div className="saffron-line w-full" />

      {/* ── Top Navigation Bar ────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-500 to-indigo-800 flex items-center justify-center text-white shadow-sm">
                <Scale className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <span className="font-extrabold text-xl tracking-tight text-slate-900">NyayaSetu</span>
                <span className="text-xs ml-1.5 px-1.5 py-0.5 bg-blue-50 text-brand-600 font-bold border border-blue-200 rounded">
                  नागरिक
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {/* Language Selector */}
            <LanguageSelector variant="dropdown" className="hidden md:inline-flex" />

            {/* Notifications Indicator */}
            <div className="relative p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 cursor-pointer">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
            </div>

            {/* User Profile & Logout */}
            <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-900">{user?.fullName || 'Citizen User'}</p>
                <p className="text-[11px] text-slate-500">{user?.email}</p>
              </div>
              <button
                onClick={logout}
                id="citizen-logout-btn"
                title="Sign out of Citizen Portal"
                className="flex items-center gap-1 text-slate-500 hover:text-red-600 p-2 rounded-xl hover:bg-red-50 transition-colors text-xs font-semibold"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Container ────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8 flex-1">
        {/* ── Welcome Banner ──────────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-900 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 shadow-xl">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{t('dashboard.verifiedWorkspace')}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                Namaste, {user?.fullName?.split(' ')[0] || 'Citizen'} 🙏
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
                {t('dashboard.welcomeSub')}
              </p>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap gap-3">
              <button
                onClick={() => alert('Demo action: Case submission form will open here.')}
                className="btn-amber text-xs sm:text-sm flex items-center justify-center gap-2 whitespace-nowrap shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Case</span>
              </button>
              <div className="px-3 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-xs text-slate-200 flex items-center gap-2">
                <DemoBadge />
              </div>
            </div>
          </div>
          <div className="absolute right-0 bottom-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* ── Quick Stats Grid ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={FileText}
            label="Active Cases"
            value={activeCasesCount}
            change="+1 this month"
            color="text-blue-600"
            bgColor="bg-blue-50"
          />
          <StatCard
            icon={AlertTriangle}
            label="Urgent Deadlines"
            value={urgentDeadlinesCount}
            change="Action required"
            color="text-rose-600"
            bgColor="bg-rose-50"
            borderColor="border-rose-200"
          />
          <StatCard
            icon={FileCheck}
            label="Analyzed Documents"
            value={DEMO_DOCUMENTS.length}
            change="100% verified"
            color="text-emerald-600"
            bgColor="bg-emerald-50"
          />
          <StatCard
            icon={Award}
            label="Assigned Advocates"
            value={1}
            change="Bar Council verified"
            color="text-indigo-600"
            bgColor="bg-indigo-50"
          />
        </div>

        {/* ── Pending Actions Banner ───────────────────────────────────────── */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-900 flex items-center gap-2">
                Action Required: File Written Objection with Tahsildar
                <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold">12 Days Left</span>
              </h3>
              <p className="text-xs text-amber-800/90 mt-0.5">
                On Case <strong className="font-mono">NS-2026-00142</strong>: Adv. Priya Deshmukh has prepared the draft application. Please sign and review before Oct 20, 2026.
              </p>
            </div>
          </div>
          <Link
            to="/citizen/cases/demo-case-1"
            className="btn-amber text-xs whitespace-nowrap px-4 py-2 self-end sm:self-center"
          >
            Review & Sign →
          </Link>
        </div>

        {/* ── Tabbed View Selection ────────────────────────────────────────── */}
        <div className="flex border-b border-slate-200 gap-2 text-xs sm:text-sm font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 px-3 transition-colors relative ${
              activeTab === 'overview'
                ? 'text-brand-600 border-b-2 border-brand-500 font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Overview & Analytics
          </button>
          <button
            onClick={() => setActiveTab('cases')}
            className={`pb-3 px-3 transition-colors relative ${
              activeTab === 'cases'
                ? 'text-brand-600 border-b-2 border-brand-500 font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            All Cases ({DEMO_CITIZEN_CASES.length})
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`pb-3 px-3 transition-colors relative ${
              activeTab === 'documents'
                ? 'text-brand-600 border-b-2 border-brand-500 font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Documents ({DEMO_DOCUMENTS.length})
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`pb-3 px-3 transition-colors relative ${
              activeTab === 'timeline'
                ? 'text-brand-600 border-b-2 border-brand-500 font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Case Timeline
          </button>
        </div>

        {/* ── Content by Active Tab ────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* ── Two Column Layout: Active Cases & Side Panels ─────────────── */}
            <div className="grid lg:grid-cols-12 gap-8">
              {/* Left Column (8 cols): Active Cases */}
              <div className="lg:col-span-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <SectionHeader
                    title="Active Legal Cases"
                    subtitle="Track progress, deadlines, and assigned legal counsel"
                    isDemo
                  />

                  {/* Filters */}
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search cases..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500"
                      />
                    </div>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="OPEN">Open</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="IN_REVIEW">In Review</option>
                      <option value="ASSIGNED">Assigned</option>
                    </select>
                  </div>
                </div>

                {/* Case Cards List */}
                <div className="space-y-4">
                  {cases.map((c) => (
                    <Link
                      key={c.id}
                      to={`/citizen/cases/${c.id}`}
                      className="block bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md hover:border-brand-500/40 transition-all group"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                            {c.caseNumber}
                          </span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                            {c.category.replace('_', ' ')}
                          </span>
                          <StatusBadge status={c.status} />
                          {c.riskLevel && <RiskBadge level={c.riskLevel} />}
                        </div>
                        <span className="text-[11px] text-slate-400">
                          Updated {new Date(c.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>

                      <div className="pt-3 space-y-2">
                        <h3 className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors text-base">
                          {c.title}
                        </h3>
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {c.description}
                        </p>
                      </div>

                      <div className="pt-4 mt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
                        <div className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-amber-600" />
                          <span>Advocate: <strong className="text-slate-800">{c.lawyerName || 'Matching in progress'}</strong></span>
                        </div>
                        <div className="flex items-center gap-1 font-semibold text-brand-600 group-hover:translate-x-1 transition-transform">
                          <span>View Full Dossier</span>
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* ── Interactive Charts Row ────────────────────────────────── */}
                <div className="grid md:grid-cols-2 gap-6 pt-4">
                  {/* Status Breakdown Donut */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-900">Case Status Distribution</h3>
                      <DemoBadge />
                    </div>
                    <div className="h-52 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={DEMO_CASE_STATUS_CHART}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={75}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {DEMO_CASE_STATUS_CHART.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap justify-center gap-3 text-[11px] text-slate-600 pt-1">
                      {DEMO_CASE_STATUS_CHART.map((item) => (
                        <div key={item.name} className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                          <span>{item.name}: {item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Resolution Activity Trend */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-900">Case Timeline Progress</h3>
                      <DemoBadge />
                    </div>
                    <div className="h-52 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={DEMO_ACTIVITY_TIMELINE}>
                          <defs>
                            <linearGradient id="colorCases" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#1e3a8a" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#1e3a8a" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} />
                          <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                          />
                          <Area type="monotone" dataKey="cases" stroke="#1e3a8a" strokeWidth={2} fillOpacity={1} fill="url(#colorCases)" name="Active Cases" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-[11px] text-slate-500 text-center">
                      Weekly resolution and filing milestones across all recorded instances
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column (4 cols): Deadlines, Advocate Info & Notifications */}
              <div className="lg:col-span-4 space-y-6">
                {/* Upcoming Deadlines Widget */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-brand-600" />
                      <h3 className="text-sm font-bold text-slate-900">Upcoming Deadlines</h3>
                    </div>
                    <span className="text-xs bg-red-50 text-red-700 font-bold px-2 py-0.5 rounded-full">
                      {DEMO_DEADLINES.length} Scheduled
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {DEMO_DEADLINES.slice(0, 3).map((dl) => (
                      <DeadlineCard key={dl.id} deadline={dl} />
                    ))}
                  </div>

                  <button
                    onClick={() => setActiveTab('cases')}
                    className="w-full text-center text-xs font-semibold text-brand-600 hover:text-brand-700 pt-2 border-t border-slate-100"
                  >
                    View All Court Dates →
                  </button>
                </div>

                {/* Assigned Advocate Card */}
                <div className="bg-gradient-to-br from-indigo-50/60 via-white to-blue-50/40 rounded-2xl border border-indigo-200/80 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">
                      Assigned Legal Counsel
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      Verified
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-brand-500 text-white flex items-center justify-center font-bold text-base shadow-sm">
                      PD
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{assignedLawyer.fullName}</h4>
                      <p className="text-xs text-slate-500 font-mono">BCI Reg: {assignedLawyer.barCouncilNumber}</p>
                      <p className="text-[11px] text-amber-700 font-semibold mt-0.5">
                        ⭐ {assignedLawyer.rating} ({assignedLawyer.experienceYears} yrs exp)
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-white/80 rounded-xl border border-indigo-100 text-xs text-slate-600 space-y-1">
                    <p className="font-semibold text-slate-800">Specialization:</p>
                    <div className="flex flex-wrap gap-1">
                      {assignedLawyer.specialization?.map((s) => (
                        <span key={s} className="bg-indigo-50 text-indigo-700 text-[10px] px-2 py-0.5 rounded font-medium">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Link
                      to="/citizen/cases/demo-case-1"
                      className="btn-primary text-xs flex-1 text-center py-2"
                    >
                      Message Advocate
                    </Link>
                    <a
                      href="tel:+919876543210"
                      className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600"
                      title="Direct Phone"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                {/* Notifications Feed */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-slate-700" />
                      <h3 className="text-sm font-bold text-slate-900">Recent Notifications</h3>
                    </div>
                    <span className="text-[11px] text-slate-500">Auto-synced</span>
                  </div>

                  <div className="space-y-2">
                    {DEMO_NOTIFICATIONS.map((notif) => (
                      <NotificationItem key={notif.id} notification={notif} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Cases Tab ────────────────────────────────────────────────────── */}
        {activeTab === 'cases' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">All Registered Cases</h2>
                <p className="text-xs text-slate-500">Complete record of submitted legal inquiries and dispute files</p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Filter by title or number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl w-60"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {cases.map((c) => (
                <div key={c.id} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm hover:border-brand-500 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold bg-slate-100 text-slate-800 px-2.5 py-1 rounded">
                      {c.caseNumber}
                    </span>
                    <StatusBadge status={c.status} size="md" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{c.title}</h3>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-3 leading-relaxed">{c.description}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span>Category:</span>
                      <strong className="text-slate-800">{c.category}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Advocate:</span>
                      <strong className="text-slate-800">{c.lawyerName || 'Unassigned'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Risk Profile:</span>
                      {c.riskLevel && <RiskBadge level={c.riskLevel} />}
                    </div>
                  </div>
                  <div className="flex justify-end pt-2 border-t border-slate-100">
                    <Link
                      to={`/citizen/cases/${c.id}`}
                      className="btn-primary text-xs flex items-center gap-1.5"
                    >
                      <span>Open Case Details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Documents Tab ────────────────────────────────────────────────── */}
        {activeTab === 'documents' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Uploaded Legal Documents</h2>
                <p className="text-xs text-slate-500">Secure digital repository with AI validation and extraction</p>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="btn-primary text-xs flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                Upload New Document
              </button>
            </div>

            <div className="space-y-3">
              {docList.map((doc) => {
                const status = doc.status || doc.processingStatus || 'COMPLETED';
                const isProcessing = ['UPLOADED', 'PROCESSING', 'ANALYZING'].includes(status);
                return (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedViewerDoc(doc)}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/80 hover:border-brand-400 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 group-hover:bg-brand-500 group-hover:text-white transition-colors">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="truncate">
                        <h4 className="font-bold text-sm text-slate-900 truncate group-hover:text-brand-600 transition-colors">
                          {doc.originalName}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                          <span>{((doc.fileSize || doc.fileSizeBytes || 0) / 1024 / 1024).toFixed(2)} MB</span>
                          <span>•</span>
                          <span>Uploaded {new Date(doc.uploadedAt || doc.createdAt || Date.now()).toLocaleDateString('en-IN')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`badge ${
                        status === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : status === 'FAILED'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {isProcessing ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3 h-3" />
                        )}
                        <span>{status === 'COMPLETED' ? 'AI Analyzed' : status}</span>
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedViewerDoc(doc);
                        }}
                        className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-brand-600 hover:border-brand-500 transition-colors"
                        title="View Document & AI Analysis"
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

        {/* ── Timeline Tab ─────────────────────────────────────────────────── */}
        {activeTab === 'timeline' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Case Milestone Timeline</h2>
                <p className="text-xs text-slate-500">Chronological history of filings, document reviews, and hearings</p>
              </div>
              <DemoBadge />
            </div>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {DEMO_CASE_EVENTS.map((evt) => (
                <div key={evt.id} className="relative group">
                  <div className="absolute -left-[29px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white bg-brand-500 shadow-sm" />
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                      <h4 className="font-bold text-sm text-slate-900">{evt.title}</h4>
                      <span className="text-[11px] text-slate-500">
                        {new Date(evt.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    {evt.description && (
                      <p className="text-xs text-slate-600 leading-relaxed">{evt.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Document Viewer Modal ── */}
        {selectedViewerDoc && (
          <DocumentViewer
            documentId={selectedViewerDoc.id}
            initialData={{
              originalName: selectedViewerDoc.originalName,
              fileSizeBytes: selectedViewerDoc.fileSize || selectedViewerDoc.fileSizeBytes || 0,
              mimeType: selectedViewerDoc.fileType || selectedViewerDoc.mimeType || 'application/pdf',
              processingStatus: selectedViewerDoc.status || selectedViewerDoc.processingStatus || 'COMPLETED',
              detectedLanguage: 'en',
              extractedText: selectedViewerDoc.extractedText || (selectedViewerDoc.id.startsWith('demo-') ? 'महाराष्ट्र शासन महसूल व वन विभाग\nगावाचे नाव: हवेली, गट क्र. २४\nभोगवटदार: राजेश शर्मा\nक्षेत्र: १.२ हेक्टर आर\nफेरफार क्र. २२४५: शेजारील जमिनीचे सीमांकन वाद' : undefined),
              analysis: selectedViewerDoc.analysis || (selectedViewerDoc.id.startsWith('demo-') ? DEMO_AI_ANALYSIS : undefined),
              createdAt: selectedViewerDoc.uploadedAt || selectedViewerDoc.createdAt,
            }}
            onClose={() => setSelectedViewerDoc(null)}
          />
        )}

        {/* ── Document Upload Modal ── */}
        <DocumentUploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onSuccess={handleUploadSuccess}
        />
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-slate-500 text-xs text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© 2026 NyayaSetu Citizen Portal (नागरिक पोर्टल)</span>
          <span className="text-slate-400">Statutory Notice: All AI summaries are for guidance. Consult your verified advocate.</span>
        </div>
      </footer>
    </div>
  );
};
