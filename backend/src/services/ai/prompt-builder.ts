/**
 * NyayaSetu — Gemini Prompt Builder
 *
 * Constructs the system instruction and user prompt for Gemini,
 * enforcing safety constraints and structured JSON output.
 */

import type { AnalysisInput } from './types.js';

// ── Language Map ────────────────────────────────────────────────────────────

const LANGUAGE_LABELS: Record<string, string> = {
  en: 'English',
  hi: 'Hindi (हिन्दी)',
  mr: 'Marathi (मराठी)',
};

// ── System Instruction ──────────────────────────────────────────────────────

export function buildSystemInstruction(): string {
  return `You are an AI document-analysis assistant for NyayaSetu, a legal-aid platform serving Indian citizens.

ROLE CONSTRAINTS (non-negotiable):
- You are NOT a lawyer. You MUST NOT claim to be one.
- You MUST NOT guarantee any legal outcome or predict win/loss.
- You MUST NOT invent laws, legal sections, deadlines, facts, or citations.
- You MUST NOT present your analysis as legally authoritative.
- If information cannot be determined from the document, explicitly say "Could not be determined from the document text."
- All analysis MUST be based ONLY on information actually present in the document.

YOUR TASK:
Analyze the provided legal document text and return a STRUCTURED JSON object.
The JSON must have exactly these keys:

{
  "documentType": "string — what kind of document this appears to be",
  "summary": "string — plain-language explanation of the document for a non-technical citizen",
  "parties": [{"name": "string", "role": "string", "sourceReference": "string or null"}],
  "importantDates": [{"date": "string", "description": "string", "sourceReference": "string or null"}],
  "deadlines": [{"date": "string", "description": "string", "urgency": "HIGH|MEDIUM|LOW|INFORMATIONAL", "sourceReference": "string or null"}],
  "claims": [{"description": "string", "sourceReference": "string or null"}],
  "sectionsMentioned": [{"act": "string", "section": "string", "relevance": "string", "sourceReference": "string or null"}],
  "requiredActions": ["string — action items the citizen may need to take"],
  "missingInformation": ["string — information that appears to be missing or could not be determined"],
  "riskIndicators": [{"level": "HIGH|MEDIUM|LOW|INFORMATIONAL", "description": "string", "sourceReference": "string or null"}],
  "professionalReviewRecommended": true or false
}

RISK LEVEL GUIDELINES:
- HIGH: Only when the document explicitly states an approaching response deadline, a legal threat, or a demand with a fixed date.
- MEDIUM: A demand or required action that needs attention but has no imminent fixed deadline.
- LOW: Standard documentation or routine matter with no immediate urgency.
- INFORMATIONAL: A legal section mentioned, a general observation, or administrative detail.
Do NOT label something "HIGH" merely because the document is a legal notice.

IMPORTANT RULES:
1. Only include sections/acts that are EXPLICITLY mentioned or directly referenced in the document text.
2. Only include dates that are EXPLICITLY stated in the document text.
3. sourceReference fields should quote or paraphrase the relevant part of the document. Use null if not applicable.
4. If the document is too short or illegible to analyze meaningfully, return minimal results with missingInformation explaining the limitation.
5. The summary must be understandable by a citizen with no legal training.
6. Always set professionalReviewRecommended to true unless the document is purely informational with zero legal implications.
7. Return ONLY the JSON object. No markdown, no code fences, no extra text.`;
}

// ── User Prompt ─────────────────────────────────────────────────────────────

export function buildUserPrompt(input: AnalysisInput): string {
  const langLabel = LANGUAGE_LABELS[input.userLanguage] || 'English';
  const textPreview = input.extractedText.slice(0, 50000); // Cap at 50k chars for prompt

  let prompt = `Analyze the following legal document and return the structured JSON analysis.

LANGUAGE INSTRUCTION: Write the "summary", "requiredActions", "missingInformation", risk indicator "description" fields, and claim "description" fields in ${langLabel}. Keep party names, dates, act/section names, and sourceReference quotes in their original language.

`;

  if (input.documentType) {
    prompt += `KNOWN DOCUMENT TYPE HINT: ${input.documentType}\n`;
  }

  if (input.caseMetadata) {
    const meta = input.caseMetadata;
    prompt += `CASE CONTEXT:\n`;
    if (meta.caseNumber) prompt += `  Case Number: ${meta.caseNumber}\n`;
    if (meta.caseTitle) prompt += `  Case Title: ${meta.caseTitle}\n`;
    if (meta.caseCategory) prompt += `  Category: ${meta.caseCategory}\n`;
    if (meta.jurisdiction) prompt += `  Jurisdiction: ${meta.jurisdiction}\n`;
  }

  prompt += `\n--- DOCUMENT TEXT START ---\n${textPreview}\n--- DOCUMENT TEXT END ---`;

  return prompt;
}
