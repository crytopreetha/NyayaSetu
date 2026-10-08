import '../config/load-env.js';
import { GeminiService } from '../services/ai/gemini.service.js';
import { buildSystemInstruction, buildUserPrompt } from '../services/ai/prompt-builder.js';
import type { AnalysisInput } from '../services/ai/types.js';

async function testGeminiModule() {
  console.log('🤖 Testing NyayaSetu Gemini AI Service Module...\n');

  // 1. Verify isConfigured check
  const isConfigured = GeminiService.isConfigured();
  console.log(`1. Gemini API Key configured in backend environment: ${isConfigured ? 'YES' : 'NO (Graceful fallback mode active)'}`);

  // 2. Test Prompt Builder
  const sampleInput: AnalysisInput = {
    extractedText: `BEFORE THE REVENUE TEHSILDAR, HAVELI, PUNE
Mutation Entry No: 4892 / Survey No: 124/2A
Notice of Proposed Mutation and Demarcation Survey
Date: 15 October 2024

To:
1. Shri Ramesh Tukaram Patil (Applicant / Khatedar)
2. Shri Suresh Vithal Jagtap (Opponent / Adjoining Landholder)

Subject: Objection against recorded partition and request for joint demarcation survey.

Please take notice that an objection has been lodged regarding the boundary demarcation of Survey No. 124/2A admeasuring 0.45 Hectares. Both parties are directed to appear in person before the Circle Officer on 10 November 2024 at 11:00 AM with original 7/12 extracts, Ferfar entries, and spot measurement receipts. Failure to attend will result in ex-parte survey orders under Section 150 of the Maharashtra Land Revenue Code, 1966.

By Order,
Tahsildar Haveli, Pune`,
    userLanguage: 'en',
    documentType: 'Notice',
    caseMetadata: {
      caseNumber: 'NS-2024-001',
      caseTitle: 'Patil vs Jagtap Land Demarcation',
      caseCategory: 'LAND_DISPUTE',
      jurisdiction: 'Haveli, Pune',
    },
  };

  const sysInstruction = buildSystemInstruction();
  const userPrompt = buildUserPrompt(sampleInput);

  console.log('2. System Instruction generated:');
  console.log(`   Length: ${sysInstruction.length} chars`);
  console.log(`   Enforces No Legal Advice: ${sysInstruction.includes('Do NOT make definitive legal conclusions')}`);
  console.log(`   Enforces Evidence-Based Risk: ${sysInstruction.includes('EVIDENCE-BASED RISK')}`);

  console.log('\n3. User Prompt generated:');
  console.log(`   Length: ${userPrompt.length} chars`);
  console.log(`   Contains Document Text: ${userPrompt.includes('BEFORE THE REVENUE TEHSILDAR')}`);
  console.log(`   Specifies Target Language: ${userPrompt.includes('Language to Respond In: en')}`);

  // 4. Test Multi-language Prompt generation (Hindi & Marathi)
  const hiPrompt = buildUserPrompt({ ...sampleInput, userLanguage: 'hi' });
  const mrPrompt = buildUserPrompt({ ...sampleInput, userLanguage: 'mr' });
  console.log(`\n4. Multilingual Prompts:`);
  console.log(`   Hindi Target: ${hiPrompt.includes('Language to Respond In: hi')}`);
  console.log(`   Marathi Target: ${mrPrompt.includes('Language to Respond In: mr')}`);

  // 5. Test Live Gemini Call if API key exists
  if (isConfigured) {
    console.log('\n5. Executing live Gemini API call...');
    try {
      const result = await GeminiService.analyzeDocument(sampleInput);
      console.log('   ✅ Live Gemini Analysis succeeded!');
      console.log(`   Document Type: ${result.documentType}`);
      console.log(`   Summary: ${result.summary.substring(0, 100)}...`);
      console.log(`   Parties identified: ${result.parties.length}`);
      console.log(`   Deadlines found: ${result.deadlines.length}`);
      console.log(`   Claims: ${result.claims.length}`);
      console.log(`   Risk indicators: ${result.riskIndicators.length}`);
      console.log(`   Professional review recommended: ${result.professionalReviewRecommended}`);
    } catch (err: any) {
      console.log(`   ⚠️ Live call failed (may be invalid/quota key): ${err.message}`);
    }
  } else {
    console.log('\n5. Live call skipped: GEMINI_API_KEY is not set. The application is operating in full resilient fallback mode.');
  }

  console.log('\n🎉 Gemini AI service module verification complete!\n');
}

testGeminiModule().catch(console.error);
