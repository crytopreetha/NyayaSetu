-- Migration 006: Performance Indexes & Automated Triggers
-- Comprehensive index strategy for fast queries, joins, and filters

-- ==========================================
-- 1. INDEXES ON USER_ID REFERENCES
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);
CREATE INDEX IF NOT EXISTS idx_cases_citizen_id ON cases(citizen_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_case_deadlines_created_by ON case_deadlines(created_by);
CREATE INDEX IF NOT EXISTS idx_case_events_actor_id ON case_events(actor_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- ==========================================
-- 2. INDEXES ON LAWYER_ID & SPECIALIZATION
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_cases_assigned_lawyer_id ON cases(assigned_lawyer_id);
CREATE INDEX IF NOT EXISTS idx_lawyers_specialization ON lawyers USING GIN(specialization);
CREATE INDEX IF NOT EXISTS idx_lawyers_languages ON lawyers USING GIN(languages_spoken);
CREATE INDEX IF NOT EXISTS idx_lawyers_verification_status ON lawyers(verification_status);

-- ==========================================
-- 3. INDEXES ON CASE STATUS & CATEGORY
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_category ON cases(category);
CREATE INDEX IF NOT EXISTS idx_cases_urgency ON cases(urgency);
CREATE INDEX IF NOT EXISTS idx_cases_status_category ON cases(status, category);

-- ==========================================
-- 4. INDEXES ON LOCATION (CITY, STATE, JURISDICTION)
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_lawyers_city_state ON lawyers(city, state);
CREATE INDEX IF NOT EXISTS idx_cases_jurisdiction ON cases(jurisdiction);

-- ==========================================
-- 5. INDEXES ON CREATED_AT & TIMESTAMPS
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cases_created_at ON cases(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_case_events_event_date ON case_events(case_id, event_date DESC);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(case_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_case_deadlines_due_date ON case_deadlines(case_id, due_date ASC);

-- ==========================================
-- 6. CASE COMPOSITE RELATIONSHIP INDEXES
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_documents_case_id ON documents(case_id);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_case_id ON ai_analysis(case_id);
CREATE INDEX IF NOT EXISTS idx_case_deadlines_case_id ON case_deadlines(case_id);
CREATE INDEX IF NOT EXISTS idx_case_events_case_id ON case_events(case_id);
CREATE INDEX IF NOT EXISTS idx_messages_case_id ON messages(case_id);

-- ==========================================
-- 7. AUTOMATED UPDATED_AT TIMESTAMP TRIGGER
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_lawyers_updated_at ON lawyers;
CREATE TRIGGER trg_lawyers_updated_at
    BEFORE UPDATE ON lawyers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_cases_updated_at ON cases;
CREATE TRIGGER trg_cases_updated_at
    BEFORE UPDATE ON cases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_ai_analysis_updated_at ON ai_analysis;
CREATE TRIGGER trg_ai_analysis_updated_at
    BEFORE UPDATE ON ai_analysis
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
