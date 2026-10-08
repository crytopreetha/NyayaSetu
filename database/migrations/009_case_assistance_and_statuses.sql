-- Migration 009: Case Assistance Requests & Unified Case Statuses
-- NyayaSetu Schema

-- 1. Update cases.status to VARCHAR(50) with comprehensive statuses
DO $$ BEGIN
    ALTER TABLE cases ALTER COLUMN status DROP DEFAULT;
    ALTER TABLE cases ALTER COLUMN status TYPE VARCHAR(50);
    ALTER TABLE cases ALTER COLUMN status SET DEFAULT 'DRAFT';
EXCEPTION
    WHEN OTHERS THEN null;
END $$;

-- Drop existing check constraint if any
DO $$ BEGIN
    ALTER TABLE cases DROP CONSTRAINT IF EXISTS chk_case_status;
EXCEPTION
    WHEN OTHERS THEN null;
END $$;

-- Add updated check constraint for all 10 standard statuses + backward compatible ones
DO $$ BEGIN
    ALTER TABLE cases ADD CONSTRAINT chk_case_status
    CHECK (status IN (
        'DRAFT',
        'DOCUMENT_UPLOADED',
        'AI_ANALYSIS',
        'AWAITING_LAWYER',
        'LAWYER_REVIEW',
        'LAWYER_ASSIGNED',
        'ACTION_REQUIRED',
        'IN_PROGRESS',
        'RESOLVED',
        'CLOSED',
        -- Legacy support
        'OPEN',
        'IN_REVIEW',
        'ACTIVE',
        'ASSIGNED'
    ));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create case_assistance_requests table
CREATE TABLE IF NOT EXISTS case_assistance_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    citizen_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lawyer_id UUID REFERENCES lawyers(id) ON DELETE CASCADE,
    request_type VARCHAR(50) NOT NULL DEFAULT 'LEGAL_ADVICE',
    status VARCHAR(50) NOT NULL DEFAULT 'NEW',
    message TEXT,
    lawyer_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Constraint on assistance request status
DO $$ BEGIN
    ALTER TABLE case_assistance_requests ADD CONSTRAINT chk_request_status
    CHECK (status IN (
        'NEW',
        'UNDER_REVIEW',
        'INFO_REQUESTED',
        'ACCEPTED',
        'DECLINED',
        'CANCELLED'
    ));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_assistance_case_id ON case_assistance_requests(case_id);
CREATE INDEX IF NOT EXISTS idx_assistance_lawyer_id ON case_assistance_requests(lawyer_id);
CREATE INDEX IF NOT EXISTS idx_assistance_citizen_id ON case_assistance_requests(citizen_id);
CREATE INDEX IF NOT EXISTS idx_assistance_status ON case_assistance_requests(status);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_assigned_lawyer ON cases(assigned_lawyer_id);
