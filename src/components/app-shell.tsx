import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard, TrendingUp, Receipt, Users, Banknote, Store, ShoppingBag, ShieldCheck, LogOut, Menu,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, useMyRoles } from "@/lib/app-queries";
import { Button } from "@/components/ui/button";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean };
const baseNav: NavItem[] = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/app/income", label: "Income", icon: TrendingUp },
  { to: "/app/expenses", label: "Expenses", icon: Receipt },
  { to: "/app/susu", label: "Susu", icon: Users },
  { to: "/app/loans", label: "Loans", icon: Banknote },
  { to: "/app/market", label: "Market", icon: Store },
  { to: "/app/orders", label: "Orders", icon: ShoppingBag },
];

export function AppShell({ children, title }: { children: ReactNode; title: string }) {
  const profile = useProfile();
  const roles = useMyRoles();
  const isAdmin = roles.data?.includes("admin");
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const loc = useLocation();

  const nav = isAdmin
    ? [...baseNav, { to: "/app/admin", label: "Admin", icon: ShieldCheck, exact: undefined }]
    : baseNav;

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-border bg-surface transform transition-transform md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="h-14 flex items-center px-5 border-b border-border">
          <Link to="/app" className="font-display font-bold text-lg">
            Clip<span className="text-gradient-gold">Capital</span>
          </Link>
        </div>
        <nav className="p-3 space-y-1">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = item.exact
              ? loc.pathname === item.to
              : loc.pathname === item.to || loc.pathname.startsWith(item.to + "/");
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                  active ? "bg-primary/15 text-primary font-semibold" : "text-muted-foreground hover:bg-surface-elevated hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" /> {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 inset-x-0 p-3 border-t border-border">
          <div className="px-3 py-2 text-xs">
            <div className="font-semibold text-foreground truncate">{profile.data?.display_name || "—"}</div>
            <div className="text-muted-foreground truncate">{profile.data?.business_name || ""}</div>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={signOut}>
            <LogOut className="w-4 h-4" /> Sign out
          </Button>
        </div>
      </aside>

      <div className="md:pl-64">
        <header className="h-14 sticky top-0 z-30 bg-background/80 backdrop-blur border-b border-border flex items-center px-4 gap-3">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(!open)}>
            <Menu className="w-5 h-5" />
          </Button>
          <h1 className="font-display font-semibold text-lg">{title}</h1>
        </header>
        <main className="p-4 md:p-6 max-w-6xl">{children}</main>
      </div>
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
      <div className="font-semibold text-foreground">{title}</div>
      {hint && <div className="text-sm mt-1">{hint}</div>}
    </div>
  );
}

export function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl bg-surface border border-border p-5">
      <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className="text-2xl font-display font-bold mt-1">{value}</div>
      {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl bg-surface border border-border p-5 ${className}`}>{children}</div>;
}
