import { createFileRoute, Link, Outlet, useMatchRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, Card, EmptyState } from "@/components/app-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useJoinGroup, useMyGroups, useAllSusuGroups, useCreateGroup } from "@/lib/app-queries";
import { toast } from "sonner";
import { Loader2, Users, Wallet, Plus, ChevronRight, Search, ShieldPlus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/_authenticated/app/susu")({
  component: SusuLayout,
});

function SusuLayout() {
  const matchRoute = useMatchRoute();
  const onChild = matchRoute({ to: "/app/susu/$groupId" });
  if (onChild) return <Outlet />;
  return <SusuList />;
}

function SusuList() {
  const myGroups = useMyGroups();
  const allGroups = useAllSusuGroups();
  const join = useJoinGroup();
  const create = useCreateGroup();

  const [invite, setInvite] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const [name, setName] = useState("");
  const [contribution, setContribution] = useState("");
  const [frequency, setFrequency] = useState("Weekly");

  const myGroupIds = new Set((myGroups.data ?? []).map(g => g.id));
  const availableGroups = (allGroups.data ?? []).filter(g => !myGroupIds.has(g.id));

  async function onJoin(inviteCode: string) {
    try {
      await join.mutateAsync(inviteCode);
      toast.success("Joined group successfully!");
    } catch (e) {
      toast.error("Failed to join: " + (e as Error).message);
    }
  }

  async function onManualJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!invite.trim()) return;
    await onJoin(invite.trim());
    setInvite("");
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    const amount = Number(contribution);
    if (!name.trim() || !amount) { toast.error("Name and contribution required"); return; }
    try {
      await create.mutateAsync({ name, contribution: amount, frequency });
      setName(""); setContribution(""); setShowCreate(false);
      toast.success("Susu Circle created successfully!");
    }
    catch (e) {
      toast.error("Failed to create circle: " + (e as Error).message);
    }
  }

  return (
    <AppShell title="Susu Savings Groups">
      {/* Top Banner */}
      <div className="bg-primary rounded-3xl p-6 mb-8 text-white relative overflow-hidden shadow-xl shadow-primary/20">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1">
            <h2 className="text-2xl font-display font-black mb-2 leading-none text-white">Savings Circles</h2>
            <p className="text-primary-foreground/80 text-sm max-w-md font-medium leading-relaxed mt-2">
              Join professional circles or start your own private Susu. Safe, secure, and automated payouts.
            </p>
          </div>
          <Button
            onClick={() => setShowCreate(!showCreate)}
            className="bg-white text-primary hover:bg-white/90 font-black uppercase text-[10px] tracking-widest px-6 h-11 rounded-2xl shadow-xl active:scale-95 transition-all gap-2 border-none"
          >
            <ShieldPlus className="w-4 h-4" />
            {showCreate ? "Close Form" : "Start New Circle"}
          </Button>
        </div>
        <Users className="absolute -right-4 -bottom-4 w-40 h-40 text-white/10 rotate-12" />
      </div>

      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ height: 0, opacity: 0, marginBottom: 0 }}
            animate={{ height: 'auto', opacity: 1, marginBottom: 32 }}
            exit={{ height: 0, opacity: 0, marginBottom: 0 }}
            className="overflow-hidden"
          >
            <Card className="border-primary/20 bg-primary/5 shadow-inner">
              <h3 className="font-display font-black text-sm uppercase tracking-tight mb-4 text-primary">New Savings Circle</h3>
              <form onSubmit={onCreate} className="grid md:grid-cols-4 gap-4 items-end">
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase ml-1 opacity-70">Circle Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Osu Barber Savings" className="h-11 bg-background rounded-xl border-border/40 font-bold" required />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase ml-1 opacity-70">Daily Contribution (GH₵)</Label>
                  <Input type="number" min="1" value={contribution} onChange={(e) => setContribution(e.target.value)} placeholder="50" className="h-11 bg-background rounded-xl border-border/40 font-bold" required />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase ml-1 opacity-70">Payout Frequency</Label>
                  <select value={frequency} onChange={(e) => setFrequency(e.target.value)}
                    className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm font-bold focus:ring-1 focus:ring-primary outline-none shadow-sm">
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                  </select>
                </div>
                <Button type="submit" disabled={create.isPending} className="h-11 font-black uppercase text-[10px] tracking-widest rounded-xl shadow-lg shadow-primary/20">
                  {create.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm & Create"}
                </Button>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: My Groups */}
        <div className="lg:col-span-2 space-y-8">
          <div>
            <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary" />
              My Active Groups
            </h3>

            {myGroups.isLoading ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {[1, 2].map(i => <div key={i} className="h-32 rounded-2xl bg-muted animate-pulse" />)}
              </div>
            ) : (myGroups.data ?? []).length === 0 ? (
              <Card className="bg-muted/30 border-dashed py-12 flex flex-col items-center justify-center text-center">
                <Users className="w-12 h-12 text-muted-foreground/30 mb-3" />
                <div className="font-bold text-muted-foreground">No active groups</div>
                <p className="text-xs text-muted-foreground/60 mt-1">Join an available circle below to start saving.</p>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {(myGroups.data ?? []).map((g) => (
                  <Link key={g.id} to="/app/susu/$groupId" params={{ groupId: g.id }}>
                    <motion.div whileHover={{ y: -4 }} className="h-full">
                      <Card className="h-full hover:border-primary/50 transition-all group border-border/60">
                        <div className="flex justify-between items-start mb-4">
                          <div className="bg-primary/10 p-2 rounded-xl text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                            <Users className="w-5 h-5" />
                          </div>
                          <div className="text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full">Active</div>
                        </div>
                        <div className="font-display font-black text-lg text-foreground truncate">{g.name}</div>
                        <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter mt-1">
                          {g.frequency} · {g.members_count} Members
                        </div>
                        <div className="mt-6 flex items-end justify-between">
                          <div>
                            <div className="text-[9px] uppercase font-bold text-muted-foreground">Contribution</div>
                            <div className="font-black text-primary text-xl">GH₵ {Number(g.contribution).toLocaleString()}</div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                        </div>
                      </Card>
                    </motion.div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Explore Section */}
          <div>
            <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
              <Search className="w-5 h-5 text-gold" />
              Available to Join
            </h3>

            {allGroups.isLoading ? (
              <div className="space-y-3">
                {[1, 2].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded-2xl" />)}
              </div>
            ) : availableGroups.length === 0 ? (
              <EmptyState title="All caught up!" hint="You are currently a member of all available groups." />
            ) : (
              <div className="grid gap-3">
                {availableGroups.map((g) => (
                  <Card key={g.id} className="flex flex-col sm:flex-row items-center justify-between gap-4 border-border/50 bg-surface/50 p-4">
                    <div className="flex items-center gap-4 w-full">
                      <div className="h-12 w-12 rounded-2xl bg-gold/10 flex items-center justify-center text-gold shrink-0">
                        <Users className="w-6 h-6" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-foreground truncate">{g.name}</div>
                        <div className="text-[10px] text-muted-foreground font-medium uppercase italic">
                          {g.frequency} contribution · Pot: GH₵ {Number(g.pot).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 w-full sm:w-auto shrink-0 border-t sm:border-t-0 sm:border-l border-border/50 pt-4 sm:pt-0 sm:pl-6">
                      <div className="text-center sm:text-right hidden sm:block">
                        <div className="text-[9px] uppercase font-black text-muted-foreground">Stake</div>
                        <div className="font-black text-foreground">GH₵ {Number(g.contribution).toLocaleString()}</div>
                      </div>
                      <Button
                        onClick={() => onJoin(g.invite_code)}
                        disabled={join.isPending}
                        className="flex-1 sm:flex-none h-10 px-6 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/10"
                      >
                        {join.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Join Circle"}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Invite Panel */}
        <div className="space-y-6">
          <Card className="bg-muted/20 border-primary/20 p-5">
            <h3 className="font-display font-black text-xs uppercase tracking-widest mb-4 text-primary">Private Invitation</h3>
            <p className="text-[11px] text-muted-foreground font-medium mb-4 leading-relaxed">
              If a friend invited you to their private circle, enter their 8-character invite code below.
            </p>
            <form onSubmit={onManualJoin} className="space-y-3">
              <Input
                value={invite}
                onChange={(e) => setInvite(e.target.value)}
                placeholder="Enter Code..."
                className="h-12 rounded-xl bg-background border-border/50 font-mono font-bold text-center tracking-widest text-lg"
                maxLength={8}
                required
              />
              <Button type="submit" disabled={join.isPending} variant="outline" className="w-full h-11 rounded-xl font-bold border-primary/30 text-primary hover:bg-primary hover:text-white transition-all uppercase text-[10px] tracking-widest">
                {join.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Join Now"}
              </Button>
            </form>
          </Card>

          <Card className="bg-gold/5 border-gold/20 p-5">
            <h3 className="font-display font-bold text-sm mb-2 text-gold">Why Join?</h3>
            <ul className="space-y-3">
              {[
                "Get lump sums for new tools",
                "Interest-free community capital",
                "Boost your ClipScore identity",
                "Vetted professionals only"
              ].map((text, i) => (
                <li key={i} className="flex items-start gap-2 text-[11px] font-medium text-gold/80 leading-tight">
                  <div className="h-1.5 w-1.5 rounded-full bg-gold mt-1 shrink-0" />
                  {text}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
