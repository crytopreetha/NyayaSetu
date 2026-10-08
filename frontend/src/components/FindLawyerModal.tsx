import React, { useState, useEffect } from 'react';
import {
  X, ShieldCheck, MapPin, Award,
  CheckCircle2, AlertCircle, RefreshCw, Star,
  Languages, UserCheck, Send
} from 'lucide-react';
import { lawyerApi, assistanceRequestApi } from '../lib/api';
import { DEMO_LAWYER_PROFILES } from '../lib/mockData';

interface FindLawyerModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId: string;
  caseTitle: string;
  initialMode?: 'FIND' | 'ADVICE';
  onRequestSuccess?: (createdRequest: any) => void;
}

export const FindLawyerModal: React.FC<FindLawyerModalProps> = ({
  isOpen,
  onClose,
  caseId,
  caseTitle,
  initialMode = 'FIND',
  onRequestSuccess,
}) => {
  // Filter states
  const [specialization, setSpecialization] = useState<string>('ALL');
  const [locationSearch, setLocationSearch] = useState<string>('');
  const [language, setLanguage] = useState<string>('ALL');
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(true);
  const [onlyVerified, setOnlyVerified] = useState<boolean>(true);

  // Data states
  const [lawyers, setLawyers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Selected lawyer & request dialog state
  const [selectedLawyer, setSelectedLawyer] = useState<any | null>(null);
  const [requestType, setRequestType] = useState<'LEGAL_ADVICE' | 'CASE_REPRESENTATION'>(
    initialMode === 'ADVICE' ? 'LEGAL_ADVICE' : 'CASE_REPRESENTATION'
  );
  const [requestMessage, setRequestMessage] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);

  // Fetch lawyers when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const fetchLawyers = async () => {
      setLoading(true);
      setError(null);
      try {
        const filters: any = {};
        if (specialization !== 'ALL') filters.specialization = specialization;
        if (locationSearch.trim()) filters.city = locationSearch.trim();
        if (language !== 'ALL') filters.language = language;
        if (onlyAvailable) filters.isAvailable = true;
        if (onlyVerified) filters.status = 'VERIFIED';

        const res = await lawyerApi.list(filters);
        if (res && res.length > 0) {
          setLawyers(res);
        } else {
          // Fallback to mock profiles for rich demo experience
          setLawyers(DEMO_LAWYER_PROFILES);
        }
      } catch (err: any) {
        console.warn('Could not fetch lawyers from API, using demo profiles:', err);
        setLawyers(DEMO_LAWYER_PROFILES);
      } finally {
        setLoading(false);
      }
    };

    fetchLawyers();
  }, [isOpen, specialization, locationSearch, language, onlyAvailable, onlyVerified]);

  if (!isOpen) return null;

  // Filter in-memory for demo / API results
  const filteredLawyers = lawyers.filter((l) => {
    const specs = Array.isArray(l.specialization) ? l.specialization : [];
    const langs = Array.isArray(l.languages_spoken) ? l.languages_spoken : l.languages || [];
    const city = l.city || '';
    const state = l.state || '';

    if (specialization !== 'ALL' && !specs.some((s: string) => s.toLowerCase().includes(specialization.toLowerCase()))) {
      return false;
    }
    if (locationSearch.trim()) {
      const q = locationSearch.toLowerCase();
      if (!city.toLowerCase().includes(q) && !state.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (language !== 'ALL' && !langs.includes(language)) {
      return false;
    }
    if (onlyAvailable && l.is_available === false) {
      return false;
    }
    if (onlyVerified && l.verification_status !== 'VERIFIED' && l.verificationStatus !== 'VERIFIED') {
      return false;
    }
    return true;
  });

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      let createdRequest: any;
      if (caseId.startsWith('demo-')) {
        // Simulated request for demo case
        createdRequest = {
          id: `req-${Date.now()}`,
          caseId,
          lawyerId: selectedLawyer?.id || null,
          requestType,
          status: 'NEW',
          message: requestMessage,
          createdAt: new Date().toISOString(),
          lawyerName: selectedLawyer?.full_name || selectedLawyer?.fullName,
          lawyerBarId: selectedLawyer?.bar_council_number || selectedLawyer?.barCouncilNumber,
        };
      } else {
        const res = await assistanceRequestApi.create(caseId, {
          lawyerId: selectedLawyer?.id || null,
          requestType,
          message: requestMessage,
        });
        createdRequest = res;
      }

      setSubmitSuccess(true);
      if (onRequestSuccess) {
        onRequestSuccess(createdRequest);
      }

      setTimeout(() => {
        onClose();
        setSubmitSuccess(false);
        setSelectedLawyer(null);
        setRequestMessage('');
      }, 1500);
    } catch (err: any) {
      setError(err?.message || 'Failed to submit assistance request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* ── Modal Header ─────────────────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-brand-900 to-indigo-950 text-white p-6 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-mono text-xs font-bold uppercase tracking-wider">
                NyayaSetu Advocate Directory
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span className="text-xs text-slate-300">Bar Council Verified</span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">
              Find Legal Representation for Your Case
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Case: <strong className="text-white">{caseTitle}</strong>
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Filter Bar ────────────────────────────────────────────────────── */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Specialization Filter */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                Specialization
              </label>
              <select
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                className="w-full text-xs font-medium rounded-xl border border-slate-200 bg-white p-2.5 focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                <option value="ALL">All Specializations</option>
                <option value="Land">Land & Revenue Law (7/12, Mutation)</option>
                <option value="Property">Property & Title Disputes</option>
                <option value="Civil">Civil Litigation</option>
                <option value="Family">Family & Matrimonial Law</option>
                <option value="Consumer">Consumer Protection</option>
                <option value="Criminal">Criminal Defense</option>
                <option value="Labour">Labour & Industrial Law</option>
              </select>
            </div>

            {/* Location Search */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                Location (City / State)
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="e.g. Pune, Mumbai, Haveli..."
                  value={locationSearch}
                  onChange={(e) => setLocationSearch(e.target.value)}
                  className="w-full text-xs font-medium rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2.5 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Language Filter */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                Consultation Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full text-xs font-medium rounded-xl border border-slate-200 bg-white p-2.5 focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                <option value="ALL">Any Language</option>
                <option value="hi">Hindi (हिन्दी)</option>
                <option value="mr">Marathi (मराठी)</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>

          {/* Quick Toggles */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs text-slate-700">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlyAvailable}
                  onChange={(e) => setOnlyAvailable(e.target.checked)}
                  className="rounded text-brand-600 focus:ring-brand-500"
                />
                <span className="font-semibold text-slate-700">Available for New Matters</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlyVerified}
                  onChange={(e) => setOnlyVerified(e.target.checked)}
                  className="rounded text-brand-600 focus:ring-brand-500"
                />
                <span className="font-semibold text-slate-700">Verified Advocates Only</span>
              </label>
            </div>

            <span className="text-[11px] font-mono font-bold text-slate-500">
              {filteredLawyers.length} advocate{filteredLawyers.length === 1 ? '' : 's'} available
            </span>
          </div>
        </div>

        {/* ── Modal Body ────────────────────────────────────────────────────── */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-center gap-3 text-xs">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {submitSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-3 text-xs font-semibold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>Assistance request submitted successfully! Case status updated to AWAITING_LAWYER.</span>
            </div>
          )}

          {/* Request Submission Form (When a lawyer is selected) */}
          {selectedLawyer ? (
            <form onSubmit={handleSubmitRequest} className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-5 space-y-4 animate-fade-in">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                    Selected Legal Advocate
                  </span>
                  <h3 className="text-base font-bold text-indigo-950">
                    Adv. {selectedLawyer.full_name || selectedLawyer.fullName}
                  </h3>
                  <p className="text-xs text-indigo-800">
                    {selectedLawyer.bar_council_number || selectedLawyer.barCouncilNumber} · {selectedLawyer.city}, {selectedLawyer.state}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedLawyer(null)}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-900 underline"
                >
                  Change Advocate
                </button>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Type of Assistance
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setRequestType('LEGAL_ADVICE')}
                    className={`p-3 rounded-xl border text-left font-semibold transition-all ${
                      requestType === 'LEGAL_ADVICE'
                        ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block font-bold">Request Legal Advice</span>
                    <span className={`text-[10px] block mt-0.5 ${requestType === 'LEGAL_ADVICE' ? 'text-brand-100' : 'text-slate-500'}`}>
                      Review dossier & provide preliminary guidance
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRequestType('CASE_REPRESENTATION')}
                    className={`p-3 rounded-xl border text-left font-semibold transition-all ${
                      requestType === 'CASE_REPRESENTATION'
                        ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block font-bold">Formal Representation</span>
                    <span className={`text-[10px] block mt-0.5 ${requestType === 'CASE_REPRESENTATION' ? 'text-brand-100' : 'text-slate-500'}`}>
                      Draft notices, represent before revenue/court authority
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Message for Advocate (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe your primary concern or upcoming date..."
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  className="w-full text-xs font-medium rounded-xl border border-slate-200 p-3 bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedLawyer(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 text-xs font-bold bg-brand-600 text-white hover:bg-brand-700 rounded-xl shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {submitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>Submit Assistance Request</span>
                </button>
              </div>
            </form>
          ) : (
            /* Advocate Cards List */
            <div className="space-y-3">
              {loading && (
                <div className="py-12 flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-brand-600" />
                  <span className="text-xs text-slate-500">Searching advocate registry...</span>
                </div>
              )}

              {!loading && filteredLawyers.length === 0 && (
                <div className="py-12 text-center space-y-2">
                  <UserCheck className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-sm font-semibold text-slate-700">No advocates match the active filters</p>
                  <p className="text-xs text-slate-400">Try adjusting your location or specialization filters.</p>
                </div>
              )}

              {filteredLawyers.map((lawyer, idx) => {
                const specs = Array.isArray(lawyer.specialization) ? lawyer.specialization : [];
                const langs = Array.isArray(lawyer.languages_spoken)
                  ? lawyer.languages_spoken
                  : lawyer.languages || ['en', 'hi'];

                return (
                  <div
                    key={lawyer.id || idx}
                    className="p-4 bg-white rounded-2xl border border-slate-200/90 hover:border-brand-500/40 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900">
                          Adv. {lawyer.full_name || lawyer.fullName}
                        </h4>
                        <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          {lawyer.bar_council_number || lawyer.barCouncilNumber}
                        </span>
                        <div className="flex items-center text-amber-500 text-xs font-bold gap-0.5">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span>{lawyer.rating || '4.9'}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {lawyer.city}, {lawyer.state}
                        </span>
                        <span className="flex items-center gap-1">
                          <Award className="w-3.5 h-3.5 text-slate-400" />
                          {lawyer.experience_years || lawyer.experienceYears || 8} yrs practice
                        </span>
                        <span className="flex items-center gap-1">
                          <Languages className="w-3.5 h-3.5 text-slate-400" />
                          {langs.join(', ').toUpperCase()}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {specs.map((s: string, sIdx: number) => (
                          <span
                            key={sIdx}
                            className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedLawyer(lawyer);
                          setRequestType('LEGAL_ADVICE');
                        }}
                        className="w-full px-4 py-2 text-xs font-bold bg-brand-50 text-brand-700 border border-brand-200 hover:bg-brand-600 hover:text-white rounded-xl transition-all shadow-sm"
                      >
                        Request Legal Advice
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedLawyer(lawyer);
                          setRequestType('CASE_REPRESENTATION');
                        }}
                        className="w-full px-4 py-2 text-xs font-bold bg-slate-100 text-slate-800 hover:bg-slate-200 rounded-xl transition-all"
                      >
                        Request Representation
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
