-- V1: Create profiles and core user tables
-- ClipCapital Database Schema — Lead Dev / Architecture
-- Flyway Migration: V1

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID PRIMARY KEY,
  display_name  TEXT NOT NULL DEFAULT '',
  business_name TEXT NOT NULL DEFAULT '',
  phone_number  TEXT,
  email         TEXT,
  clip_score    INT NOT NULL DEFAULT 650,
  wallet_balance DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  loan_balance  DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  bank_name     TEXT,
  account_number TEXT,
  account_name  TEXT,
  two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  sms_backup_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  privacy       JSONB NOT NULL DEFAULT '{"show_income": true, "show_score": true}'::jsonb,
  location      TEXT,
  business_type TEXT DEFAULT 'Barber',
  bio           TEXT,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_phone ON profiles(phone_number);
CREATE INDEX idx_profiles_email ON profiles(email);

-- ============================================================
-- USER ROLES
-- ============================================================
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'vendor', user');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS user_roles (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role       user_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);

-- ============================================================
-- INCOME ENTRIES
-- ============================================================
CREATE TABLE IF NOT EXISTS income_entries (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount     NUMERIC NOT NULL CHECK (amount > 0),
  note       TEXT NOT NULL DEFAULT '',
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_income_user_date ON income_entries(user_id, entry_date DESC);

-- ============================================================
-- EXPENSE ENTRIES
-- ============================================================
CREATE TABLE IF NOT EXISTS expense_entries (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount     NUMERIC NOT NULL CHECK (amount > 0),
  category   TEXT NOT NULL DEFAULT 'Other',
  note       TEXT NOT NULL DEFAULT '',
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_expense_user_date ON expense_entries(user_id, entry_date DESC);
