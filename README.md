# ClipCapital — Local Development Setup (VS Code)

This guide walks you through getting the full ClipCapital codebase running locally in Visual Studio Code.

---

## 1. Get the code out of Lovable

Lovable stores your full codebase in the cloud. To run it locally, you first need to move it to your machine.

### Option A: GitHub (recommended)

1. In the Lovable chat, tap the **Plus (+) menu** in the chat input.
2. Choose **GitHub → Connect project**.
3. Authorize the Lovable GitHub App.
4. Pick the GitHub account or organization you want the repo in.
5. Click **Create Repository**.

Lovable will push every file (routes, components, migrations, config) to that repo in real time.

Then clone it locally:

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME
```

### Option B: Direct download (paid Lovable workspace)

1. Switch to **Code Editor View** in Lovable.
2. Click **Download codebase** at the bottom of the file tree.
3. Extract the ZIP and open the folder in VS Code.

---

## 2. Install the required tools

This project uses **Bun** as its package manager and runtime.

- Install Bun:

```bash
curl -fsSL https://bun.sh/install | bash
```

- Verify the installation:

```bash
bun --version
```

You also need **VS Code** and the **Tailwind CSS IntelliSense** extension installed for the best experience.

---

## 3. Install project dependencies

Open the project folder in VS Code, then open the integrated terminal (`Ctrl + \``) and run:

```bash
bun install
```

This reads `bun.lock` and installs the exact versions used by Lovable.

---

## 4. Configure environment variables

The app needs Supabase credentials to talk to the backend database and auth service.

In the project root, create a `.env` file with the following values (copy them from the `.env` file already in your project, or from **Lovable Cloud → Project Settings → Integrations**):

```env
VITE_SUPABASE_URL=https://tgalgawpwybdjxrijntd.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnYWxnYXdwd3liZGp4cmlqbnRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5NTg4NjEsImV4cCI6MjA5NzUzNDg2MX0.lXBGFhvqMvblvuaTXNE_1wq3kBhtwhinTrCeH7f9JGE
VITE_SUPABASE_PROJECT_ID=tgalgawpwybdjxrijntd

SUPABASE_URL=https://tgalgawpwybdjxrijntd.supabase.co
SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnYWxnYXdwd3liZGp4cmlqbnRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5NTg4NjEsImV4cCI6MjA5NzUzNDg2MX0.lXBGFhvqMvblvuaTXNE_1wq3kBhtwhinTrCeH7f9JGE
```

> **Important:** The `VITE_` prefixed variables are required by the browser bundle. The `SUPABASE_` prefixed variables are required by server functions. The publishable/anonymous key is safe to include in the frontend. The service role key is **not** available on Lovable Cloud and should never be added to a client-side file.

---

## 5. Run the development server

In the VS Code terminal:

```bash
bun dev
```

The dev server will start on `http://localhost:8080` by default. VS Code may prompt you to open the URL in the browser.

---

## 6. Build and preview the production app

To test the app exactly as it will run when published:

1. Build the app for production:

```bash
bun run build
```

2. Preview the production build locally:

```bash
bun run preview
```

This serves the optimized production bundle on `http://localhost:3000` by default (or another port if 3000 is busy). It runs the full SSR/SSG pipeline, so it is the best way to verify that production features (server functions, protected routes, database calls) work before publishing.

> **Tip:** The preview server uses the same `.env` variables as the dev server. Make sure your Supabase credentials are set before running either command.

---

## 7. Run and manage Supabase SQL migrations

The database schema lives in the `supabase/migrations/` folder as numbered `.sql` files. Because this project uses **Lovable Cloud**, the managed backend handles most migration execution for you.

### Migrations in Lovable Cloud (production / live database)

When you ask the Lovable agent to change the database, it creates a migration in the `supabase/migrations/` folder and applies it to your live Lovable Cloud database. You do **not** need to run `supabase db push` or `psql` yourself.

To add a new migration yourself, ask the Lovable agent in chat, e.g.:

