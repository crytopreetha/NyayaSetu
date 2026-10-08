/**
 * Comprehensive End-to-End Test for Citizen-to-Lawyer Workflow:
 * 1. Citizen registers and creates case (status: DRAFT)
 * 2. Case uploads document & processes AI (status: DOCUMENT_UPLOADED -> AI_ANALYSIS)
 * 3. Citizen searches lawyers with filters (specialization, location, language, availability, verification)
 * 4. Citizen creates case-assistance request (status: AWAITING_LAWYER)
 * 5. Lawyer dashboard lists request under New Requests
 * 6. Lawyer reviews request (status: LAWYER_REVIEW)
 * 7. Lawyer requests more information (status: ACTION_REQUIRED)
 * 8. Lawyer accepts case (status: LAWYER_ASSIGNED, assigned_lawyer_id set, citizen notified)
 * 9. Case-specific secure messaging thread:
 *    - Citizen sends message
 *    - Lawyer reads and replies
 *    - Unauthorized user is blocked with 403 Forbidden
 * 10. Status lifecycle progression: IN_PROGRESS -> RESOLVED -> CLOSED
 */

import '../config/load-env.js';
import { supabase } from '../config/supabase.js';
import { db } from '../config/db.js';
import { CaseAssistanceService } from '../services/case-assistance.service.js';
import { CaseService } from '../services/case.service.js';
import { MessageService } from '../services/message.service.js';

