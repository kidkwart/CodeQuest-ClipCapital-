import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — ClipCapital" },
      { name: "description", content: "Sign in or create your ClipCapital account to track income, save with ClipSusu and access ClipLoans." },
    ],
  }),
  component: AuthPage,
});

const signInSchema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
});

const signUpSchema = signInSchema.extend({
  displayName: z.string().trim().min(1, "Name required").max(80),
  businessName: z.string().trim().max(120).optional(),
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/app" });
    });
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signin") {
        const parsed = signInSchema.safeParse({ email, password });
        if (!parsed.success) throw new Error(parsed.error.issues[0].message);
        const { error } = await supabase.auth.signInWithPassword(parsed.data);
        if (error) throw error;
      } else {
        const parsed = signUpSchema.safeParse({ email, password, displayName, businessName });
        if (!parsed.success) throw new Error(parsed.error.issues[0].message);
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/app`,
            data: {
              display_name: parsed.data.displayName,
              business_name: parsed.data.businessName ?? "",
            },
          },
        });
        if (error) throw error;
      }
      navigate({ to: "/app" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <div className="border-b border-border/40">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center">
          <Link to="/" className="flex items-center gap-2 font-display font-bold">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-primary text-primary-foreground text-sm">✂</span>
            ClipCapital
          </Link>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-display font-bold text-center">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-xs text-muted-foreground text-center mt-1">
            {mode === "signin" ? "Sign in to your ClipCapital account" : "Start tracking your shop in 30 seconds"}
          </p>

          <div className="mt-6 rounded-2xl bg-surface-elevated border border-border p-2 grid grid-cols-2 text-xs font-semibold">
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(null); }}
                className={`rounded-xl py-2 transition ${mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
              >
                {m === "signin" ? "Sign in" : "Sign up"}
              </button>
            ))}
          </div>

          <form onSubmit={onSubmit} className="mt-5 space-y-3">
            {mode === "signup" && (
              <>
                <input
                  type="text" placeholder="Your name" required maxLength={80}
                  value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full rounded-xl bg-surface-elevated border border-border px-4 py-3 text-sm outline-none focus:border-primary"
                />
                <input
                  type="text" placeholder="Business name (optional)" maxLength={120}
                  value={businessName} onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full rounded-xl bg-surface-elevated border border-border px-4 py-3 text-sm outline-none focus:border-primary"
                />
              </>
            )}
            <input
              type="email" placeholder="Email" required autoComplete="email" maxLength={255}
              value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl bg-surface-elevated border border-border px-4 py-3 text-sm outline-none focus:border-primary"
            />
            <input
              type="password" placeholder="Password" required minLength={6} maxLength={72}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl bg-surface-elevated border border-border px-4 py-3 text-sm outline-none focus:border-primary"
            />

            {error && (
              <div className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-xl px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full rounded-xl bg-primary text-primary-foreground font-semibold py-3 text-sm hover:bg-primary/90 transition disabled:opacity-60"
            >
              {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <p className="text-[11px] text-muted-foreground text-center mt-4">
            By continuing you agree to ClipCapital's terms.
          </p>
        </div>
      </div>
    </div>
  );
}
