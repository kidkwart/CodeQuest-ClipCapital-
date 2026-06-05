import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import heroImg from "@/assets/hero-barber.jpg";
import { SiteHeader, SiteFooter, Section, FadeIn } from "@/components/marketing";
import { ClipScoreGauge } from "@/components/clip-score-gauge";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ClipCapital — Finance. Simplified. For Every Barber & Hairdresser." },
      { name: "description", content: "Micro-finance, savings, and business tools for Ghana's 200,000+ barbers and hairdressers. Built for Mobile Money — no bank account required." },
      { property: "og:title", content: "ClipCapital — Finance. Simplified." },
      { property: "og:description", content: "Ghana's micro-finance platform for barbers and hairdressers." },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: LandingPage,
});

const pillars = [
  { icon: "📈", name: "Income Tracker", desc: "Log daily earnings in under 30 seconds. Auto-generates weekly and monthly summaries." },
  { icon: "🧾", name: "Expense Manager", desc: "Track supplies, rent, electricity — understand real profitability shop by shop." },
  { icon: "🤝", name: "ClipSusu", desc: "Peer savings groups collected via Mobile Money. Earn 5% interest per annum." },
  { icon: "💰", name: "ClipLoans", desc: "Qualify after 3–6 months of records. GH₵ 200 – GH₵ 5,000, repaid in daily micro-deductions." },
  { icon: "🛒", name: "ClipMarket", desc: "Browse and buy supplies from vetted local stores. Redeem loyalty rewards on every purchase." },
];

const problems = [
  { stat: "70%", label: "of Ghana's working population is financially excluded (Bank of Ghana)" },
  { stat: "30–100%", label: "monthly interest charged by informal lenders to barbers and hairdressers" },
  { stat: "0", label: "financial records kept by most barbers — earnings managed mentally or on paper" },
  { stat: "200K+", label: "active barbers and hair salons across Ghana operating informally" },
];

const scoreSteps = [
  { n: 1, title: "Record", body: "Log income daily in under a minute." },
  { n: 2, title: "Build", body: "After 90 days, ClipCapital generates your ClipScore." },
  { n: 3, title: "Qualify", body: "A qualifying ClipScore unlocks loan applications." },
  { n: 4, title: "Repay", body: "Daily micro-deductions via MTN MoMo or Vodafone Cash." },
  { n: 5, title: "Grow", body: "On-time repayment raises your ClipScore and loan ceiling." },
];

const revenue = [
  { stream: "Loan Interest", desc: "Interest on all ClipLoans disbursed", rate: "5–8% flat per cycle" },
  { stream: "Transaction Fees", desc: "Mobile Money collections for ClipSusu groups", rate: "1% per transaction" },
  { stream: "Marketplace Commission", desc: "Affiliated stores on ClipMarket", rate: "3–5% per sale" },
  { stream: "Partner Referrals", desc: "Equipment suppliers via ClipCapital referrals", rate: "3–5% per sale" },
  { stream: "Data Insights (B2B)", desc: "Anonymised trade data for financial institutions (Year 2+)", rate: "Subscription" },
];

const projections = [
  { year: "Year 1", users: 500, revenue: 13.2, costs: 60 },
  { year: "Year 2", users: 3000, revenue: 102.8, costs: 95 },
  { year: "Year 3", users: 12000, revenue: 632, costs: 180 },
];

const roadmap = [
  { phase: "Phase 1", time: "Months 1–2", body: "Field research with 50+ barbers and hairdressers in Accra." },
  { phase: "Phase 2", time: "Months 3–4", body: "MVP build — income tracker, expense logger, ClipScore v1, video tutorials." },
  { phase: "Phase 3", time: "Month 5", body: "MTN & Vodafone Cash API integration; first marketplace partners; compliance." },
  { phase: "Phase 4", time: "Months 6–7", body: "Pilot launch with 50 users; on-the-ground agents in shops." },
  { phase: "Phase 5", time: "Months 8–10", body: "Activate ClipLoans; onboard 150 borrowers; launch ClipMarket." },
  { phase: "Phase 6", time: "Months 11–12", body: "Full public launch in Accra via barbers' and hairdressers' associations." },
  { phase: "Phase 7", time: "Year 2+", body: "Expand to Kumasi, Takoradi, Tamale and adjacent informal trades." },
];

