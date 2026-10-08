/**
 * NyayaSetu AI Analysis — Type Definitions
 *
 * Structured output contract for Gemini-powered document analysis.
 * Risk levels are evidence-based: only flag HIGH when the document
 * text explicitly contains an approaching deadline or critical demand.
 */

// ── Risk Categories ─────────────────────────────────────────────────────────

export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL';

export interface RiskIndicator {
  level: RiskLevel;
  description: string;
  /** Optional: quote or reference from the source document */
  sourceReference?: string;
}

// ── Party ───────────────────────────────────────────────────────────────────

export interface IdentifiedParty {
  name: string;
  role: string;
  /** Optional: the line or excerpt where this party was found */
  sourceReference?: string;
}

// ── Date / Deadline ─────────────────────────────────────────────────────────

export interface ImportantDate {
  date: string;
  description: string;
  sourceReference?: string;
}

export interface Deadline {
  date: string;
  description: string;
  urgency: RiskLevel;
  sourceReference?: string;
}

// ── Claim ───────────────────────────────────────────────────────────────────

export interface Claim {
  description: string;
  sourceReference?: string;
}

// ── Legal Section ───────────────────────────────────────────────────────────

export interface SectionMentioned {
  act: string;
  section: string;
  relevance: string;
  sourceReference?: string;
}

// ── Full Structured Analysis Output ─────────────────────────────────────────

export interface GeminiAnalysisResult {
  documentType: string;
  summary: string;
  parties: IdentifiedParty[];
  importantDates: ImportantDate[];
  deadlines: Deadline[];
  claims: Claim[];
  sectionsMentioned: SectionMentioned[];
  requiredActions: string[];
  missingInformation: string[];
  riskIndicators: RiskIndicator[];
  professionalReviewRecommended: boolean;
}

// ── Input to the AI Service ─────────────────────────────────────────────────

export interface AnalysisInput {
  extractedText: string;
  documentType?: string;
  userLanguage: 'en' | 'hi' | 'mr';
  caseMetadata?: {
    caseNumber?: string;
    caseTitle?: string;
    caseCategory?: string;
    jurisdiction?: string;
  };
}
