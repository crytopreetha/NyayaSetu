-- Migration 002: Add password_hash to users for JWT-based local authentication
-- Run this in your Supabase SQL Editor after migration 001.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Index for fast email lookups during login
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

COMMENT ON COLUMN users.password_hash IS 'bcrypt hash of the user password for local JWT auth. Never store plaintext.';
