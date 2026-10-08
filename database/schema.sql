-- NyayaSetu PostgreSQL / Supabase Schema Definition
-- Generated for Phase 1 Architecture

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Custom Enum Types
CREATE TYPE user_role AS ENUM ('CITIZEN', 'LAWYER', 'ADMIN');
CREATE TYPE verification_state AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');
CREATE TYPE case_status_type AS ENUM ('DRAFT', 'ANALYZING', 'OPEN', 'IN_REVIEW', 'ACTIVE', 'RESOLVED', 'CLOSED');
CREATE TYPE urgency_level AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE doc_process_status AS ENUM ('PENDING', 'EXTRACTING', 'ANALYZED', 'FAILED');
CREATE TYPE deadline_state AS ENUM ('PENDING', 'COMPLETED', 'MISSED');

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_id UUID UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    full_name VARCHAR(150) NOT NULL,
    role user_role NOT NULL DEFAULT 'CITIZEN',
    preferred_language VARCHAR(10) NOT NULL DEFAULT 'hi',
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. LAWYERS TABLE
CREATE TABLE IF NOT EXISTS lawyers (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    bar_council_number VARCHAR(100) NOT NULL UNIQUE,
    bio TEXT,
    specialization VARCHAR(100)[] NOT NULL DEFAULT '{}',
    experience_years INT NOT NULL DEFAULT 0,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    languages_spoken VARCHAR(20)[] NOT NULL DEFAULT '{"en", "hi"}',
    verification_status verification_state NOT NULL DEFAULT 'PENDING',
    rating NUMERIC(3, 2) DEFAULT 5.00 CHECK (rating >= 0 AND rating <= 5),
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    verification_docs TEXT[],
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. CASES TABLE
CREATE TABLE IF NOT EXISTS cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    citizen_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    assigned_lawyer_id UUID REFERENCES lawyers(id) ON DELETE SET NULL,
    case_number VARCHAR(50) UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    status case_status_type NOT NULL DEFAULT 'DRAFT',
    urgency urgency_level NOT NULL DEFAULT 'MEDIUM',
    jurisdiction VARCHAR(150),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    original_name VARCHAR(255) NOT NULL,
    storage_path TEXT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    detected_language VARCHAR(10),
    extracted_text TEXT,
    processing_status doc_process_status NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. AI ANALYSIS TABLE
CREATE TABLE IF NOT EXISTS ai_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL UNIQUE REFERENCES documents(id) ON DELETE CASCADE,
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    document_type VARCHAR(100),
    plain_language_summary TEXT NOT NULL,
    key_entities JSONB NOT NULL DEFAULT '{}'::JSONB,
    critical_dates JSONB NOT NULL DEFAULT '[]'::JSONB,
    risk_indicators JSONB NOT NULL DEFAULT '[]'::JSONB,
    suggested_next_steps JSONB NOT NULL DEFAULT '[]'::JSONB,
    applicable_acts_or_sections JSONB NOT NULL DEFAULT '[]'::JSONB,
    confidence_score NUMERIC(3, 2) DEFAULT 0.90,
    disclaimer_acknowledged BOOLEAN NOT NULL DEFAULT TRUE,
    lawyer_reviewed BOOLEAN NOT NULL DEFAULT FALSE,
    lawyer_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. CASE DEADLINES TABLE
CREATE TABLE IF NOT EXISTS case_deadlines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE NOT NULL,
    priority urgency_level NOT NULL DEFAULT 'MEDIUM',
    status deadline_state NOT NULL DEFAULT 'PENDING',
    is_ai_inferred BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. CASE EVENTS (Timeline) TABLE
CREATE TABLE IF NOT EXISTS case_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    content TEXT NOT NULL,
    attachments JSONB DEFAULT '[]'::JSONB,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    link_url TEXT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);
CREATE INDEX IF NOT EXISTS idx_lawyers_specialization ON lawyers USING GIN(specialization);
CREATE INDEX IF NOT EXISTS idx_lawyers_languages ON lawyers USING GIN(languages_spoken);
CREATE INDEX IF NOT EXISTS idx_lawyers_city_state ON lawyers(city, state);
CREATE INDEX IF NOT EXISTS idx_cases_citizen_id ON cases(citizen_id);
CREATE INDEX IF NOT EXISTS idx_cases_assigned_lawyer_id ON cases(assigned_lawyer_id);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_documents_case_id ON documents(case_id);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_case_id ON ai_analysis(case_id);
CREATE INDEX IF NOT EXISTS idx_case_deadlines_case_id ON case_deadlines(case_id, due_date);
CREATE INDEX IF NOT EXISTS idx_case_events_case_id ON case_events(case_id, event_date);
CREATE INDEX IF NOT EXISTS idx_messages_case_id ON messages(case_id, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
