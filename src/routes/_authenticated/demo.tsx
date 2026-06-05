import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/demo")({
  head: () => ({
    meta: [
      { title: "ClipCapital Demo — Your shop" },
      { name: "description", content: "Track your daily income, expenses, savings and loans inside the ClipCapital app." },
    ],
  }),
  component: DemoShell,
});

const tabs: { to: string; label: string; icon: string; exact?: boolean }[] = [
  { to: "/demo", label: "Home", icon: "🏠", exact: true },
  { to: "/demo/income", label: "Income", icon: "📈" },
  { to: "/demo/expenses", label: "Expenses", icon: "🧾" },
  { to: "/demo/susu", label: "Susu", icon: "🤝" },
  { to: "/demo/loans", label: "Loans", icon: "💰" },
  { to: "/demo/market", label: "Market", icon: "🛒" },
];

function DemoShell() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = Route.useRouteContext();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <div className="border-b border-border/40 backdrop-blur bg-background/70">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-display font-bold">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-primary text-primary-foreground text-sm">✂</span>
            ClipCapital
            <span className="text-xs font-normal text-muted-foreground ml-2">Demo</span>
          </Link>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-muted-foreground hidden sm:inline">{user.email}</span>
            <button onClick={signOut} className="rounded-full border border-border px-3 py-1 hover:border-primary/50 transition">
              Sign out
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center py-8 px-4">
        <div className="w-full max-w-md">
          <div className="rounded-[36px] border-[10px] border-surface-elevated bg-surface overflow-hidden shadow-2xl">
            <div className="bg-surface min-h-[680px] flex flex-col">
              <div className="flex items-center justify-between px-6 pt-4 pb-2 text-[10px] text-muted-foreground">
                <span>9:41</span>
                <span className="flex items-center gap-1">5G · 87%</span>
              </div>

              <div className="flex-1 overflow-y-auto px-5 pb-4">
                <Outlet />
              </div>

              <nav className="grid grid-cols-6 gap-1 border-t border-border bg-surface-elevated px-2 py-2">
                {tabs.map((t) => {
                  const active = t.exact ? pathname === t.to : pathname.startsWith(t.to);
                  return (
                    <Link
                      key={t.to}
                      to={t.to as "/demo"}
                      className={`flex flex-col items-center gap-0.5 py-1.5 rounded-lg text-[10px] transition ${
                        active ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <span className="text-base">{t.icon}</span>
                      {t.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Frontend demo with real per-user data. No real payments are processed.
          </p>
        </div>
      </div>
    </div>
  );
}
