import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, Card, EmptyState } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MomoFields, useMomo } from "@/components/momo-form";
import { useGroup, useGroupContributions, useGroupMembers, useRecordContribution } from "@/lib/app-queries";
import { useCurrentUser } from "@/hooks/use-current-user";
import { ArrowLeft, Copy } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/susu/$groupId")({
  component: GroupPage,
});

function GroupPage() {
  const { groupId } = Route.useParams();
  const { user } = useCurrentUser();
  const group = useGroup(groupId);
  const members = useGroupMembers(groupId);
  const contributions = useGroupContributions(groupId);
  const record = useRecordContribution();
  const [amount, setAmount] = useState("");
  const [momo, setMomo] = useMomo();

  const isOwner = group.data?.owner_id === user?.id;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const amt = Number(amount);
    if (!amt || !momo.momo_reference) { toast.error("Amount and MoMo reference required"); return; }
    try {
      await record.mutateAsync({ group_id: groupId, amount: amt, ...momo });
      setAmount(""); setMomo({ ...momo, momo_reference: "" });
      toast.success("Contribution recorded — awaiting owner confirmation");
    } catch (e) { toast.error((e as Error).message); }
  }

  if (!group.data) return <AppShell title="Loading…"><div /></AppShell>;

  return (
    <AppShell title={group.data.name}>
      <Link to="/app/susu" className="inline-flex items-center gap-1 text-sm text-muted-foreground mb-4 hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> All groups
      </Link>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <Card>
          <div className="text-xs text-muted-foreground uppercase">Pot</div>
          <div className="text-2xl font-display font-bold">GH₵ {Number(group.data.pot).toLocaleString()}</div>
          <div className="text-xs text-muted-foreground mt-1 capitalize">{group.data.frequency} · cycle {group.data.cycle_index}</div>
        </Card>
        <Card>
          <div className="text-xs text-muted-foreground uppercase">Per-member contribution</div>
          <div className="text-2xl font-display font-bold">GH₵ {Number(group.data.contribution).toLocaleString()}</div>
        </Card>
        <Card>
          <div className="text-xs text-muted-foreground uppercase mb-1">Invite code</div>
          <div className="flex items-center gap-2">
            <code className="font-mono font-bold text-lg">{group.data.invite_code}</code>
            <Button variant="ghost" size="icon" onClick={() => {
              navigator.clipboard.writeText(group.data!.invite_code);
              toast.success("Copied");
            }}><Copy className="w-4 h-4" /></Button>
          </div>
          <div className="text-xs text-muted-foreground">Share with members to join.</div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-display font-semibold mb-3">Record a contribution</h3>
          <form onSubmit={submit} className="space-y-3">
            <div>
              <Label>Amount (GH₵)</Label>
              <Input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)}
                placeholder={String(group.data.contribution)} required />
            </div>
            <MomoFields value={momo} onChange={setMomo} />
            <Button type="submit" disabled={record.isPending} className="w-full">
              {record.isPending ? "Recording…" : "Record contribution"}
            </Button>
            <p className="text-xs text-muted-foreground">Pay via mobile money first, then enter your transaction ID. {isOwner ? "As owner, you can confirm payments." : "The group owner will confirm your payment."}</p>
          </form>
        </Card>

        <div>
          <h3 className="font-display font-semibold mb-3">Members & payout order</h3>
          {members.data?.length ? (
            <Card>
              <ul className="divide-y divide-border text-sm">
                {members.data.map((m) => {
                  const profile = (m as { profiles?: { display_name?: string } | null }).profiles;
                  return (
                    <li key={m.id} className="py-2 flex justify-between">
                      <span>{profile?.display_name ?? "Member"}</span>
                      <span className="text-muted-foreground">
                        #{m.payout_order} {m.has_received ? "· paid" : ""}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </Card>
          ) : <EmptyState title="No members yet" />}
        </div>
      </div>

      <h3 className="font-display font-semibold mt-8 mb-3">Contribution ledger</h3>
      {contributions.data?.length ? (
        <Card>
          <ul className="divide-y divide-border text-sm">
            {contributions.data.map((c) => (
              <li key={c.id} className="py-2 flex justify-between gap-2">
                <div>
                  <div className="font-mono text-xs text-muted-foreground">{c.momo_provider.toUpperCase()} · {c.momo_reference}</div>
                  <div className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">GH₵ {Number(c.amount).toLocaleString()}</div>
                  <div className={`text-xs ${c.status === "confirmed" ? "text-primary" : "text-muted-foreground"}`}>{c.status}</div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      ) : <EmptyState title="No contributions yet" />}
    </AppShell>
  );
}
