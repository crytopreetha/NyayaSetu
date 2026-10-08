-- Seed / Demo Data for NyayaSetu
-- Populates realistic multilingual legal scenarios across all 9 tables

-- ============================================================================
-- 1. SEED USERS
-- ============================================================================
INSERT INTO users (id, auth_id, email, phone, full_name, role, preferred_language)
VALUES
  -- Citizen 1: Ramesh Kumar (Hindi speaker)
  ('11111111-1111-1111-1111-111111111111', gen_random_uuid(), 'ramesh.kumar@example.com', '+919876543210', 'Ramesh Kumar', 'CITIZEN', 'hi'),
  -- Citizen 2: Ananya Sengupta (Bengali speaker)
  ('11111111-1111-1111-1111-111111111112', gen_random_uuid(), 'ananya.sengupta@example.com', '+919876543211', 'Ananya Sengupta', 'CITIZEN', 'bn'),
  -- Citizen 3: Karthik Subramanian (Tamil speaker)
  ('11111111-1111-1111-1111-111111111113', gen_random_uuid(), 'karthik.subramanian@example.com', '+919876543212', 'Karthik Subramanian', 'CITIZEN', 'ta'),
  -- Lawyer 1: Adv. Priya Sharma (Delhi HC)
  ('22222222-2222-2222-2222-222222222221', gen_random_uuid(), 'adv.priya.sharma@example.com', '+919812345671', 'Adv. Priya Sharma', 'LAWYER', 'en'),
  -- Lawyer 2: Adv. Rajesh Verma (Consumer & Civil, Bengaluru)
  ('22222222-2222-2222-2222-222222222222', gen_random_uuid(), 'adv.rajesh.verma@example.com', '+919812345672', 'Adv. Rajesh Verma', 'LAWYER', 'en'),
  -- Admin User
  ('00000000-0000-0000-0000-000000000001', gen_random_uuid(), 'admin@nyayasetu.org', '+919800000001', 'NyayaSetu System Admin', 'ADMIN', 'en')
ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- 2. SEED LAWYERS (Profiles extending lawyer users)
-- ============================================================================
INSERT INTO lawyers (id, bar_council_number, bio, specialization, experience_years, city, state, languages_spoken, verification_status, rating, is_available)
VALUES
  (
    '22222222-2222-2222-2222-222222222221',
    'D/1425/2014',
    'Senior advocate practicing civil litigation, property disputes, and tenancy rights in Delhi High Court and district tribunals.',
    ARRAY['Property Law', 'Tenancy Disputes', 'Civil Litigation', 'Consumer Protection'],
    11,
    'New Delhi',
    'Delhi',
    ARRAY['en', 'hi', 'pa'],
    'VERIFIED',
    4.92,
    TRUE
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'KAR/5832/2018',
    'Specialist in Consumer Forum complaints, cyber fraud remedies, and banking dispute resolutions.',
    ARRAY['Consumer Protection', 'Cybercrime & Banking Fraud', 'Labor & Employment'],
    7,
    'Bengaluru',
    'Karnataka',
    ARRAY['en', 'hi', 'kn', 'ta'],
    'VERIFIED',
    4.85,
    TRUE
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 3. SEED CASES
-- ============================================================================
INSERT INTO cases (id, citizen_id, assigned_lawyer_id, case_number, title, description, category, status, urgency, jurisdiction)
VALUES
  -- Case 1: Tenant security deposit dispute (Assigned to Adv. Priya Sharma)
  (
    '33333333-3333-3333-3333-333333333331',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222221',
    'NS-2026-DEL-101',
    'Illegal Withholding of Security Deposit by Landlord',
    'Landlord refused to return Rs 85,000 security deposit after complete tenancy vacancy with 30-day notice and zero property damage.',
    'Property Law',
    'ACTIVE',
    'HIGH',
    'South Delhi Rent Controller Tribunal'
  ),
  -- Case 2: E-Commerce refund failure (Open in pool for review)
  (
    '33333333-3333-3333-3333-333333333332',
    '11111111-1111-1111-1111-111111111112',
    NULL,
    'NS-2026-KOL-102',
    'Unfair Trade Practice - Defective Electronics Refund Denial',
    'Online vendor supplied counterfeit laptop motherboard and rejected return claim despite video proof of delivery unboxing.',
    'Consumer Protection',
    'OPEN',
    'MEDIUM',
    'Kolkata District Consumer Disputes Redressal Commission'
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 4. SEED DOCUMENTS
-- ============================================================================
INSERT INTO documents (id, case_id, uploaded_by, original_name, storage_path, mime_type, file_size_bytes, detected_language, extracted_text, processing_status)
VALUES
  (
    '44444444-4444-4444-4444-444444444441',
    '33333333-3333-3333-3333-333333333331',
    '11111111-1111-1111-1111-111111111111',
    'Legal_Notice_Tenancy_Deposit.pdf',
    'cases/33333333-3333-3333-3333-333333333331/Legal_Notice_Tenancy_Deposit.pdf',
    'application/pdf',
    245760,
    'en',
    'LEGAL NOTICE: Under Section 106 of the Transfer of Property Act, 1882. To: Shri R.K. Gupta. Demand for refund of security deposit amount of Rs. 85,000 within 15 days of receipt of this notice, failing which legal proceedings will be initiated.',
    'ANALYZED'
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 5. SEED AI ANALYSIS
-- ============================================================================
INSERT INTO ai_analysis (id, document_id, case_id, document_type, plain_language_summary, key_entities, critical_dates, risk_indicators, suggested_next_steps, applicable_acts_or_sections, confidence_score, lawyer_reviewed, lawyer_notes)
VALUES
  (
    '55555555-5555-5555-5555-555555555551',
    '44444444-4444-4444-4444-444444444441',
    '33333333-3333-3333-3333-333333333331',
    'Statutory Legal Notice',
    'यह एक औपचारिक कानूनी नोटिस है जिसमें मकान मालिक से 15 दिनों के भीतर 85,000 रुपये की सुरक्षा जमा राशि वापस करने की मांग की गई है। यदि वे भुगतान नहीं करते हैं, तो सिविल कोर्ट में मुकदमा दायर किया जा सकता है।',
    '{"claim_amount": "Rs 85,000", "sender": "Ramesh Kumar (Tenant)", "recipient": "R.K. Gupta (Landlord)", "location": "New Delhi"}'::JSONB,
    '[{"date": "2026-10-25", "description": "15-day statutory response deadline expires", "is_urgent": true}]'::JSONB,
    '[{"level": "HIGH", "indicator": "Statutory 15-day notice window expiring", "consequence": "Must file civil recovery summary suit under Order 37 CPC if no reply received"}]'::JSONB,
    '["Keep postal speed post tracking receipt safe as evidence of delivery", "Collect all UPI/Bank transfer proofs of original deposit payment", "Consult assigned advocate Adv. Priya Sharma for filing reply/suit"]'::JSONB,
    '[{"act": "Transfer of Property Act, 1882", "section": "Section 106"}, {"act": "Code of Civil Procedure, 1908", "section": "Order XXXVII"}]'::JSONB,
    0.96,
    TRUE,
    'Reviewed by Adv. Priya Sharma. The statutory notice is well-formed. Prepare summary suit draft.'
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 6. SEED CASE DEADLINES
-- ============================================================================
INSERT INTO case_deadlines (id, case_id, created_by, title, description, due_date, priority, status, is_ai_inferred)
VALUES
  (
    '66666666-6666-6666-6666-666666666661',
    '33333333-3333-3333-3333-333333333331',
    '22222222-2222-2222-2222-222222222221',
    'Expiry of 15-day Legal Notice to Landlord',
    'Check if reply or refund received. If not, draft summary suit petition.',
    '2026-10-25',
    'HIGH',
    'PENDING',
    TRUE
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 7. SEED CASE EVENTS (Timeline)
-- ============================================================================
INSERT INTO case_events (id, case_id, actor_id, event_type, title, description, event_date, metadata)
VALUES
  (
    '77777777-7777-7777-7777-777777777771',
    '33333333-3333-3333-3333-333333333331',
    '11111111-1111-1111-1111-111111111111',
    'CASE_CREATED',
    'Case Opened by Citizen',
    'Citizen Ramesh Kumar registered case regarding unreturned security deposit.',
    '2026-10-05 10:30:00+05:30',
    '{"initial_category": "Property Law"}'::JSONB
  ),
  (
    '77777777-7777-7777-7777-777777777772',
    '33333333-3333-3333-3333-333333333331',
    '11111111-1111-1111-1111-111111111111',
    'DOCUMENT_UPLOADED',
    'Legal Notice Uploaded',
    'Document Legal_Notice_Tenancy_Deposit.pdf uploaded for analysis.',
    '2026-10-05 10:32:00+05:30',
    '{"file_type": "application/pdf"}'::JSONB
  ),
  (
    '77777777-7777-7777-7777-777777777773',
    '33333333-3333-3333-3333-333333333331',
    '22222222-2222-2222-2222-222222222221',
    'LAWYER_ASSIGNED',
    'Adv. Priya Sharma Accepted Representation',
    'Case assigned for advocate review and consultation.',
    '2026-10-06 14:15:00+05:30',
    '{"bar_id": "D/1425/2014"}'::JSONB
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 8. SEED MESSAGES
-- ============================================================================
INSERT INTO messages (id, case_id, sender_id, content, is_read)
VALUES
  (
    '88888888-8888-8888-8888-888888888881',
    '33333333-3333-3333-3333-333333333331',
    '11111111-1111-1111-1111-111111111111',
    'नमस्ते वकील साहिबा, मैंने कानूनी नोटिस की प्रति अपलोड कर दी है। क्या मुझे बैंक पासबुक भी जमा करनी होगी?',
    TRUE
  ),
  (
    '88888888-8888-8888-8888-888888888882',
    '33333333-3333-3333-3333-333333333331',
    '22222222-2222-2222-2222-222222222221',
    'नमस्ते रमेश जी। हाँ, कृपया वह बैंक स्टेटमेंट अपलोड करें जिसमें डिपाजिट का भुगतान दिखता हो। हम 25 अक्टूबर तक इंतज़ार करेंगे।',
    FALSE
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 9. SEED NOTIFICATIONS
-- ============================================================================
INSERT INTO notifications (id, user_id, title, message, type, link_url, is_read)
VALUES
  (
    '99999999-9999-9999-9999-999999999991',
    '11111111-1111-1111-1111-111111111111',
    'दस्तावेज़ विश्लेषण तैयार है',
    'आपके कानूनी नोटिस का सरल भाषा में सारांश और जोखिम विश्लेषण तैयार है।',
    'AI_READY',
    '/citizen/cases/33333333-3333-3333-3333-333333333331',
    TRUE
  ),
  (
    '99999999-9999-9999-9999-999999999992',
    '22222222-2222-2222-2222-222222222221',
    'Upcoming Statutory Deadline',
    'Case NS-2026-DEL-101 has a statutory notice deadline expiring on 2026-10-25.',
    'DEADLINE_ALERT',
    '/lawyer/cases/33333333-3333-3333-3333-333333333331',
    FALSE
  )
ON CONFLICT (id) DO NOTHING;
