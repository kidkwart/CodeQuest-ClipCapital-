import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Mail, Lock, Building, User as UserIcon, ArrowRight, CheckCircle2, Scissors, ChevronLeft } from "lucide-react";

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
  const [mode, setMode] = useState<"signin" | "signup" | "verify" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [otpToken, setOtpToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        navigate({ to: "/app" });
      } else {
        setCheckingSession(false);
      }
    });
  }, [navigate]);

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="mt-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Akwaaba...</p>
      </div>
    );
  }

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
        navigate({ to: "/app" });
      } else if (mode === "signup") {
        const parsed = signUpSchema.safeParse({ email, password, displayName, businessName });
        if (!parsed.success) throw new Error(parsed.error.issues[0].message);
        const { data, error } = await supabase.auth.signUp({
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

        // If email confirmation is off, data.session will exist
        if (data.session) {
          toast.success("Welcome to ClipCapital!");
          navigate({ to: "/app" });
        } else {
          // If it's on, we go to verify
          setMode("verify");
          toast.success("Verification code sent to your email!");
        }
      } else if (mode === "verify") {
        const { error } = await supabase.auth.verifyOtp({
          email,
          token: otpToken,
          type: 'signup'
        });
        if (error) throw error;
        toast.success("Email verified successfully!");
        navigate({ to: "/app" });
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth?mode=reset`,
        });
        if (error) throw error;
        toast.success("Password reset link sent to your email!");
        setMode("signin");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function resendOtp() {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });
      if (error) {
        console.error("Supabase Resend Error:", error);
        throw error;
      }
      toast.success("A new verification code has been sent!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to resend code");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20">
      {/* Dynamic Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] -left-[10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] -right-[10%] w-[40%] h-[40%] bg-gold/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 md:py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-[440px]"
        >
          {/* Branded Logo Section */}
          <div className="flex flex-col items-center mb-8">
            <Link to="/" className="group transition-transform active:scale-95">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full group-hover:bg-primary/30 transition-colors" />
                <div className="relative bg-primary p-4 rounded-2xl shadow-2xl shadow-primary/20 flex items-center justify-center">
                  <Scissors className="w-8 h-8 text-white" />
                </div>
              </div>
            </Link>
            <h1 className="mt-6 text-3xl font-display font-extrabold tracking-tight">
              Clip<span className="text-primary">Capital</span>
            </h1>
            <p className="text-primary font-black text-[10px] uppercase tracking-[0.2em] mt-1">Finance. Simplified.</p>
            <p className="text-muted-foreground text-[11px] font-medium mt-1 italic">Ghana's Financial Partner for Trades</p>
          </div>

          <Card className="p-1 shadow-2xl shadow-black/[0.03] border-border/40 overflow-hidden bg-surface/50 backdrop-blur-xl">
            {/* Header Tabs */}
            {mode !== "verify" && (
              <div className="p-2 flex gap-1">
                {(["signin", "signup"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => { setMode(m); setError(null); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                      mode === m
                        ? "bg-primary text-white shadow-lg shadow-primary/20"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {m === "signin" ? <Lock className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
                    {m === "signin" ? "Sign In" : "Sign Up"}
                  </button>
                ))}
              </div>
            )}

            {mode === "verify" && (
              <button
                onClick={() => setMode("signup")}
                className="m-4 flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Back to Sign Up
              </button>
            )}

            <div className="p-6 pt-2">
              <div className="mb-6">
                <h2 className="text-xl font-bold">
                  {mode === "signin" ? "Welcome Back" :
                   mode === "signup" ? "New Account" :
                   mode === "forgot" ? "Reset Password" :
                   "Confirm Code"}
                </h2>
                <p className="text-xs text-muted-foreground mt-1 font-medium">
                  {mode === "signin" ? "Enter your credentials to access your shop dashboard." :
                   mode === "signup" ? "Join 10,000+ Ghanaian barbers growing their business." :
                   mode === "forgot" ? "We'll send you a link to get back into your account." :
                   `We just sent a 6-digit code to ${email}`}
                </p>
              </div>

              <form onSubmit={onSubmit} className="space-y-4">
                <AnimatePresence mode="wait">
                  {mode === "signup" && (
                    <motion.div
                      key="signup-fields"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Full Name</Label>
                        <div className="relative group">
                          <UserIcon className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                          <Input
                            placeholder="e.g. Kwame Mensah"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="pl-10 h-11 rounded-xl bg-muted/30 border-border/50 focus:bg-background"
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Business Name</Label>
                        <div className="relative group">
                          <Building className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                          <Input
                            placeholder="e.g. Mensah Quality Cuts"
                            value={businessName}
                            onChange={(e) => setBusinessName(e.target.value)}
                            className="pl-10 h-11 rounded-xl bg-muted/30 border-border/50 focus:bg-background"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {mode === "verify" ? (
                    <motion.div
                      key="verify-fields"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="space-y-5 py-2"
                    >
                      <div className="space-y-3">
                        <Input
                          placeholder="000000"
                          maxLength={6}
                          value={otpToken}
                          onChange={(e) => setOtpToken(e.target.value)}
                          className="h-16 text-center text-4xl font-display font-black tracking-[0.4em] rounded-2xl border-primary/30 focus:border-primary bg-primary/5"
                          required
                        />
                        <div className="flex items-center justify-between px-1">
                          <p className="text-[10px] text-muted-foreground font-semibold">
                            Enter the code from your email
                          </p>
                          <button
                            type="button"
                            className="text-[10px] font-bold text-primary hover:underline uppercase tracking-tighter"
                            onClick={resendOtp}
                            disabled={loading}
                          >
                            Resend Code
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ) : mode === "forgot" ? (
                    <motion.div
                      key="forgot-fields"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-4"
                    >
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Email Address</Label>
                        <div className="relative group">
                          <Mail className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground" />
                          <Input
                            type="email"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="pl-10 h-11 rounded-xl bg-muted/30 border-border/50 focus:bg-background"
                            required
                          />
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="credentials-fields"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-4"
                    >
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Email Address</Label>
                        <div className="relative group">
                          <Mail className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                          <Input
                            type="email"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="pl-10 h-11 rounded-xl bg-muted/30 border-border/50 focus:bg-background"
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center ml-1">
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Password</Label>
                          <button
                            type="button"
                            onClick={() => setMode("forgot")}
                            className="text-[10px] font-bold text-primary hover:underline uppercase tracking-tighter"
                          >
                            Forgot?
                          </button>
                        </div>
                        <div className="relative group">
                          <Lock className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                          <Input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="pl-10 h-11 rounded-xl bg-muted/30 border-border/50 focus:bg-background"
                            required
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-xs font-bold text-red-600 bg-red-50 border border-red-100 rounded-xl p-3 flex items-start gap-2"
                  >
                    <div className="h-4 w-4 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0 text-[10px]">!</div>
                    {error}
                  </motion.div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-xl text-sm font-bold shadow-xl shadow-primary/20 transition-all hover:translate-y-[-1px] active:translate-y-[0px] group"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      {mode === "verify" ? "Verifying..." : "Just a moment..."}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {mode === "signin" ? "Enter Dashboard" :
                       mode === "signup" ? "Get Started" :
                       mode === "forgot" ? "Send Link" :
                       "Verify & Sign In"}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  )}
                </Button>

                {(mode === "verify" || mode === "forgot") && (
                  <Button
                    variant="ghost"
                    className="w-full text-xs font-bold text-muted-foreground"
                    onClick={() => setMode("signin")}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back to Sign In
                  </Button>
                )}
              </form>
            </div>
          </Card>

          <div className="mt-8 flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-elevated border border-border/50">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Trusted by 10,000+ Ghanaian Artisans</span>
            </div>
            <p className="text-[11px] text-muted-foreground text-center max-w-[280px] leading-relaxed">
              By continuing you agree to our <a href="#" className="text-primary font-bold hover:underline">Terms</a> & <a href="#" className="text-primary font-bold hover:underline">Privacy Policy</a>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function Loader2({ className }: { className?: string }) {
  return <div className={`border-2 border-current border-t-transparent rounded-full ${className}`} />;
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-[32px] border border-border/40 ${className}`}>{children}</div>;
}
