-- V2: Create Susu (savings circle) tables
-- ClipCapital Database Schema — Lead Dev / Architecture
-- Flyway Migration: V2

-- ============================================================
-- SUSU GROUPS
-- ============================================================
CREATE TABLE IF NOT EXISTS susu_groups (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name            TEXT NOT NULL,
  members_count   INT NOT NULL DEFAULT 0,
  contribution    NUMERIC NOT NULL,
  frequency       TEXT NOT NULL CHECK (frequency IN ('Daily', 'Weekly')),
  pot             NUMERIC NOT NULL DEFAULT 0,
  cycle_index     INT NOT NULL DEFAULT 0,
  invite_code     TEXT UNIQUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_susu_groups_owner ON susu_groups(owner_id);
CREATE INDEX idx_susu_groups_invite ON susu_groups(invite_code);

-- ============================================================
-- SUSU MEMBERSHIPS
-- ============================================================
CREATE TABLE IF NOT EXISTS susu_memberships (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  group_id      UUID NOT NULL REFERENCES susu_groups(id) ON DELETE CASCADE,
  payout_order  INT,
  has_received  BOOLEAN NOT NULL DEFAULT FALSE,
  joined_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, group_id)
);

CREATE INDEX idx_susu_memberships_user ON susu_memberships(user_id);
CREATE INDEX idx_susu_memberships_group ON susu_memberships(group_id);

-- ============================================================
-- SUSU CONTRIBUTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS susu_contributions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  group_id        UUID NOT NULL REFERENCES susu_groups(id) ON DELETE CASCADE,
  amount          NUMERIC NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'paid', 'confirmed')),
  momo_number     TEXT,
  transaction_ref TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_susu_contrib_user ON susu_contributions(user_id);
CREATE INDEX idx_susu_contrib_group ON susu_contributions(group_id);
CREATE INDEX idx_susu_contrib_status ON susu_contributions(status);

-- ============================================================
-- SUSU PAYOUTS
-- ============================================================
CREATE TABLE IF NOT EXISTS susu_payouts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    UUID NOT NULL REFERENCES susu_groups(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount      NUMERIC NOT NULL,
  cycle_index INT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_susu_payouts_group ON susu_payouts(group_id);
