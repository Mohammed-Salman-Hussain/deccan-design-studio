import { useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GROUPS, SENSORS, type CostBand, type Sensor, type SensorGroup } from "@/lib/hardware";
import { LoopChip } from "@/components/ll/primitives";
import { cn } from "@/lib/utils";

const COST_STYLE: Record<CostBand, string> = {
  Low: "border-success/30 bg-success/15 text-success",
  Medium: "border-warning/30 bg-warning/15 text-warning",
  High: "border-destructive/30 bg-destructive/15 text-destructive",
};

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid grid-cols-[96px_1fr] gap-2 text-xs">
      <dt className="text-muted-foreground">{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}

function SensorCard({ s }: { s: Sensor }) {
  const [open, setOpen] = useState(false);
  return (
    <article className="glass glow-border flex flex-col rounded-xl p-3.5">
      <header className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold leading-snug">{s.name}</h3>
        <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium", COST_STYLE[s.cost])} title="Indicative cost band, to be validated">{s.cost}</span>
      </header>
      <p className="mt-1 text-xs text-muted-foreground">{s.measures}</p>
      <dl className="mt-3 space-y-1.5">
        <Row k="Signal" v={s.signal} />
        <Row k="Connectivity" v={s.connectivity} />
        <Row k="Feeds" v={s.feeds} />
      </dl>
      {open && (
        <dl className="mt-1.5 space-y-1.5 border-t pt-2">
          <Row k="Mounted" v={s.mount} />
          <Row k="Power" v={s.power} />
          <Row k="Sampling" v={s.sampling} />
          <Row k="Upkeep" v={s.upkeep} />
          <Row k="Fails by" v={s.failures} />
        </dl>
      )}
      <div className="mt-auto flex items-end justify-between gap-2 pt-3">
        <div className="flex flex-wrap gap-1">{s.loops.map((l) => <LoopChip key={l} loop={l} />)}</div>
        <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="inline-flex items-center gap-1 text-xs text-primary-glow hover:underline">
          {open ? "Less" : "Details"} <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} aria-hidden />
        </button>
      </div>
      <p className="mt-2 text-[10px] text-muted-foreground">Cost band is indicative, to be validated.</p>
    </article>
  );
}

export function SensorCatalog() {
  const [group, setGroup] = useState<SensorGroup | "all">("all");
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return SENSORS.filter((s) => (group === "all" || s.group === group) && (!needle || `${s.name} ${s.measures} ${s.feeds}`.toLowerCase().includes(needle)));
  }, [group, q]);

  return (
    <div>
      <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter sensors by group">
          <Button size="sm" variant={group === "all" ? "soft" : "glass"} onClick={() => setGroup("all")}>All {SENSORS.length}</Button>
          {GROUPS.map((g) => (
            <Button key={g.id} size="sm" variant={group === g.id ? "soft" : "glass"} onClick={() => setGroup(g.id)}>{g.label} {SENSORS.filter((s) => s.group === g.id).length}</Button>
          ))}
        </div>
        <div className="relative md:w-64">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search sensors" aria-label="Search sensors" className="pl-8" />
        </div>
      </div>
      {list.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">No sensors match “{q}”.</div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{list.map((s) => <SensorCard key={s.id} s={s} />)}</div>
      )}
    </div>
  );
}
