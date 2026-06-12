import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ClipScoreGauge } from "@/components/clip-score-gauge";
import heroImg from "@/assets/hero-barber.jpg";
import logoImg from "@/assets/logo.svg";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ClipCapital — Finance for Ghana's Barbers & Hairdressers" },
      { name: "description", content: "Track income, save with Susu groups, access micro-loans, and shop supplies — built for Ghana's informal trade workers. Mobile money only, no bank account required." },
      { property: "og:title", content: "ClipCapital — Finance. Simplified." },
      { property: "og:description", content: "Ghana's micro-finance platform for barbers and hairdressers." },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: LandingPage,
});

const pillars = [
  { icon: "📈", name: "Track every cedi", desc: "Log income and expenses in seconds. Build a financial identity that lenders can trust." },
  { icon: "🤝", name: "Save together", desc: "Create or join Susu groups. Contribute via mobile money, rotate payouts among members." },
  { icon: "💰", name: "Access loans", desc: "Build a ClipScore, qualify for GH₵ 200–5,000, repay via mobile money." },
  { icon: "🛒", name: "Shop supplies", desc: "Buy clippers, shampoo, towels from vetted local vendors directly in the app." },
];

const testimonials = [
  { name: "Kwame Osei", shop: "Classic Cuts Osu", text: "ClipCapital helped me buy two new clippers when my old ones broke. The Susu payouts are always on time!", rating: 5 },
  { name: "Abena Mensah", shop: "Beauty Haven Kumasi", text: "I used to track everything on paper. Now I can see my profits instantly and my ClipScore is rising!", rating: 5 },
];

const steps = [
  { step: "01", title: "Sign Up", desc: "Create your profile in 30 seconds using just your email and phone." },
  { step: "02", title: "Log Income", desc: "Record your daily shop earnings to build your digital financial identity." },
  { step: "03", title: "Grow Score", desc: "As your ClipScore rises, you unlock larger loans and exclusive market deals." },
];

function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="fixed top-0 inset-x-0 z-40 backdrop-blur bg-background/70 border-b border-border/40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group active:scale-95 transition-transform">
            <img src={logoImg} alt="ClipCapital Logo" className="w-8 h-8 rounded-lg" />
            <span className="font-display font-bold text-lg">
              Clip<span className="text-gradient-gold">Capital</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground">Sign in</Link>
            <Link to="/auth" className="rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:bg-primary/90 transition">
              Get started
            </Link>
          </div>
        </div>
      </header>

      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 kente-pattern opacity-30" aria-hidden />
        <div className="absolute top-32 right-1/4 w-96 h-96 rounded-full bg-primary/20 blur-3xl" aria-hidden />
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-gold/10 blur-3xl" aria-hidden />

        <div className="relative max-w-6xl mx-auto px-6 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1 text-xs font-medium text-muted-foreground mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Built for Ghana's informal trades
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl md:text-7xl font-display font-bold leading-[1.05] tracking-tight">
              Finance.<br /><span className="text-gradient-gold">Simplified.</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-6 text-lg text-muted-foreground max-w-xl">
              ClipCapital turns daily cash income into a verifiable financial identity — unlocking savings, micro-loans, and growth capital. No bank account required.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-8 flex flex-wrap items-center gap-4">
              <Link to="/auth" className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3 font-semibold hover:bg-primary/90 transition glow-emerald">
                Create your free account →
              </Link>
              <Link to="/auth" className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 font-semibold hover:bg-surface transition">
                I already have an account
              </Link>
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.3 }}
            className="lg:col-span-5 relative">
            <div className="relative mx-auto w-[280px] h-[560px] rounded-[42px] border-[10px] border-surface-elevated bg-surface shadow-2xl overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-surface-elevated rounded-b-2xl z-10" />
              <img src={heroImg} alt="Ghanaian barber" className="absolute inset-0 w-full h-full object-cover opacity-40" />
              <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background" />
              <div className="absolute inset-0 p-5 flex flex-col">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground"><span>9:41</span><span>5G ◗</span></div>
                <div className="mt-6">
                  <div className="text-xs text-muted-foreground">Akwaaba, Kwame</div>
                  <div className="text-2xl font-display font-bold mt-1">GH₵ 1,455</div>
                  <div className="text-[10px] text-primary mt-0.5">▲ 18% this week</div>
                </div>
                <div className="mt-6 flex justify-center"><ClipScoreGauge score={712} size={180} /></div>
                <div className="mt-auto grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-primary/15 border border-primary/30 p-3">
                    <div className="text-[10px] text-muted-foreground">Susu pot</div>
                    <div className="text-sm font-bold mt-0.5">GH₵ 3,200</div>
                  </div>
                  <div className="rounded-xl bg-gold/15 border border-gold/30 p-3">
                    <div className="text-[10px] text-muted-foreground">Loan due</div>
                    <div className="text-sm font-bold mt-0.5">GH₵ 12 today</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 max-w-6xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-display font-bold mb-3">Four tools. One app.</h2>
        <p className="text-muted-foreground mb-10 max-w-2xl">Everything Ghana's barbers and hairdressers need to run a real business — without paperwork, without a bank.</p>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {pillars.map((p) => (
            <div key={p.name} className="rounded-2xl bg-surface border border-border p-6 hover:border-primary/50 transition">
              <div className="text-4xl mb-4">{p.icon}</div>
              <h3 className="text-lg font-display font-bold mb-2">{p.name}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-20 max-w-6xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-display font-bold mb-3 text-center">How it works</h2>
        <p className="text-muted-foreground mb-12 text-center max-w-xl mx-auto">Three simple steps to unlock your shop's full potential.</p>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((s) => (
            <div key={s.step} className="relative p-8 rounded-3xl bg-surface border border-border overflow-hidden">
              <div className="text-6xl font-display font-black text-primary/10 absolute -top-2 -right-2">{s.step}</div>
              <h3 className="text-xl font-display font-bold mb-3 relative z-10">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed relative z-10">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-20 bg-primary/5 border-y border-primary/10">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-10">Trusted by artisans</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {testimonials.map((t) => (
              <Card key={t.name} className="p-8">
                <div className="flex gap-1 text-gold mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => <Zap key={i} className="w-4 h-4 fill-current" />)}
                </div>
                <p className="text-lg font-medium mb-6 italic text-foreground">"{t.text}"</p>
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">{t.name[0]}</div>
                  <div>
                    <div className="font-bold">{t.name}</div>
                    <div className="text-xs text-muted-foreground uppercase font-black tracking-widest">{t.shop}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 max-w-6xl mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Ready to grow your shop?</h2>
        <p className="text-muted-foreground mb-8 max-w-xl mx-auto">Sign up free in 30 seconds. Start tracking income today.</p>
        <Link to="/auth" className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-7 py-4 text-lg font-semibold hover:bg-primary/90 transition glow-emerald">
          Create your free account →
        </Link>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} ClipCapital · Made in Ghana
      </footer>
    </div>
  );
}
