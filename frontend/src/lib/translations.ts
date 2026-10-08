/**
 * NyayaSetu Multilingual Translation Lexicon
 * Supported Languages:
 * - English (en)
 * - Hindi (hi) - हिन्दी
 * - Marathi (mr) - मराठी
 * 
 * Rules:
 * - Static UI text is localized.
 * - Names, original document extracts, lawyer names, case IDs remain untranslated.
 * - Non-binding informational disclaimers provided for legal safety.
 */

export type SupportedLanguage = 'en' | 'hi' | 'mr';

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
];

export const TRANSLATIONS: Record<SupportedLanguage, Record<string, string>> = {
  // ─────────────────────────────────────────────────────────────────────────────
  // ENGLISH (en)
  // ─────────────────────────────────────────────────────────────────────────────
  en: {
    // Navigation
    'nav.brand': 'NyayaSetu',
    'nav.tagline': 'Bridging Citizens & Legal Justice',
    'nav.citizenPortal': 'Citizen Portal',
    'nav.advocatePortal': 'Advocate Workspace',
    'nav.dashboard': 'Dashboard',
    'nav.cases': 'Cases',
    'nav.documents': 'Documents',
    'nav.timeline': 'Timeline',
    'nav.login': 'Login',
    'nav.register': 'Register',
    'nav.logout': 'Logout',
    'nav.language': 'Language',
    'nav.backToDashboard': 'Back to Dashboard',
    'nav.backToWorkspace': 'Back to Advocate Workspace',

    // Dashboard
    'dashboard.welcome': 'Welcome back',
    'dashboard.welcomeSub': 'Track your legal matters, verified advocates, and statutory dates',
    'dashboard.verifiedWorkspace': 'Verified Citizen Workspace (Naagrik Portal)',
    'dashboard.activeCases': 'Active Cases',
    'dashboard.pendingActions': 'Pending Actions',
    'dashboard.upcomingDeadlines': 'Upcoming Deadlines',
    'dashboard.caseDocuments': 'Case Documents',
    'dashboard.overviewTab': 'Overview',
    'dashboard.casesTab': 'All Cases',
    'dashboard.documentsTab': 'Documents',
    'dashboard.timelineTab': 'Timeline',
    'dashboard.recentNotifications': 'Recent Notifications',
    'dashboard.statutoryDeadlines': 'Statutory Deadlines',
    'dashboard.assignedCounsel': 'Assigned Legal Counsel',
    'dashboard.messageAdvocate': 'Message Advocate',
    'dashboard.viewCourtDates': 'View All Court Dates',
    'dashboard.filterCases': 'Filter by title or case number...',
    'dashboard.openCaseDetails': 'Open Case Details',

    // Buttons
    'btn.uploadDocument': 'Upload New Document',
    'btn.upload': 'Upload',
    'btn.view': 'View',
    'btn.download': 'Download',
    'btn.sendMessage': 'Send',
    'btn.saveNotes': 'Save Notes',
    'btn.cancel': 'Cancel',
    'btn.done': 'Done',
    'btn.close': 'Close',
    'btn.inspect': 'Inspect',
    'btn.details': 'Details',

    // Document Upload
    'upload.title': 'Upload Legal Document',
    'upload.subtitle': 'Secure validation, text extraction & AI comprehension',
    'upload.selectCase': 'Select Case',
    'upload.dragDrop': 'Click to upload or drag & drop files',
    'upload.supportedFormats': 'Supported formats: PDF, DOCX, TXT (Maximum size: 15 MB)',
    'upload.fileSelected': 'File selected for processing',
    'upload.btnUpload': 'Upload & Process',
    'upload.uploading': 'Validating & Uploading...',
    'upload.successTitle': 'Document Uploaded Successfully!',
    'upload.successDesc': 'Your document is now queued in the AI comprehension pipeline.',
    'upload.initialStatus': 'Initial Status',
    'upload.encryptionNotice': 'Encrypted private storage. Documents are never exposed publicly.',
    'upload.repositoryTitle': 'Uploaded Legal Documents',
    'upload.repositorySub': 'Secure digital repository for deeds, notices, and revenue extracts',

    // Case Detail Page
    'case.number': 'Case Dossier',
    'case.statusWorkflow': 'Case Lifecycle Progress',
    'case.currentStage': 'Current stage',
    'case.stageCompleted': 'Completed',
    'case.stageUpcoming': 'Upcoming',
    'case.assignedAdvocate': 'Assigned Advocate',
    'case.barVerified': 'Bar Council Verified',
    'case.matching': 'Matching Advocate...',
    'case.communication': 'Communication with Advocate',
    'case.channelActive': 'Active Secure Channel',
    'case.messagePlaceholder': 'Type your message to the advocate...',
    'case.statutoryDeadlines': 'Statutory Deadlines',
    'case.due': 'Due',
    'case.caseDocuments': 'Case Documents',
    'case.files': 'Files',
    'case.chronologicalEvents': 'Chronological Events',

    // AI Analysis Section & Labels
    'ai.title': 'AI Document Analysis',
    'ai.subtitle': 'Automated extraction from uploaded title extracts and petitions',
    'ai.confidence': 'Confidence',
    'ai.summaryTitle': 'Plain-Language Case Summary',
    'ai.datesTitle': 'Critical Dates',
    'ai.risksTitle': 'Risk Indicators & Vulnerability Assessment',
    'ai.actionsTitle': 'Required Actions',
    'ai.nextStepsTitle': 'Recommended Next Steps',
    'ai.partiesTitle': 'Identified Parties',
    'ai.statutesTitle': 'Relevant Statutory Sections',
    'ai.extractedTextTab': 'Extracted Text',
    'ai.metadataTab': 'File Details & Audit',
    'ai.disclaimer': 'Informational assistance only. This AI-generated explanation and translation is not certified legal advice or a certified translation. Consult a verified legal advocate for formal legal representation.',

    // Risk levels
    'risk.high': 'HIGH RISK',
    'risk.medium': 'MEDIUM RISK',
    'risk.low': 'LOW RISK',
    'risk.critical': 'CRITICAL',

    // Statuses
    'status.uploaded': 'Uploaded',
    'status.processing': 'Extracting Text...',
    'status.analyzing': 'AI Analyzing...',
    'status.completed': 'AI Analyzed',
    'status.failed': 'Failed',

    // Advocate Section
    'lawyer.reg': 'BCI Reg',
    'lawyer.exp': 'yrs experience',
    'lawyer.specialization': 'Specialization',
    'lawyer.privateNotes': 'Private Advocate Case Notes',
    'lawyer.privateNotesSub': 'Confidential internal notes (never visible to citizen client)',
    'lawyer.notesSaved': 'Saved ✓',

    // Common & Empty states
    'empty.noDocuments': 'No documents uploaded yet. Upload a PDF, DOCX, or TXT file to begin.',
    'empty.noDeadlines': 'No upcoming deadlines currently scheduled.',
    'empty.noCases': 'No matching cases found.',
    'loading.general': 'Loading...',
    'loading.extracting': 'Extracting document text...',
    'loading.analyzing': 'Synthesizing plain-language analysis...',
    'error.uploadFailed': 'Upload failed. Please check network connectivity and try again.',
    'error.unsupportedFile': 'Unsupported file format. Please upload PDF, DOCX, or TXT.',
    'error.fileTooLarge': 'File size exceeds 15 MB limit.',
    'footer.disclaimer': 'Statutory Notice: All AI summaries and translations are for informational guidance. Consult your verified advocate for formal legal advice.',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // HINDI (hi) - हिन्दी
  // ─────────────────────────────────────────────────────────────────────────────
  hi: {
    // Navigation
    'nav.brand': 'NyayaSetu',
    'nav.tagline': 'नागरिकों और कानूनी न्याय के बीच सेतु',
    'nav.citizenPortal': 'नागरिक पोर्टल',
    'nav.advocatePortal': 'अधिवक्ता कार्यक्षेत्र',
    'nav.dashboard': 'डैशबोर्ड',
    'nav.cases': 'मामले',
    'nav.documents': 'दस्तावेज़',
    'nav.timeline': 'समय-सीमा',
    'nav.login': 'लॉग इन',
    'nav.register': 'पंजीकरण',
    'nav.logout': 'लॉग आउट',
    'nav.language': 'भाषा',
    'nav.backToDashboard': 'डैशबोर्ड पर वापस जाएं',
    'nav.backToWorkspace': 'अधिवक्ता कार्यक्षेत्र पर वापस जाएं',

    // Dashboard
    'dashboard.welcome': 'पुनः स्वागत है',
    'dashboard.welcomeSub': 'अपने कानूनी मामलों, सत्यापित अधिवक्ताओं और महत्वपूर्ण तिथियों की प्रगति देखें',
    'dashboard.verifiedWorkspace': 'सत्यापित नागरिक कार्यस्थान (नागरिक पोर्टल)',
    'dashboard.activeCases': 'सक्रिय मामले',
    'dashboard.pendingActions': 'लंबित कार्रवाइयां',
    'dashboard.upcomingDeadlines': 'आगामी समय-सीमाएं',
    'dashboard.caseDocuments': 'मामले के दस्तावेज़',
    'dashboard.overviewTab': 'सिंहावलोकन',
    'dashboard.casesTab': 'सभी मामले',
    'dashboard.documentsTab': 'दस्तावेज़',
    'dashboard.timelineTab': 'समय-सीमा',
    'dashboard.recentNotifications': 'हालिया सूचनाएं',
    'dashboard.statutoryDeadlines': 'वैधानिक समय-सीमाएं',
    'dashboard.assignedCounsel': 'नियुक्त कानूनी परामर्शदाता',
    'dashboard.messageAdvocate': 'अधिवक्ता को संदेश भेजें',
    'dashboard.viewCourtDates': 'सभी अदालती तारीखें देखें',
    'dashboard.filterCases': 'शीर्षक या मामला संख्या से खोजें...',
    'dashboard.openCaseDetails': 'मामले का विवरण खोलें',

    // Buttons
    'btn.uploadDocument': 'नया दस्तावेज़ अपलोड करें',
    'btn.upload': 'अपलोड करें',
    'btn.view': 'देखें',
    'btn.download': 'डाउनलोड करें',
    'btn.sendMessage': 'भेजें',
    'btn.saveNotes': 'टिप्पणियां सहेजें',
    'btn.cancel': 'रद्द करें',
    'btn.done': 'संपन्न',
    'btn.close': 'बंद करें',
    'btn.inspect': 'निरीक्षण करें',
    'btn.details': 'विवरण',

    // Document Upload
    'upload.title': 'कानूनी दस्तावेज़ अपलोड करें',
    'upload.subtitle': 'सुरक्षित सत्यापन, पाठ निष्कर्षण और एआई कानूनी समझ',
    'upload.selectCase': 'मामला चुनें',
    'upload.dragDrop': 'अपलोड करने के लिए क्लिक करें या फ़ाइल यहाँ खींचें',
    'upload.supportedFormats': 'समर्थित प्रारूप: PDF, DOCX, TXT (अधिकतम आकार: 15 MB)',
    'upload.fileSelected': 'प्रक्रिया हेतु फ़ाइल चयनित',
    'upload.btnUpload': 'अपलोड और विश्लेषण करें',
    'upload.uploading': 'सत्यापन और अपलोड जारी...',
    'upload.successTitle': 'दस्तावेज़ सफलतापूर्वक अपलोड हुआ!',
    'upload.successDesc': 'आपका दस्तावेज़ अब एआई समझ पाइपलाइन में प्रक्रियाधीन है।',
    'upload.initialStatus': 'प्रारंभिक स्थिति',
    'upload.encryptionNotice': 'एन्क्रिप्टेड सुरक्षित भंडारण। दस्तावेज़ कभी सार्वजनिक रूप से प्रदर्शित नहीं किए जाते।',
    'upload.repositoryTitle': 'अपलोड किए गए कानूनी दस्तावेज़',
    'upload.repositorySub': 'दस्तावेज़ों, नोटिसों और राजस्व अभिलेखों का सुरक्षित डिजिटल कोष',

    // Case Detail Page
    'case.number': 'मामला दस्तावेज़',
    'case.statusWorkflow': 'मामला प्रगति चक्र',
    'case.currentStage': 'वर्तमान चरण',
    'case.stageCompleted': 'पूर्ण',
    'case.stageUpcoming': 'आगामी',
    'case.assignedAdvocate': 'नियुक्त अधिवक्ता',
    'case.barVerified': 'बार काउंसिल द्वारा सत्यापित',
    'case.matching': 'अधिवक्ता मिलान जारी...',
    'case.communication': 'अधिवक्ता के साथ संवाद',
    'case.channelActive': 'सक्रिय सुरक्षित चैनल',
    'case.messagePlaceholder': 'अधिवक्ता को अपना संदेश लिखें...',
    'case.statutoryDeadlines': 'वैधानिक समय-सीमाएं',
    'case.due': 'नियत तिथि',
    'case.caseDocuments': 'मामले के दस्तावेज़',
    'case.files': 'फ़ाइलें',
    'case.chronologicalEvents': 'कालानुक्रमिक घटनाएं',

    // AI Analysis Section & Labels (Strictly following user requirement)
    'ai.title': 'एआई दस्तावेज़ विश्लेषण',
    'ai.subtitle': 'अपलोड किए गए अभिलेखों से स्वचालित कानूनी विश्लेषण',
    'ai.confidence': 'विश्वसनीयता',
    'ai.summaryTitle': 'सरल सारांश',
    'ai.datesTitle': 'महत्वपूर्ण तिथियां',
    'ai.risksTitle': 'जोखिम संकेत',
    'ai.actionsTitle': 'आवश्यक कार्रवाई',
    'ai.nextStepsTitle': 'अगले कदम',
    'ai.partiesTitle': 'पहचाने गए पक्ष',
    'ai.statutesTitle': 'संबंधित वैधानिक धाराएं',
    'ai.extractedTextTab': 'निकाला गया पाठ',
    'ai.metadataTab': 'फ़ाइल विवरण और ऑडिट',
    'ai.disclaimer': 'केवल सूचनात्मक सहायता। यह एआई-जनित स्पष्टीकरण और अनुवाद प्रमाणित कानूनी सलाह या प्रमाणित कानूनी अनुवाद नहीं है। औपचारिक कानूनी प्रतिनिधित्व के लिए एक सत्यापित अधिवक्ता से परामर्श करें।',

    // Risk levels
    'risk.high': 'उच्च जोखिम',
    'risk.medium': 'मध्यम जोखिम',
    'risk.low': 'कम जोखिम',
    'risk.critical': 'अति गंभीर',

    // Statuses
    'status.uploaded': 'अपलोड किया गया',
    'status.processing': 'पाठ निकाला जा रहा है...',
    'status.analyzing': 'एआई विश्लेषण जारी...',
    'status.completed': 'एआई विश्लेषित',
    'status.failed': 'विफल',

    // Advocate Section
    'lawyer.reg': 'बीसीआई पंजीकरण',
    'lawyer.exp': 'वर्षों का अनुभव',
    'lawyer.specialization': 'विशेषज्ञता',
    'lawyer.privateNotes': 'अधिवक्ता निजी टिप्पणियां',
    'lawyer.privateNotesSub': 'गोपनीय आंतरिक टिप्पणियां (नागरिक मुवक्किल को कभी दिखाई नहीं देंगी)',
    'lawyer.notesSaved': 'सहेजा गया ✓',

    // Common & Empty states
    'empty.noDocuments': 'अभी तक कोई दस्तावेज़ अपलोड नहीं किया गया। शुरू करने के लिए PDF, DOCX, या TXT फ़ाइल अपलोड करें।',
    'empty.noDeadlines': 'वर्तमान में कोई आगामी समय-सीमा निर्धारित नहीं है।',
    'empty.noCases': 'कोई मेल खाते मामले नहीं मिले।',
    'loading.general': 'लोड हो रहा है...',
    'loading.extracting': 'दस्तावेज़ पाठ निकाला जा रहा है...',
    'loading.analyzing': 'सरल भाषा में विश्लेषण तैयार हो रहा है...',
    'error.uploadFailed': 'अपलोड विफल रहा। कृपया नेटवर्क कनेक्टिविटी जांचें और पुनः प्रयास करें।',
    'error.unsupportedFile': 'असमर्थित फ़ाइल प्रारूप। कृपया PDF, DOCX, या TXT अपलोड करें।',
    'error.fileTooLarge': 'फ़ाइल का आकार 15 MB की सीमा से अधिक है।',
    'footer.disclaimer': 'वैधानिक सूचना: सभी एआई सारांश और अनुवाद सूचनात्मक मार्गदर्शन के लिए हैं। औपचारिक कानूनी सलाह के लिए अपने सत्यापित अधिवक्ता से परामर्श लें।',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // MARATHI (mr) - मराठी
  // ─────────────────────────────────────────────────────────────────────────────
  mr: {
    // Navigation
    'nav.brand': 'NyayaSetu',
    'nav.tagline': 'नागरिक आणि कायदेशीर न्याय यांच्यातील सेतू',
    'nav.citizenPortal': 'नागरिक पोर्टल',
    'nav.advocatePortal': 'वकील कार्यक्षेत्र',
    'nav.dashboard': 'डॅशबोर्ड',
    'nav.cases': 'प्रकरणे',
    'nav.documents': 'दस्तऐवज',
    'nav.timeline': 'कालमर्यादा',
    'nav.login': 'लॉग इन',
    'nav.register': 'नोंदणी',
    'nav.logout': 'लॉग आउट',
    'nav.language': 'भाषा',
    'nav.backToDashboard': 'डॅशबोर्डवर परत जा',
    'nav.backToWorkspace': 'वकील कार्यक्षेत्रावर परत जा',

    // Dashboard
    'dashboard.welcome': 'पुन्हा स्वागत आहे',
    'dashboard.welcomeSub': 'आपली कायदेशीर प्रकरणे, प्रमाणित वकील आणि महत्त्वाच्या तारखांची प्रगती तपासा',
    'dashboard.verifiedWorkspace': 'प्रमाणित नागरिक कार्यस्थान (नागरिक पोर्टल)',
    'dashboard.activeCases': 'सक्रिय प्रकरणे',
    'dashboard.pendingActions': 'प्रलंबित कृती',
    'dashboard.upcomingDeadlines': 'आगामी मुदती',
    'dashboard.caseDocuments': 'प्रकरणाचे दस्तऐवज',
    'dashboard.overviewTab': 'आढावा',
    'dashboard.casesTab': 'सर्व प्रकरणे',
    'dashboard.documentsTab': 'दस्तऐवज',
    'dashboard.timelineTab': 'कालमर्यादा',
    'dashboard.recentNotifications': 'अलीकडील सूचना',
    'dashboard.statutoryDeadlines': 'वैधानिक मुदती',
    'dashboard.assignedCounsel': 'नेमलेले कायदेशीर सल्लागार',
    'dashboard.messageAdvocate': 'वकिलांना संदेश पाठवा',
    'dashboard.viewCourtDates': 'सर्व न्यायालयीन तारखा पहा',
    'dashboard.filterCases': 'शीर्षक किंवा प्रकरण क्रमांकाने शोधा...',
    'dashboard.openCaseDetails': 'प्रकरण तपशील उघडा',

    // Buttons
    'btn.uploadDocument': 'नवीन दस्तऐवज अपलोड करा',
    'btn.upload': 'अपलोड करा',
    'btn.view': 'पहा',
    'btn.download': 'डाउनलोड करा',
    'btn.sendMessage': 'पाठवा',
    'btn.saveNotes': 'नोंदी जतन करा',
    'btn.cancel': 'रद्द करा',
    'btn.done': 'पूर्ण',
    'btn.close': 'बंद करा',
    'btn.inspect': 'तपासा',
    'btn.details': 'तपशील',

    // Document Upload
    'upload.title': 'कायदेशीर दस्तऐवज अपलोड करा',
    'upload.subtitle': 'सुरक्षित पडताळणी, मजकूर संकलन आणि एआय कायदेशीर आकलन',
    'upload.selectCase': 'प्रकरण निवडा',
    'upload.dragDrop': 'अपलोड करण्यासाठी क्लिक करा किंवा फाईल येथे ओढा',
    'upload.supportedFormats': 'समर्थित फॉरमॅट: PDF, DOCX, TXT (कमाल मर्यादा: 15 MB)',
    'upload.fileSelected': 'प्रक्रियेसाठी फाईल निवडली',
    'upload.btnUpload': 'अपलोड आणि विश्लेषण करा',
    'upload.uploading': 'पडताळणी आणि अपलोड सुरू आहे...',
    'upload.successTitle': 'दस्तऐवज यशस्वीरित्या अपलोड झाला!',
    'upload.successDesc': 'आपला दस्तऐवज आता एआय आकलन प्रक्रियेत समाविष्ट केला आहे.',
    'upload.initialStatus': 'प्रारंभिक स्थिती',
    'upload.encryptionNotice': 'एनक्रिप्टेड सुरक्षित साठवणूक. दस्तऐवज कधीही सार्वजनिक केले जात नाहीत.',
    'upload.repositoryTitle': 'अपलोड केलेले कायदेशीर दस्तऐवज',
    'upload.repositorySub': 'खरेदीखत, नोटीस आणि महसूल नोंदींचा सुरक्षित डिजिटल साठा',

    // Case Detail Page
    'case.number': 'प्रकरण नस्ती',
    'case.statusWorkflow': 'प्रकरण प्रगती चक्र',
    'case.currentStage': 'सध्याचा टप्पा',
    'case.stageCompleted': 'पूर्ण',
    'case.stageUpcoming': 'आगामी',
    'case.assignedAdvocate': 'नेमलेले वकील',
    'case.barVerified': 'बार कौन्सिल प्रमाणित',
    'case.matching': 'वकील जोडणी सुरू आहे...',
    'case.communication': 'वकिलांसोबत संवाद',
    'case.channelActive': 'सक्रिय सुरक्षित चॅनेल',
    'case.messagePlaceholder': 'वकिलांना आपला संदेश लिहा...',
    'case.statutoryDeadlines': 'वैधानिक मुदती',
    'case.due': 'नियत मुदत',
    'case.caseDocuments': 'प्रकरणाचे दस्तऐवज',
    'case.files': 'दस्तऐवज',
    'case.chronologicalEvents': 'कालक्रमानुसार घडामोडी',

    // AI Analysis Section & Labels (Strictly following user requirement)
    'ai.title': 'एआय दस्तऐवज विश्लेषण',
    'ai.subtitle': 'अपलोड केलेल्या ७/१२ व इतर नोंदींवरून स्वयंचलित कायदेशीर आकलन',
    'ai.confidence': 'विश्वासार्हता',
    'ai.summaryTitle': 'सोपा सारांश',
    'ai.datesTitle': 'महत्त्वाच्या तारखा',
    'ai.risksTitle': 'जोखीम संकेत',
    'ai.actionsTitle': 'आवश्यक कृती',
    'ai.nextStepsTitle': 'पुढील पावले',
    'ai.partiesTitle': 'ओळखलेले पक्ष',
    'ai.statutesTitle': 'संबंधित वैधानिक कलमे',
    'ai.extractedTextTab': 'संकलित मजकूर',
    'ai.metadataTab': 'फाईल तपशील आणि ऑडिट',
    'ai.disclaimer': 'केवळ माहितीपर सहाय्य. हे एआय-निर्मित विश्लेषण आणि भाषांतर प्रमाणित कायदेशीर सल्ला किंवा प्रमाणित कायदेशीर भाषांतर नाही. अधिकृत कायदेशीर प्रतिनिधित्वासाठी प्रमाणित वकिलांचा सल्ला घ्या.',

    // Risk levels
    'risk.high': 'उच्च जोखीम',
    'risk.medium': 'मध्यम जोखीम',
    'risk.low': 'कमी जोखीम',
    'risk.critical': 'अति गंभीर',

    // Statuses
    'status.uploaded': 'अपलोड केले',
    'status.processing': 'मजकूर संकलित करत आहे...',
    'status.analyzing': 'एआय विश्लेषण सुरू आहे...',
    'status.completed': 'एआय विश्लेषित',
    'status.failed': 'अयशस्वी',

    // Advocate Section
    'lawyer.reg': 'बीसीआय नोंदणी',
    'lawyer.exp': 'वर्षे अनुभव',
    'lawyer.specialization': 'विशेषज्ञता',
    'lawyer.privateNotes': 'वकिलांच्या खाजगी नोंदी',
    'lawyer.privateNotesSub': 'गोपनीय अंतर्गत नोंदी (नागरिक अशिलाला कधीही दिसणार नाहीत)',
    'lawyer.notesSaved': 'जतन केले ✓',

    // Common & Empty states
    'empty.noDocuments': 'अद्याप कोणतेही दस्तऐवज अपलोड केलेले नाहीत. सुरू करण्यासाठी PDF, DOCX, किंवा TXT फाईल अपलोड करा.',
    'empty.noDeadlines': 'सध्या कोणतीही आगामी मुदत नियोजित नाही.',
    'empty.noCases': 'एकही जुळणारे प्रकरण आढळले नाही.',
    'loading.general': 'लोड होत आहे...',
    'loading.extracting': 'दस्तऐवजातील मजकूर संकलित करत आहे...',
    'loading.analyzing': 'सोप्या भाषेत विश्लेषण तयार करत आहे...',
    'error.uploadFailed': 'अपलोड अयशस्वी झाले. कृपया नेटवर्क तपासा आणि पुन्हा प्रयत्न करा.',
    'error.unsupportedFile': 'असमर्थित फाईल प्रकार. कृपया PDF, DOCX, किंवा TXT अपलोड करा.',
    'error.fileTooLarge': 'फाईलचा आकार 15 MB पेक्षा जास्त आहे.',
    'footer.disclaimer': 'वैधानिक सूचना: सर्व एआय सारांश आणि भाषांतरे केवळ माहितीपर मार्गदर्शनासाठी आहेत. अधिकृत कायदेशीर सल्ल्यासाठी आपल्या प्रमाणित वकिलांशी संपर्क साधा.',
  },
};