> "Create a migration that adds a `notifications` table with `user_id`, `title`, `body`, and `read` columns."

The agent will:

1. Write the SQL file into `supabase/migrations/`.
2. Apply it to the live database after your approval.
3. Regenerate the TypeScript types in `src/integrations/supabase/types.ts`.

> **Note:** The service role key is not available on Lovable Cloud, so you cannot run the Supabase CLI directly against the production database from your local machine. Always use the Lovable agent or backend UI for production schema changes.

### Local database development (optional)

If you want a fully local database for testing schema changes before applying them, install the **Supabase CLI** and run a local instance:

1. Install the Supabase CLI:

```bash
# macOS
brew install supabase/tap/supabase

# Windows (with Scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Linux / other
npm install -g supabase
```

2. Start the local Supabase stack:

```bash
supabase init
supabase start
```

This runs Postgres, Auth, and other services in Docker. Your local API URL and anon key will be printed to the terminal.

3. Update your local `.env` to point at the local instance:

```env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_PUBLISHABLE_KEY=your-local-anon-key
SUPABASE_URL=http://localhost:54321
SUPABASE_PUBLISHABLE_KEY=your-local-anon-key
```

4. Apply migrations to your local database:

```bash
supabase db reset
```

This replays every migration in `supabase/migrations/` on a fresh local database.

5. When you are happy with the schema, copy or commit the new migration file. Then ask the Lovable agent to apply it to your Lovable Cloud project.

### Migration best practices

- Keep each migration focused on one schema change (one table, one set of policy changes, etc.).
- Every table created in the `public` schema must include `GRANT` statements for `authenticated` and `service_role` in the same migration file.
- Always enable Row Level Security (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`) and write policies in the same migration.
- Never edit `supabase/migrations/` files that have already been applied to production. Create a new migration to alter the schema instead.
- After a migration runs, the Lovable agent will regenerate `src/integrations/supabase/types.ts`. Do not edit that file manually.

---

## 8. Sign in and start using the app

1. Open `http://localhost:8080` in your browser.
2. Go to `/auth` and create an account.
3. The first account created is automatically promoted to `admin`.
4. After signing in, you are redirected to `/app` and can use the full product (Dashboard, Income, Expenses, Susu, Loans, Marketplace, Orders, and Admin).

---

## 9. Optional: import your database data

The app schema lives in the `supabase/migrations` folder. If you also want the actual marketplace products, seeded users, and sample data, import the CSV exports that were generated earlier:

1. Open the Lovable backend view.
2. Go to **Database → Tables**.
3. For each table you want to populate, click the table and choose **Import data**.
4. Upload the matching CSV file from the `db-export/` folder.

Alternatively, use the Supabase CLI with the project reference and service role key if you have access to them.

---

## 10. Common commands

| Command | Description |
| --- | --- |
| `bun dev` | Start the local development server |
| `bun build` | Build the app for production |
| `bun preview` | Preview the production build locally |
| `bun lint` | Run ESLint |

---

## 11. Troubleshooting

### "Failed to resolve import" / build errors

Make sure all files are present and that you did not miss files during download. If you used GitHub, run:

```bash
git status
```

### "Missing Supabase environment variable(s)"

The `.env` file is missing or the variables are named incorrectly. Double-check the names in step 4.

### "Unauthorized" when calling app features

You are not signed in. The protected routes are under `/app/*` and require a session. Visit `/auth` first.

### Port 8080 is already in use

Change the port in `vite.config.ts` or run:

```bash
bun dev --port 3000
```

---

## 12. Project structure (at a glance)

```
src/
  routes/           # TanStack Start file-based routes
  components/       # Reusable UI components
  lib/              # Server functions, queries, and utilities
  hooks/            # React hooks
  integrations/     # Supabase client and middleware
  styles.css        # Tailwind v4 theme and design tokens
supabase/
  migrations/       # Database schema and seed migrations
```

---

Need help? If you hit a specific error, paste the error message into the Lovable chat and I can fix it for you.
