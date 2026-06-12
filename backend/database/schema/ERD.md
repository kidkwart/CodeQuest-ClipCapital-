# ClipCapital — Database Schema (ERD)

> **Source of truth** — maintained by Lead Dev / Architecture.
> Migrations live in `database/migrations/` (Flyway naming convention).
> All tables target **PostgreSQL 15+** on Supabase.

---

## Entity-Relationship Diagram

```
┌──────────────────────┐       ┌──────────────────────┐
│      profiles        │       │      user_roles       │
├──────────────────────┤       ├──────────────────────┤
│ id          UUID  PK │◄──┐   │ user_id  UUID   FK   │──► profiles.id
│ display_name TEXT    │   │   │ role  ENUM            │
│ business_name TEXT   │   │   │   (admin|vendor|user) │
│ phone_number TEXT    │   │   └──────────────────────┘
│ email TEXT           │   │
│ clip_score  INT      │   │   ┌──────────────────────┐
│ wallet_balance DEC   │   │   │   income_entries      │
│ loan_balance DEC     │   │   ├──────────────────────┤
│ bank_name TEXT       │   ├──►│ id          UUID  PK  │
│ account_number TEXT  │   │   │ user_id  UUID   FK    │──► profiles.id
│ account_name TEXT    │   │   │ amount     NUMERIC    │
│ two_factor BOOLEAN   │   │   │ note       TEXT       │
│ sms_backup  BOOLEAN  │   │   │ entry_date DATE       │
│ privacy    JSONB     │   │   │ created_at TIMESTAMPTZ│
│ avatar_url TEXT      │   │   └──────────────────────┘
│ created_at TIMESTAMPTZ   │
│ updated_at TIMESTAMPTZ   │   ┌──────────────────────┐
└──────────────────────┘   │   │  expense_entries      │
        │                  │   ├──────────────────────┤
        │                  ├──►│ id          UUID  PK  │
        │                  │   │ user_id  UUID   FK    │──► profiles.id
        │                  │   │ amount     NUMERIC    │
        │                  │   │ category   TEXT       │
        │                  │   │ note       TEXT       │
        │                  │   │ entry_date DATE       │
        │                  │   │ created_at TIMESTAMPTZ│
        │                  │   └──────────────────────┘
        │                  │
        │                  │   ┌──────────────────────┐
        │                  │   │    susu_groups        │
        │                  │   ├──────────────────────┤
        │                  │   │ id            UUID PK │
        │                  │   │ owner_id  UUID  FK    │──► profiles.id
        │                  │   │ name         TEXT     │
        │                  │   │ members_count INT     │
        │                  │   │ contribution NUMERIC  │
        │                  │   │ frequency    TEXT     │
        │                  │   │   (Daily|Weekly)      │
        │                  │   │ pot          NUMERIC  │
        │                  │   │ cycle_index   INT     │
        │                  │   │ invite_code   TEXT    │
        │                  │   │ created_at TIMESTAMPTZ│
        │                  │   └──────────┬───────────┘
        │                  │              │
        │                  │   ┌──────────▼───────────┐
        │                  │   │ susu_memberships      │
        │                  │   ├──────────────────────┤
        │                  │   │ id         UUID  PK   │
        │                  │   │ user_id  UUID  FK     │──► profiles.id
        │                  │   │ group_id UUID  FK     │──► susu_groups.id
        │                  │   │ payout_order INT      │
        │                  │   │ has_received BOOLEAN  │
        │                  │   │ joined_at TIMESTAMPTZ │
        │                  │   └──────────────────────┘
        │                  │
        │                  │   ┌──────────────────────┐
        │                  │   │ susu_contributions    │
        │                  │   ├──────────────────────┤
        │                  │   │ id         UUID  PK   │
        │                  │   │ user_id  UUID  FK     │──► profiles.id
        │                  │   │ group_id UUID  FK     │──► susu_groups.id
        │                  │   │ amount     NUMERIC    │
        │                  │   │ status     TEXT       │
        │                  │   │   (pending|paid|confirmed)
        │                  │   │ momo_number TEXT      │
        │                  │   │ transaction_ref TEXT  │
        │                  │   │ created_at TIMESTAMPTZ│
        │                  │   └──────────────────────┘
        │                  │
        │                  │   ┌──────────────────────┐
        │                  │   │   susu_payouts        │
        │                  │   ├──────────────────────┤
        │                  │   │ id         UUID  PK   │
        │                  │   │ group_id UUID  FK     │──► susu_groups.id
        │                  │   │ user_id  UUID  FK     │──► profiles.id
        │                  │   │ amount     NUMERIC    │
        │                  │   │ cycle_index INT       │
        │                  │   │ created_at TIMESTAMPTZ│
        │                  │   └──────────────────────┘
        │                  │
        │                  │   ┌──────────────────────┐
        │                  │   │  loan_applications    │
        │                  │   ├──────────────────────┤
        │                  ├──►│ id          UUID  PK  │
        │                  │   │ user_id  UUID   FK    │──► profiles.id
        │                  │   │ amount     NUMERIC    │
        │                  │   │ interest_rate NUMERIC │
        │                  │   │ total_payable NUMERIC │
        │                  │   │ balance     NUMERIC   │
        │                  │   │ status      TEXT      │
        │                  │   │   (pending|approved|rejected|repaid)
        │                  │   │ term_months INT       │
        │                  │   │ created_at TIMESTAMPTZ│
        │                  │   │ updated_at TIMESTAMPTZ│
        │                  │   └──────────┬───────────┘
        │                  │              │
        │                  │   ┌──────────▼───────────┐
        │                  │   │  loan_repayments      │
        │                  │   ├──────────────────────┤
        │                  │   │ id          UUID  PK  │
        │                  │   │ loan_id  UUID   FK    │──► loan_applications.id
        │                  │   │ amount     NUMERIC    │
        │                  │   │ status     TEXT       │
        │                  │   │   (pending|confirmed) │
        │                  │   │ created_at TIMESTAMPTZ│
        │                  │   └──────────────────────┘
        │                  │
        │                  │   ┌──────────────────────┐
        │                  │   │     products          │
        │                  │   ├──────────────────────┤
        │                  ├──►│ id          UUID  PK  │
        │                  │   │ vendor_id UUID  FK    │──► profiles.id
        │                  │   │ name       TEXT       │
        │                  │   │ description TEXT      │
        │                  │   │ price      NUMERIC    │
        │                  │   │ stock      INT        │
        │                  │   │ category   TEXT       │
        │                  │   │ image_url  TEXT       │
        │                  │   │ active     BOOLEAN    │
        │                  │   │ created_at TIMESTAMPTZ│
        │                  │   └──────────┬───────────┘
        │                  │              │
        │                  │   ┌──────────▼───────────┐
        │                  │   │      orders           │
        │                  │   ├──────────────────────┤
        │                  │   │ id          UUID  PK  │
        │                  │   │ user_id  UUID   FK    │──► profiles.id
        │                  │   │ total      NUMERIC    │
        │                  │   │ payment_method TEXT   │
        │                  │   │   (momo|loan|credit)  │
        │                  │   │ momo_number TEXT      │
        │                  │   │ status     TEXT       │
        │                  │   │   (pending|processing|shipped|delivered)
        │                  │   │ created_at TIMESTAMPTZ│
        │                  │   └──────────┬───────────┘
        │                  │              │
        │                  │   ┌──────────▼───────────┐
        │                  │   │    order_items        │
        │                  │   ├──────────────────────┤
        │                  │   │ id          UUID  PK  │
        │                  │   │ order_id  UUID  FK    │──► orders.id
        │                  │   │ product_id UUID FK    │──► products.id
        │                  │   │ vendor_id UUID  FK    │──► profiles.id
        │                  │   │ quantity   INT        │
        │                  │   │ price      NUMERIC    │
        │                  │   └──────────────────────┘
        │                  │
        │                  │   ┌──────────────────────┐
        │                  │   │   notifications       │
        │                  │   ├──────────────────────┤
        │                  ├──►│ id          UUID  PK  │
        │                  │   │ user_id  UUID   FK    │──► profiles.id
        │                  │   │ title      TEXT       │
        │                  │   │ message    TEXT       │
        │                  │   │ type       TEXT       │
        │                  │   │   (loan|susu|order|system)
        │                  │   │ read       BOOLEAN    │
        │                  │   │ created_at TIMESTAMPTZ│
        │                  │   └──────────────────────┘
        │                  │
        │                  │   ┌──────────────────────┐
        │                  │   │   admin_messages      │
        │                  │   ├──────────────────────┤
        │                  ├──►│ id          UUID  PK  │
        │                  │   │ user_id  UUID   FK    │──► profiles.id
        │                  │   │ message    TEXT       │
        │                  │   │ is_from_admin BOOLEAN │
        │                  │   │ read       BOOLEAN    │
        │                  │   │ created_at TIMESTAMPTZ│
        │                  │   └──────────────────────┘
        │                  │
        │                  │   ┌──────────────────────┐
        │                  │   │  product_requests     │
        │                  │   ├──────────────────────┤
        │                  ├──►│ id          UUID  PK  │
        │                  │   │ user_id  UUID   FK    │──► profiles.id
        │                  │   │ product_name TEXT     │
        │                  │   │ description  TEXT     │
        │                  │   │ status  TEXT          │
        │                  │   │   (pending|approved|denied)
        │                  │   │ created_at TIMESTAMPTZ│
        │                  │   └──────────────────────┘
        │                  │
        │                  │   ┌──────────────────────┐
        │                  │   │    referrals          │
        │                  │   ├──────────────────────┤
        │                  ├──►│ id          UUID  PK  │
        │                  │   │ referrer_id UUID FK   │──► profiles.id
        │                  │   │ referred_id UUID FK   │──► profiles.id
        │                  │   │ status     TEXT       │
        │                  │   │   (pending|joined)    │
        │                  │   │ created_at TIMESTAMPTZ│
        │                  │   └──────────────────────┘
        │                  │
        │                  │   ┌──────────────────────┐
        │                  │   │   revenue_goals       │
        │                  │   ├──────────────────────┤
        │                  ├──►│ id          UUID  PK  │
        │                  │   │ user_id  UUID   FK    │──► profiles.id
        │                  │   │ monthly_target NUMERIC│
        │                  │   │ month        INT      │
        │                  │   │ year         INT      │
        │                  │   │ created_at TIMESTAMPTZ│
        │                  │   └──────────────────────┘
        │                  │
        │                  │   ┌──────────────────────┐
        │                  │   │ withdrawal_requests   │
        │                  │   ├──────────────────────┤
        │                  ├──►│ id          UUID  PK  │
        │                  │   │ user_id  UUID   FK    │──► profiles.id
        │                  │   │ amount     NUMERIC    │
        │                  │   │ status     TEXT       │
        │                  │   │   (pending|approved|rejected|completed)
        │                  │   │ bank_name  TEXT       │
        │                  │   │ account_number TEXT   │
        │                  │   │ account_name  TEXT    │
        │                  │   │ created_at TIMESTAMPTZ│
        │                  │   │ processed_at TIMESTAMPTZ│
        │                  │   └──────────────────────┘
        │                  │
        │                  │   ┌──────────────────────┐
        │                  │   │    system_logs        │
        │                  │   ├──────────────────────┤
        │                  └──►│ id          UUID  PK  │
        │                       │ user_id  UUID   FK   │──► profiles.id
        │                       │ event_type TEXT      │
        │                       │ details   JSONB      │
        │                       │ created_at TIMESTAMPTZ│
        │                       └──────────────────────┘
        │
        │                       ┌──────────────────────┐
        │                       │   system_settings     │
        │                       ├──────────────────────┤
        │                       │ id          UUID  PK  │
        │                       │ key         TEXT  UNQ │
        │                       │ value       JSONB     │
        │                       │ updated_at TIMESTAMPTZ│
        │                       └──────────────────────┘
```

