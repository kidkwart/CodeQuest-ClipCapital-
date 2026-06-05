import { createFileRoute } from "@tanstack/react-router";
import { useSusu, useToggleSusu } from "@/lib/demo-queries";

export const Route = createFileRoute("/_authenticated/demo/susu")({
  component: SusuPage,
});

function SusuPage() {
  const { data: groups = [] } = useSusu();
  const toggle = useToggleSusu();

  const saved = groups.filter((g) => g.joined).reduce((s, g) => s + Number(g.pot), 0);

  return (
    <div className="pt-4 space-y-5">
      <div>
        <h1 className="text-xl font-display font-bold">ClipSusu</h1>
        <p className="text-xs text-muted-foreground mt-1">Peer savings groups · 5% APR · Mobile Money collections</p>
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-primary/20 to-gold/10 border border-primary/30 p-4">
        <div className="text-xs text-muted-foreground">Your total saved</div>
        <div className="text-2xl font-display font-bold mt-1">GH₵ {saved.toFixed(0)}</div>
        <div className="text-[11px] text-gold mt-1">Earning 5% per annum</div>
      </div>

      <div className="space-y-3">
        {groups.map((g) => (
          <div key={g.id} className="rounded-2xl bg-surface-elevated border border-border p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="font-display font-bold">{g.name}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{g.members_count} members · {g.frequency} GH₵ {Number(g.contribution)}</div>
                <div className="mt-3 text-xs">
                  <span className="text-muted-foreground">Group pot: </span>
                  <span className="font-bold text-gold">GH₵ {Number(g.pot)}</span>
                </div>
              </div>
              <button
                disabled={toggle.isPending}
                onClick={() => toggle.mutate({ groupId: g.id, joined: g.joined })}
                className={`text-xs font-semibold rounded-full px-4 py-2 transition disabled:opacity-60 ${
                  g.joined ? "bg-surface border border-border text-muted-foreground" : "bg-primary text-primary-foreground hover:bg-primary/90"
                }`}
              >
                {g.joined ? "Joined ✓" : "Join"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
