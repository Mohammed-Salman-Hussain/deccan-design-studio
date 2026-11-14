import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Legend, Tooltip as RTooltip, PieChart, Pie, Cell } from "recharts";
import { Truck, Zap, Waves, Recycle, Gauge, Send, CheckCheck, ShieldCheck, Map as MapIcon, ListOrdered, AlertTriangle, Factory, ScrollText, FileDown, Layers, Inbox, Clock, User } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/store/app";
import { useActionQueue, useClearedDrains, useLocality, useLocalitySummary, useStepClock, useT, fmtL } from "@/lib/hooks";
import { drainRisk, feederLoad, weatherAt } from "@/lib/sim/engine";
import { LOOPS, LOOP_BY_ID } from "@/lib/sim/loops";
import type { LoopId } from "@/lib/sim/types";
import { Panel, Stat, LoopChip, StatusPill, Meter, EmptyState } from "@/components/ll/primitives";
import { AnimatedNumber } from "@/components/ll/AnimatedNumber";
import { LoopRing } from "@/components/ll/LoopRing";
import { LocalityMap, type MapCircle, type MapMarker } from "@/components/map/LocalityMap";
import { Button } from "@/components/ui/button";
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
      m.push({ id: d.id, lat: d.lat, lng: d.lng, color: r >= 70 ? "var(--destructive)" : r >= 50 ? "var(--warning)" : "var(--loop-rain)", shape: "drain", size: 11, pulse: r >= 75, label: `${d.id} ${d.name}`, popup: `<strong>${d.id} · ${d.name}</strong><br/>Clog risk ${r}%${cleared.has(d.id) ? " · cleared" : ""}<br/>Width ${d.widthM} m of ${d.designWidthM} m` });
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

  const radarData = LOOPS.map((l) => ({ loop: l.short, today: Math.round(sum.scores[l.id]), baseline: loc.fingerprint[l.id] }));
  const weakest = [...LOOPS].sort((a, b) => sum.scores[a.id] - sum.scores[b.id])[0];
  const filtered = queue.filter((q) => filter === "all" || q.loop === filter);
  const pending = queue.filter((q) => q.status === "pending");

  const stpHubs = loc.hubs.filter((h) => h.stpKLD > 0);
  const reg = stpHubs.filter((h) => h.stpRegistered).length;
  const bookings = sum.hubs
    .filter((h) => h.hub.stpKLD > 0 && h.hub.stpRegistered)
    .map((h, i) => ({ hub: h.hub, kl: Math.max(6, Math.round(h.surplusL / 1000)), site: ["Aparna Constructions site", "My Home builders, Moosapet", "Metro depot works", "Rainbow Vistas Ph-2"][i % 4], status: i % 3 === 0 ? "Delivered" : "Booked" }));

  return (
    <div className="space-y-5">
      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <Stat label={t("kpi.score")} icon={Gauge} color="var(--primary-glow)" value={<AnimatedNumber value={sum.score} decimals={1} />} sub={<>Weakest: <span style={{ color: weakest.color }}>{weakest.short}</span></>} hint="Flat-weighted mean of all hub loop scores, plus a bonus for completed field tasks." />
        <Stat label={t("kpi.tankers")} icon={Truck} color="var(--loop-save)" value={<AnimatedNumber value={sum.tankersAvoided} decimals={1} />} sub="today, across all hubs" hint="(extra reuse + pit top-up + 25% of recharge + shortage avoided) ÷ 5,000 L" />
        <Stat label={t("kpi.kwh")} icon={Zap} color="var(--loop-solar)" value={<AnimatedNumber value={sum.kwhShifted} suffix=" kWh" />} sub="out of 6–10 am / 6–10 pm" hint="Peak-hour grid energy without LoopLocal minus with LoopLocal." />
        <Stat label={t("kpi.recharge")} icon={Waves} color="var(--loop-rain)" value={<span className="tabular">{fmtL(sum.rechargeL + sum.reuseL)}</span>} sub={`${fmtL(sum.rechargeL)} rain · ${fmtL(sum.reuseL)} treated`} hint="Roof runoff sent to pits plus treated water reused on site or topped into pits." />
        <Stat label={t("kpi.waste")} icon={Recycle} color="var(--loop-waste)" value={<AnimatedNumber value={sum.wasteDivertedKg} suffix=" kg" />} sub="kept out of drains" hint="Wet waste × (segregation + 12%), capped by each digester's capacity." className="col-span-2 md:col-span-1" />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel
          className="xl:col-span-2"
          title={`${loc.name} live map`}
          subtitle={`${loc.hubs.length} hubs · ${loc.drains.length} monitored drains · ${w.rainMm > 0.5 ? `raining ${w.rainMm.toFixed(0)} mm/h` : `${w.temp.toFixed(0)} °C`}${w.outage ? " · outage active" : ""}`}
          icon={MapIcon}
          action={<Layers className="size-4 text-muted-foreground" aria-hidden />}
          bodyClass="space-y-3"
        >
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Map layers">
            {LAYERS.map((l) => (
              <button key={l.k} aria-pressed={layers[l.k]} onClick={() => setLayers((s) => ({ ...s, [l.k]: !s[l.k] }))} className={cn("flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition", layers[l.k] ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground")}>
                <span className="size-2 rounded-full" style={{ background: l.color, opacity: layers[l.k] ? 1 : 0.4 }} /> {l.label}
              </button>
            ))}
          </div>
          <div className="h-[380px] overflow-hidden rounded-xl border md:h-[440px]">
            <LocalityMap center={loc.center} zoom={loc.zoom} markers={markers} circles={circles} ariaLabel={`Map of ${loc.name} with hubs and drains`} />
          </div>
          <div className="flex flex-wrap gap-4 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="size-3 rounded-[4px] border-2 border-success" /> Hub (Loop Score)</span>
            <span className="flex items-center gap-1.5"><span className="size-2.5 rotate-45 bg-destructive" /> Drain ≥70% risk</span>
            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-warning" /> Active field task</span>
          </div>
        </Panel>

        <Panel title="Locality fingerprint" subtitle="Which loops are weakest right now" icon={Gauge}>
          <div className="flex items-center justify-center">
            <LoopRing size={132} stroke={11} scores={sum.scores}>
              <div className="text-center">
                <p className="font-display text-3xl font-semibold"><AnimatedNumber value={sum.score} /></p>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Loop Score</p>
              </div>
            </LoopRing>
          </div>
          <div className="h-[250px]">
            <ResponsiveContainer>
              <RadarChart data={radarData} outerRadius="72%">
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="loop" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Zone baseline" dataKey="baseline" stroke="var(--muted-foreground)" fill="var(--muted-foreground)" fillOpacity={0.08} strokeDasharray="4 3" />
                <Radar name="Today" dataKey="today" stroke="var(--primary-glow)" fill="var(--primary)" fillOpacity={0.35} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <RTooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <p className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            <span className="font-medium" style={{ color: weakest.color }}>{weakest.name}</span> is weakest at {Math.round(sum.scores[weakest.id])}. {weakest.why}
          </p>
        </Panel>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel
          className="xl:col-span-2"
          title="Priority action queue"
          subtitle="Ranked by the decision engine across all five loops"
          icon={ListOrdered}
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
              <Send /> Dispatch top 3
            </Button>
          }
        >
          <div className="mb-3 flex flex-wrap gap-1.5" role="group" aria-label="Filter by loop">
            <button onClick={() => setFilter("all")} aria-pressed={filter === "all"} className={cn("rounded-full border px-2.5 py-1 text-xs", filter === "all" ? "bg-accent" : "text-muted-foreground")}>All ({queue.length})</button>
            {LOOPS.map((l) => (
              <button key={l.id} onClick={() => setFilter(l.id)} aria-pressed={filter === l.id} className={cn("rounded-full border px-2.5 py-1 text-xs", filter === l.id ? "bg-accent" : "text-muted-foreground")} style={{ color: filter === l.id ? l.color : undefined }}>
                {l.short}
              </button>
            ))}
          </div>
          {filtered.length === 0 ? (
            <EmptyState icon={Inbox} title="No actions for this loop" body="The engine has nothing urgent here for this scenario. Try another loop or scenario." />
          ) : (
            <ol className="space-y-2.5">
              <AnimatePresence initial={false}>
                {filtered.map((a, i) => (
                  <motion.li key={a.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="group relative overflow-hidden rounded-xl border bg-background/30 p-3.5 transition hover:bg-background/50">
                    <span className="absolute inset-y-0 left-0 w-1" style={{ background: LOOP_BY_ID[a.loop].color }} />
                    <div className="flex flex-col gap-3 pl-2 md:flex-row md:items-center">
                      <div className="flex min-w-0 flex-1 gap-3">
                        <span className="mt-0.5 font-mono text-xs text-muted-foreground">#{i + 1}</span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium">{a.title}</p>
                            {a.source === "citizen" && <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">Resident report</span>}
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground">{a.reason}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-muted-foreground">
                            <LoopChip loop={a.loop} />
                            <span className="flex items-center gap-1"><User className="size-3" />{a.assignee} · {a.crew}</span>
                            <span className="flex items-center gap-1"><Clock className="size-3" />by {a.deadline}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 pl-7 md:w-60 md:flex-col md:items-end md:pl-0">
                        <div className="w-24 md:w-full">
                          <div className="mb-1 flex justify-between text-[10px] text-muted-foreground"><span>{t("common.priority")}</span><span className="tabular">{a.priority}</span></div>
                          <Meter value={a.priority} color={a.priority >= 70 ? "var(--destructive)" : a.priority >= 50 ? "var(--warning)" : "var(--loop-reuse)"} label="Priority" />
                        </div>
                        <div className="ml-auto flex items-center gap-2 md:ml-0">
                          <StatusPill status={a.status} />
                          {a.status === "pending" && (
                            <Button size="sm" variant="soft" onClick={() => { dispatch(a); toast.success("Dispatched", { description: `${a.title} → ${a.assignee}` }); }}>
                              <Send /> {t("btn.dispatch")}
                            </Button>
                          )}
                          {a.status === "done" && (
                            <Button size="sm" variant="cream" onClick={() => { setStatus(a.id, "verified"); toast.success("Verified", { description: a.title }); }}>
                              <CheckCheck /> {t("btn.verify")}
                            </Button>
                          )}
                          {a.status === "verified" && <ShieldCheck className="size-4 text-info" aria-label="Verified" />}
                        </div>
                      </div>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ol>
          )}
        </Panel>

        <Panel title="Drain risk leaderboard" subtitle="Top 10 by clog risk" icon={AlertTriangle}>
          <ol className="space-y-2">
            {drains.slice(0, 10).map(({ d, r }, i) => (
              <li key={d.id} className="flex items-center gap-3">
                <span className="w-5 font-mono text-[11px] text-muted-foreground">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs font-medium"><span className="font-mono text-primary-glow">{d.id}</span> {d.name}</p>
                    <span className={cn("font-mono text-xs tabular", r >= 70 ? "text-destructive" : r >= 50 ? "text-warning" : "text-muted-foreground")}>{r}%</span>
                  </div>
                  <Meter value={r} className="mt-1 h-1.5" color={r >= 70 ? "var(--destructive)" : r >= 50 ? "var(--warning)" : "var(--loop-rain)"} label={`${d.id} risk`} />
                  {cleared.has(d.id) && <p className="mt-0.5 text-[10px] text-success">Cleared today</p>}
                </div>
              </li>
            ))}
          </ol>
        </Panel>
      </div>

      <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        <Panel title="Transformer watch" subtitle="Feeders ranked by load" icon={Zap}>
          <ul className="space-y-2.5">
            {feeders.map((f) => (
              <li key={f.f.id}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">{f.f.name}</span>
                  <span className={cn("font-mono tabular", f.tripped ? "text-destructive" : f.pct >= 90 ? "text-destructive" : f.pct >= 75 ? "text-warning" : "text-muted-foreground")}>{f.tripped ? "OUTAGE" : `${f.pct}%`}</span>
                </div>
                <Meter value={f.tripped ? 100 : f.pct} className="mt-1 h-1.5" color={f.tripped ? "var(--muted-foreground)" : f.pct >= 90 ? "var(--destructive)" : f.pct >= 75 ? "var(--warning)" : "var(--loop-solar)"} label={`${f.f.name} load`} />
              </li>
            ))}
          </ul>
          <div className="mt-4 rounded-xl border border-warning/30 bg-warning/10 p-3">
            <p className="text-xs font-medium text-warning">Over 15 kW without own transformer</p>
            <ul className="mt-1.5 space-y-1 text-xs text-muted-foreground">
              {loc.hubs.filter((h) => !h.ownTransformer && h.sanctionedKW > 15).map((h) => (
                <li key={h.id} className="flex justify-between"><span>{h.name}</span><span className="font-mono">{h.sanctionedKW} kW</span></li>
              ))}
            </ul>
          </div>
        </Panel>

        <Panel title="STPs & Green Water" subtitle="Registration and tanker bookings" icon={Factory}>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col items-center">
              <div className="h-28 w-28">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={[{ v: reg }, { v: stpHubs.length - reg }]} dataKey="v" innerRadius={34} outerRadius={50} stroke="none" startAngle={90} endAngle={-270}>
                      <Cell fill="var(--loop-reuse)" />
                      <Cell fill="var(--muted)" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <p className="text-center text-xs"><span className="font-display text-lg font-semibold">{reg}/{stpHubs.length}</span><br /><span className="text-muted-foreground">hub STPs registered</span></p>
            </div>
            <div className="flex flex-col items-center">
              <div className="h-28 w-28">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={[{ v: 61 }, { v: 539 }]} dataKey="v" innerRadius={34} outerRadius={50} stroke="none" startAngle={90} endAngle={-270}>
                      <Cell fill="var(--primary-glow)" />
                      <Cell fill="var(--muted)" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <p className="text-center text-xs"><span className="font-display text-lg font-semibold">61/~600</span><br /><span className="text-muted-foreground">city private STPs (Hans India)</span></p>
            </div>
          </div>
          <ul className="mt-4 space-y-2">
            {bookings.length === 0 && <li className="text-xs text-muted-foreground">No registered plants in this locality yet — register STPs to unlock bookings.</li>}
            {bookings.map((b) => (
              <li key={b.hub.id} className="flex items-center justify-between gap-2 rounded-lg border bg-background/30 px-3 py-2 text-xs">
                <div className="min-w-0">
                  <p className="truncate font-medium">{b.hub.name} → {b.site}</p>
                  <p className="text-muted-foreground">{b.kl} kL treated water</p>
                </div>
                <span className={cn("rounded-full px-2 py-0.5 text-[10px]", b.status === "Delivered" ? "bg-success/15 text-success" : "bg-info/15 text-info")}>{b.status}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel
          className="lg:col-span-2 xl:col-span-1"
          title="Audit log"
          subtitle="Every recommendation, dispatch and verification"
          icon={ScrollText}
          action={<Button size="sm" variant="glass" onClick={() => setReportOpen(true)}><FileDown /> Export report</Button>}
        >
          <ul className="max-h-[320px] space-y-0 overflow-y-auto pr-1">
            {audit.slice(0, 40).map((e) => (
              <li key={e.id} className="relative border-l pb-3 pl-4 last:pb-0">
                <span className="absolute -left-[5px] top-1 size-2.5 rounded-full border-2 border-background bg-primary-glow" />
                <p className="text-xs"><span className="font-medium">{e.actor}</span> · <span className="text-muted-foreground">{e.text}</span></p>
                <p className="font-mono text-[10px] text-muted-foreground">{e.sim}</p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <ExportReport open={reportOpen} onOpenChange={setReportOpen} />
    </div>
  );
}
