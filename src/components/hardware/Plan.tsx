import { CheckCircle2, Milestone, PlugZap } from "lucide-react";
import { Panel } from "@/components/ll/primitives";
import { NO_HARDWARE, PHASES, type Availability } from "@/lib/hardware";
import { cn } from "@/lib/utils";

const AVAIL_STYLE: Record<Availability, string> = {
  Public: "border-success/30 bg-success/10 text-success",
  "Needs permission": "border-warning/30 bg-brand-yellow/60 text-warning",
  Simulated: "border-primary-glow/30 bg-primary-glow/10 text-primary-glow",
};

export function NoHardware() {
  return (
    <Panel title="Integration without new hardware" subtitle="Data LoopLocal can use before a single sensor is installed" icon={PlugZap}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-xs">
          <thead><tr className="text-[11px] uppercase tracking-wider text-muted-foreground"><th className="pb-2 pr-3 font-medium">Source</th><th className="pb-2 pr-3 font-medium">Data</th><th className="pb-2 pr-3 font-medium">Used for</th><th className="pb-2 font-medium">Status</th></tr></thead>
          <tbody className="divide-y">
            {NO_HARDWARE.map((n) => (
              <tr key={n.source}>
                <td className="py-2.5 pr-3 font-medium">{n.source}</td>
                <td className="py-2.5 pr-3 text-muted-foreground">{n.data}</td>
                <td className="py-2.5 pr-3 text-muted-foreground">{n.use}</td>
                <td className="py-2.5"><span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-medium", AVAIL_STYLE[n.status])}>{n.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted-foreground"><strong className="text-foreground">Public</strong> can be used today. <strong className="text-foreground">Needs permission</strong> requires an agreement with the owner of the data. <strong className="text-foreground">Simulated</strong> is generated inside the prototype until a real feed is connected.</p>
    </Panel>
  );
}

export function Rollout() {
  return (
    <Panel title="Phased rollout" subtitle="Each phase has to prove itself before the next begins" icon={Milestone}>
      <ol className="relative grid gap-3 lg:grid-cols-4">
        {PHASES.map((p, i) => (
          <li key={p.id} className={cn("relative rounded-xl border p-3.5", i === 0 && "border-primary bg-brand-yellow/40")}>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-wider text-primary-glow">Step {i}</span>
              {i === 0 && <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground"><CheckCircle2 className="size-3" aria-hidden /> You are here</span>}
            </div>
            <h3 className="mt-1 text-sm font-semibold">{p.name}</h3>
            <dl className="mt-2 space-y-2 text-xs">
              <div><dt className="text-[11px] uppercase tracking-wider text-muted-foreground">Scope</dt><dd>{p.scope}</dd></div>
              <div><dt className="text-[11px] uppercase tracking-wider text-muted-foreground">Needs</dt><dd>{p.needs}</dd></div>
              <div><dt className="text-[11px] uppercase tracking-wider text-muted-foreground">Move on when</dt><dd>{p.exit}</dd></div>
            </dl>
          </li>
        ))}
      </ol>
    </Panel>
  );
}