const advantages = [
  { title: "Trade-specific design", body: "Built for barbers and hairdressers, not generic SMEs. Loan sizes, schedules, and copy tailored to the trade." },
  { title: "Daily micro-repayments", body: "Repayment mirrors how users earn — small amounts every day." },
  { title: "No bank account required", body: "Runs entirely on Mobile Money, which 75%+ of Ghanaian adults already use." },
  { title: "Savings with 5% interest", body: "A tangible benefit unavailable from most informal savings methods." },
  { title: "Community trust", body: "ClipSusu peer groups build social accountability and reduce default risk." },
  { title: "Accessible onboarding", body: "In-app video tutorials and on-the-ground agents — no user left behind by literacy." },
];

const sdgs = [
  { n: 1, name: "No Poverty" },
  { n: 8, name: "Decent Work" },
  { n: 9, name: "Innovation" },
  { n: 10, name: "Reduced Inequalities" },
  { n: 17, name: "Partnerships" },
];

function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 kente-pattern opacity-40" aria-hidden />
        <div className="absolute top-32 right-1/4 w-96 h-96 rounded-full bg-primary/20 blur-3xl" aria-hidden />
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-gold/10 blur-3xl" aria-hidden />

        <div className="relative max-w-7xl mx-auto px-6 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1 text-xs font-medium text-muted-foreground mb-6"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              A financial inclusion engine for Ghana
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
              className="text-5xl md:text-7xl font-display font-bold leading-[1.05] tracking-tight"
            >
              Finance. Simplified.<br />
              <span className="text-gradient-gold">For every barber<br />& hairdresser.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
              className="mt-6 text-lg text-muted-foreground max-w-xl"
            >
              ClipCapital turns daily cash income into a verifiable financial identity — unlocking savings, micro-loans, and growth capital for Ghana's 200,000+ informal barbers and hairdressers. No bank account required.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }}
              className="mt-8 flex flex-wrap items-center gap-4"
            >
              <Link to="/demo" className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3 font-semibold hover:bg-primary/90 transition glow-emerald">
                Try the live demo →
              </Link>
              <a href="#problem" className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 font-semibold hover:bg-surface transition">
                Read the pitch
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.5 }}
              className="mt-12 grid grid-cols-3 gap-6 max-w-lg"
            >
              {[
                ["200K+", "Target market"],
                ["5%", "Savings APR"],
                ["GH₵ 5K", "Max loan"],
              ].map(([k, v]) => (
                <div key={k}>
                  <div className="text-3xl font-display font-bold text-foreground">{k}</div>
                  <div className="text-xs text-muted-foreground mt-1">{v}</div>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.3 }}
            className="lg:col-span-5 relative"
          >
            <div className="relative mx-auto w-[280px] h-[560px] rounded-[42px] border-[10px] border-surface-elevated bg-surface shadow-2xl overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-surface-elevated rounded-b-2xl z-10" />
              <img src={heroImg} alt="Ghanaian barber using ClipCapital" className="absolute inset-0 w-full h-full object-cover opacity-40" />
              <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background" />
              <div className="absolute inset-0 p-5 flex flex-col">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>9:41</span>
                  <span>5G ◗</span>
                </div>
                <div className="mt-6">
                  <div className="text-xs text-muted-foreground">Akwaaba, Kwame</div>
                  <div className="text-2xl font-display font-bold mt-1">GH₵ 1,455</div>
                  <div className="text-[10px] text-primary mt-0.5">▲ 18% this week</div>
                </div>
                <div className="mt-6 flex justify-center">
                  <ClipScoreGauge score={712} size={180} />
                </div>
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

      {/* Problem */}
      <Section id="problem" eyebrow="The Problem" title={<>Ghana's most visible trades are invisible to the financial system.</>}>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {problems.map((p, i) => (
            <FadeIn key={p.stat} delay={i * 0.05}>
              <div className="rounded-2xl bg-surface border border-border p-6 h-full">
                <div className="text-4xl font-display font-bold text-gradient-gold">{p.stat}</div>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{p.label}</p>
              </div>
            </FadeIn>
          ))}
        </div>
        <FadeIn delay={0.2}>
          <p className="mt-12 text-xl text-muted-foreground max-w-3xl leading-relaxed">
            Barbershops and hair salons are everywhere — from Accra to Tamale. Yet without records, credit history, or collateral, owners are rejected by banks and forced into informal loans at exploitative rates. A single equipment breakdown can push a shop into crisis.
          </p>
        </FadeIn>
      </Section>

      {/* Solution */}
      <Section id="solution" eyebrow="The Solution" title={<>Five tools. One app. Built for the trade.</>}>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pillars.map((p, i) => (
            <FadeIn key={p.name} delay={i * 0.05}>
              <div className="group rounded-2xl bg-surface border border-border p-7 h-full hover:border-primary/50 transition">
                <div className="text-4xl mb-4">{p.icon}</div>
                <h3 className="text-xl font-display font-bold mb-2">{p.name}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </Section>

      {/* ClipScore */}
      <Section eyebrow="How ClipScore works" title={<>From mental math to a verifiable financial identity.</>}>
        <div className="relative grid md:grid-cols-5 gap-4">
          {scoreSteps.map((s, i) => (
            <FadeIn key={s.n} delay={i * 0.08}>
              <div className="relative rounded-2xl bg-surface border border-border p-6 h-full">
                <div className="text-xs text-gold font-bold uppercase tracking-widest mb-3">Step {s.n}</div>
                <h4 className="text-lg font-display font-bold mb-2">{s.title}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </Section>

      {/* Business Model */}
      <Section id="model" eyebrow="Business model" title={<>Five revenue streams aligned with user success.</>}>
        <div className="rounded-2xl bg-surface border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-elevated">
              <tr>
                <th className="text-left p-5 font-display font-bold">Revenue Stream</th>
                <th className="text-left p-5 font-display font-bold hidden md:table-cell">Description</th>
                <th className="text-left p-5 font-display font-bold">Rate</th>
              </tr>
            </thead>
            <tbody>
              {revenue.map((r) => (
                <tr key={r.stream} className="border-t border-border">
                  <td className="p-5 font-semibold">{r.stream}</td>
                  <td className="p-5 text-muted-foreground hidden md:table-cell">{r.desc}</td>
                  <td className="p-5 text-gold font-medium">{r.rate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Projections */}
      <Section eyebrow="3-Year outlook" title={<>From pilot to platform.</>}>
        <div className="grid lg:grid-cols-2 gap-6">
          <FadeIn>
            <div className="rounded-2xl bg-surface border border-border p-6 h-full">
              <h4 className="font-display font-bold mb-1">Registered users</h4>
              <p className="text-xs text-muted-foreground mb-4">Barbers & hairdressers onboarded</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={projections}>
                    <CartesianGrid stroke="oklch(0.32 0.02 160 / 30%)" strokeDasharray="3 3" />
                    <XAxis dataKey="year" stroke="oklch(0.7 0.02 100)" fontSize={12} />
                    <YAxis stroke="oklch(0.7 0.02 100)" fontSize={12} />
                    <Tooltip contentStyle={{ background: "oklch(0.21 0.022 160)", border: "1px solid oklch(0.32 0.02 160)", borderRadius: 12 }} />
                    <Bar dataKey="users" fill="oklch(0.62 0.15 160)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div className="rounded-2xl bg-surface border border-border p-6 h-full">
              <h4 className="font-display font-bold mb-1">Revenue vs. costs</h4>
              <p className="text-xs text-muted-foreground mb-4">In GH₵ thousands</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={projections}>
                    <CartesianGrid stroke="oklch(0.32 0.02 160 / 30%)" strokeDasharray="3 3" />
                    <XAxis dataKey="year" stroke="oklch(0.7 0.02 100)" fontSize={12} />
                    <YAxis stroke="oklch(0.7 0.02 100)" fontSize={12} />
                    <Tooltip contentStyle={{ background: "oklch(0.21 0.022 160)", border: "1px solid oklch(0.32 0.02 160)", borderRadius: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="revenue" name="Revenue" stroke="oklch(0.82 0.14 85)" strokeWidth={3} dot={{ r: 5 }} />
                    <Line type="monotone" dataKey="costs" name="Costs" stroke="oklch(0.55 0.13 200)" strokeWidth={3} dot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </FadeIn>
        </div>
        <FadeIn delay={0.15}>
          <p className="mt-8 text-sm text-muted-foreground max-w-3xl">
            Year 1 deficit is expected — it covers platform development, team salaries, pilot loan capital, and agent outreach. A seed grant of GH₵ 80,000 closes the gap. Break-even is projected in mid-Year 2.
          </p>
        </FadeIn>
      </Section>

      {/* Roadmap */}
      <Section id="roadmap" eyebrow="Implementation plan" title={<>Twelve months to public launch.</>}>
        <div className="space-y-3">
          {roadmap.map((r, i) => (
            <FadeIn key={r.phase} delay={i * 0.04}>
              <div className="flex flex-col md:flex-row md:items-center gap-4 rounded-2xl bg-surface border border-border p-5">
                <div className="md:w-28 text-gold font-display font-bold">{r.phase}</div>
                <div className="md:w-36 text-sm text-muted-foreground">{r.time}</div>
                <div className="flex-1 text-foreground">{r.body}</div>
              </div>
            </FadeIn>
          ))}
        </div>
      </Section>

      {/* Advantages */}
      <Section eyebrow="Competitive advantage" title={<>Why ClipCapital will succeed where others haven't.</>}>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {advantages.map((a, i) => (
            <FadeIn key={a.title} delay={i * 0.05}>
              <div className="rounded-2xl bg-surface border border-border p-6 h-full">
                <h4 className="font-display font-bold text-lg mb-2 text-foreground">{a.title}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{a.body}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </Section>

      {/* SDG */}
      <Section eyebrow="Social impact" title={<>Aligned with five UN Sustainable Development Goals.</>}>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {sdgs.map((s, i) => (
            <FadeIn key={s.n} delay={i * 0.05}>
              <div className="rounded-2xl bg-gradient-to-br from-primary/15 to-gold/10 border border-border p-6 text-center">
                <div className="text-5xl font-display font-bold text-gradient-gold">{s.n}</div>
                <div className="text-sm font-semibold mt-2">{s.name}</div>
              </div>
            </FadeIn>
          ))}
        </div>
      </Section>

      {/* Final CTA */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <FadeIn>
          <div className="relative rounded-3xl bg-gradient-to-br from-primary/30 via-surface to-gold/15 border border-border p-12 md:p-20 overflow-hidden">
            <div className="absolute inset-0 kente-pattern opacity-30" aria-hidden />
            <div className="relative max-w-2xl">
              <h2 className="text-4xl md:text-6xl font-display font-bold leading-tight">
                See the app barbers will actually use.
              </h2>
              <p className="mt-6 text-lg text-muted-foreground">
                Walk through the income tracker, ClipSusu, ClipLoans, and ClipMarket — the full ClipCapital experience in your browser.
              </p>
              <Link to="/demo" className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-7 py-4 text-lg font-semibold hover:bg-primary/90 transition glow-emerald">
                Open the demo →
              </Link>
            </div>
          </div>
        </FadeIn>
      </section>

      <SiteFooter />
    </div>
  );
}
