-- Migration 002: Users and Lawyers Tables
-- Relationships: users -> lawyers (1:1 optional extension)

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
-- Represents the verified legal advocate profile extending users (where role = 'LAWYER')
CREATE TABLE IF NOT EXISTS lawyers (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    bar_council_number VARCHAR(100) NOT NULL UNIQUE,
    bio TEXT,
    specialization TEXT[] NOT NULL DEFAULT '{}',
    experience_years INT NOT NULL DEFAULT 0 CHECK (experience_years >= 0),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    languages_spoken VARCHAR(20)[] NOT NULL DEFAULT '{"en", "hi"}',
    verification_status verification_state NOT NULL DEFAULT 'PENDING',
    rating NUMERIC(3, 2) DEFAULT 5.00 CHECK (rating >= 0.00 AND rating <= 5.00),
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    verification_docs TEXT[] DEFAULT '{}',
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
