import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  LucideIcon, LayoutDashboard, TrendingUp, Receipt, Users, Banknote, Store, ShoppingBag, ShieldCheck, LogOut, Menu, History, Settings, MessageCircle, X, ArrowDownToLine
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, useMyRoles } from "@/lib/app-queries";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import { NotificationTray } from "./notification-tray";

import logoImg from "@/assets/logo.svg";

type NavItem = { to: string; label: string; icon: LucideIcon; exact?: boolean };
const baseNav: NavItem[] = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/app/income", label: "Income", icon: TrendingUp },
  { to: "/app/expenses", label: "Expenses", icon: Receipt },
  { to: "/app/withdraw", label: "Withdraw", icon: ArrowDownToLine },
  { to: "/app/susu", label: "Susu", icon: Users },
  { to: "/app/loans", label: "Loans", icon: Banknote },
  { to: "/app/market", label: "Market", icon: Store },
  { to: "/app/orders", label: "Orders", icon: ShoppingBag },
  { to: "/app/settings", label: "Settings", icon: Settings },
  { to: "/app/support", label: "Support", icon: MessageCircle },
  { to: "/app/history", label: "History", icon: History },
];

export function AppShell({ children, title }: { children: ReactNode; title: string }) {
  const profile = useProfile();
  const roles = useMyRoles();
  const { user } = useCurrentUser();

  const isAdmin = roles.data?.includes("admin") || user?.email === "bernardyawkwarteng8@gmail.com";

  const navigate = useNavigate();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const loc = useLocation();

  const nav: NavItem[] = isAdmin
    ? [...baseNav, { to: "/app/admin", label: "Admin", icon: ShieldCheck }]
    : baseNav;

  async function signOut() {
    if (!window.confirm("Are you sure you want to sign out?")) return;
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
      {/* Sidebar Overlay for Mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Main Sidebar */}
      <aside className={`fixed top-0 inset-y-0 left-0 z-50 w-64 border-r border-border bg-surface flex flex-col h-screen transform transition-transform duration-300 ease-in-out lg:sticky lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        {/* Logo Section */}
        <div className="h-24 flex items-center justify-between px-5 border-b border-border bg-primary/5 shrink-0">
          <Link to="/app" className="flex items-center gap-3 active:scale-95 transition-transform" onClick={() => setOpen(false)}>
            <img src={logoImg} alt="ClipCapital Logo" className="w-8 h-8 rounded-lg shadow-sm" />
            <div className="flex flex-col">
              <span className="font-display font-bold text-lg leading-tight tracking-tight">
                Clip<span className="text-primary">Capital</span>
              </span>
              <span className="text-[9px] font-black text-primary uppercase tracking-[0.15em] mt-0.5">
                Finance. Simplified.
              </span>
            </div>
          </Link>
          {/* Close button for mobile */}
          <Button variant="ghost" size="icon" className="md:hidden -mr-2 text-muted-foreground" onClick={() => setOpen(false)}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Navigation - SCROLLABLE */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar overscroll-contain">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = item.exact
              ? loc.pathname === item.to
              : loc.pathname === item.to || loc.pathname.startsWith(item.to + "/");
            return (
              <Link
                key={item.to}
                to={item.to as any}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                  active ? "bg-primary text-white font-bold shadow-md shadow-primary/20" : "text-muted-foreground hover:bg-surface-elevated hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" /> {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer Section */}
        <div className="p-4 border-t border-border bg-muted/10 shrink-0">
          <div className="px-3 py-2 mb-2 rounded-xl bg-background/50 border border-border/50">
            <div className="text-[10px] uppercase font-black text-muted-foreground mb-0.5 opacity-50">Account</div>
            <div className="font-bold text-xs text-foreground truncate">{profile.data?.display_name || "User"}</div>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/5" onClick={signOut}>
            <LogOut className="w-4 h-4" /> Sign out
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative lg:pl-0">
        <header className="h-14 sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border flex items-center px-4 gap-3">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(!open)}>
            <Menu className="w-5 h-5" />
          </Button>
          <h1 className="font-display font-bold text-base md:text-lg flex-1 truncate">{title}</h1>
          <NotificationTray />
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-8 max-w-6xl w-full mx-auto pb-24 scroll-smooth">
          {children}
        </main>
      </div>
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
      <div className="font-semibold text-foreground text-lg">{title}</div>
      {hint && <div className="text-sm mt-2 opacity-70">{hint}</div>}
    </div>
  );
}

export function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl bg-surface border border-border p-6 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
      <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors" />
      <div className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">{label}</div>
      <div className="text-2xl font-display font-black mt-1 text-foreground">{value}</div>
      {hint && <div className="text-[10px] text-muted-foreground mt-2 font-medium bg-muted/50 px-2 py-0.5 rounded-full inline-block">{hint}</div>}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl bg-surface border border-border p-6 shadow-sm ${className}`}>{children}</div>;
}
