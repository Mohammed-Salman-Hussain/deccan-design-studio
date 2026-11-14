import { useMemo, useState } from "react";
import { Calculator } from "lucide-react";
import { Panel } from "@/components/ll/primitives";
import { LOOPS } from "@/lib/sim/loops";
import type { LoopId } from "@/lib/sim/types";
import { SENSORS, type CostBand } from "@/lib/hardware";
import { cn } from "@/lib/utils";

const WEIGHT: Record<CostBand, number> = { Low: 1, Medium: 3, High: 8 };
const COST_STYLE: Record<CostBand, string> = {
  Low: "border-success/30 bg-success/15 text-success",
  Medium: "border-warning/30 bg-warning/15 text-warning",
  High: "border-destructive/30 bg-destructive/15 text-destructive",
};

export function Sizer() {
  const [flats, setFlats] = useState(180);
  const [loops, setLoops] = useState<Record<LoopId, boolean>>({ waste: true, solar: true, rain: true, reuse: true, save: true });

  const plan = useMemo(() => {
    const picked = SENSORS.filter((s) => s.loops.some((l) => loops[l]));
    const perHub = picked.map((s) => ({ s, qty: s.qty(flats) })).filter((x) => x.qty > 0);
    const shared = picked.filter((s) => s.qty(flats) === 0);
    const gateways = perHub.length ? Math.max(1, Math.ceil(flats / 300)) : 0;
    const score = perHub.reduce((a, x) => a + WEIGHT[x.s.cost] * x.qty, 0) + gateways * WEIGHT.Medium;
    const band: CostBand = score <= 30 ? "Low" : score <= 75 ? "Medium" : "High";
    return { perHub, shared, gateways, band, count: perHub.reduce((a, x) => a + x.qty, 0) + gateways };
  }, [flats, loops]);

  const anyLoop = Object.values(loops).some(Boolean);

  return (
    <div className="grid gap-4 xl:grid-cols-[340px_1fr]">
      <Panel title="Size a hub" subtitle="A guide, not a quote" icon={Calculator}>
        <div>
          <label htmlFor="sizer-flats" className="mb-1 flex items-center justify-between text-xs"><span className="text-muted-foreground">Number of flats</span><span className="font-display text-lg font-semibold text-primary-glow tabular">{flats}</span></label>
          <input id="sizer-flats" type="range" min={40} max={500} step={10} value={flats} onChange={(e) => setFlats(Number(e.target.value))} className="w-full accent-[var(--primary)]" />
          <div className="mt-0.5 flex justify-between text-[10px] text-muted-foreground"><span>40</span><span>500</span></div>
        </div>
        <fieldset className="mt-4">
          <legend className="mb-1.5 text-xs text-muted-foreground">Loops to include</legend>
          <div className="space-y-1.5">
            {LOOPS.map((l) => (
              <label key={l.id} htmlFor={`sz-${l.id}`} className={cn("flex cursor-pointer items-center gap-2.5 rounded-lg border px-2.5 py-2 text-xs transition hover:bg-accent/40", loops[l.id] && "bg-primary/10")}>
                <input id={`sz-${l.id}`} type="checkbox" checked={loops[l.id]} onChange={() => setLoops((p) => ({ ...p, [l.id]: !p[l.id] }))} className="size-4 accent-[var(--primary)]" />
                <l.icon className="size-3.5" style={{ color: l.color }} aria-hidden />
                <span>{l.short}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="mt-4 rounded-xl border bg-muted/30 p-3 text-center">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Indicative cost band for the hub</p>
          <p className="mt-1"><span className={cn("rounded-full border px-3 py-1 text-sm font-semibold", COST_STYLE[plan.band])}>{anyLoop ? plan.band : "—"}</span></p>
          <p className="mt-2 text-[11px] text-muted-foreground">{plan.count} devices including {plan.gateways} gateway{plan.gateways === 1 ? "" : "s"}. Indicative, to be validated with a site survey and vendor quotes.</p>
        </div>
      </Panel>

      <Panel title="Suggested sensor list" subtitle={`${flats} flats · ${LOOPS.filter((l) => loops[l.id]).length} loop${LOOPS.filter((l) => loops[l.id]).length === 1 ? "" : "s"}`}>
        {!anyLoop ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">Choose at least one loop to see a sensor list.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-xs">
                <thead><tr className="text-[11px] uppercase tracking-wider text-muted-foreground"><th className="pb-2 pr-3 font-medium">Device</th><th className="pb-2 pr-3 text-right font-medium">Qty</th><th className="pb-2 pr-3 font-medium">Signal</th><th className="pb-2 font-medium">Band</th></tr></thead>
                <tbody className="divide-y">
                  {plan.gateways > 0 && (<tr><td className="py-2 pr-3 font-medium">Edge gateway with local rules</td><td className="py-2 pr-3 text-right tabular">{plan.gateways}</td><td className="py-2 pr-3 text-muted-foreground">Ethernet / LTE</td><td className="py-2"><span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-medium", COST_STYLE.Medium)}>Medium</span></td></tr>)}
                  {plan.perHub.map(({ s, qty }) => (
                    <tr key={s.id}><td className="py-2 pr-3 font-medium">{s.name}</td><td className="py-2 pr-3 text-right tabular">{qty}</td><td className="py-2 pr-3 text-muted-foreground">{s.signal}</td><td className="py-2"><span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-medium", COST_STYLE[s.cost])}>{s.cost}</span></td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            {plan.shared.length > 0 && (
              <div className="mt-4 rounded-lg border p-3 text-xs">
                <p className="font-medium">Shared or optional (locality level, not per hub)</p>
                <p className="mt-1 text-muted-foreground">{plan.shared.map((s) => s.name).join(" · ")}</p>
              </div>
            )}
            <p className="mt-3 text-[11px] text-muted-foreground">This is a guide to the kind and number of devices. It is not a quote, and bands are indicative, to be validated.</p>
          </>
        )}
      </Panel>
    </div>
  );
}
