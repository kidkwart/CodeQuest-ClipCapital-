import { createFileRoute } from "@tanstack/react-router";
import { useDemo } from "@/lib/demo-store";

export const Route = createFileRoute("/demo/susu")({
  component: SusuPage,
});

function SusuPage() {
  const { susuGroups, toggleJoin } = useDemo();

  return (
    <div className="pt-4 space-y-5">
      <div>
        <h1 className="text-xl font-display font-bold">ClipSusu</h1>
        <p className="text-xs text-muted-foreground mt-1">Peer savings groups · 5% APR · Mobile Money collections</p>
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-primary/20 to-gold/10 border border-primary/30 p-4">
        <div className="text-xs text-muted-foreground">Your total saved</div>
        <div className="text-2xl font-display font-bold mt-1">
          GH₵ {susuGroups.filter((g) => g.joined).reduce((s, g) => s + g.pot, 0)}
        </div>
        <div className="text-[11px] text-gold mt-1">Earning 5% per annum</div>
      </div>

      <div className="space-y-3">
        {susuGroups.map((g) => (
          <div key={g.id} className="rounded-2xl bg-surface-elevated border border-border p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="font-display font-bold">{g.name}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{g.members} members · {g.frequency} GH₵ {g.contribution}</div>
                <div className="mt-3 text-xs">
                  <span className="text-muted-foreground">Group pot: </span>
                  <span className="font-bold text-gold">GH₵ {g.pot}</span>
                </div>
              </div>
              <button
                onClick={() => toggleJoin(g.id)}
                className={`text-xs font-semibold rounded-full px-4 py-2 transition ${
                  g.joined ? "bg-surface border border-border text-muted-foreground" : "bg-primary text-primary-foreground hover:bg-primary/90"
                }`}
              >
                {g.joined ? "Joined ✓" : "Join"}
              </button>
            </div>
          </div>
        ))}
      </div>

      <button className="w-full rounded-2xl border-2 border-dashed border-border py-4 text-sm text-muted-foreground hover:border-primary/50 hover:text-foreground transition">
        + Create new susu group
      </button>
    </div>
  );
}
