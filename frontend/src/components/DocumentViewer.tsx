import React, { useState, useEffect } from 'react';
import {
  FileText, Download, CheckCircle2, Clock, AlertTriangle,
  AlertCircle, Sparkles, BookOpen, Calendar,
  RefreshCw, X, ShieldAlert, Eye, FileCode,
  Users, Scale, HelpCircle, UserCheck
} from 'lucide-react';
import { documentApi } from '../lib/api';
import type { DocumentProcessingStatus } from '../types/domain';
import { useLanguage } from '../contexts/LanguageContext';
import { LanguageSelector } from './LanguageSelector';

interface DocumentViewerProps {
  documentId: string;
  initialData?: {
    originalName: string;
    fileSizeBytes: number;
    mimeType: string;
    processingStatus: DocumentProcessingStatus;
    detectedLanguage?: string;
    extractedText?: string;
    createdAt?: string;
    analysis?: any;
  };
  onClose?: () => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  documentId,
  initialData,
  onClose,
}) => {
  const { currentLanguage, t } = useLanguage();
  const [doc, setDoc] = useState<any>(initialData || null);
  const [loading, setLoading] = useState<boolean>(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'analysis' | 'text' | 'metadata'>('analysis');
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  // Poll for status updates if document is actively processing
  useEffect(() => {
    let intervalId: any = null;

    const fetchStatus = async () => {
      try {
        const res = await documentApi.getStatus(documentId, currentLanguage);
        setDoc((prev: any) => ({
          ...prev,
          ...res,
        }));

        // If completed or failed, stop polling and load full details
        if (res.processingStatus === 'COMPLETED' || res.processingStatus === 'FAILED') {
          if (intervalId) clearInterval(intervalId);
          // Fetch full doc to get extractedText if not already loaded
          const full = await documentApi.getById(documentId, currentLanguage);
          setDoc(full);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch document status');
        if (intervalId) clearInterval(intervalId);
      } finally {
        setLoading(false);
      }
    };

    if (documentId.startsWith('demo-')) {
      setLoading(false);
      return;
    }

    fetchStatus();

    // Set polling if processing
    if (!doc || doc.processingStatus === 'UPLOADED' || doc.processingStatus === 'PROCESSING' || doc.processingStatus === 'ANALYZING') {
      intervalId = setInterval(fetchStatus, 2000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [documentId, currentLanguage, doc?.processingStatus]);

  const handleDownload = async () => {
    if (!doc) return;
    if (documentId.startsWith('demo-')) {
      alert(`Demo download: Simulated secure retrieval of ${doc.originalName || 'document'}`);
      return;
    }
    setIsDownloading(true);
    try {
      await documentApi.download(documentId, doc.originalName || 'document.pdf');
    } catch (err: any) {
      alert(`Download failed: ${err.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const getStatusBadge = (status: DocumentProcessingStatus) => {
    switch (status) {
      case 'UPLOADED':
        return (
          <span className="badge bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3.5 h-3.5 animate-pulse" />
            Uploaded & Queued
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="badge bg-amber-50 text-amber-700 border border-amber-200">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            Extracting Text...
          </span>
        );
      case 'ANALYZING':
        return (
          <span className="badge bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Sparkles className="w-3.5 h-3.5 animate-bounce" />
            AI Comprehension Running...
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Analysis Completed
          </span>
        );
      case 'FAILED':
        return (
          <span className="badge bg-red-50 text-red-700 border border-red-200">
            <AlertCircle className="w-3.5 h-3.5" />
            Processing Failed
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden flex flex-col max-w-4xl w-full mx-auto animate-fade-in">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-brand-900 to-indigo-950 text-white p-6 flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-300">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {doc?.originalName || 'Legal Document Dossier'}
              </h2>
              <p className="text-xs text-slate-300">
                {doc?.fileSizeBytes ? `${(doc.fileSizeBytes / 1024 / 1024).toFixed(2)} MB` : ''} · {doc?.mimeType || 'Document'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {doc?.processingStatus && getStatusBadge(doc.processingStatus)}
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              title="Close Viewer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* ── Processing Pipeline Stepper ─────────────────────────────────────── */}
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          {[
            { label: 'Uploaded', key: 'UPLOADED', active: true },
            {
              label: 'Text Extracted',
              key: 'PROCESSING',
              active: doc?.processingStatus === 'PROCESSING' || doc?.processingStatus === 'ANALYZING' || doc?.processingStatus === 'COMPLETED',
            },
            {
              label: 'AI Analyzed',
              key: 'ANALYZING',
              active: doc?.processingStatus === 'ANALYZING' || doc?.processingStatus === 'COMPLETED',
            },
            {
              label: 'Ready for Review',
              key: 'COMPLETED',
              active: doc?.processingStatus === 'COMPLETED',
            },
          ].map((step, idx) => (
            <div
              key={step.key}
              className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                step.active
                  ? 'bg-white border-brand-500/30 text-brand-900 shadow-sm font-semibold'
                  : 'bg-slate-100/60 border-slate-200 text-slate-400'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  step.active ? 'bg-brand-500 text-white' : 'bg-slate-200 text-slate-500'
                }`}
              >
                {idx + 1}
              </div>
              <span className="text-[11px] truncate">{step.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tab Navigation ─────────────────────────────────────────────────── */}
      <div className="flex border-b border-slate-200 px-6 gap-4 text-xs font-semibold bg-white">
        <button
          onClick={() => setActiveTab('analysis')}
          className={`py-3.5 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'analysis'
              ? 'border-brand-500 text-brand-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Legal Comprehension</span>
        </button>
        <button
          onClick={() => setActiveTab('text')}
          className={`py-3.5 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'text'
              ? 'border-brand-500 text-brand-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>Extracted Text</span>
        </button>
        <button
          onClick={() => setActiveTab('metadata')}
          className={`py-3.5 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'metadata'
              ? 'border-brand-500 text-brand-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Document Metadata</span>
        </button>
      </div>

      {/* ── Content Body ────────────────────────────────────────────────────── */}
      <div className="p-6 overflow-y-auto max-h-[600px] space-y-6 flex-1">
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <RefreshCw className="w-8 h-8 text-brand-500 animate-spin" />
            <p className="text-sm font-semibold text-slate-600">Retrieving document records...</p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-center gap-3 text-xs">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab 1: AI Legal Comprehension */}
        {activeTab === 'analysis' && doc?.analysis && (() => {
          const analysis = doc.analysis;
          const keyEntities = analysis.key_entities || analysis.keyEntities || {};
          const parties = Array.isArray(keyEntities.parties) ? keyEntities.parties : [];
          const claims = Array.isArray(keyEntities.claims) ? keyEntities.claims : [];
          const missingInfo = Array.isArray(keyEntities.missingInformation) ? keyEntities.missingInformation : [];
          const professionalReviewRecommended = keyEntities.professionalReviewRecommended !== false;
          const docType = analysis.document_type || analysis.documentType || 'Legal Document';
          const provider = keyEntities.provider || analysis.provider || 'AI Engine';
          const rawSteps = analysis.suggested_next_steps || analysis.suggestedNextSteps;
          const dynamicSteps = Array.isArray(rawSteps) && rawSteps.length > 0 ? rawSteps : null;

          return (
            <div className="space-y-6 animate-fade-in">
              {/* Multilingual Selector Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex flex-wrap items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand-600" />
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">{t('ai.title')}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {docType}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {Math.round((analysis.confidence_score || analysis.confidenceScore || 0.9) * 100)}% {t('ai.confidence')}
                  </span>
                  {provider && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      {provider.includes('gemini') ? '⚡ Google Gemini 2.0 Flash' : '🔍 Heuristic Analysis'}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 font-medium">{t('nav.language')}:</span>
                  <LanguageSelector variant="pills" />
                </div>
              </div>

              {/* Legal Safety Notice */}
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
                <ShieldAlert className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-900 leading-relaxed">
                  <strong>Legal Safety Notice:</strong> {t('ai.disclaimer')}
                </p>
              </div>

              {/* Plain Language Summary */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                  <span>{t('ai.summaryTitle')}</span>
                  <span className="text-[10px] text-slate-400 font-mono lowercase">
                    ({currentLanguage})
                  </span>
                </h3>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-sm text-slate-800 leading-relaxed font-sans">
                  {currentLanguage === 'hi'
                    ? (analysis.plain_language_summary_hi ||
                       (doc.id?.startsWith('demo-')
                         ? 'यह दस्तावेज़ हवेली तालुका में पुश्तैनी कृषि भूमि का 7/12 भू-अभिलेख सत्यापित करता है। 15 मार्च 2024 को किए गए नामांतरण प्रविष्टि में पड़ोसी भूखंड धारक के साथ सीमा विवाद की जांच लंबित है। तहसीलदार के समक्ष आपत्ति दर्ज करना आवश्यक है।'
                         : (analysis.plain_language_summary || analysis.plainLanguageSummary || analysis.summary)))
                    : currentLanguage === 'mr'
                    ? (analysis.plain_language_summary_mr ||
                       (doc.id?.startsWith('demo-')
                         ? 'हा दस्तऐवज हवेली तालुक्यातील वारसाहक्काच्या शेतजमिनीचा ७/१२ उतारा प्रमाणित करतो. १५ मार्च २०२४ च्या फेरफार नोंदीमध्ये शेजारील जमीनधारकासोबत सीमांकन वाद प्रलंबित आहे. तहसीलदारांकडे ३० दिवसांत हरकत नोंदवणे आवश्यक आहे.'
                         : (analysis.plain_language_summary || analysis.plainLanguageSummary || analysis.summary)))
                    : (analysis.plain_language_summary || analysis.plainLanguageSummary || analysis.summary)}
                </div>
              </div>

              {/* Identified Parties */}
              {parties.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-brand-600" />
                    <span>{t('ai.partiesTitle')}</span>
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-2.5">
                    {parties.map((p: any, idx: number) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{p.name || 'Unnamed Party'}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-50 text-brand-700 border border-brand-200">
                            {p.role || 'Participant'}
                          </span>
                        </div>
                        {p.sourceReference && (
                          <p className="text-[10px] text-slate-500 italic mt-0.5 line-clamp-2">
                            "{p.sourceReference}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Claims & Key Assertions */}
              {claims.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-brand-600" />
                    <span>Key Claims & Allegations</span>
                  </h3>
                  <div className="space-y-2">
                    {claims.map((claim: any, idx: number) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                        <p className="text-slate-800 font-medium">
                          {typeof claim === 'string' ? claim : (claim.description || JSON.stringify(claim))}
                        </p>
                        {claim?.sourceReference && (
                          <p className="text-[10px] text-slate-500 italic mt-1 line-clamp-2">
                            Reference: "{claim.sourceReference}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Critical Dates & Deadlines */}
              {analysis.critical_dates && analysis.critical_dates.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-brand-600" />
                    {t('ai.datesTitle')}
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-2.5">
                    {analysis.critical_dates.map((d: any, idx: number) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold font-mono text-brand-600">{d.date}</p>
                          {d.urgency && (
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                              d.urgency === 'HIGH' ? 'bg-red-100 text-red-800' : 'bg-slate-200 text-slate-700'
                            }`}>
                              {d.urgency}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600">
                          {currentLanguage === 'hi' && d.description?.includes('transaction')
                            ? 'दस्तावेज़ जारी / लेनदेन की तारीख'
                            : currentLanguage === 'mr' && d.description?.includes('transaction')
                            ? 'दस्तऐवज जारी / व्यवहाराची तारीख'
                            : d.description}
                        </p>
                        {d.reference && (
                          <p className="text-[10px] text-slate-400 italic">"{d.reference}"</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Evidence-Based Risk Indicators */}
              {analysis.risk_indicators && analysis.risk_indicators.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    {t('ai.risksTitle')}
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-2.5">
                    {analysis.risk_indicators.map((r: any, idx: number) => {
                      const levelLabel = t(`risk.${(r.level || 'medium').toLowerCase()}`) || `${r.level} Risk`;
                      const descriptionText =
                        currentLanguage === 'hi'
                          ? (r.description?.includes('Boundary')
                              ? 'सीमा या स्वामित्व अतिव्याप्ति का उल्लेख है। संयुक्त सर्वेक्षण या स्थल निरीक्षण आवश्यक हो सकता है।'
                              : r.description?.includes('Pending')
                              ? 'कार्यवाही में लंबित आपत्ति दर्ज है। राजस्व प्राधिकारी से निर्धारित सुनवाई तिथि की पुष्टि करें।'
                              : r.description)
                          : currentLanguage === 'mr'
                          ? (r.description?.includes('Boundary')
                              ? 'हद्द किंवा मालकी अतिव्यापनाचा उल्लेख आहे. संयुक्त मोजणी किंवा प्रत्यक्ष पाहणी आवश्यक ठरू शकते.'
                              : r.description?.includes('Pending')
                              ? 'कार्यवाहीत प्रलंबित हरकत नोंदवली आहे. महसूल प्राधिकरणाकडे नियोजित सुनावणीची तारीख तपासा.'
                              : r.description)
                          : r.description;

                      return (
                        <div
                          key={idx}
                          className={`p-3 rounded-xl border text-xs ${
                            r.level === 'HIGH'
                              ? 'bg-rose-50 border-rose-200 text-rose-900'
                              : r.level === 'MEDIUM'
                              ? 'bg-amber-50 border-amber-200 text-amber-900'
                              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[10px] px-2 py-0.5 rounded-full bg-white/70 uppercase">
                              {levelLabel}
                            </span>
                          </div>
                          <p className="mt-1 font-medium leading-relaxed">{descriptionText}</p>
                          {r.sourceReference && (
                            <p className="mt-1 text-[10px] opacity-75 italic">Ref: "{r.sourceReference}"</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Missing Information / Ambiguities */}
              {missingInfo.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Missing Critical Information & Ambiguities</span>
                  </h3>
                  <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200/80 space-y-1.5">
                    {missingInfo.map((item: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-amber-950">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                        <span className="font-medium">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Next Steps / Required Actions */}
              <div className="p-4 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                  <span>{t('ai.nextStepsTitle')} ({t('ai.actionsTitle')})</span>
                </h4>
                <div className="space-y-2">
                  {(dynamicSteps || (currentLanguage === 'hi'
                    ? [
                        'इस सत्यापित सारांश को NyayaSetu पर अपने नियुक्त अधिवक्ता के साथ साझा करें।',
                        'सक्षम प्राधिकारी से मूल भू-राजस्व उद्धरण या नोटिस की प्रमाणित भौतिक प्रतियां प्राप्त करें।',
                        'रसीदों, नामांतरण चालानों और संबंधित पत्राचार का व्यवस्थित रिकॉर्ड बनाए रखें।',
                      ]
                    : currentLanguage === 'mr'
                    ? [
                        'हा प्रमाणित सारांश NyayaSetu वरील आपल्या नियुक्त वकिलांसोबत सामायिक करा.',
                        'सक्षम प्राधिकरणाकडून मूळ महसूल उतारे किंवा नोटीसच्या प्रमाणित भौतिक प्रती मिळवा.',
                        'पावत्या, फेरफार चलन आणि संबंधित पत्रव्यवहाराचा व्यवस्थित संच तयार ठेवा.',
                      ]
                    : [
                        'Share this verified summary with your assigned advocate on NyayaSetu.',
                        'Obtain certified physical copies of the original land revenue extracts or notices from the issuing authority.',
                        'Maintain an organized docket of receipts, mutation challans, and related correspondence.',
                      ]
                  )).map((step: string, i: number) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-indigo-950">
                      <span className="w-5 h-5 rounded-full bg-indigo-200 text-indigo-800 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed font-medium">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Applicable Acts & Sections */}
              {analysis.applicable_acts_or_sections && analysis.applicable_acts_or_sections.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                    {t('ai.statutesTitle')}
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-2.5">
                    {analysis.applicable_acts_or_sections.map((act: any, idx: number) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                        <p className="font-bold text-slate-900">{act.act}</p>
                        <p className="text-[11px] text-indigo-700 font-semibold">{act.section}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{act.relevance}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Professional Advocate Review Callout */}
              {professionalReviewRecommended && (
                <div className="p-4 bg-emerald-50/80 border border-emerald-200/90 rounded-2xl flex items-start gap-3">
                  <UserCheck className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-emerald-950 space-y-1">
                    <p className="font-bold">Professional Advocate Review Recommended</p>
                    <p className="text-emerald-800 leading-relaxed">
                      This document contains formal legal obligations or procedural deadlines. We strongly recommend having your verified NyayaSetu advocate review these findings before taking binding legal actions.
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* In-progress analysis banner if processing */}
        {activeTab === 'analysis' && (!doc?.analysis || doc.processingStatus !== 'COMPLETED') && (
          <div className="p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <RefreshCw className="w-6 h-6 animate-spin" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">AI Comprehension in Progress</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Your document has been securely stored and text has been queued for analysis. The plain-language summary will appear here automatically once ready.
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Extracted Text */}
        {activeTab === 'text' && (
          <div className="space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Extracted Text Contents
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">
                {doc?.extractedText ? `${doc.extractedText.length} characters` : '0 characters'}
              </span>
            </div>
            <pre className="p-4 bg-slate-900 text-slate-200 text-xs rounded-2xl font-mono whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
              {doc?.extractedText || 'No text extracted yet or extraction in progress.'}
            </pre>
          </div>
        )}

        {/* Tab 3: Metadata */}
        {activeTab === 'metadata' && (
          <div className="grid sm:grid-cols-2 gap-4 text-xs animate-fade-in">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-400">Original Filename</span>
              <p className="font-bold text-slate-900">{doc?.originalName}</p>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-400">MIME Format</span>
              <p className="font-bold text-slate-900 font-mono">{doc?.mimeType}</p>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-400">File Size</span>
              <p className="font-bold text-slate-900">
                {doc?.fileSizeBytes ? `${(doc.fileSizeBytes / 1024 / 1024).toFixed(2)} MB (${doc.fileSizeBytes} bytes)` : '-'}
              </p>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-400">Detected Language</span>
              <p className="font-bold text-brand-600 uppercase font-mono">{doc?.detectedLanguage || 'English (Default)'}</p>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-400">Upload Date</span>
              <p className="font-bold text-slate-900">
                {doc?.createdAt ? new Date(doc.createdAt).toLocaleString('en-IN') : '-'}
              </p>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-400">Security Classification</span>
              <p className="font-bold text-emerald-700">Encrypted Private Storage (Restricted Access)</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Footer Actions ──────────────────────────────────────────────────── */}
      <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between">
        <span className="text-xs text-slate-500">
          Privileged Legal Document Repository
        </span>

        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="btn-primary text-xs flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{isDownloading ? 'Downloading...' : 'Download Stored File'}</span>
        </button>
      </div>
    </div>
  );
};
