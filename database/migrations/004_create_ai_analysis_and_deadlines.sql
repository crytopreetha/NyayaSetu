-- Migration 004: AI Analysis and Case Deadlines Tables
-- Relationships:
-- cases -> ai_analysis
-- documents -> ai_analysis (1:1 with source document)
-- cases -> case_deadlines
-- users -> case_deadlines (author reference)

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
    confidence_score NUMERIC(3, 2) DEFAULT 0.90 CHECK (confidence_score >= 0.00 AND confidence_score <= 1.00),
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
