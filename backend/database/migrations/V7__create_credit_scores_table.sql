-- V7: Create credit_scores table
-- ClipLoans + ClipScore Service — Backend Dev
-- Flyway Migration: V7

-- ============================================================
-- CREDIT SCORES (ClipScore)
-- ============================================================
CREATE TABLE IF NOT EXISTS credit_scores (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score               INT NOT NULL DEFAULT 100 CHECK (score BETWEEN 0 AND 900),
  breakdown           JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- breakdown shape: { base, income_bonus, savings_bonus, loan_bonus, referral_bonus }
  calculated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  next_calculation_at TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX idx_credit_scores_user ON credit_scores(user_id);
CREATE INDEX idx_credit_scores_score ON credit_scores(score DESC);

-- ============================================================
-- LOAN REPAYMENT SCHEDULE (for micro-deduction tracking)
-- ============================================================
CREATE TABLE IF NOT EXISTS repayment_schedule (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id         UUID NOT NULL REFERENCES loan_applications(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  deduction_date  DATE NOT NULL,
  amount_deducted NUMERIC NOT NULL DEFAULT 0,
  balance_before  NUMERIC NOT NULL,
  balance_after   NUMERIC NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'deducted', 'failed')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_repayment_sched_loan ON repayment_schedule(loan_id);
CREATE INDEX idx_repayment_sched_date ON repayment_schedule(deduction_date);
CREATE INDEX idx_repayment_sched_status ON repayment_schedule(status);

-- ============================================================
-- LOAN DISBURSEMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS loan_disbursements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id         UUID NOT NULL REFERENCES loan_applications(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount          NUMERIC NOT NULL,
  method          TEXT NOT NULL DEFAULT 'wallet_credit'
                  CHECK (method IN ('wallet_credit', 'momo_transfer', 'bank_transfer')),
  reference       TEXT UNIQUE NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'completed', 'failed')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at    TIMESTAMPTZ
);

CREATE INDEX idx_disb_loan ON loan_disbursements(loan_id);
CREATE INDEX idx_disb_user ON loan_disbursements(user_id);
CREATE INDEX idx_disb_reference ON loan_disbursements(reference);

-- ============================================================
-- CLIPSCORE HISTORY (audit trail of score changes)
-- ============================================================
CREATE TABLE IF NOT EXISTS clip_score_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  old_score   INT,
  new_score   INT NOT NULL,
  breakdown   JSONB NOT NULL,
  trigger_event TEXT NOT NULL,
  -- trigger_event: 'income_logged', 'susu_confirmed', 'loan_repaid', 'loan_defaulted', 'referral_joined'
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cs_history_user ON clip_score_history(user_id);
CREATE INDEX idx_cs_history_date ON clip_score_history(created_at DESC);
