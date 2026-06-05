import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

export function SiteHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/70 border-b border-border/40">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-display font-bold text-lg">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground">✂</span>
          <span>ClipCapital</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <a href="#problem" className="hover:text-foreground transition">Problem</a>
          <a href="#solution" className="hover:text-foreground transition">Solution</a>
          <a href="#model" className="hover:text-foreground transition">Model</a>
          <a href="#roadmap" className="hover:text-foreground transition">Roadmap</a>
        </nav>
        <Link
          to="/demo"
          className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:bg-primary/90 transition"
        >
          Try the demo →
        </Link>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border/40 mt-32">
      <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 font-display font-bold text-lg mb-2">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground">✂</span>
            ClipCapital
          </div>
          <p className="text-sm text-muted-foreground max-w-md">
            Finance. Simplified. A university entrepreneurship project building financial inclusion for Ghana's informal trades.
          </p>
        </div>
        <div className="text-xs text-muted-foreground">
          © 2026 ClipCapital · Accra, Ghana
        </div>
      </div>
    </footer>
  );
}

export function Section({ id, eyebrow, title, children, className = "" }: { id?: string; eyebrow?: string; title?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section id={id} className={`max-w-7xl mx-auto px-6 py-24 ${className}`}>
      {(eyebrow || title) && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-12 max-w-3xl"
        >
          {eyebrow && (
            <div className="text-sm font-semibold text-gold uppercase tracking-widest mb-3">{eyebrow}</div>
          )}
          {title && <h2 className="text-4xl md:text-5xl font-bold text-foreground">{title}</h2>}
        </motion.div>
      )}
      {children}
    </section>
  );
}

export function FadeIn({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay }}
    >
      {children}
    </motion.div>
  );
}
