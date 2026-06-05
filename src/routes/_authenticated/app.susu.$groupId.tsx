import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, Card, EmptyState } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MomoFields, useMomo } from "@/components/momo-form";
import { useGroup, useGroupContributions, useGroupMembers, useRecordContribution } from "@/lib/app-queries";
import { useCurrentUser } from "@/hooks/use-current-user";
import { ArrowLeft, Copy, MessageSquare, Share2, Users, Wallet } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

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

  const shareToWhatsApp = () => {
    if (!group.data) return;
    const text = `Join my Susu savings group "${group.data.name}" on ClipCapital! \n\nUse my Invite Code: ${group.data.invite_code} \n\nLet's save and grow together! 💰📈`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  if (!group.data) return <AppShell title="Loading…"><div /></AppShell>;

  return (
    <AppShell title={group.data.name}>
      <Link to="/app/susu" className="inline-flex items-center gap-1 text-sm text-muted-foreground mb-4 hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> All groups
      </Link>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="h-full border-primary/20 bg-primary/5">
            <div className="flex items-center gap-2 text-primary mb-2">
              <Wallet className="w-4 h-4" />
              <div className="text-xs font-bold uppercase tracking-wider">Total Pot</div>
            </div>
            <div className="text-3xl font-display font-bold text-primary">GH₵ {Number(group.data.pot).toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-2 font-medium capitalize">
              {group.data.frequency} cycle · Round {group.data.cycle_index}
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="h-full border-gold/20 bg-gold/5">
            <div className="flex items-center gap-2 text-gold mb-2">
              <Users className="w-4 h-4" />
              <div className="text-xs font-bold uppercase tracking-wider">Your Contribution</div>
            </div>
            <div className="text-3xl font-display font-bold text-gold">GH₵ {Number(group.data.contribution).toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-2 font-medium">
              Due every {group.data.frequency === 'daily' ? 'day' : 'week'}
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="h-full border-emerald-500/20 bg-emerald-500/5">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-3">Invite Members</div>
            <div className="flex items-center justify-between gap-3 bg-background p-2 rounded-lg border border-emerald-500/10 mb-3">
              <code className="font-mono font-bold text-lg text-emerald-700">{group.data.invite_code}</code>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => {
                navigator.clipboard.writeText(group.data!.invite_code);
                toast.success("Code copied to clipboard!");
              }}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <Button
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white gap-2 font-bold"
              onClick={shareToWhatsApp}
            >
              <MessageSquare className="w-4 h-4" /> Invite via WhatsApp
            </Button>
          </Card>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h3 className="font-display font-bold text-lg flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" />
            Pay Your Contribution
          </h3>
          <Card className="shadow-sm">
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Amount to send (GH₵)</Label>
                <Input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)}
                  placeholder={String(group.data.contribution)} className="h-12 text-lg font-bold" required />
              </div>
              <div className="p-4 bg-muted/30 rounded-xl border border-border/50">
                <MomoFields value={momo} onChange={setMomo} />
              </div>
              <Button type="submit" disabled={record.isPending} className="w-full h-12 font-bold text-lg shadow-lg shadow-primary/20">
                {record.isPending ? "Submitting..." : "Send Contribution"}
              </Button>
              <div className="flex items-start gap-2 p-3 bg-blue-500/5 rounded-lg border border-blue-500/10">
                <Share2 className="w-4 h-4 text-blue-500 mt-0.5" />
                <p className="text-[10px] text-blue-700 font-medium leading-relaxed">
                  Pay the total to 0244123456 (ClipCapital Susu) then enter your transaction ID.
                  {isOwner ? " You can confirm this payment as the owner." : " Your group owner will confirm once received."}
                </p>
              </div>
            </form>
          </Card>

          <h3 className="font-display font-bold text-lg mt-10 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Recent Contributions
          </h3>
          {contributions.data?.length ? (
            <Card className="p-0 overflow-hidden shadow-sm">
              <ul className="divide-y divide-border">
                {contributions.data.map((c) => (
                  <li key={c.id} className="p-4 flex justify-between items-center hover:bg-muted/30 transition-colors">
                    <div className="flex flex-col">
                      <div className="font-mono text-[10px] font-bold text-muted-foreground uppercase">{c.momo_provider} · {c.momo_reference}</div>
                      <div className="text-[10px] text-muted-foreground">{new Date(c.created_at).toLocaleString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-primary">GH₵ {Number(c.amount).toLocaleString()}</div>
                      <div className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        c.status === "confirmed" ? "bg-emerald-500/10 text-emerald-600" : "bg-orange-500/10 text-orange-600"
                      }`}>
                        {c.status}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          ) : <EmptyState title="No history" hint="Be the first to contribute to this cycle!" />}
        </div>

        <div>
          <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Susu Members
          </h3>
          {members.data?.length ? (
            <Card className="p-0 overflow-hidden shadow-sm">
              <div className="p-4 bg-muted/20 border-b border-border">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Payout Schedule</div>
              </div>
              <ul className="divide-y divide-border">
                {members.data.map((m, idx) => {
                  const profile = (m as { profiles?: { display_name?: string } | null }).profiles;
                  const isNext = !m.has_received && (idx === 0 || members.data![idx-1].has_received);

                  return (
                    <li key={m.id} className={`p-4 flex justify-between items-center ${isNext ? 'bg-primary/5' : ''}`}>
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ${
                          m.has_received ? 'bg-muted text-muted-foreground' : 'bg-primary/20 text-primary'
                        }`}>
                          {m.payout_order}
                        </div>
                        <div>
                          <div className="font-bold text-sm flex items-center gap-2">
                            {profile?.display_name ?? "Member"}
                            {isNext && <span className="text-[9px] bg-primary text-white px-1.5 py-0.5 rounded-full animate-pulse">NEXT PAYOUT</span>}
                          </div>
                          <div className="text-[10px] text-muted-foreground uppercase font-medium">
                            Joined {new Date(m.joined_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        {m.has_received ? (
                          <div className="flex items-center gap-1 text-emerald-600 font-bold text-[10px] uppercase">
                            <Check className="w-3 h-3" /> Payout Received
                          </div>
                        ) : (
                          <div className="text-muted-foreground font-bold text-[10px] uppercase italic">
                            Waiting
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>
          ) : <EmptyState title="Group is empty" hint="Share your invite code to start saving!" />}
        </div>
      </div>
    </AppShell>
  );
}
