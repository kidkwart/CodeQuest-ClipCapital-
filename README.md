# ClipCapital

ClipCapital is a mobile-first micro-finance platform built specifically for Ghana's informal trade workers, such as barbers and hairdressers. It allows users to track income, save with Susu groups, access micro-loans, and shop for supplies.

## Tech Stack

- **Frontend**: React (TanStack Start)
- **Styling**: Tailwind CSS v4
- **Database & Auth**: Supabase
- **Payments**: Paystack Integration
- **Package Manager**: Bun

---

## Local Development Setup

Follow these steps to get the project running on your local machine.

### 1. Clone the Repository

```bash
git clone https://github.com/kidkwart/clipcapital.git
cd clipcapital
```

### 2. Install Tools

This project requires **Bun** for fast package management and runtime.

- [Install Bun](https://bun.sh/) if you haven't already:

```bash
curl -fsSL https://bun.sh/install | bash
```

- Verify the installation:

```bash
bun --version
```

### 3. Install Dependencies

```bash
bun install
```

### 4. Environment Variables

Create a `.env` file in the project root and add your Supabase credentials:

```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_PAYSTACK_PUBLIC_KEY=your-paystack-key
```

### 5. Run the Development Server

```bash
bun dev
```

The app will be available at `http://localhost:8080`.

---

## Database Management

The database schema is managed via SQL migrations located in `supabase/migrations/`.

### Applying Migrations Locally

If you are using the Supabase CLI:

```bash
supabase db reset
```

This will apply all migrations to your local Docker-based database.

---

## Deployment

To build the project for production:

```bash
bun run build
```

To preview the production build:

```bash
bun run preview
```

---

## Project Structure

```
src/
  routes/           # File-based routing (TanStack Router)
  components/       # UI components (Shadcn UI)
  lib/              # Business logic, queries, and integrations
  hooks/            # Custom React hooks
  integrations/     # Supabase client setup
supabase/
  migrations/       # Database schema migrations
```

© 2024 ClipCapital. All rights reserved.
