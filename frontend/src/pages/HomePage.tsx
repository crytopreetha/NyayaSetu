import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Scale, Languages, Users, FileText, ArrowRight, CheckCircle2,
  AlertTriangle, Sparkles, Clock, BookOpen, MessageSquare, ShieldAlert,
  Gavel, Cpu, Check
} from 'lucide-react';
import { HealthStatus } from '../components/HealthStatus';
import { MetricChart } from '../components/MetricChart';
import { LanguageSelector } from '../components/LanguageSelector';

export const HomePage: React.FC = () => {
  const [selectedLang, setSelectedLang] = useState('hi');

  const sampleTranslations: Record<string, { title: string; desc: string; sample: string }> = {
    hi: {
      title: 'हिंदी (Hindi)',
      desc: 'नागरिकों के लिए सरल भाषा में कानूनी सहायता',
      sample: 'आपका 7/12 भू-अभिलेख सत्यापित हो गया है। कोई गंभीर कानूनी आपत्ति नहीं पाई गई है।',
    },
    mr: {
      title: 'मराठी (Marathi)',
      desc: 'नागरिकांसाठी सोप्या भाषेत कायदेशीर मार्गदर्शन',
      sample: 'तुमचा ७/१२ उतारा तपासला गेला आहे. पुढील सुनावणी २५ ऑक्टोबर रोजी नियोजित आहे.',
    },
    bn: {
      title: 'বাংলা (Bengali)',
      desc: 'নাগরিকদের জন্য সহজ ভাষায় আইনি সহায়তা',
      sample: 'আপনার নথিপত্র সফলভাবে বিশ্লেষণ করা হয়েছে। কোনো আইনি জটিলতা পাওয়া যায়নি।',
    },
    ta: {
      title: 'தமிழ் (Tamil)',
      desc: 'எளிய மொழியில் குடிமக்களுக்கான சட்ட உதவி',
      sample: 'உங்கள் ஆவணம் வெற்றிகரமாக பகுப்பாய்வு செய்யப்பட்டது. வழக்கறிஞர் மதிப்பாய்வு நிலுவையில் உள்ளது.',
    },
    te: {
      title: 'తెలుగు (Telugu)',
      desc: 'సామాన్య ప్రజలకు సులభమైన చట్టపరమైన సలహా',
      sample: 'మీ పత్రాలు పరిశీలించబడ్డాయి. తదుపరి గడువు నవంబర్ 5న ఉంది.',
    },
    gu: {
      title: 'ગુજરાતી (Gujarati)',
      desc: 'સરળ ભાષામાં નાગરિકો માટે કાયદાકીય સહાય',
      sample: 'તમારા જમીન દસ્તાવેજો ચકાસવામાં આવ્યા છે. વકીલની સલાહ માટે ઉપલબ્ધ છે.',
    },
    en: {
      title: 'English',
      desc: 'Plain-language legal clarification for all Indian citizens',
      sample: 'Your land title document has been reviewed. Limitation period expires in 60 days.',
    },
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* ── Top Tricolor Accent Bar ────────────────────────────────────────── */}
      <div className="saffron-line w-full" />

      {/* ── Header / Navigation ────────────────────────────────────────────── */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-brand-500 via-blue-900 to-indigo-800 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <Scale className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-2xl tracking-tight text-slate-900">
                  NyayaSetu
                </span>
                <span className="text-xs px-2 py-0.5 bg-amber-500/10 text-amber-800 border border-amber-300/60 font-semibold rounded-md">
                  न्यायसेतु
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Empowering Indian Citizens with Legal Clarity</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-slate-600">
            <a href="#how-it-works" className="hover:text-brand-500 transition-colors">How It Works</a>
            <a href="#multilingual" className="hover:text-brand-500 transition-colors">BHASHINI AI</a>
            <a href="#features" className="hover:text-brand-500 transition-colors">Features</a>
            <a href="#disclaimer" className="hover:text-brand-500 transition-colors">Safety & Ethics</a>
          </nav>

          <div className="flex items-center space-x-3">
            <LanguageSelector variant="dropdown" className="hidden sm:inline-flex" />
            <Link
              to="/lawyer/login"
              className="text-xs sm:text-sm font-semibold text-slate-700 hover:text-brand-500 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors hidden sm:inline-flex items-center gap-1.5"
            >
              <Gavel className="w-4 h-4 text-slate-500" />
              <span>Advocate Portal</span>
            </Link>
            <Link
              to="/login"
              className="btn-primary text-xs sm:text-sm flex items-center gap-1.5"
            >
              <span>Citizen Access</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Main Hero Section ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-900 via-slate-900 to-indigo-950 text-white pt-16 pb-20 px-4 sm:px-6 lg:px-8">
        {/* Decorative Grid and Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />
        <div className="absolute top-1/4 right-10 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Heading and CTAs */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-200 text-xs font-semibold backdrop-blur-sm">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                <span>Next-Gen Indian Legal-Tech Platform</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
                Complex Legal Documents Made{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-200 to-yellow-400">
                  Understandable in Your Language
                </span>
              </h1>

              <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl">
                NyayaSetu empowers common citizens with automated legal document simplification, regional language translations powered by <span className="text-white font-semibold">BHASHINI</span>, risk detection, and seamless collaboration with verified legal advocates.
              </p>

              {/* CTAs */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3.5">
                <Link
                  to="/register"
                  className="btn-amber text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 px-6 py-3.5"
                >
                  <Users className="w-5 h-5" />
                  <span>Get Citizen Legal Help (नागरिक)</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>

                <Link
                  to="/lawyer/register"
                  className="bg-white/10 hover:bg-white/15 text-white font-semibold text-sm sm:text-base px-6 py-3.5 rounded-xl border border-white/20 backdrop-blur-md flex items-center justify-center gap-2 transition-all hover:border-white/40 shadow-sm"
                >
                  <Gavel className="w-5 h-5 text-amber-300" />
                  <span>Advocate Onboarding (अधिवक्ता)</span>
                </Link>
              </div>

              {/* Feature Pills */}
              <div className="pt-4 flex flex-wrap gap-3 text-xs sm:text-sm text-slate-300">
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>22+ Scheduled Indian Languages</span>
                </div>
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Statutory Limitation Alerts</span>
                </div>
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Bar Council Verified Advocates</span>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Interactive Preview Card */}
            <div className="lg:col-span-5">
              <div className="relative">
                <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-amber-500/30 to-blue-600/30 blur-xl opacity-70" />
                <div className="relative rounded-2xl bg-slate-900/90 border border-slate-700/60 p-6 shadow-2xl backdrop-blur-xl space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">7/12 Extract Verification.pdf</p>
                        <p className="text-[10px] text-slate-400">Maharashtra Land Revenue Record</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      AI Simplified
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/50">
                      <p className="text-[11px] font-semibold text-amber-300 uppercase tracking-wider mb-1">
                        Plain-Language Summary
                      </p>
                      <p className="text-slate-300 leading-relaxed">
                        This document verifies ownership of ancestral farmland in Haveli taluka. A boundary overlap inquiry was initiated on 15 March 2024.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/50">
                        <p className="text-[10px] text-slate-400 font-medium">Critical Deadline</p>
                        <p className="text-xs font-bold text-red-400 mt-0.5">20 Oct 2026 (12 days)</p>
                        <p className="text-[10px] text-slate-500">File objection with Tahsildar</p>
                      </div>
                      <div className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/50">
                        <p className="text-[10px] text-slate-400 font-medium">Risk Assessment</p>
                        <p className="text-xs font-bold text-amber-400 mt-0.5">Medium Risk (Warning)</p>
                        <p className="text-[10px] text-slate-500">Requires certified map</p>
                      </div>
                    </div>

                    <div className="p-3 bg-brand-500/20 rounded-xl border border-brand-500/40 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Languages className="w-4 h-4 text-sky-400" />
                        <div>
                          <p className="text-[11px] font-bold text-white">मराठी भाषांतर उपलब्ध</p>
                          <p className="text-[10px] text-slate-300">Translated via BHASHINI</p>
                        </div>
                      </div>
                      <span className="text-[11px] text-sky-300 font-semibold underline cursor-pointer">
                        View Marathi
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 text-center">
                    <p className="text-[10px] text-slate-400">
                      ⚡ Demo visualization based on sample land revenue dispute data
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Prominent Safety & Legal Disclaimer ────────────────────────────── */}
      <section id="disclaimer" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20 w-full">
        <div className="bg-amber-50 border-2 border-amber-300/80 rounded-2xl p-5 sm:p-6 shadow-md flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0 text-amber-800">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="flex-1 space-y-1">
            <h2 className="text-sm font-bold text-amber-950 uppercase tracking-wide flex items-center gap-2">
              Legal Safety & Regulatory Notice
              <span className="text-[10px] px-2 py-0.5 bg-amber-200 text-amber-900 rounded font-bold">Important</span>
            </h2>
            <p className="text-xs sm:text-sm text-amber-900/90 leading-relaxed">
              NyayaSetu is an AI-powered legal empowerment and document analysis platform designed to improve transparency and accessibility. <strong>NyayaSetu does not provide formal legal counsel or replace a licensed advocate.</strong> AI-generated summaries and risk indicators are informational aids. For statutory filings and representation, always consult verified legal professionals registered with the Bar Council of India.
            </p>
          </div>
        </div>
      </section>

      {/* ── How NyayaSetu Works ────────────────────────────────────────────── */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <span className="text-xs font-bold text-brand-600 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full uppercase tracking-wider">
            Simple 3-Step Process
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
            How NyayaSetu Bridges the Legal Divide
          </h2>
          <p className="text-slate-600 text-sm sm:text-base">
            Designed specifically for citizens with zero prior legal knowledge, making court notices, property deeds, and police summons simple to comprehend.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow relative">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl mb-4">
              1
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Upload Any Legal Document</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Snap a photo or upload a PDF of summons, 7/12 extracts, sale deeds, consumer notices, or employment contracts. Encrypted and stored securely in accordance with Indian data protection norms.
            </p>
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center text-xs font-semibold text-brand-600 gap-1">
              <span>PDF & Image OCR support</span>
              <Check className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow relative">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xl mb-4">
              2
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">AI Plain-Language Translation</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Gemini AI decodes legal jargon into everyday language, highlights statutory limitation dates, flags risk levels, and BHASHINI translates it directly into your native regional language.
            </p>
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center text-xs font-semibold text-amber-700 gap-1">
              <span>BHASHINI Multilingual Engine</span>
              <Check className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow relative">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xl mb-4">
              3
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Connect with Verified Advocates</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Directly match with Bar Council-verified advocates in your district. Share your case dossier, receive informed counsel, and track hearing milestones through your citizen dashboard.
            </p>
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center text-xs font-semibold text-emerald-700 gap-1">
              <span>End-to-end case tracking</span>
              <Check className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Multilingual & BHASHINI Showcase ──────────────────────────────── */}
      <section id="multilingual" className="bg-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8 w-full relative">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <Languages className="w-3.5 h-3.5" />
              <span>National Language Mission · BHASHINI</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Legal Justice in Every Indian Tongue
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Language should never be a barrier to justice. Select a language below to preview how NyayaSetu simplifies complex court orders.
            </p>
          </div>

          {/* Interactive Language Selector */}
          <div className="flex flex-wrap justify-center gap-2 max-w-4xl mx-auto">
            {Object.entries(sampleTranslations).map(([code, item]) => (
              <button
                key={code}
                onClick={() => setSelectedLang(code)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  selectedLang === code
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30 scale-105'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                }`}
              >
                {item.title}
              </button>
            ))}
          </div>

          {/* Translation Preview Box */}
          <div className="max-w-3xl mx-auto bg-slate-800/80 rounded-2xl border border-slate-700 p-6 sm:p-8 backdrop-blur-sm shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-700/80 mb-4">
              <div>
                <h3 className="text-base font-bold text-amber-300">
                  {sampleTranslations[selectedLang].title}
                </h3>
                <p className="text-xs text-slate-400">
                  {sampleTranslations[selectedLang].desc}
                </p>
              </div>
              <span className="text-[11px] bg-slate-700 text-slate-300 px-2.5 py-1 rounded-md font-mono">
                Code: {selectedLang.toUpperCase()}
              </span>
            </div>

            <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-700/50">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-2">
                Simulated Output:
              </p>
              <p className="text-base text-slate-100 font-medium leading-relaxed">
                "{sampleTranslations[selectedLang].sample}"
              </p>
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                BHASHINI ULCA Pipeline Integration
              </span>
              <span className="italic">⚡ Demo translation preview</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── AI Assistance Explanation ──────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 shadow-sm space-y-8">
          <div className="max-w-3xl space-y-3">
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full uppercase tracking-wider">
              Responsible AI Architecture
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              How AI Assists — Without Making Risky Decisions
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              NyayaSetu employs a strict human-in-the-loop design. AI assists citizens with comprehension, extraction, and organization, while all formal legal representation remains strictly in the hands of qualified advocates.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Document Summarization</h3>
              <p className="text-xs text-slate-600">
                Transforms 40-page court orders and statutory clauses into concise, understandable bullet points.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Limitation Period Tracking</h3>
              <p className="text-xs text-slate-600">
                Identifies statutory filing deadlines and hearing summons to prevent default judgments.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Risk Flagging</h3>
              <p className="text-xs text-slate-600">
                Flags potential high-risk notices, bailable warrants, or urgent injunctions immediately.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Advocate Hand-off</h3>
              <p className="text-xs text-slate-600">
                Generates structured case dossiers for advocates, reducing preliminary consultation time by 70%.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Platform Analytics / Interactive Recharts ──────────────────────── */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Platform Activity & Legal Resolution Insights</h2>
            <p className="text-sm text-slate-500">Live operational data and resolution trends across pilot districts</p>
          </div>
          <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md">
            ⚡ Interactive Analytics
          </span>
        </div>
        <MetricChart />
      </section>

      {/* ── Backend Verification Section ───────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        <HealthStatus />
      </section>

      {/* ── Dual Portals Call to Action ────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Citizen Card */}
          <div className="bg-gradient-to-br from-blue-900 to-indigo-950 text-white rounded-3xl p-8 sm:p-10 shadow-xl space-y-6 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-amber-300">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold">Are you a Citizen?</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Got a court notice, property document, or contract you don't fully understand? Upload it now for instant plain-language explanation and connect with an advocate.
              </p>
            </div>
            <div className="pt-4 flex flex-col sm:flex-row gap-3">
              <Link to="/register" className="btn-amber text-center text-sm font-bold py-3">
                Create Citizen Account
              </Link>
              <Link to="/login" className="bg-white/10 hover:bg-white/20 text-white text-center text-sm font-semibold py-3 px-5 rounded-xl border border-white/20 transition-colors">
                Citizen Login →
              </Link>
            </div>
          </div>

          {/* Lawyer Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl p-8 sm:p-10 border border-slate-800 shadow-xl space-y-6 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-400">
                <Gavel className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold">Are you a Legal Advocate?</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Join verified advocates on NyayaSetu. Access pre-structured case briefs with AI-extracted timelines, statutory references, and direct client communication channels.
              </p>
            </div>
            <div className="pt-4 flex flex-col sm:flex-row gap-3">
              <Link to="/lawyer/register" className="btn-primary text-center text-sm font-bold py-3">
                Join as Advocate (अधिवक्ता)
              </Link>
              <Link to="/lawyer/login" className="bg-white/10 hover:bg-white/20 text-white text-center text-sm font-semibold py-3 px-5 rounded-xl border border-white/20 transition-colors">
                Advocate Login →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-slate-200/80 pt-12 pb-8 mt-12 text-slate-600 text-xs sm:text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1 space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white">
                  <Scale className="w-4 h-4 text-amber-300" />
                </div>
                <span className="font-bold text-lg text-slate-900">NyayaSetu</span>
              </div>
              <p className="text-xs text-slate-500">
                न्यायसेतु · Legal Clarity for Every Indian Citizen. Bridging language barriers with BHASHINI & Google Cloud.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-3 text-xs uppercase tracking-wider">Citizens</h4>
              <ul className="space-y-2 text-xs">
                <li><Link to="/login" className="hover:text-brand-500">Sign In</Link></li>
                <li><Link to="/register" className="hover:text-brand-500">Register Case</Link></li>
                <li><a href="#how-it-works" className="hover:text-brand-500">How It Works</a></li>
                <li><a href="#multilingual" className="hover:text-brand-500">BHASHINI Languages</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-3 text-xs uppercase tracking-wider">Advocates</h4>
              <ul className="space-y-2 text-xs">
                <li><Link to="/lawyer/login" className="hover:text-brand-500">Advocate Portal</Link></li>
                <li><Link to="/lawyer/register" className="hover:text-brand-500">Bar Council Verification</Link></li>
                <li><a href="#disclaimer" className="hover:text-brand-500">Ethics & Compliance</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-3 text-xs uppercase tracking-wider">Legal & Compliance</h4>
              <ul className="space-y-2 text-xs">
                <li><a href="#disclaimer" className="hover:text-brand-500">Legal Disclaimer</a></li>
                <li><span className="text-slate-400">Advocates Act 1961 Compliance</span></li>
                <li><span className="text-slate-400">DPDP Act 2023 Privacy Standard</span></li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <p>© 2026 NyayaSetu (न्यायसेतु). All rights reserved. Indian Legal-Tech Initiative.</p>
            <p className="text-[11px] text-slate-400">
              Demo environment connected to Supabase PostgreSQL & Express API
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
