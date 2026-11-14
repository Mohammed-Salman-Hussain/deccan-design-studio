import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pie, PieChart, Cell, ResponsiveContainer } from "recharts";
import { Truck, Gauge, Droplets, Send, CheckCheck, ShieldCheck, Map as MapIcon, ListOrdered, Layers, Inbox, Clock, User, FileDown } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/store/app";
import { useActionQueue, useClearedDrains, useLocality, useLocalitySummary, useStepClock, useT, fmtL } from "@/lib/hooks";
import { drainRisk, feederLoad, weatherAt } from "@/lib/sim/engine";
import { LOOPS, LOOP_BY_ID } from "@/lib/sim/loops";
import type { LoopId } from "@/lib/sim/types";
import { Panel, Stat, StatusPill, Meter, EmptyState, InfoTip } from "@/components/ll/primitives";
import { AnimatedNumber } from "@/components/ll/AnimatedNumber";
import { LocalityMap, type MapCircle, type MapMarker } from "@/components/map/LocalityMap";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { ExportReport } from "./ExportReport";

type LayerKey = "flood" | "outage" | "waste" | "tanker" | "heat";
const LAYERS: { k: LayerKey; label: string; color: string }[] = [
  { k: "flood", label: "Flood risk", color: "var(--loop-rain)" },
  { k: "outage", label: "Outage risk", color: "var(--loop-solar)" },
  { k: "waste", label: "Waste hotspots", color: "var(--loop-waste)" },
  { k: "tanker", label: "Tanker demand", color: "var(--loop-save)" },
  { k: "heat", label: "Heat", color: "var(--destructive)" },
];
const SHOWN = 5;
const SITES = ["Construction site, Moosapet", "Metro works yard", "Road works yard", "Construction site, Phase 2"];
const riskColor = (r: number) => (r >= 70 ? "var(--destructive)" : r >= 50 ? "var(--warning)" : "var(--loop-rain)");

