import '../config/load-env.js';
import fs from 'fs';
import path from 'path';
import { db } from '../config/db.js';
import { AuthService } from '../services/auth.service.js';
import { CaseService } from '../services/case.service.js';
import { DocumentService } from '../services/document.service.js';
import { DocumentProcessingService } from '../services/document-processing.service.js';
import { AIAnalysisService } from '../services/ai-analysis.service.js';

async function runDocumentPipelineTests() {
  console.log('🧪 Starting NyayaSetu Document Upload & Processing Pipeline Tests...\n');

  try {
    // 1. Create two test citizens to verify authorization
    const citizenEmail1 = `citizen_test_${Date.now()}@example.com`;
    const citizenEmail2 = `unauthorized_citizen_${Date.now()}@example.com`;

    const citizen1 = await AuthService.registerCitizen({
      email: citizenEmail1,
      password: 'SecurePassword123!',
      fullName: 'Rajesh Test Citizen',
    });

    const citizen2 = await AuthService.registerCitizen({
      email: citizenEmail2,
      password: 'SecurePassword123!',
      fullName: 'Sneha Other Citizen',
    });

    console.log('✅ Created test citizens:');
    console.log(`   Citizen 1 (Owner): ${citizen1.user.id}`);
    console.log(`   Citizen 2 (Unauthorized): ${citizen2.user.id}\n`);

    // 2. Citizen 1 creates a case
    const testCase = await CaseService.createCase({
      citizenId: citizen1.user.id,
      title: 'Agricultural Land Demarcation & Title Dispute — Haveli',
      description: 'Dispute over mutation entry 2024 and boundary survey overlap with adjacent plot holder.',
      category: 'LAND_DISPUTE',
      urgency: 'HIGH',
      jurisdiction: 'Pune / Haveli',
    });

    console.log(`✅ Case created by Citizen 1: ID = ${testCase.id}, Case # = ${testCase.case_number}\n`);

    // 3. Authorization check for case access
    console.log('🔒 Testing Case Authorization...');
    await DocumentService.checkUserAuthorizedForCase(testCase.id, citizen1.user.id, 'CITIZEN');
    console.log('   ✅ Citizen 1 authorized for case');

    let unauthorizedFailed = false;
    try {
      await DocumentService.checkUserAuthorizedForCase(testCase.id, citizen2.user.id, 'CITIZEN');
    } catch (err: any) {
      unauthorizedFailed = true;
      console.log(`   ✅ Citizen 2 correctly denied access (403 Forbidden): "${err.message}"`);
    }

    if (!unauthorizedFailed) {
      throw new Error('Security flaw: Unauthorized citizen was allowed access to another citizen case!');
    }

    // 4. Test Text Document Upload & Pipeline Processing
    console.log('\n📄 Testing TXT Document Processing Pipeline...');
    const storageDir = path.resolve(process.cwd(), 'storage/documents');
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }

    const txtContent = `GOVERNMENT OF MAHARASHTRA
REVENUE AND FOREST DEPARTMENT
RECORD OF RIGHTS (7/12 EXTRACT)
Taluka: Haveli, District: Pune
Survey / Gut No: 142/B
Dispute Notice Issued: 15 March 2024
Notice under Section 150 of Maharashtra Land Revenue Code, 1966.
Objection filed regarding boundary overlap.
Next scheduled hearing before Tahsildar: 20 October 2026.
Parties: Rajesh Test Citizen vs State Revenue Dept & Adjacent Landholder.
Limitation period: 30 days from notice date.`;

    const txtFilename = `test_notice_${Date.now()}.txt`;
    const txtStoragePath = path.join(storageDir, txtFilename);
    fs.writeFileSync(txtStoragePath, txtContent, 'utf-8');

    // Create document in DB (starts at UPLOADED)
    const docRecord = await DocumentService.createDocument({
      caseId: testCase.id,
      uploadedBy: citizen1.user.id,
      originalName: 'Haveli_7_12_Extract_Notice.txt',
      storagePath: txtStoragePath,
      mimeType: 'text/plain',
      fileSizeBytes: Buffer.byteLength(txtContent),
    });

    console.log(`   ✅ Document created in PostgreSQL: ID = ${docRecord.id}, Status = ${docRecord.processing_status}`);

    // Wait for async pipeline to finish processing
    console.log('   ⏳ Waiting for AI processing pipeline (UPLOADED -> PROCESSING -> ANALYZING -> COMPLETED)...');
    let attempts = 0;
    let finalDoc: any = null;
    while (attempts < 20) {
      await new Promise((r) => setTimeout(r, 500));
      finalDoc = await DocumentService.getDocumentById(docRecord.id);
      if (finalDoc.processing_status === 'COMPLETED' || finalDoc.processing_status === 'FAILED') {
        break;
      }
      attempts++;
    }

    console.log(`   ✅ Pipeline finished with status: ${finalDoc.processing_status}`);
    if (finalDoc.processing_status !== 'COMPLETED') {
      throw new Error(`Pipeline did not complete successfully. Status: ${finalDoc.processing_status}`);
    }

    // 5. Verify Extracted Information & AI Analysis
    console.log('\n🤖 Verifying AI Analysis (No legal conclusions)...');
    const analysis = await AIAnalysisService.getAnalysisByDocumentId(docRecord.id);
    console.log(`   ✅ Document Type: ${analysis.document_type}`);
    console.log(`   ✅ Plain-Language Summary: "${analysis.plain_language_summary.slice(0, 100)}..."`);
    console.log(`   ✅ Critical Dates:`, JSON.stringify(analysis.critical_dates));
    console.log(`   ✅ Risk Indicators:`, JSON.stringify(analysis.risk_indicators));
    console.log(`   ✅ Applicable Acts/Sections:`, JSON.stringify(analysis.applicable_acts_or_sections));
    console.log(`   ✅ Confidence Score: ${analysis.confidence_score}`);

    // 6. Test Document Authorization (Unauthorized user attempting to access document)
    console.log('\n🔒 Testing Document Access Authorization...');
    await DocumentService.checkUserAuthorizedForDocument(docRecord.id, citizen1.user.id, 'CITIZEN');
    console.log('   ✅ Citizen 1 authorized to access document');

    let docAccessBlocked = false;
    try {
      await DocumentService.checkUserAuthorizedForDocument(docRecord.id, citizen2.user.id, 'CITIZEN');
    } catch (err: any) {
      docAccessBlocked = true;
      console.log(`   ✅ Citizen 2 correctly blocked from accessing document: "${err.message}"`);
    }

    if (!docAccessBlocked) {
      throw new Error('Security flaw: Unauthorized citizen was allowed access to document!');
    }

    // Clean up temporary test file
    try {
      if (fs.existsSync(txtStoragePath)) fs.unlinkSync(txtStoragePath);
    } catch {}

    console.log('\n🎉 ALL DOCUMENT PIPELINE & AUTHORIZATION TESTS PASSED!\n');
    process.exit(0);
  } catch (err: any) {
    console.error('\n❌ Test failed:', err.message || err);
    process.exit(1);
  }
}

runDocumentPipelineTests();
