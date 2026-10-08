-- Migration 003: Cases and Documents Tables
-- Relationships:
-- users -> cases (citizen ownership)
-- lawyers -> cases (advocate assignment)
-- cases -> documents (files attached to a case)
-- users -> documents (uploader reference)

-- 3. CASES TABLE
CREATE TABLE IF NOT EXISTS cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    citizen_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    assigned_lawyer_id UUID REFERENCES lawyers(id) ON DELETE SET NULL,
    case_number VARCHAR(50) UNIQUE NOT NULL,
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
    file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes > 0),
    detected_language VARCHAR(10),
    extracted_text TEXT,
    processing_status doc_process_status NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
