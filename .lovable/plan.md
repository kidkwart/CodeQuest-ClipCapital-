
## ClipCapital — Build Plan

A polished marketing site plus a clickable demo of the mobile-first app, all frontend (no backend, no real Mobile Money).

### Design direction
Warm, trustworthy modern African fintech. Deep emerald + warm gold accents on a near-black background, with subtle Kente-inspired geometric patterns used sparingly. Display font: Clash Display (or Space Grotesk). Body: Inter. Generous spacing, large editorial type, soft-glow accents, rounded-2xl cards. Phone mockup of the app on the hero. Motion: gentle fade/slide-up on scroll via framer-motion; one animated ClipScore gauge on the hero.

### Routes

```
/                 Landing page (marketing)
/demo             App demo shell — phone-frame layout with bottom tab nav
  /demo (Home)    Today's earnings, ClipScore gauge, quick actions
  /demo/income    Income tracker — log earnings, weekly chart
  /demo/expenses  Expense manager — list + add
  /demo/susu      ClipSusu groups — join/create, member list, contributions
  /demo/loans     ClipLoans — eligibility, apply flow, repayment schedule
  /demo/market    ClipMarket — product grid, cart
```

Each marketing route gets distinct `head()` metadata. Demo uses in-memory state (zustand or React state) seeded with realistic Ghanaian names, GH₵ amounts, and barbershop products.

### Landing page sections
1. Hero — tagline "Finance. Simplified. For Every Barber & Hairdresser." + phone mockup + dual CTA (Try the demo / Read the pitch)
2. Problem — 70% financially excluded, the 4 pain points as cards
3. Solution — 5 product pillars (Income, Expenses, ClipSusu, ClipLoans, ClipMarket) with icons
4. How ClipScore works — 5-step horizontal flow
5. Market — 200k+ barbers stat block
6. Business model — revenue streams table
7. Financial projections — 3-year chart (Recharts)
8. Roadmap — 7-phase timeline
9. Competitive advantage — bento grid
10. Impact / SDG alignment — 5 SDG badges
11. CTA footer — "Try the demo" + contact

### Technical notes
- TanStack Start file routes under `src/routes/` (`index.tsx`, `demo.tsx` layout, `demo.index.tsx`, `demo.income.tsx`, etc.)
- Design tokens defined in `src/styles.css` via oklch — emerald primary, gold accent, dark bg
- Recharts for projections + income chart
- framer-motion for entrance animations
- Generated hero image (barber + phone, warm cinematic) via imagegen
- All copy pulled verbatim from the proposal where possible
- No backend, no Lovable Cloud — pure frontend demo

Ready to build on approval.
