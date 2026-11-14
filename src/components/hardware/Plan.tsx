import { useState } from "react";
import { CheckCircle2, ClipboardCheck, Milestone, PlugZap } from "lucide-react";
import { useApp } from "@/store/app";
import { Button } from "@/components/ui/button";
import { Meter, Panel } from "@/components/ll/primitives";
import { CHECKLISTS, NO_HARDWARE, PHASES, type Availability, type RoleKey } from "@/lib/hardware";
import { cn } from "@/lib/utils";

const AVAIL_STYLE: Record<Availability, string> = {
  Public: "border-success/30 bg-success/15 text-success",
  "Needs permission": "border-warning/30 bg-warning/15 text-warning",
  Simulated: "border-info/30 bg-info/15 text-info",
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

const ROLES: RoleKey[] = ["officer", "vendor", "tech", "resident"];

export function Checklists() {
  const [role, setRole] = useState<RoleKey>("officer");
  const checks = useApp((s) => s.checks);
  const toggle = useApp((s) => s.toggleCheck);
  const list = CHECKLISTS[role];
  const keyOf = (i: number) => `hw:${role}:${i}`;
  const done = list.items.filter((_, i) => checks[keyOf(i)]).length;

  return (
    <Panel title="Role-wise checklists" subtitle="Tick items off as you go; progress is saved in this browser" icon={ClipboardCheck}>
      <div className="mb-3 flex flex-wrap gap-1.5" role="tablist" aria-label="Choose a role">
        {ROLES.map((r) => (
          <Button key={r} size="sm" role="tab" aria-selected={role === r} variant={role === r ? "soft" : "glass"} onClick={() => setRole(r)}>{CHECKLISTS[r].title}</Button>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <div className="rounded-xl border p-3">
          <p className="text-sm font-semibold">{list.title}</p>
          <p className="mt-1 text-xs text-muted-foreground">{list.blurb}</p>
          <div className="mt-4 flex items-end justify-between"><span className="font-display text-3xl font-semibold text-primary-glow tabular">{done}/{list.items.length}</span><span className="text-[11px] uppercase tracking-wider text-muted-foreground">done</span></div>
          <Meter value={(done / list.items.length) * 100} className="mt-2" label={`${list.title} checklist progress`} />
        </div>
        <ul className="space-y-1.5" role="tabpanel">
          {list.items.map((item, i) => {
            const id = `chk-${role}-${i}`;
            const on = !!checks[keyOf(i)];
            return (
              <li key={id}>
                <label htmlFor={id} className={cn("flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 text-sm transition hover:bg-accent/40", on && "bg-primary/10")}>
                  <input id={id} type="checkbox" checked={on} onChange={() => toggle(keyOf(i))} className="mt-0.5 size-4 shrink-0 accent-[var(--primary)]" />
                  <span className={cn(on && "text-muted-foreground line-through")}>{item}</span>
                </label>
              </li>
            );
          })}
        </ul>
      </div>
    </Panel>
  );
}

export function Rollout() {
  return (
    <Panel title="Phased rollout" subtitle="Each phase has to prove itself before the next begins" icon={Milestone}>
      <ol className="relative grid gap-3 lg:grid-cols-4">
        {PHASES.map((p, i) => (
          <li key={p.id} className={cn("relative rounded-xl border p-3.5", i === 0 && "border-primary/50 bg-primary/10")}>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-wider text-primary-glow">Step {i}</span>
              {i === 0 && <span className="inline-flex items-center gap-1 rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-medium text-primary-glow"><CheckCircle2 className="size-3" aria-hidden /> You are here</span>}
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
