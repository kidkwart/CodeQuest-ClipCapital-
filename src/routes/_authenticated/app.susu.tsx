import { createFileRoute, Link, Outlet, useMatchRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, Card, EmptyState } from "@/components/app-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useCreateGroup, useJoinGroup, useMyGroups } from "@/lib/app-queries";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/susu")({
  component: SusuLayout,
});

function SusuLayout() {
  const matchRoute = useMatchRoute();
  // If a child route is active, render outlet only.
  const onChild = matchRoute({ to: "/app/susu/$groupId" });
  if (onChild) return <Outlet />;
  return <SusuList />;
}

function SusuList() {
  const groups = useMyGroups();
  const create = useCreateGroup();
  const join = useJoinGroup();
  const [name, setName] = useState("");
  const [contribution, setContribution] = useState("");
  const [frequency, setFrequency] = useState("Weekly");
  const [invite, setInvite] = useState("");

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    const amount = Number(contribution);
    if (!name.trim() || !amount) { toast.error("Name and contribution required"); return; }
    try {
      await create.mutateAsync({ name, contribution: amount, frequency });
      setName(""); setContribution("");
      toast.success("Group created successfully!");
    }
    catch (e) {
      toast.error("Failed to create group: " + (e as Error).message);
    }
  }

  async function onJoin(e: React.FormEvent) {
    e.preventDefault();
    try { await join.mutateAsync(invite); setInvite(""); toast.success("Joined group"); }
    catch (e) { toast.error((e as Error).message); }
  }

  return (
    <AppShell title="Susu — Savings Groups">
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <h3 className="font-display font-semibold mb-3">Start a new group</h3>
          <form onSubmit={onCreate} className="space-y-3">
            <div><Label>Group name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Madina Barber Savings" required /></div>
            <div><Label>Contribution (GH₵)</Label><Input type="number" min="1" value={contribution} onChange={(e) => setContribution(e.target.value)} placeholder="50" required /></div>
            <div>
              <Label>Frequency</Label>
              <select value={frequency} onChange={(e) => setFrequency(e.target.value)}
                className="mt-1 w-full h-11 rounded-xl border border-input bg-background px-3 text-sm font-bold focus:ring-1 focus:ring-primary outline-none">
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
              </select>
            </div>
            <Button type="submit" disabled={create.isPending} className="w-full h-11 font-bold">
              {create.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create group"}
            </Button>
          </form>
        </Card>

        <Card>
          <h3 className="font-display font-semibold mb-3">Join with invite code</h3>
          <form onSubmit={onJoin} className="space-y-3">
            <div><Label>Invite code</Label><Input value={invite} onChange={(e) => setInvite(e.target.value)} placeholder="8-char code" required /></div>
            <Button type="submit" disabled={join.isPending} variant="outline" className="w-full">Join group</Button>
          </form>
          <p className="mt-3 text-xs text-muted-foreground">Group owners can share their invite code from the group page.</p>
        </Card>
      </div>

      <h3 className="font-display font-semibold mb-3">My groups</h3>
      {(groups.data ?? []).length === 0 ? (
        <EmptyState title="You're not in any groups yet" hint="Create one above or join with an invite code." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(groups.data ?? []).map((g) => (
            <Link key={g.id} to="/app/susu/$groupId" params={{ groupId: g.id }}
              className="rounded-xl bg-surface border border-border p-5 hover:border-primary/50 transition">
              <div className="font-display font-bold">{g.name}</div>
              <div className="text-xs text-muted-foreground mt-1 capitalize">{g.frequency} · {g.members_count} member(s)</div>
              <div className="text-sm mt-2">Contribution: <span className="font-semibold">GH₵ {Number(g.contribution).toLocaleString()}</span></div>
              <div className="text-sm">Pot: <span className="font-semibold text-gold">GH₵ {Number(g.pot).toLocaleString()}</span></div>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