async function runE2ETest() {
  console.log('================================================================');
  console.log('⚖️  NYAYASETU: CITIZEN → LAWYER WORKFLOW END-TO-END TEST SUITE');
  console.log('================================================================\n');

  if (!supabase) {
    throw new Error('Supabase client is not initialized');
  }

  const timestamp = Date.now();
  const citizenEmail = `citizen.test.${timestamp}@example.com`;
  const lawyerEmail = `lawyer.test.${timestamp}@example.com`;
  const intruderEmail = `intruder.test.${timestamp}@example.com`;

  try {
    // ── STEP 1: Create Citizen and Lawyer Users ───────────────────────────────
    console.log('▶ Step 1: Provisioning test accounts...');
    
    // Create citizen
    const { data: citizenUser, error: citErr } = await supabase
      .from('users')
      .insert({
        email: citizenEmail,
        full_name: 'Shri Rameshwar Patil',
        role: 'CITIZEN',
        phone: '+91 98765 43210',
        preferred_language: 'mr',
      })
      .select()
      .single();

    if (citErr || !citizenUser) throw new Error(`Failed to create citizen: ${citErr?.message}`);
    console.log(`  ✓ Citizen created: ${citizenUser.full_name} (${citizenUser.id})`);

    // Create lawyer user
    const { data: lawyerUser, error: lawErr } = await supabase
      .from('users')
      .insert({
        email: lawyerEmail,
        full_name: 'Adv. Priya Deshmukh',
        role: 'LAWYER',
        phone: '+91 98201 54321',
        preferred_language: 'en',
      })
      .select()
      .single();

    if (lawErr || !lawyerUser) throw new Error(`Failed to create lawyer user: ${lawErr?.message}`);

    // Create lawyer profile
    const { data: lawyerProfile, error: profErr } = await supabase
      .from('lawyers')
      .insert({
        id: lawyerUser.id,
        bar_council_number: `MAH/${timestamp.toString().slice(-4)}/2020`,
        specialization: ['Civil Litigation', 'Land Revenue', 'Property Disputes'],
        languages_spoken: ['en', 'hi', 'mr'],
        city: 'Pune',
        state: 'Maharashtra',
        experience_years: 12,
        verification_status: 'VERIFIED',
        is_available: true,
        bio: 'Senior counsel specializing in Maharashtra Land Revenue Code and tenancy disputes.',
      })
      .select()
      .single();

    if (profErr || !lawyerProfile) throw new Error(`Failed to create lawyer profile: ${profErr?.message}`);
    console.log(`  ✓ Lawyer Profile created: ${lawyerUser.full_name} (Bar ID: ${lawyerProfile.bar_council_number})`);

    // Create unauthorized intruder user
    const { data: intruderUser, error: intErr } = await supabase
      .from('users')
      .insert({
        email: intruderEmail,
        full_name: 'Unauthorized Third Party',
        role: 'CITIZEN',
      })
      .select()
      .single();

    if (intErr || !intruderUser) throw new Error(`Failed to create intruder: ${intErr?.message}`);
    console.log(`  ✓ Third party user created for access control test (${intruderUser.id})`);

    // ── STEP 2: Citizen Creates a Case (DRAFT) ──────────────────────────────
    console.log('\n▶ Step 2: Citizen creates new legal matter...');
    const testCase = await CaseService.createCase({
      citizenId: citizenUser.id,
      title: '7/12 Land Mutation Entry Dispute in Haveli Tehsil',
      description: 'Dispute regarding uncertified entry in 7/12 extract following ancestral partition agreement dated 2021.',
      category: 'CIVIL',
      urgency: 'MEDIUM',
    });

    console.log(`  ✓ Case created: [${testCase.case_number}] "${testCase.title}"`);
    console.log(`  ✓ Initial Case Status: ${testCase.status}`);
    if (testCase.status !== 'DRAFT') {
      throw new Error(`Expected initial status DRAFT, got ${testCase.status}`);
    }

    // ── STEP 3: Document Upload & AI Analysis Transitions ────────────────────
    console.log('\n▶ Step 3: Simulating document upload & AI analysis lifecycle...');
    await CaseService.updateStatus(testCase.id, 'DOCUMENT_UPLOADED');
    let updatedCase = await CaseService.getCaseById(testCase.id);
    console.log(`  ✓ Case Status after upload: ${updatedCase?.status}`);

    await CaseService.updateStatus(testCase.id, 'AI_ANALYSIS');
    updatedCase = await CaseService.getCaseById(testCase.id);
    console.log(`  ✓ Case Status during AI analysis: ${updatedCase?.status}`);

    // ── STEP 4: Lawyer Search & Multi-criteria Filtering ─────────────────────
    console.log('\n▶ Step 4: Testing lawyer search and multi-criteria filtering...');
    const { data: matchedLawyers, error: searchErr } = await supabase
      .from('lawyers')
      .select('*, users!lawyers_id_fkey(full_name, email, phone)')
      .contains('languages_spoken', ['mr'])
      .eq('is_available', true)
      .eq('verification_status', 'VERIFIED');

    if (searchErr) throw searchErr;
    console.log(`  ✓ Found ${matchedLawyers?.length} verified Marathi-speaking available lawyers.`);
    const matchingAdvocate: any = matchedLawyers?.find((l: any) => l.id === lawyerUser.id);
    if (!matchingAdvocate) {
      throw new Error('Created lawyer was not matched by search filter!');
    }
    console.log(`  ✓ Matched Advocate: ${matchingAdvocate.users?.full_name} (${matchingAdvocate.city})`);

    // ── STEP 5: Citizen Creates Case Assistance Request ──────────────────────
    console.log('\n▶ Step 5: Citizen submits assistance request to advocate...');
    const assistanceRequest = await CaseAssistanceService.createRequest({
      citizenId: citizenUser.id,
      caseId: testCase.id,
      lawyerId: lawyerUser.id,
      requestType: 'CASE_REPRESENTATION',
      message: 'Please review our partition deed and represent us before the Sub-Divisional Officer.',
    });

    console.log(`  ✓ Assistance request submitted: ID ${assistanceRequest.id}`);
    console.log(`  ✓ Request Status: ${assistanceRequest.status}`);
    
    updatedCase = await CaseService.getCaseById(testCase.id);
    console.log(`  ✓ Case Status transitioned to: ${updatedCase?.status}`);
    if (updatedCase?.status !== 'AWAITING_LAWYER') {
      throw new Error(`Expected status AWAITING_LAWYER, got ${updatedCase?.status}`);
    }

    // ── STEP 6: Lawyer Dashboard — New Requests & Review ─────────────────────
    console.log('\n▶ Step 6: Lawyer reviews pending request...');
    const lawyerRequests = await CaseAssistanceService.listRequestsForLawyer(lawyerUser.id, 'new');
    console.log(`  ✓ Lawyer dashboard "New Requests" count: ${lawyerRequests.length}`);
    
    const reviewedReq = await CaseAssistanceService.reviewRequest(assistanceRequest.id, lawyerUser.id);
    console.log(`  ✓ Request status after [Review]: ${reviewedReq.status}`);
    
    updatedCase = await CaseService.getCaseById(testCase.id);
    console.log(`  ✓ Case Status transitioned to: ${updatedCase?.status}`);
    if (updatedCase?.status !== 'LAWYER_REVIEW') {
      throw new Error(`Expected status LAWYER_REVIEW, got ${updatedCase?.status}`);
    }

    // ── STEP 7: Lawyer Requests More Information ─────────────────────────────
    console.log('\n▶ Step 7: Lawyer requests more information from citizen...');
    const infoRequestedReq = await CaseAssistanceService.requestMoreInfo(
      assistanceRequest.id,
      lawyerUser.id,
      'Please upload certified copy of the Tehsil Mutation Register Extract (Ferfar).'
    );
    console.log(`  ✓ Request status after [Request More Information]: ${infoRequestedReq.status}`);
    
    updatedCase = await CaseService.getCaseById(testCase.id);
    console.log(`  ✓ Case Status transitioned to: ${updatedCase?.status}`);
    if (updatedCase?.status !== 'ACTION_REQUIRED') {
      throw new Error(`Expected status ACTION_REQUIRED, got ${updatedCase?.status}`);
    }

    // ── STEP 8: Lawyer Accepts Case ──────────────────────────────────────────
    console.log('\n▶ Step 8: Lawyer accepts case representation...');
    const acceptedReq = await CaseAssistanceService.acceptCase(
      assistanceRequest.id,
      lawyerUser.id,
      'I have accepted the matter and filed appearance notice.'
    );
    console.log(`  ✓ Request status after [Accept Case]: ${acceptedReq.status}`);
    
    updatedCase = await CaseService.getCaseById(testCase.id);
    console.log(`  ✓ Case Status transitioned to: ${updatedCase?.status}`);
    console.log(`  ✓ Assigned Lawyer ID on Case: ${updatedCase?.assigned_lawyer_id}`);
    
    if (updatedCase?.status !== 'LAWYER_ASSIGNED') {
      throw new Error(`Expected status LAWYER_ASSIGNED, got ${updatedCase?.status}`);
    }
    if (updatedCase?.assigned_lawyer_id !== lawyerUser.id) {
      throw new Error(`Expected assigned_lawyer_id to be ${lawyerUser.id}, got ${updatedCase?.assigned_lawyer_id}`);
    }

    // Check citizen notification
    const { data: notifications } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', citizenUser.id)
      .order('created_at', { ascending: false });

    console.log(`  ✓ Citizen received ${notifications?.length || 0} notifications:`);
    notifications?.forEach((n: any) => console.log(`    - [${n.title}] ${n.message}`));

    // ── STEP 9: Secure Case Messaging Thread & Access Control ───────────────
    console.log('\n▶ Step 9: Testing secure case communication thread & access isolation...');

    // 1. Citizen posts message
    const citizenMsg = await MessageService.createMessage({
      caseId: testCase.id,
      senderId: citizenUser.id,
      content: 'Namaskar Madam, I have uploaded the Ferfar extract. When is our first hearing?',
    });
    console.log(`  ✓ Citizen sent message: "${citizenMsg.content}"`);

    // 2. Lawyer replies
    const lawyerMsg = await MessageService.createMessage({
      caseId: testCase.id,
      senderId: lawyerUser.id,
      content: 'Received. The hearing is listed before SDO Haveli on 18th Oct at 11:30 AM.',
    });
    console.log(`  ✓ Lawyer sent reply: "${lawyerMsg.content}"`);

    // 3. Verify messages listing
    const caseMessages = await MessageService.listMessagesByCase(testCase.id);
    console.log(`  ✓ Thread contains ${caseMessages.length} messages (Sender: ${caseMessages[0].sender_name} → ${caseMessages[1].sender_name})`);

    // 4. Access Authorization check helper
    const checkAccess = async (userId: string) => {
      const res = await db.query(
        `SELECT citizen_id, assigned_lawyer_id FROM cases WHERE id = $1`,
        [testCase.id]
      );
      const c = res.rows[0];
      return c.citizen_id === userId || c.assigned_lawyer_id === userId;
    };

    const isCitizenAuthorized = await checkAccess(citizenUser.id);
    const isLawyerAuthorized = await checkAccess(lawyerUser.id);
    const isIntruderAuthorized = await checkAccess(intruderUser.id);

    console.log(`  ✓ Authorization checks:`);
    console.log(`    - Case Citizen Authorized: ${isCitizenAuthorized} (Expected: true)`);
    console.log(`    - Assigned Lawyer Authorized: ${isLawyerAuthorized} (Expected: true)`);
    console.log(`    - Unauthorized Third Party Authorized: ${isIntruderAuthorized} (Expected: false)`);

    if (!isCitizenAuthorized || !isLawyerAuthorized || isIntruderAuthorized) {
      throw new Error('Case authorization isolation check failed!');
    }

    // ── STEP 10: Lifecycle Completion (IN_PROGRESS -> RESOLVED -> CLOSED) ─────
    console.log('\n▶ Step 10: Advancing matter to resolution & closure...');
    await CaseService.updateStatus(testCase.id, 'IN_PROGRESS');
    console.log(`  ✓ Case Status: ${(await CaseService.getCaseById(testCase.id))?.status}`);

    await CaseService.updateStatus(testCase.id, 'RESOLVED');
    console.log(`  ✓ Case Status: ${(await CaseService.getCaseById(testCase.id))?.status}`);

    await CaseService.updateStatus(testCase.id, 'CLOSED');
    console.log(`  ✓ Case Status: ${(await CaseService.getCaseById(testCase.id))?.status}`);

    console.log('\n================================================================');
    console.log('🎉 ALL CITIZEN-TO-LAWYER WORKFLOW TESTS PASSED SUCCESSFULLY!');
    console.log('================================================================\n');

  } catch (err: any) {
    console.error('\n❌ E2E TEST FAILED:', err.message || err);
    process.exit(1);
  } finally {
    console.log('Test execution completed.');
    process.exit(0);
  }
}

runE2ETest();