export function OfficerView() {
  const t = useT();
  const loc = useLocality();
  const sum = useLocalitySummary();
  const scenario = useApp((s) => s.scenario);
  const clock = useStepClock();
  const queue = useActionQueue();
  const dispatch = useApp((s) => s.dispatch);
  const setStatus = useApp((s) => s.setStatus);
  const audit = useApp((s) => s.audit);
  const cleared = useClearedDrains();
  const [layers, setLayers] = useState<Record<LayerKey, boolean>>({ flood: true, outage: false, waste: false, tanker: false, heat: false });
  const [filter, setFilter] = useState<LoopId | "all">("all");
  const [showAll, setShowAll] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const wasteShare = sum.scores.waste / 100;
  const drains = useMemo(
    () => loc.drains.map((d) => ({ d, r: drainRisk(d, scenario, clock, cleared.has(d.id), wasteShare) })).sort((a, b) => b.r - a.r),
    [loc, scenario, clock, cleared, wasteShare],
  );
  const feeders = useMemo(() => loc.feeders.map((f) => ({ f, ...feederLoad(f, loc, scenario, clock) })).sort((a, b) => b.pct - a.pct), [loc, scenario, clock]);
  const w = weatherAt(scenario, clock / 60);

  const markers: MapMarker[] = useMemo(() => {
    const m: MapMarker[] = loc.landmarks.map((l) => ({ id: `lm-${l.name}`, lat: l.lat, lng: l.lng, color: "", label: l.name, shape: "label" as const }));
    for (const hs of sum.hubs) {
      const color = hs.score >= 65 ? "var(--success)" : hs.score >= 45 ? "var(--warning)" : "var(--destructive)";
      m.push({ id: hs.hub.id, lat: hs.hub.lat, lng: hs.hub.lng, color, shape: "hub", size: 12, html: String(Math.round(hs.score)), label: hs.hub.name, popup: `<strong>${hs.hub.name}</strong><br/>${hs.hub.flats} flats · ${hs.hub.area}<br/>Loop Score ${hs.score.toFixed(0)} · Tank ${hs.now.tankPct.toFixed(0)}%<br/>Solar ${hs.now.solarKW.toFixed(1)} kW · Pump ${hs.now.pumpOn ? "on (" + hs.now.pumpSource + ")" : "off"}` });
    }
    for (const { d, r } of drains) {
      m.push({ id: d.id, lat: d.lat, lng: d.lng, color: riskColor(r), shape: "drain", size: 11, pulse: r >= 75, label: `${d.id} ${d.name}`, popup: `<strong>${d.id} · ${d.name}</strong><br/>Clog risk ${r}%${cleared.has(d.id) ? " · cleared" : ""}<br/>Width ${d.widthM} m of ${d.designWidthM} m` });
    }
    for (const a of queue.filter((q) => q.status === "dispatched")) {
      m.push({ id: `task-${a.id}`, lat: a.lat, lng: a.lng, color: LOOP_BY_ID[a.loop].color, shape: "dot", size: 8, pulse: true, label: a.title, popup: `<strong>${a.title}</strong><br/>${a.assignee} · due ${a.deadline}` });
    }
    return m;
  }, [loc, sum.hubs, drains, queue, cleared]);

  const circles: MapCircle[] = useMemo(() => {
    const c: MapCircle[] = [];
    if (layers.flood) for (const { d, r } of drains) c.push({ lat: d.lat, lng: d.lng, radius: 60 + r * 4, color: "var(--loop-rain)", opacity: r / 380 });
    if (layers.outage) for (const f of feeders) {
      const hubs = loc.hubs.filter((h) => h.feeder === f.f.id);
      for (const h of hubs) c.push({ lat: h.lat, lng: h.lng, radius: 120 + Math.max(0, f.pct - 50) * 6 + (f.tripped ? 300 : 0), color: "var(--loop-solar)", opacity: f.tripped ? 0.35 : 0.18 });
    }
    if (layers.waste) for (const hs of sum.hubs) c.push({ lat: hs.hub.lat + 0.001, lng: hs.hub.lng - 0.001, radius: (100 - hs.hub.segregation) * 5, color: "var(--loop-waste)", opacity: 0.22 });
    if (layers.waste) for (const l of loc.landmarks.filter((x) => x.kind === "market" || x.kind === "transfer")) c.push({ lat: l.lat, lng: l.lng, radius: 320, color: "var(--loop-waste)", opacity: 0.25 });
    if (layers.tanker) for (const hs of sum.hubs) c.push({ lat: hs.hub.lat, lng: hs.hub.lng, radius: 150 + (100 - hs.scores.rain) * 4 + (hs.hub.pits === 0 ? 150 : 0), color: "var(--loop-save)", opacity: 0.2 });
    if (layers.heat) for (const hs of sum.hubs) c.push({ lat: hs.hub.lat, lng: hs.hub.lng, radius: 200 + Math.max(0, w.temp - 28) * 40, color: "var(--destructive)", opacity: Math.max(0.08, (w.temp - 26) / 60) });
    return c;
  }, [layers, drains, feeders, sum.hubs, loc, w.temp]);

  const filtered = queue.filter((q) => filter === "all" || q.loop === filter);
  const visible = showAll ? filtered : filtered.slice(0, SHOWN);
  const pending = queue.filter((q) => q.status === "pending");
  const layersOn = Object.values(layers).filter(Boolean).length;

  const stpHubs = loc.hubs.filter((h) => h.stpKLD > 0);
  const reg = stpHubs.filter((h) => h.stpRegistered).length;
  const bookings = sum.hubs
    .filter((h) => h.hub.stpKLD > 0 && h.hub.stpRegistered)
    .map((h, i) => ({ hub: h.hub, kl: Math.max(6, Math.round(h.surplusL / 1000)), site: SITES[i % SITES.length], status: i % 3 === 0 ? "Delivered" : "Booked" }));
  const overLimit = loc.hubs.filter((h) => !h.ownTransformer && h.sanctionedKW > 15);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label={t("kpi.score")} icon={Gauge} color="var(--primary-glow)" value={<AnimatedNumber value={sum.score} decimals={1} />} hint="Flat-weighted mean of all hub loop scores, plus a bonus for completed field tasks." />
        <Stat label={t("kpi.tankers")} icon={Truck} color="var(--loop-save)" value={<AnimatedNumber value={sum.tankersAvoided} decimals={1} />} hint="(extra reuse + pit top-up + 25% of recharge + shortage avoided) ÷ 5,000 L" />
        <Stat label="Water reused" icon={Droplets} color="var(--loop-rain)" value={<span className="tabular">{fmtL(sum.rechargeL + sum.reuseL)}</span>} sub={`${fmtL(sum.rechargeL)} rain · ${fmtL(sum.reuseL)} treated`} hint="Roof runoff sent to pits plus treated water reused on site or topped into pits." />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Panel
          title={`${loc.name} map`}
          icon={MapIcon}
          subtitle={
            <>
              {loc.hubs.length} hubs and {loc.drains.length} monitored drains. {w.rainMm > 0.5 ? `Raining ${w.rainMm.toFixed(0)} mm/h.` : `${w.temp.toFixed(0)} °C.`}{w.outage ? " Power outage active." : ""}
              <span className="mt-2 block">Square: hub, shown with its Loop Score. Diamond: drain at 70% clog risk or more. Pulsing dot: active field task.</span>
            </>
          }
          action={
            <Popover>
              <PopoverTrigger asChild>
                <Button size="sm" variant="glass"><Layers /> Layers{layersOn > 0 && <span className="font-mono text-xs text-muted-foreground">{layersOn}</span>}</Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-48 space-y-1 p-2">
                {LAYERS.map((l) => (
                  <button key={l.k} aria-pressed={layers[l.k]} onClick={() => setLayers((s) => ({ ...s, [l.k]: !s[l.k] }))} className={cn("flex h-8 w-full items-center gap-2 rounded-md px-2 text-sm transition-colors hover:bg-accent", layers[l.k] && "bg-accent font-medium")}>
                    <span className="size-2.5 rounded-full" style={{ background: l.color, opacity: layers[l.k] ? 1 : 0.35 }} /> {l.label}
                  </button>
                ))}
              </PopoverContent>
            </Popover>
          }
        >
          <div className="h-[340px] overflow-hidden rounded-lg border md:h-[420px]">
            <LocalityMap center={loc.center} zoom={loc.zoom} markers={markers} circles={circles} ariaLabel={`Map of ${loc.name} with hubs and drains`} />
          </div>
        </Panel>

        <Panel
          title="Actions"
          icon={ListOrdered}
          subtitle="Ranked by the decision engine across all five loops. Open the info button on a row to see why it is there."
          action={
            <Button
              size="sm"
              variant="hero"
              disabled={pending.length === 0}
              onClick={() => {
                const top = pending.slice(0, 3);
                top.forEach((a) => dispatch(a));
                toast.success(`Dispatched ${top.length} actions`, { description: "Field crews notified on their phones." });
              }}
            >
              <Send /> Send top 3
            </Button>
          }
        >
          <Select value={filter} onValueChange={(v) => { setFilter(v as LoopId | "all"); setShowAll(false); }}>
            <SelectTrigger aria-label="Filter by loop" className="mb-3 h-8 w-44 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All loops ({queue.length})</SelectItem>
              {LOOPS.map((l) => <SelectItem key={l.id} value={l.id} className="text-xs">{l.short}</SelectItem>)}
            </SelectContent>
          </Select>
          {filtered.length === 0 ? (
            <EmptyState icon={Inbox} title="Nothing urgent here" body="Try another loop or scenario." />
          ) : (
            <>
              <ol className="space-y-2">
                <AnimatePresence initial={false}>
                  {visible.map((a) => (
                    <motion.li key={a.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-3 rounded-lg border p-2.5">
                      <span className="w-1 self-stretch rounded-full" style={{ background: LOOP_BY_ID[a.loop].color }} aria-hidden />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{a.title}</p>
                        <p className="flex items-center gap-2 truncate text-xs text-muted-foreground"><User className="size-3 shrink-0" />{a.assignee}<Clock className="size-3 shrink-0" />by {a.deadline}</p>
                      </div>
                      <InfoTip label={`Why: ${a.title}`}>
                        <p>{a.reason}</p>
                        <p className="mt-2 font-mono text-[11px]">{LOOP_BY_ID[a.loop].name} · priority {a.priority}{a.source === "citizen" ? " · resident report" : ""}</p>
                      </InfoTip>
                      {a.status === "pending" ? (
                        <Button size="sm" variant="soft" onClick={() => { dispatch(a); toast.success("Dispatched", { description: `${a.title} → ${a.assignee}` }); }}>
                          <Send /> {t("btn.dispatch")}
                        </Button>
                      ) : a.status === "done" ? (
                        <Button size="sm" variant="cream" onClick={() => { setStatus(a.id, "verified"); toast.success("Verified", { description: a.title }); }}>
                          <CheckCheck /> {t("btn.verify")}
                        </Button>
                      ) : a.status === "verified" ? (
                        <span className="flex items-center gap-1"><ShieldCheck className="size-4 text-primary-glow" aria-hidden /><StatusPill status={a.status} /></span>
                      ) : (
                        <StatusPill status={a.status} />
                      )}
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ol>
              {filtered.length > SHOWN && (
                <Button variant="ghost" size="sm" className="mt-2 w-full" onClick={() => setShowAll(!showAll)}>
                  {showAll ? "Show fewer" : `Show all ${filtered.length}`}
                </Button>
              )}
            </>
          )}
        </Panel>
      </div>

      <Tabs defaultValue="drains">
        <TabsList>
          <TabsTrigger value="drains">Drains</TabsTrigger>
          <TabsTrigger value="power">Power</TabsTrigger>
          <TabsTrigger value="water">Treated water</TabsTrigger>
          <TabsTrigger value="log">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="drains" className="mt-3">
          <Panel title="Drains by clog risk" subtitle="Top 8 of the monitored drains. Crews should clear the highest first.">
            <ol className="grid gap-x-8 gap-y-3 md:grid-cols-2">
              {drains.slice(0, 8).map(({ d, r }) => (
                <li key={d.id}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm"><span className="font-mono text-xs text-primary-glow">{d.id}</span> {d.name}</p>
                    <span className="font-mono text-xs tabular" style={{ color: riskColor(r) }}>{r}%</span>
                  </div>
                  <Meter value={r} className="mt-1 h-1.5" color={riskColor(r)} label={`${d.id} risk`} />
                  {cleared.has(d.id) && <p className="mt-0.5 text-[11px] text-muted-foreground">Cleared today</p>}
                </li>
              ))}
            </ol>
          </Panel>
        </TabsContent>

        <TabsContent value="power" className="mt-3">
          <Panel title="Transformer load" subtitle="Feeders ranked by load. Outage means the feeder has tripped.">
            <ul className="grid gap-x-8 gap-y-3 md:grid-cols-2">
              {feeders.map((f) => {
                const c = f.tripped || f.pct >= 90 ? "var(--destructive)" : f.pct >= 75 ? "var(--warning)" : "var(--loop-solar)";
                return (
                  <li key={f.f.id}>
                    <div className="flex items-center justify-between text-sm">
                      <span>{f.f.name}</span>
                      <span className="font-mono text-xs tabular" style={{ color: c }}>{f.tripped ? "Outage" : `${f.pct}%`}</span>
                    </div>
                    <Meter value={f.tripped ? 100 : f.pct} className="mt-1 h-1.5" color={c} label={`${f.f.name} load`} />
                  </li>
                );
              })}
            </ul>
            {overLimit.length > 0 && (
              <p className="mt-4 rounded-lg bg-brand-yellow/50 px-3 py-2 text-xs">
                <span className="font-medium">Over 15 kW without their own transformer:</span> {overLimit.map((h) => `${h.name} (${h.sanctionedKW} kW)`).join(", ")}
              </p>
            )}
          </Panel>
        </TabsContent>

        <TabsContent value="water" className="mt-3">
          <Panel title="Treated water" subtitle="Which hub plants are registered for Green Water, and the tanker bookings that follow.">
            <div className="grid gap-5 md:grid-cols-[160px_1fr]">
              <div className="flex flex-col items-center">
                <div className="h-28 w-28">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={[{ v: reg }, { v: Math.max(0, stpHubs.length - reg) }]} dataKey="v" innerRadius={34} outerRadius={50} stroke="none" startAngle={90} endAngle={-270}>
                        <Cell fill="var(--loop-rain)" />
                        <Cell fill="var(--muted)" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-center text-xs"><span className="font-display text-lg font-semibold">{reg}/{stpHubs.length}</span><br /><span className="text-muted-foreground">plants registered</span></p>
              </div>
              <ul className="space-y-2">
                {bookings.length === 0 && <li className="text-xs text-muted-foreground">No registered plants here yet. Register a plant to unlock bookings.</li>}
                {bookings.map((b) => (
                  <li key={b.hub.id} className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{b.hub.name} → {b.site}</p>
                      <p className="text-xs text-muted-foreground">{b.kl} kL treated water</p>
                    </div>
                    <span className={cn("rounded-full border px-2 py-0.5 text-[11px]", b.status === "Delivered" ? "border-success/30 bg-success/10 text-success" : "border-warning/30 bg-brand-yellow/60 text-warning")}>{b.status}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Panel>
        </TabsContent>

        <TabsContent value="log" className="mt-3">
          <Panel
            title="Activity"
            subtitle="Every recommendation, dispatch and verification is recorded here."
            action={<Button size="sm" variant="glass" onClick={() => setReportOpen(true)}><FileDown /> Export report</Button>}
          >
            <ul className="max-h-[300px] overflow-y-auto pr-1">
              {audit.slice(0, 40).map((e) => (
                <li key={e.id} className="relative border-l pb-3 pl-4 last:pb-0">
                  <span className="absolute -left-[5px] top-1 size-2.5 rounded-full border-2 border-card bg-primary" />
                  <p className="text-sm"><span className="font-medium">{e.actor}</span> <span className="text-muted-foreground">{e.text}</span></p>
                  <p className="font-mono text-[11px] text-muted-foreground">{e.sim}</p>
                </li>
              ))}
            </ul>
          </Panel>
        </TabsContent>
      </Tabs>

      <ExportReport open={reportOpen} onOpenChange={setReportOpen} />
    </div>
  );
}
