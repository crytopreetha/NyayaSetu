import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle2, User, Send,
  Sparkles, MessageSquare, BookOpen, Eye, FileText
} from 'lucide-react';
import {
  DEMO_CITIZEN_CASES, DEMO_DOCUMENTS, DEMO_DEADLINES,
  DEMO_CASE_EVENTS, DEMO_AI_ANALYSIS, DEMO_MESSAGES
} from '../lib/mockData';
import { StatusBadge, RiskBadge, DemoBadge } from '../components/ui';
import type { Message, CaseStatus } from '../types/domain';
import { useAuth } from '../contexts/AuthContext';
import { DocumentViewer } from '../components/DocumentViewer';
import { LanguageSelector } from '../components/LanguageSelector';

export const LawyerCaseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  // Find case or fallback
  const initialCase =
    DEMO_CITIZEN_CASES.find((c) => c.id === id) || DEMO_CITIZEN_CASES[0];

  const [currentStatus, setCurrentStatus] = useState<CaseStatus>(initialCase.status);
  const [statusUpdatedAlert, setStatusUpdatedAlert] = useState(false);

  const documents = DEMO_DOCUMENTS.filter((d) => d.caseId === initialCase.id);
  const deadlines = DEMO_DEADLINES.filter((dl) => dl.caseId === initialCase.id);
  const events = DEMO_CASE_EVENTS.filter((e) => e.caseId === initialCase.id);

  const [selectedViewerDoc, setSelectedViewerDoc] = useState<any | null>(null);

  // Advocate private notes
  const [advocateNotes, setAdvocateNotes] = useState(
    'Initial assessment: Boundary demarcation dispute under Section 150 of Maharashtra Land Revenue Code. Recommend filing interim stay application before Tahsildar.'
  );
  const [notesSaved, setNotesSaved] = useState(false);

  // Messaging
  const [messages, setMessages] = useState<Message[]>(DEMO_MESSAGES);
  const [replyText, setReplyText] = useState('');

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    const msg: Message = {
      id: `msg-${Date.now()}`,
      caseId: initialCase.id,
      senderId: user?.id || 'demo-lawyer-1',
      senderName: user?.fullName || 'Adv. Priya Deshmukh',
      senderRole: 'LAWYER',
      content: replyText.trim(),
      createdAt: new Date().toISOString(),
    };

    setMessages([...messages, msg]);
    setReplyText('');
  };

  const handleUpdateStatus = (newStatus: CaseStatus) => {
    setCurrentStatus(newStatus);
    setStatusUpdatedAlert(true);
    setTimeout(() => setStatusUpdatedAlert(false), 3000);
  };

  const handleSaveNotes = () => {
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      <div className="saffron-line w-full" />

      {/* Header */}
      <header className="bg-slate-950/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/lawyer/dashboard"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Advocate Workspace</span>
            </Link>
            <div className="h-4 w-px bg-slate-800" />
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold bg-slate-800 text-indigo-300 px-2.5 py-1 rounded">
                {initialCase.caseNumber}
              </span>
              <StatusBadge status={currentStatus} />
              {initialCase.riskLevel && <RiskBadge level={initialCase.riskLevel} />}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <LanguageSelector variant="dropdown" />
            <DemoBadge />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8 flex-1">
        {/* Status update notification banner */}
        {statusUpdatedAlert && (
          <div className="bg-emerald-950/60 border border-emerald-700 text-emerald-300 px-4 py-3 rounded-2xl flex items-center gap-2 text-xs font-semibold animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Case status successfully updated to {currentStatus}. Client notified.</span>
          </div>
        )}

        {/* Top Banner & Status Controls */}
        <div className="bg-slate-800/80 rounded-3xl border border-slate-700/80 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {initialCase.category.replace('_', ' ')}
                </span>
                <span className="text-xs text-slate-400">
                  Dispute File · Lodged {new Date(initialCase.createdAt).toLocaleDateString('en-IN')}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                {initialCase.title}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-4xl leading-relaxed">
                {initialCase.description}
              </p>
            </div>

            {/* Advocate Case Status Controls */}
            <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-4 flex flex-col gap-2 min-w-[240px]">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                Advocate Status Controls
              </span>
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                {(['IN_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as CaseStatus[]).map((st) => (
                  <button
                    key={st}
                    onClick={() => handleUpdateStatus(st)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      currentStatus === st
                        ? 'bg-indigo-600 text-white shadow'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-750 hover:text-white'
                    }`}
                  >
                    {st.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 2-Column Grid */}
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Left Column (8 cols): Citizen Details, AI Extracted Information, Communication */}
          <div className="lg:col-span-8 space-y-8">
            {/* Citizen Client Information */}
            <div className="bg-slate-800/80 rounded-3xl border border-slate-700/80 p-6 space-y-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-400" />
                Citizen Client Particulars
              </h2>

              <div className="grid sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/60 space-y-1">
                  <span className="text-slate-400">Client Full Name</span>
                  <p className="font-bold text-white text-sm">{initialCase.citizenName || 'Rajesh Sharma'}</p>
                </div>
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/60 space-y-1">
                  <span className="text-slate-400">Contact Number</span>
                  <p className="font-bold text-white text-sm">+91 98230 11223</p>
                </div>
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/60 space-y-1">
                  <span className="text-slate-400">Primary Language</span>
                  <p className="font-bold text-amber-300 text-sm">Marathi / English</p>
                </div>
              </div>
            </div>

            {/* AI Legal Extraction Dossier */}
            <div className="bg-slate-800/80 rounded-3xl border border-slate-700/80 p-6 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center">
                    <Sparkles className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">AI Legal Analysis & Statutory Extraction</h3>
                    <p className="text-[11px] text-slate-400">Automated pre-processing from submitted land revenue records</p>
                  </div>
                </div>
                <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-mono">
                  Confidence 82%
                </span>
              </div>

              {/* Legal Sections */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Relevant Statutes & Provisions
                </h4>
                <div className="grid sm:grid-cols-2 gap-2">
                  {DEMO_AI_ANALYSIS.legalSections.map((sec, i) => (
                    <div key={i} className="p-3 bg-slate-900/70 border border-slate-700 rounded-xl text-xs text-indigo-300 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                      <span>{sec}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Extracted Dates */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Extracted Limitation & Critical Dates
                </h4>
                <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Significance / Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {DEMO_AI_ANALYSIS.extractedDates.map((d, i) => (
                        <tr key={i}>
                          <td className="py-2.5 px-3 font-mono font-bold text-amber-400">{d.date}</td>
                          <td className="py-2.5 px-3">{d.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Risk Flags */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Identified Legal Vulnerabilities
                </h4>
                <div className="space-y-2">
                  {DEMO_AI_ANALYSIS.riskIndicators.map((r, i) => (
                    <div key={i} className="p-3 rounded-xl bg-slate-900/80 border border-slate-700 flex items-center justify-between text-xs">
                      <span className="text-slate-200">{r.description}</span>
                      <RiskBadge level={r.level} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Communication Panel */}
            <div className="bg-slate-800/80 rounded-3xl border border-slate-700/80 p-6 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                <div className="flex items-center gap-2.5">
                  <MessageSquare className="w-5 h-5 text-indigo-400" />
                  <div>
                    <h3 className="font-bold text-white text-sm">Direct Client Communication</h3>
                    <p className="text-[11px] text-slate-400">Live dialogue with {initialCase.citizenName || 'Rajesh Sharma'}</p>
                  </div>
                </div>
              </div>

              {/* Messages feed */}
              <div className="space-y-3 max-h-80 overflow-y-auto p-1">
                {messages.map((m) => {
                  const isLawyer = m.senderRole === 'LAWYER';
                  return (
                    <div key={m.id} className={`flex flex-col ${isLawyer ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-1.5 mb-1 text-[11px] text-slate-400">
                        <span className="font-semibold text-slate-200">{m.senderName}</span>
                        <span>·</span>
                        <span>{new Date(m.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div
                        className={`p-3.5 rounded-2xl max-w-lg text-xs leading-relaxed ${
                          isLawyer
                            ? 'bg-indigo-600 text-white rounded-tr-none'
                            : 'bg-slate-900 text-slate-200 rounded-tl-none border border-slate-700'
                        }`}
                      >
                        {m.content}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Send response */}
              <form onSubmit={handleSendReply} className="flex gap-2 pt-2">
                <input
                  type="text"
                  placeholder="Draft advocate instructions to citizen..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="btn-primary text-xs flex items-center gap-1.5 px-4"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          </div>

          {/* Right Column (4 cols): Documents Review, Notes, Deadlines */}
          <div className="lg:col-span-4 space-y-6">
            {/* Private Advocate Notes */}
            <div className="bg-slate-800/80 rounded-3xl border border-slate-700/80 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Private Advocate Case Notes</h3>
                {notesSaved && (
                  <span className="text-[10px] text-emerald-400 font-bold">Saved ✓</span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">Confidential internal notes (never visible to citizen client)</p>

              <textarea
                rows={5}
                value={advocateNotes}
                onChange={(e) => setAdvocateNotes(e.target.value)}
                className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white resize-none focus:outline-none focus:border-indigo-500"
              />

              <button
                onClick={handleSaveNotes}
                className="w-full btn-primary text-xs py-2"
              >
                Save Notes
              </button>
            </div>

            {/* Document Review List */}
            <div className="bg-slate-800/80 rounded-3xl border border-slate-700/80 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Uploaded Documents ({documents.length})</h3>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded">
                  Verified
                </span>
              </div>

              <div className="space-y-2.5">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedViewerDoc(doc)}
                    className="p-3 bg-slate-900 border border-slate-700 hover:border-indigo-500 rounded-xl flex items-center justify-between cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div className="w-8 h-8 rounded-lg bg-slate-800 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center flex-shrink-0 transition-colors">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-bold text-white truncate group-hover:text-indigo-300 transition-colors">{doc.originalName}</p>
                        <p className="text-[10px] text-slate-400">{(doc.fileSize / 1024 / 1024).toFixed(1)} MB · Analyzed</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedViewerDoc(doc);
                        }}
                        className="p-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:text-white hover:border-indigo-500 transition-colors"
                        title="View Document Details & AI Insights"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Procedural Deadlines */}
            <div className="bg-slate-800/80 rounded-3xl border border-slate-700/80 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Procedural Deadlines</h3>
                <span className="text-xs bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded font-bold">
                  {deadlines.length}
                </span>
              </div>

              <div className="space-y-3">
                {deadlines.map((dl) => (
                  <div key={dl.id} className="p-3 bg-slate-900 border border-slate-700 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white">{dl.title}</h4>
                      <RiskBadge level={dl.priority} />
                    </div>
                    <p className="text-[10px] text-slate-400">{dl.description}</p>
                    <p className="text-[11px] font-bold text-amber-400 pt-1">
                      Due: {new Date(dl.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-slate-800/80 rounded-3xl border border-slate-700/80 p-6 space-y-4">
              <h3 className="text-sm font-bold text-white">Case Timeline</h3>
              <div className="relative pl-5 space-y-3 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-700">
                {events.map((evt) => (
                  <div key={evt.id} className="relative">
                    <div className="absolute -left-[23px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    <div>
                      <p className="text-xs font-bold text-white">{evt.title}</p>
                      <p className="text-[10px] text-slate-400">{new Date(evt.createdAt).toLocaleDateString('en-IN')}</p>
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
      </main>

      <footer className="bg-slate-950 border-t border-slate-800 py-6 mt-12 text-slate-500 text-xs text-center">
        <p>© 2026 NyayaSetu Advocate Case Management · Privileged Attorney-Client Communication</p>
      </footer>
    </div>
  );
};
