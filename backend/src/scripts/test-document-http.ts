import '../config/load-env.js';
import fs from 'fs';
import path from 'path';
import { AuthService } from '../services/auth.service.js';
import { CaseService } from '../services/case.service.js';

async function runHttpUploadTests() {
  console.log('🌐 Starting HTTP Document Upload & Authorization API Tests...\n');

  const BASE_URL = 'http://localhost:5000/api';

  try {
    // 1. Register test user & get JWT token
    const testEmail = `http_doc_user_${Date.now()}@example.com`;
    const authResult = await AuthService.registerCitizen({
      email: testEmail,
      password: 'SecurePassword123!',
      fullName: 'Vikram HTTP Tester',
    });

    const token = authResult.token;
    console.log(`✅ Registered citizen user with JWT: ${authResult.user.id}`);

    // 2. Create a case for this user
    const testCase = await CaseService.createCase({
      citizenId: authResult.user.id,
      title: 'Agricultural Lease Agreement Dispute',
      description: 'Tenancy renewal disagreement under Agricultural Tenancy Act.',
      category: 'PROPERTY',
    });
    console.log(`✅ Case created: ${testCase.id}`);

    // 3. Create a sample valid PDF file
    const tempDir = path.resolve(process.cwd(), 'storage/temp_test');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    // Minimal valid PDF structure with readable text stream
    const pdfPath = path.join(tempDir, 'sample_contract.pdf');
    const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 200 >>
stream
BT
/F1 12 Tf
72 712 Td
(Agricultural Lease Agreement - Dated 10 January 2024. Next hearing on 25 November 2026. Notice issued under Section 150.) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000206 00000 n 
trailer
<< /Size 5 /Root 1 0 R >>
startxref
450
%%EOF`;

    fs.writeFileSync(pdfPath, pdfContent);

    // 4. Test HTTP upload via fetch / FormData
    console.log('\n📤 Testing HTTP POST /api/documents/upload with PDF...');
    const formData = new FormData();
    const pdfBlob = new Blob([fs.readFileSync(pdfPath)], { type: 'application/pdf' });
    formData.append('file', pdfBlob, 'sample_contract.pdf');
    formData.append('caseId', testCase.id);

    const uploadRes = await fetch(`${BASE_URL}/documents/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const uploadJson: any = await uploadRes.json();
    console.log(`   Response status: ${uploadRes.status}`);
    console.log(`   Response body:`, uploadJson);

    if (uploadRes.status !== 201 || !uploadJson.success) {
      throw new Error(`Upload failed with status ${uploadRes.status}: ${JSON.stringify(uploadJson)}`);
    }

    const docId = uploadJson.data.id;
    console.log(`   ✅ Document uploaded successfully. ID = ${docId}`);

    // 5. Poll status endpoint: GET /api/documents/:id/status
    console.log('\n⏳ Polling GET /api/documents/:id/status until COMPLETED...');
    let pollDoc: any = null;
    let attempts = 0;
    while (attempts < 25) {
      await new Promise((r) => setTimeout(r, 600));
      const statusRes = await fetch(`${BASE_URL}/documents/${docId}/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const statusJson: any = await statusRes.json();
      pollDoc = statusJson.data;
      console.log(`   Poll attempt ${attempts + 1}: status = ${pollDoc?.processingStatus}`);
      if (pollDoc?.processingStatus === 'COMPLETED' || pollDoc?.processingStatus === 'FAILED') {
        break;
      }
      attempts++;
    }

    if (pollDoc?.processingStatus !== 'COMPLETED') {
      throw new Error(`Expected COMPLETED status, got ${pollDoc?.processingStatus}`);
    }
    console.log('   ✅ Document status transitioned to COMPLETED!');
    if (pollDoc.analysis) {
      console.log(`   ✅ AI Analysis attached: "${pollDoc.analysis.plain_language_summary.slice(0, 80)}..."`);
    }

    // 6. Test GET /api/documents/:id/download
    console.log('\n📥 Testing GET /api/documents/:id/download...');
    const downloadRes = await fetch(`${BASE_URL}/documents/${docId}/download`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log(`   Download status: ${downloadRes.status}`);
    const disposition = downloadRes.headers.get('content-disposition');
    console.log(`   Content-Disposition: ${disposition}`);
    if (downloadRes.status !== 200) {
      throw new Error(`Download failed with status ${downloadRes.status}`);
    }
    const downloadedBuffer = await downloadRes.arrayBuffer();
    console.log(`   ✅ Downloaded ${downloadedBuffer.byteLength} bytes matching original file!`);

    // 7. Test invalid file rejection (.exe)
    console.log('\n🚫 Testing invalid file type rejection (.exe)...');
    const badFormData = new FormData();
    const badBlob = new Blob([Buffer.from('executable binary code')], { type: 'application/x-msdownload' });
    badFormData.append('file', badBlob, 'malicious_file.exe');
    badFormData.append('caseId', testCase.id);

    const badRes = await fetch(`${BASE_URL}/documents/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: badFormData,
    });
    const badJson: any = await badRes.json();
    console.log(`   Status: ${badRes.status} (Expected 400 Bad Request)`);
    console.log(`   Error message: ${badJson?.error?.message || badJson?.message}`);
    if (badRes.status !== 400) {
      throw new Error(`Expected 400 for invalid file, got ${badRes.status}`);
    }
    console.log('   ✅ Invalid file extension correctly rejected!');

    // Cleanup
    try {
      if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
      if (fs.existsSync(tempDir)) fs.rmdirSync(tempDir);
    } catch {}

    console.log('\n🎉 ALL HTTP DOCUMENT UPLOAD & AUTH TESTS PASSED!\n');
    process.exit(0);
  } catch (err: any) {
    console.error('\n❌ HTTP Upload Test failed:', err.message || err);
    process.exit(1);
  }
}

runHttpUploadTests();
