
## Goal

Drop the marketing/demo split. After login, users land on the real ClipCapital app. Every tab does real work and persists per-user.

## Information architecture

- `/` — slim public landing (hero + 3 value props + CTA to /auth). Keep SEO metadata.
- `/auth` — sign in / sign up (unchanged).
- `/app` (under `_authenticated/`) — app shell with sidebar nav.
  - `/app` — Dashboard (ClipScore, monthly P&L, recent activity, loan status)
  - `/app/income`
  - `/app/expenses`
  - `/app/susu`            list of my groups
  - `/app/susu/$groupId`   group detail (members, contribution ledger, payout rotation)
  - `/app/loans`           apply + my applications + repayments
  - `/app/market`          browse products
  - `/app/market/cart`     cart + checkout (records order, MoMo reference)
  - `/app/orders`          my orders
  - `/app/admin`           admin only: loan review queue + vendor approvals
- Old `/demo/*` routes deleted.

## Database changes (one migration)

New enum `app_role` (`admin`, `vendor`, `user`) and `user_roles` table with `has_role()` security-definer function (per project rules).

New / changed tables:
- `user_roles` — role assignments (separate from profiles to prevent escalation).
- `susu_groups` — add `owner_id`, `start_date`, `next_payout_date`, `status`, `cycle_index`. Drop demo seed rows.
- `susu_memberships` — add `payout_order int`, `has_received boolean`.
- `susu_contributions` — new: group_id, user_id, amount, cycle_index, momo_reference, status (`pending`/`confirmed`), paid_at.
- `susu_payouts` — new: group_id, user_id, amount, cycle_index, paid_at, momo_reference.
- `loan_applications` — new: user_id, amount, term_months, purpose, status (`pending`/`approved`/`rejected`/`repaying`/`closed`), reviewed_by, reviewed_at, decision_note, disbursed_at, balance.
- `loan_repayments` — new: loan_id, user_id, amount, momo_reference, paid_at, status.
- `products` — new: vendor_id, name, description, price, image_url, stock, active.
- `orders` — new: buyer_id, total, momo_reference, status (`pending`/`paid`/`shipped`/`cancelled`).
- `order_items` — new: order_id, product_id, vendor_id, qty, price.
- Drop `cart_items` server table; cart stays client-side (localStorage) until checkout creates an order.
- Remove `loan_balance` from `profiles` (derive from `loan_applications`).

RLS:
- Owners manage their own rows (income, expenses, loan_applications, loan_repayments, orders, order_items as buyer).
- Susu group members can read the group, contributions, payouts; only owner can create groups; only members can insert their own contributions.
- Vendors manage their own products; everyone authenticated can read active products.
- Admins (via `has_role`) can read/update all `loan_applications` and `user_roles`.

GRANTs on every new public table.

## Server functions (createServerFn + requireSupabaseAuth)

`src/lib/`:
- `susu.functions.ts` — `createGroup`, `joinGroup` (by invite code), `recordContribution`, `markPayout`, `listMyGroups`, `getGroup`.
- `loans.functions.ts` — `applyForLoan`, `listMyLoans`, `recordRepayment`, plus admin: `listPendingLoans`, `reviewLoan`.
- `market.functions.ts` — `listProducts`, `createProduct` (vendor), `myProducts`.
- `orders.functions.ts` — `placeOrder(items, momoReference)`, `listMyOrders`.
- `admin.functions.ts` — `grantRole`, `listVendors` (admin gated via `has_role`).
- `score.functions.ts` — recompute ClipScore from income count, expense ratio, on-time repayment rate.

All admin/vendor functions verify role via `has_role` RPC inside the handler.

## UI work

- New `AppShell` component (sidebar + topbar with profile menu + sign out) used by all `/app/*` routes.
- Replace mock data hooks in `demo-queries.ts` → new `app-queries.ts` keyed by real tables.
- Income/Expense: keep current forms but add edit + delete, validation with zod, empty states.
- Susu: create-group form (name, contribution, frequency, start date), invite code share, members list with payout order, ledger of contributions, "record MoMo payment" form (amount + reference), payout rotation indicator.
- Loans: application form (amount up to ClipScore-derived cap, term, purpose), list of my applications with status, repayment form for approved loans.
- Market: product grid (real `products` table), product detail, vendor onboarding ("become a vendor" requests `vendor` role), product create form for vendors.
- Cart: localStorage, checkout asks for MoMo reference (MTN/Vodafone selector + phone + tx id) and creates `orders` + `order_items`.
- Admin: tabs for loan queue (approve/reject with note) and role management.

## Payments (manual MoMo)

No SDK. A reusable `<MomoReferenceForm>` collects provider (MTN/Vodafone), phone, transaction id. Stored on contributions, repayments, and orders. Status starts `pending`; admin or vendor flips to `confirmed`/`paid` after manual verification.

## Seed / bootstrap

First user to sign up with email matching `ADMIN_EMAIL` env var auto-gets `admin` role via trigger. (Generate `ADMIN_EMAIL` via add_secret request to you.) Existing demo data left intact; old `/demo` routes deleted.

## Out of scope this iteration

- Real MoMo API integration (kept manual).
- Notifications / email.
- File uploads for product images (use URL field for now).
- Loan disbursement automation.

## Build order

1. Migration: roles + new tables + RLS + GRANTs.
2. Server functions for each domain.
3. AppShell + route restructure under `_authenticated/app/`.
4. Income/Expenses (port + polish).
5. Susu (create/join/contribute/payout).
6. Loans (apply + repay + admin queue).
7. Market + Orders (vendor + buyer + cart checkout).
8. Dashboard + ClipScore recompute.
9. Delete old `/demo/*` routes and demo-queries/mock files.
10. Landing page slim-down.

This will land across several turns. I'll start with the migration and confirm before wiring code, since schema needs your approval first.