---

## Enums

| Enum | Values |
|------|--------|
| `user_role` | `admin`, `vendor`, `user` |

---

## Key Relationships

| From | To | Type | Description |
|------|----|------|-------------|
| `profiles` → `user_roles` | 1:N | Role-based access |
| `profiles` → `income_entries` | 1:N | Daily income logs |
| `profiles` → `expense_entries` | 1:N | Expense tracking |
| `profiles` → `susu_groups` | 1:N | Group ownership |
| `susu_groups` → `susu_memberships` | 1:N | Group membership |
| `susu_groups` → `susu_contributions` | 1:N | Pot contributions |
| `susu_groups` → `susu_payouts` | 1:N | Pot disbursements |
| `profiles` → `loan_applications` | 1:N | Loan requests |
| `loan_applications` → `loan_repayments` | 1:N | Repayment history |
| `profiles` → `products` | 1:N | Vendor products |
| `profiles` → `orders` | 1:N | Purchase orders |
| `orders` → `order_items` | 1:N | Line items |

---

## Triggers & Business Rules

1. **`handle_new_user`** — Auto-creates profile on auth signup
2. **`calculate_clip_score`** — Recomputes credit score on income/loan/susu events
3. **`calculate_loan_totals`** — Computes `total_payable` on loan approval
4. **`handle_repayment_confirmed`** — Auto-deducts from wallet, closes loan at ≤0
5. **`handle_susu_contribution_automation`** — Adds to pot on confirmed payment
6. **`handle_susu_rotation`** — Rotates payout when all members have paid
7. **`handle_new_notification`** — Fires notifications on loan/susu/order events
8. **`log_system_event`** — Audit trail on signup, loan request, purchase

---

## Migration Naming Convention (Flyway)

```
V1__create_profiles_and_core_tables.sql
V2__create_susu_tables.sql
V3__create_loan_tables.sql
V4__create_marketplace_tables.sql
V5__create_notification_tables.sql
V6__create_system_tables.sql
V7__create_rpcs_and_functions.sql
V8__create_triggers.sql
V9__seed_data.sql
```

---

*Last updated: 2026-07-19 — Agyark (Lead Dev)*
