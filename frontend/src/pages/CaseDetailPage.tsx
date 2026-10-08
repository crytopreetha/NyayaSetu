import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Calendar, FileText,
  CheckCircle2, User,
  Sparkles, BookOpen,
  Phone, Mail, Info, Eye, Plus, RefreshCw,
  UserSearch, ShieldCheck, Scale, Loader2
} from 'lucide-react';
import {
  DEMO_CITIZEN_CASES, DEMO_DOCUMENTS, DEMO_DEADLINES,
  DEMO_CASE_EVENTS, DEMO_AI_ANALYSIS,
  DEMO_LAWYER_PROFILES
} from '../lib/mockData';
import { StatusBadge, RiskBadge, DemoBadge } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { DocumentViewer } from '../components/DocumentViewer';
import { DocumentUploadModal } from '../components/DocumentUploadModal';
import { LanguageSelector } from '../components/LanguageSelector';
import { CaseStatusTimeline } from '../components/CaseStatusTimeline';
import { FindLawyerModal } from '../components/FindLawyerModal';
import { CaseMessagingThread } from '../components/CaseMessagingThread';
import { caseApi, documentApi } from '../lib/api';

export const CaseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  // Find case or fallback to demo case 1
  const defaultDemoCase =
    DEMO_CITIZEN_CASES.find((c) => c.id === id) || DEMO_CITIZEN_CASES[0];

  const [caseData, setCaseData] = useState<any>(defaultDemoCase);
  const [loadingCase, setLoadingCase] = useState<boolean>(Boolean(id && !id.startsWith('demo-')));

  const initialDocs = DEMO_DOCUMENTS.filter((d) => d.caseId === caseData.id);
  const deadlines = DEMO_DEADLINES.filter((dl) => dl.caseId === caseData.id);
  const events = DEMO_CASE_EVENTS.filter((e) => e.caseId === caseData.id);

  // Document Management state
  const [docList, setDocList] = useState<any[]>(initialDocs);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedViewerDoc, setSelectedViewerDoc] = useState<any | null>(null);

  // Lawyer Finder & Request state
  const [isFindLawyerOpen, setIsFindLawyerOpen] = useState(false);
  const [findLawyerMode, setFindLawyerMode] = useState<'FIND' | 'ADVICE'>('FIND');
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'hi' | 'mr'>('en');

  // Load real case from backend if not demo
  useEffect(() => {
    if (!id || id.startsWith('demo-')) return;

    const fetchCaseAndDocs = async () => {
      try {
        const live = await caseApi.getById(id);
        if (live) {
          setCaseData({
            id: live.id,
            caseNumber: live.case_number,
            title: live.title,
            description: live.description,
            category: live.category,
            status: live.status,
            urgency: live.urgency,
            riskLevel: live.urgency,
            citizenId: live.citizen_id,
            citizenName: live.citizen_name,
            assignedLawyerId: live.assigned_lawyer_id,
            lawyerName: live.lawyer_name,
            lawyerBarId: live.lawyer_bar_id,
            createdAt: live.created_at,
          });
        }

        const docs = await documentApi.listByCase(id);
        if (docs && docs.length > 0) {
          setDocList(docs);
        }
      } catch (err) {
        console.warn('Could not load case from backend, keeping default:', err);
      } finally {
        setLoadingCase(false);
      }
    };

    fetchCaseAndDocs();
  }, [id]);

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

  const lawyer = DEMO_LAWYER_PROFILES.find((l) => l.id === caseData.assignedLawyerId) || {
    id: caseData.assignedLawyerId || 'lawyer-1',
    fullName: caseData.lawyerName || 'Adv. Priya Deshmukh',
    barCouncilNumber: caseData.lawyerBarId || 'MAH/4521/2014',
    specialization: 'Civil & Property Law',
    rating: 4.9,
    experienceYears: 12,
    bio: 'Specializing in Land, Revenue, and Civil tenancy disputes in Bombay High Court and District Courts.',
    phone: '+91 98201 54321',
    email: 'adv.deshmukh@nyayasetu.gov.in',
  };

  if (loadingCase) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
          <p className="text-sm font-medium text-slate-600">Loading case dossier...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <div className="saffron-line w-full" />

      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/citizen/dashboard"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </Link>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold bg-slate-100 text-slate-800 px-2.5 py-1 rounded">
                {caseData.caseNumber}
              </span>
              <StatusBadge status={caseData.status} />
              {caseData.riskLevel && <RiskBadge level={caseData.riskLevel} />}
            </div>
          </div>

            <div className="flex items-center gap-2">
              <LanguageSelector variant="dropdown" />
              <DemoBadge />
            </div>
        </div>
      </header>

      {/* ── Main Case Content ───────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8 flex-1">
        {/* Case Title Banner */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {caseData.category.replace('_', ' ')}
                </span>
                <span className="text-xs text-slate-400">
                  Filed on {new Date(caseData.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {caseData.title}
              </h1>
              <p className="text-sm text-slate-600 max-w-4xl leading-relaxed">
                {caseData.description}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {caseData.lawyerName || caseData.assignedLawyerId ? (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col gap-1.5 min-w-[220px]">
                  <span className="text-[11px] text-slate-500 font-medium">Assigned Advocate:</span>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                      AD
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{caseData.lawyerName || 'Assigned Advocate'}</p>
                      <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Bar Council Verified</span>
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-3.5 flex flex-col gap-2 min-w-[220px]">
                  <div className="flex items-center gap-1.5 text-amber-900 text-xs font-bold">
                    <UserSearch className="w-4 h-4 text-amber-600" />
                    <span>No Advocate Assigned</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-tight">
                    Connect with a verified advocate for formal representation or legal advice.
                  </p>
                </div>
              )}

              {/* Action Buttons: [Find a Lawyer] and [Request Legal Advice] */}
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setFindLawyerMode('FIND');
                    setIsFindLawyerOpen(true);
                  }}
                  className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <UserSearch className="w-3.5 h-3.5" />
                  <span>Find a Lawyer</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFindLawyerMode('ADVICE');
                    setIsFindLawyerOpen(true);
                  }}
                  className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all"
                >
                  <Scale className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Request Legal Advice</span>
                </button>
              </div>
            </div>
          </div>

          {/* ── Visual Case Lifecycle Timeline ────────────────────────────────── */}
          <div className="pt-4 border-t border-slate-100">
            <CaseStatusTimeline currentStatus={caseData.status} />
          </div>
        </div>

        {/* ── Two Column Layout: Main Analysis + Secondary Info ──────────────── */}
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Left Column (8 cols): AI Analysis & Communication */}
          <div className="lg:col-span-8 space-y-8">
            {/* ── AI Analysis Card ──────────────────────────────────────────── */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 text-white flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-slate-900">AI Document Analysis</h2>
                      <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                        {Math.round(DEMO_AI_ANALYSIS.confidence * 100)}% Confidence
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">Automated extraction from uploaded title extracts</p>
                  </div>
                </div>

                {/* Multilingual Switcher */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                  <button
                    onClick={() => setSelectedLanguage('en')}
                    className={`px-2.5 py-1 rounded-lg ${selectedLanguage === 'en' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => setSelectedLanguage('hi')}
                    className={`px-2.5 py-1 rounded-lg ${selectedLanguage === 'hi' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}
                  >
                    हिंदी
                  </button>
                  <button
                    onClick={() => setSelectedLanguage('mr')}
                    className={`px-2.5 py-1 rounded-lg ${selectedLanguage === 'mr' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}
                  >
                    मराठी
                  </button>
                </div>
              </div>

              {/* Demo AI Disclaimer Alert */}
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
                <Info className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-900 leading-relaxed">
                  <strong>⚡ Demonstration Preview:</strong> This analysis was pre-computed to showcase NyayaSetu's intelligence engine. Live Gemini 2.0 Flash document extraction will run seamlessly once cloud processing pipelines are initialized.
                </p>
              </div>

              {/* Plain Language Summary */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Plain-Language Case Summary
                </h3>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-sm text-slate-700 leading-relaxed">
                  {selectedLanguage === 'hi'
                    ? 'यह दस्तावेज़ हवेली तालुका में पुश्तैनी कृषि भूमि का 7/12 भू-अभिलेख सत्यापित करता है। 15 मार्च 2024 को किए गए नामांतरण प्रविष्टि में पड़ोसी भूखंड धारक के साथ सीमा विवाद की जांच लंबित है। तहसीलदार के समक्ष आपत्ति दर्ज करना आवश्यक है।'
                    : selectedLanguage === 'mr'
                    ? 'हा दस्तऐवज हवेली तालुक्यातील वारसाहक्काच्या शेतजमिनीचा ७/१२ उतारा प्रमाणित करतो. १५ मार्च २०२४ च्या फेरफार नोंदीमध्ये शेजारील जमीनधारकासोबत सीमांकन वाद प्रलंबित आहे. तहसीलदारांकडे ३० दिवसांत हरकत नोंदवणे आवश्यक आहे.'
                    : DEMO_AI_ANALYSIS.summary}
                </div>
              </div>

              {/* Extracted Information: Parties & Statutes */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    Identified Parties
                  </h4>
                  <ul className="space-y-1 text-xs text-slate-700">
                    {DEMO_AI_ANALYSIS.extractedParties.map((party, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        <span>{party}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                    Relevant Statutory Sections
                  </h4>
                  <ul className="space-y-1 text-xs text-slate-700">
                    {DEMO_AI_ANALYSIS.legalSections.map((sec, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        <span>{sec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Risk Indicators Breakdown */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Risk Indicators & Vulnerability Assessment
                </h3>
                <div className="grid sm:grid-cols-3 gap-3">
                  {DEMO_AI_ANALYSIS.riskIndicators.map((risk, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-xl border text-xs space-y-1 ${
                        risk.level === 'HIGH'
                          ? 'bg-rose-50 border-rose-200 text-rose-900'
                          : risk.level === 'MEDIUM'
                          ? 'bg-amber-50 border-amber-200 text-amber-900'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      }`}
                    >
                      <RiskBadge level={risk.level} />
                      <p className="pt-1 text-[11px] leading-relaxed font-medium">
                        {risk.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Next Steps */}
              <div className="p-4 bg-indigo-50/60 border border-indigo-200/80 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                  Recommended Next Actions
                </h4>
                <div className="space-y-2">
                  {DEMO_AI_ANALYSIS.recommendedActions.map((action, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-indigo-950">
                      <span className="w-5 h-5 rounded-full bg-indigo-200 text-indigo-800 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed font-medium">{action}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Communication Panel (Case-specific message thread) ─────── */}
            <CaseMessagingThread
              caseId={caseData.id}
              caseNumber={caseData.caseNumber}
              assignedLawyerName={caseData.lawyerName}
              citizenName={caseData.citizenName || user?.fullName}
              isLawyerAssigned={Boolean(caseData.assignedLawyerId || caseData.lawyerName)}
            />
          </div>

          {/* Right Column (4 cols): Important Dates, Documents & Timeline */}
          <div className="lg:col-span-4 space-y-6">
            {/* Important Dates / Deadlines */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-brand-600" />
                  <h3 className="text-sm font-bold text-slate-900">Statutory Deadlines</h3>
                </div>
                <span className="text-xs bg-red-50 text-red-700 font-bold px-2 py-0.5 rounded-full">
                  {deadlines.length} Due
                </span>
              </div>

              <div className="space-y-3">
                {deadlines.map((dl) => (
                  <div key={dl.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900">{dl.title}</h4>
                      <RiskBadge level={dl.priority} />
                    </div>
                    <p className="text-[11px] text-slate-500">{dl.description}</p>
                    <p className="text-[11px] font-bold text-amber-700 pt-1">
                      Due: {new Date(dl.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Uploaded Documents */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-700" />
                  <h3 className="text-sm font-bold text-slate-900">Case Documents</h3>
                  <span className="text-xs bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-full">
                    {docList.length} Files
                  </span>
                </div>
                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1 shadow-sm"
                  title="Upload New Case Document"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Upload</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {docList.map((doc) => {
                  const status = doc.status || doc.processingStatus || 'COMPLETED';
                  const isProcessing = ['UPLOADED', 'PROCESSING', 'ANALYZING'].includes(status);
                  return (
                    <div
                      key={doc.id}
                      onClick={() => setSelectedViewerDoc(doc)}
                      className="p-3 bg-slate-50 border border-slate-200 hover:border-brand-400 hover:bg-slate-100/70 rounded-xl flex items-center justify-between cursor-pointer transition-all group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 group-hover:bg-brand-500 group-hover:text-white transition-colors">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-bold text-slate-900 truncate group-hover:text-brand-600 transition-colors">
                            {doc.originalName}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500">
                            <span>{((doc.fileSize || doc.fileSizeBytes || 0) / 1024 / 1024).toFixed(2)} MB</span>
                            <span>•</span>
                            <span className={`font-semibold ${
                              status === 'COMPLETED'
                                ? 'text-emerald-600'
                                : status === 'FAILED'
                                ? 'text-rose-600'
                                : 'text-amber-600 flex items-center gap-1'
                            }`}>
                              {isProcessing && <RefreshCw className="w-2.5 h-2.5 animate-spin" />}
                              {status}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedViewerDoc(doc);
                          }}
                          className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-brand-600 hover:border-brand-500 transition-colors"
                          title="View Document & AI Analysis"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Assigned Advocate Profile */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Assigned Advocate</h3>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  Verified
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-brand-500 text-white flex items-center justify-center font-bold text-base shadow-sm">
                  PD
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{lawyer.fullName}</h4>
                  <p className="text-xs text-slate-500 font-mono">Reg: {lawyer.barCouncilNumber}</p>
                  <p className="text-[11px] text-amber-700 font-semibold">⭐ {lawyer.rating} ({lawyer.experienceYears} yrs)</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                {lawyer.bio}
              </p>

              <div className="pt-2 flex flex-col gap-2 text-xs text-slate-600 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{lawyer.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{lawyer.email}</span>
                </div>
              </div>
            </div>

            {/* Case Event Timeline */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Chronological Events</h3>
              <div className="relative pl-5 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {events.map((evt) => (
                  <div key={evt.id} className="relative">
                    <div className="absolute -left-[23px] top-1 w-2.5 h-2.5 rounded-full bg-brand-500" />
                    <div>
                      <p className="text-xs font-bold text-slate-900">{evt.title}</p>
                      <p className="text-[10px] text-slate-500">{new Date(evt.createdAt).toLocaleDateString('en-IN')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

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
          caseId={caseData.id}
          onSuccess={handleUploadSuccess}
        />

        {/* ── Find a Lawyer & Request Legal Advice Modal ── */}
        <FindLawyerModal
          isOpen={isFindLawyerOpen}
          onClose={() => setIsFindLawyerOpen(false)}
          caseId={caseData.id}
          caseTitle={caseData.title}
          initialMode={findLawyerMode}
          onRequestSuccess={(createdReq) => {
            setCaseData((prev: any) => ({
              ...prev,
              status: 'AWAITING_LAWYER',
              assignedLawyerId: createdReq.lawyerId || prev.assignedLawyerId,
              lawyerName: createdReq.lawyerName || prev.lawyerName,
            }));
          }}
        />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-slate-500 text-xs text-center">
        <p>© 2026 NyayaSetu · Case Dossier · Information compiled for legal assistance purposes</p>
      </footer>
    </div>
  );
};
