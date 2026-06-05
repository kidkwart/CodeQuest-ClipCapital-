import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, Card, EmptyState } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMyRoles, usePendingLoans, useReviewLoan } from "@/lib/app-queries";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/admin")({
  component: Admin,
});

function Admin() {
  const roles = useMyRoles();
  if (roles.isLoading) return <AppShell title="Admin"><div className="text-muted-foreground">Loading…</div></AppShell>;
  if (!roles.data?.includes("admin")) return <Navigate to="/app" />;

  return (
    <AppShell title="Admin">
      <h3 className="font-display font-semibold mb-3">Loan applications</h3>
      <LoanQueue />
    </AppShell>
  );
}

function LoanQueue() {
  const list = usePendingLoans();
  const review = useReviewLoan();
  const [noteById, setNoteById] = useState<Record<string, string>>({});

  if ((list.data ?? []).length === 0) return <EmptyState title="No applications" />;

  return (
    <div className="space-y-3">
      {list.data!.map((l) => {
        const profile = (l as { profiles?: { display_name?: string; business_name?: string } | null }).profiles;
        return (
          <Card key={l.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-display font-bold">{profile?.display_name ?? "User"} <span className="text-xs text-muted-foreground">({profile?.business_name ?? "—"})</span></div>
                <div className="text-sm mt-1">GH₵ {Number(l.amount).toLocaleString()} · {l.term_months}mo · {l.purpose}</div>
                <div className="text-xs text-muted-foreground mt-1">{new Date(l.created_at).toLocaleString()}</div>
                <div className="text-xs font-bold uppercase mt-1 text-primary">{l.status}</div>
              </div>
            </div>
            {l.status === "pending" && (
              <div className="mt-4 space-y-2 border-t border-border pt-3">
                <Label className="text-xs">Decision note (optional)</Label>
                <Input value={noteById[l.id] ?? ""} onChange={(e) => setNoteById({ ...noteById, [l.id]: e.target.value })} />
                <div className="flex gap-2">
                  <Button size="sm" disabled={review.isPending} onClick={async () => {
                    try { await review.mutateAsync({ id: l.id, status: "approved", decision_note: noteById[l.id] ?? "" }); toast.success("Approved"); }
                    catch (e) { toast.error((e as Error).message); }
                  }}>Approve</Button>
                  <Button size="sm" variant="outline" disabled={review.isPending} onClick={async () => {
                    try { await review.mutateAsync({ id: l.id, status: "rejected", decision_note: noteById[l.id] ?? "" }); toast.success("Rejected"); }
                    catch (e) { toast.error((e as Error).message); }
                  }}>Reject</Button>
                </div>
              </div>
            )}
            {l.decision_note && <div className="mt-2 text-xs italic text-muted-foreground">Note: {l.decision_note}</div>}
          </Card>
        );
      })}
    </div>
  );
}
