# 🏦 ClipCapital

**ClipCapital** is a premium, mobile-first micro-finance ecosystem designed specifically for Ghana’s informal trade sectors. From master barbers to hairstylists, ClipCapital empowers artisans with the tools they need to track revenue, grow through Susu groups, access micro-loans, and source professional-grade equipment.

---

## ✨ Premium Features

### 🛠️ Professional Marketplace
An integrated supply chain for artisans. Browse and purchase high-end equipment like **Wahl Professional Clippers**, **Dyson Pro Dryers**, and luxury **Barber Chairs**.
- **Credit Integration:** Purchase equipment using your accumulated credit line.
- **Order Tracking:** Real-time status updates from pending to shipped.

### 🛡️ Admin Command Center
A powerful suite of administrative tools to manage the entire ecosystem:
- **Financial Oversight:** Monitor total revenue, volume, and active risk.
- **Loan Management:** Approve or decline micro-loan applications with a single tap.
- **Global Governance:** Adjust the base interest rate and toggle "Vault Lockdown" (Maintenance Mode) instantly.
- **Support Hub:** Direct communication channel with users via integrated chat.
- **User Management:** Audit and manage user accounts and their ClipScores.

### 🎨 Themed Experience
Built with a sophisticated UI that adapts to your environment:
- **Midnight Emerald:** A deep, high-contrast dark mode for focused work.
- **Pristine White:** A clean, high-end light mode for a professional business aesthetic.

### 📈 Financial Growth
- **Susu Circles:** Participate in community-driven peer-to-peer savings.
- **ClipScore:** A proprietary credit-scoring algorithm based on daily revenue logs.
- **Micro-Loans:** Instant access to liquidity for business expansion.

---

## 🚀 Tech Stack

*   **Framework:** [React Native](https://reactnative.dev/) / [Expo](https://expo.dev/)
*   **Routing:** [Expo Router](https://docs.expo.dev/router/introduction/) (File-based)
*   **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) via NativeWind
*   **Frontend State:** [TanStack Query v5](https://tanstack.com/query/latest)
*   **Animations:** [React Native Reanimated](https://www.reanimated.org/)
*   **Backend API:** [Node.js](https://nodejs.org/) / [Express](https://expressjs.com/) (JWT auth, Paystack MoMo, loans & ClipScore services)
*   **Database & Auth:** [Supabase](https://supabase.com/) (migrations in `more/supabase`) + Flyway
*   **Deployment:** GitHub Pages (web) + Docker / [Fly.io](https://fly.io/) (API)

---

## 🛠️ Local Development

### 1. Prerequisites
Ensure you have **Node.js 20+** (and **Bun** if you prefer the frontend):
```bash
curl -fsSL https://bun.sh/install | bash
```

### 2. Setup
```bash
# Clone the repository
git clone https://github.com/kidkwart/CodeQuest-App.git
cd CodeQuest-App

# Install dependencies
npm --prefix frontend install
npm --prefix backend install
```

### 3. Environment Configuration
Create a `.env` file in the `frontend/` directory:
```env
EXPO_PUBLIC_SUPABASE_URL=your_project_url
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_anon_key
EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY=your_paystack_key
```

### 4. Database Setup
Initialize the Supabase database using the Supabase CLI (migrations live in `more/supabase`):
```bash
supabase db reset
```

### 5. Launch
```bash
# Frontend (Expo app)
npm --prefix frontend run start

# Backend API
npm --prefix backend run dev
```

### 6. Verify
```bash
npm run typecheck   # type-checks frontend + backend
npm run test:backend
```

---

## 📂 Project Structure

```text
frontend/               # Expo React Native app
 ├── app/               # Expo Router screens (auth, tabs, market, susu, admin...)
 ├── src/               # Components, hooks, context, lib & Supabase client
 ├── android/           # Native Android project (Java/Kotlin modules)
 ├── public/            # Web assets
 └── package.json       # Expo config (app.json, eas.json, metro, tailwind...)

backend/                # Node.js API (Auth, Gateway, Paystack, Loans, ClipScore)
 ├── src/               # Express services & routes
 ├── database/          # Flyway migrations
 ├── Dockerfile
 └── package.json

more/                   # Infrastructure & docs
 ├── supabase/          # Supabase migrations & config
 └── commits.txt

.github/workflows/      # CI/CD (backend CI, Fly.io deploy, Pages deploy)
```

---

© 2026 ClipCapital. Engineered for the artisans of the future.
[@kidkwart_jr](https://github.com/kidkwart)
