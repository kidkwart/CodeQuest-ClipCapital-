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
*   **Backend & Auth:** [Supabase](https://supabase.com/)
*   **State Management:** [TanStack Query v5](https://tanstack.com/query/latest)
*   **Animations:** [React Native Reanimated](https://www.reanimated.org/)
*   **Package Manager:** [Bun](https://bun.sh/)

---

## 🛠️ Local Development

### 1. Prerequisites
Ensure you have **Bun** installed:
```bash
curl -fsSL https://bun.sh/install | bash
```

### 2. Setup
```bash
# Clone the repository
git clone https://github.com/kidkwart/clipcapital.git
cd clipcapital

# Install dependencies
bun install
```

### 3. Environment Configuration
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
VITE_PAYSTACK_PUBLIC_KEY=your_paystack_key
```

### 4. Database Setup
Initialize your database using the Supabase CLI:
```bash
supabase db reset
```

### 5. Launch
```bash
bun dev
```

---

## 📂 Project Structure

```text
src/
 ├── components/     # Atomic UI components & Native elements
 ├── hooks/          # Custom React hooks (logic & state)
 ├── context/        # Theme & Global state providers
 ├── lib/            # API, Supabase client, and utility functions
app/
 ├── (auth)/         # Authentication flow (Login/Signup)
 ├── (tabs)/         # Core app navigation (Dashboard, Wallet, etc.)
 ├── market/         # Marketplace & Order management
 └── admin/          # Exclusive Admin Command Center
```

---

© 2026 ClipCapital. Engineered for the artisans of the future.
[@kidkwart_jr](https://github.com/kidkwart)
