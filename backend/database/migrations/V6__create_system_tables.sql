-- V6: Create system, referral, withdrawal, and settings tables
-- ClipCapital Database Schema — Lead Dev / Architecture
-- Flyway Migration: V6

-- ============================================================
-- SYSTEM LOGS (Audit Trail)
-- ============================================================
CREATE TABLE IF NOT EXISTS system_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  event_type  TEXT NOT NULL,
  details     JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_syslogs_user ON system_logs(user_id);
CREATE INDEX idx_syslogs_event ON system_logs(event_type);
CREATE INDEX idx_syslogs_created ON system_logs(created_at DESC);

-- ============================================================
-- REFERRALS
-- ============================================================
CREATE TABLE IF NOT EXISTS referrals (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending', 'joined')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(referrer_id, referred_id)
);

CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);

-- ============================================================
-- REVENUE GOALS
-- ============================================================
CREATE TABLE IF NOT EXISTS revenue_goals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  monthly_target  NUMERIC NOT NULL DEFAULT 0,
  month           INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  year            INT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, month, year)
);

-- ============================================================
-- WITHDRAWAL REQUESTS
-- ============================================================
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount          DECIMAL(12,2) NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  bank_name       TEXT NOT NULL,
  account_number  TEXT NOT NULL,
  account_name    TEXT NOT NULL,
  momo_number     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at    TIMESTAMPTZ,
  notes           TEXT
);

CREATE INDEX idx_withdraw_user ON withdrawal_requests(user_id);
CREATE INDEX idx_withdraw_status ON withdrawal_requests(status);

-- ============================================================
-- SYSTEM SETTINGS (App Configuration)
-- ============================================================
CREATE TABLE IF NOT EXISTS system_settings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key         TEXT NOT NULL UNIQUE,
  value       JSONB NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed default settings
INSERT INTO system_settings (key, value) VALUES
  ('interest_rate', '10.0'::jsonb),
  ('maintenance_mode', 'false'::jsonb),
  ('min_loan_amount', '50.00'::jsonb),
  ('max_loan_amount', '5000.00'::jsonb)
ON CONFLICT (key) DO NOTHING;
