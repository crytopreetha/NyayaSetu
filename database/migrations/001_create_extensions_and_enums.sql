-- Migration 001: Extensions and Enumerated Types
-- NyayaSetu Database Schema

-- Enable cryptographic UUID generator if available (built into modern Postgres 13+ natively)
DO $$ BEGIN
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
EXCEPTION
    WHEN OTHERS THEN null;
END $$;

-- User Role: Defines the persona accessing NyayaSetu
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('CITIZEN', 'LAWYER', 'ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Lawyer Verification Status
DO $$ BEGIN
    CREATE TYPE verification_state AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Case Lifecycle States
DO $$ BEGIN
    CREATE TYPE case_status_type AS ENUM (
        'DRAFT',
        'ANALYZING',
        'OPEN',
        'IN_REVIEW',
        'ACTIVE',
        'RESOLVED',
        'CLOSED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Urgency/Priority Levels
DO $$ BEGIN
    CREATE TYPE urgency_level AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Document Processing Workflow States
DO $$ BEGIN
    CREATE TYPE doc_process_status AS ENUM (
        'PENDING',
        'EXTRACTING',
        'ANALYZED',
        'FAILED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Deadline Status
DO $$ BEGIN
    CREATE TYPE deadline_state AS ENUM ('PENDING', 'COMPLETED', 'MISSED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
