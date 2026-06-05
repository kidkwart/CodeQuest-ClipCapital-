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

## 6. Sign in and start using the app

1. Open `http://localhost:8080` in your browser.
2. Go to `/auth` and create an account.
3. The first account created is automatically promoted to `admin`.
4. After signing in, you are redirected to `/app` and can use the full product (Dashboard, Income, Expenses, Susu, Loans, Marketplace, Orders, and Admin).

---

## 7. Optional: import your database data

The app schema lives in the `supabase/migrations` folder. If you also want the actual marketplace products, seeded users, and sample data, import the CSV exports that were generated earlier:

1. Open the Lovable backend view.
2. Go to **Database → Tables**.
3. For each table you want to populate, click the table and choose **Import data**.
4. Upload the matching CSV file from the `db-export/` folder.

Alternatively, use the Supabase CLI with the project reference and service role key if you have access to them.

---

## 8. Common commands

| Command | Description |
| --- | --- |
| `bun dev` | Start the local development server |
| `bun build` | Build the app for production |
| `bun preview` | Preview the production build locally |
| `bun lint` | Run ESLint |

---

## 9. Troubleshooting

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

## 10. Project structure (at a glance)

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
