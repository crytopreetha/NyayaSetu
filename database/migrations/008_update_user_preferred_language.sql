-- Migration 008: Update User Preferred Language Constraints & Default
-- Sets default to 'en' and constrains allowed values to: 'en', 'hi', 'mr'

ALTER TABLE users ALTER COLUMN preferred_language SET DEFAULT 'en';

-- Ensure all existing records are valid ('en', 'hi', 'mr')
UPDATE users 
SET preferred_language = 'en' 
WHERE preferred_language IS NULL OR preferred_language NOT IN ('en', 'hi', 'mr');

DO $$ BEGIN
    ALTER TABLE users ADD CONSTRAINT chk_users_preferred_language 
    CHECK (preferred_language IN ('en', 'hi', 'mr'));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
