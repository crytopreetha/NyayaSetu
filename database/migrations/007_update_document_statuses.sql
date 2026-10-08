-- Migration 007: Update Document Processing Statuses
-- Converts processing_status to VARCHAR(50) to allow: UPLOADED, PROCESSING, ANALYZING, COMPLETED, FAILED

ALTER TABLE documents ALTER COLUMN processing_status DROP DEFAULT;
ALTER TABLE documents ALTER COLUMN processing_status TYPE VARCHAR(50);
ALTER TABLE documents ALTER COLUMN processing_status SET DEFAULT 'UPLOADED';

-- Optional: ensure check constraint for valid statuses
DO $$ BEGIN
    ALTER TABLE documents ADD CONSTRAINT chk_processing_status 
    CHECK (processing_status IN ('UPLOADED', 'PROCESSING', 'ANALYZING', 'COMPLETED', 'FAILED', 'PENDING', 'EXTRACTING', 'ANALYZED'));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
