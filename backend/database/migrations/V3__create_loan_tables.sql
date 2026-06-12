-- V3: Create loan tables
-- ClipCapital Database Schema — Lead Dev / Architecture
-- Flyway Migration: V3

-- ============================================================
-- LOAN APPLICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS loan_applications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount          NUMERIC NOT NULL CHECK (amount > 0),
  interest_rate   NUMERIC NOT NULL DEFAULT 5.0,
  total_payable   NUMERIC NOT NULL DEFAULT 0,
  balance         NUMERIC NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'approved', 'rejected', 'repaid')),
  term_months     INT NOT NULL DEFAULT 1,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_loan_apps_user ON loan_applications(user_id);
CREATE INDEX idx_loan_apps_status ON loan_applications(status);

-- ============================================================
-- LOAN REPAYMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS loan_repayments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id    UUID NOT NULL REFERENCES loan_applications(id) ON DELETE CASCADE,
  amount     NUMERIC NOT NULL CHECK (amount > 0),
  status     TEXT NOT NULL DEFAULT 'pending'
             CHECK (status IN ('pending', 'confirmed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_loan_repay_loan ON loan_repayments(loan_id);
CREATE INDEX idx_loan_repay_status ON loan_repayments(status);
