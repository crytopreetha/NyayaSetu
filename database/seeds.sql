-- Sample Seed Data for NyayaSetu Initial Testing

-- 1. Demo Citizen User
INSERT INTO users (id, email, full_name, role, preferred_language, phone)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'citizen.ramesh@example.com', 'Ramesh Kumar', 'CITIZEN', 'hi', '+919876543210')
ON CONFLICT (email) DO NOTHING;

-- 2. Demo Lawyer User
INSERT INTO users (id, email, full_name, role, preferred_language, phone)
VALUES 
  ('22222222-2222-2222-2222-222222222222', 'adv.priya@example.com', 'Adv. Priya Sharma', 'LAWYER', 'en', '+919812345678')
ON CONFLICT (email) DO NOTHING;

-- 3. Demo Lawyer Profile
INSERT INTO lawyers (id, bar_council_number, bio, specialization, experience_years, city, state, languages_spoken, verification_status, rating)
VALUES
  ('22222222-2222-2222-2222-222222222222', 'D/1425/2015', 'High Court advocate practicing civil, consumer protection, and property dispute matters.', '{"Civil Law", "Consumer Protection", "Property Dispute"}', 9, 'New Delhi', 'Delhi', '{"en", "hi", "pa"}', 'VERIFIED', 4.90)
ON CONFLICT (id) DO NOTHING;

-- 4. Demo Case
INSERT INTO cases (id, citizen_id, assigned_lawyer_id, case_number, title, description, category, status, urgency, jurisdiction)
VALUES
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'NS-2026-DEL-001', 'Tenant Eviction & Deposit Dispute', 'Landlord refuses to return security deposit of Rs 75,000 despite 30 days notice.', 'Property Law', 'ACTIVE', 'HIGH', 'Saket District Court, New Delhi')
ON CONFLICT (id) DO NOTHING;
