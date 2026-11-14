import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LOOPS, LOOP_BY_ID } from "@/lib/sim/loops";
import type { LoopId } from "@/lib/sim/types";
import { fmtL, fmtRs, useActionQueue, useLocality, useLocalitySummary } from "@/lib/hooks";
import { useApp } from "@/store/app";
import { LoopChip, PageHeader, Panel, StatusPill } from "@/components/ll/primitives";

export const Route = createFileRoute("/loops")({
  head: () => ({
    meta: [
      { title: "The five loops — LoopLocal" },
      { name: "description", content: "How waste, sun, rain, used water and saved water feed each other across a Hyderabad locality, with live values on every link." },
      { property: "og:title", content: "The five loops — LoopLocal" },
      { property: "og:description", content: "An animated flow of the five loops with live values on every link." },
    ],
  }),
  component: LoopsPage,
});

type NodeId = "kitchen" | "biogas" | "solar" | "pumps" | "tank" | "rain" | "pit" | "drains" | "stp" | "reuse" | "green" | "bill";

interface NodeDef {
  id: NodeId;
  x: number;
  y: number;
  label: string;
  sub: string;
  loop: LoopId;
  what: string;
  feeds: string;
  fedBy: string;
}

const NODES: NodeDef[] = [
  { id: "kitchen", x: 90, y: 70, label: "Kitchens", sub: "Wet waste", loop: "waste", what: "Segregated wet waste leaves flats every morning and goes to the biogas unit instead of the street.", fedBy: "Residents, hotels, the Rythu Bazar", feeds: "Biogas unit, and keeps drains free of rotting waste" },
  { id: "biogas", x: 290, y: 70, label: "Biogas unit", sub: "Cooking gas + backup power", loop: "waste", what: "A digester turns wet waste into gas that runs a small genset for pumps on cloudy days and cuts.", fedBy: "Kitchen wet waste (feed quality is monitored)", feeds: "Pumps and community kitchens" },
  { id: "solar", x: 290, y: 200, label: "Solar roof", sub: "Midday power", loop: "solar", what: "Rooftop panels cover pumps, lifts and corridor lights, with the Core scheduling heavy loads into sunlit hours.", fedBy: "Sunlight and the cloud forecast", feeds: "Pumps, STP blowers, lifts" },
  { id: "pumps", x: 500, y: 140, label: "Pumps", sub: "Solar-hour schedule", loop: "solar", what: "The scheduler runs pumps when sun or biogas is available and fills tanks ahead of planned cuts.", fedBy: "Solar roof, biogas genset, grid as last resort", feeds: "Overhead tank" },
  { id: "tank", x: 700, y: 140, label: "Overhead tank", sub: "A battery you fill", loop: "save", what: "A full tank carries the building through an outage. Every litre reused or recharged means one fewer pump hour.", fedBy: "Pumps, tanker top-ups", feeds: "Flats, flushing, gardens" },
  { id: "rain", x: 90, y: 330, label: "Rain & runoff", sub: "Roofs and lanes", loop: "rain", what: "Forecast rain is split three ways: into recharge pits, into the street, or into drains that may be choked.", fedBy: "Weather forecast and the rain gauge", feeds: "Recharge pits and drains" },
  { id: "drains", x: 290, y: 420, label: "Drains", sub: "Clog risk ranked", loop: "rain", what: "The Core ranks drains by clog risk before a storm so crews clear the worst first.", fedBy: "Runoff, silt, plastic, wet waste", feeds: "Nalas and lakes — or the street if blocked" },
  { id: "pit", x: 290, y: 330, label: "Recharge pit", sub: "Opened before a storm", loop: "rain", what: "Pits are opened and desilted before the storm so roof runoff soaks into the ground.", fedBy: "Roof runoff, treated water top-ups", feeds: "Borewells and groundwater" },
  { id: "stp", x: 500, y: 330, label: "Sewage plant", sub: "Blowers on solar", loop: "reuse", what: "The STP treats used water. Blowers run in solar hours and a falling output with normal inflow raises a flag.", fedBy: "Used water from the flats", feeds: "Flushing, gardens, pits, Green Water" },
  { id: "reuse", x: 700, y: 270, label: "On-site reuse", sub: "Flush, garden, cooling", loop: "reuse", what: "Treated water is used on site first, which cuts what the building draws from the tank.", fedBy: "STP treated water", feeds: "Less demand on the tank" },
  { id: "green", x: 700, y: 400, label: "Green Water", sub: "Tanker booking", loop: "reuse", what: "Surplus that passes quality tests is listed for nearby construction sites through a Green Water Tanker booking.", fedBy: "STP surplus", feeds: "Construction sites, instead of fresh tankers" },
  { id: "bill", x: 890, y: 205, label: "Bill & grid", sub: "Peak kWh shifted", loop: "save", what: "Less pumping in the 6–10 am and 6–10 pm peak windows and fewer tanker trips lower the bill and calm the evening feeder.", fedBy: "Everything upstream", feeds: "Officers' and RWA's savings view" },
];

const NODE = Object.fromEntries(NODES.map((n) => [n.id, n])) as Record<NodeId, NodeDef>;

interface LinkDef {
  from: NodeId;
  to: NodeId;
  loop: LoopId;
  value: (m: Metrics) => string;
}

interface Metrics {
  wasteKg: number;
  biogasKWh: number;
  solarKWh: number;
  shiftedKWh: number;
  rechargeL: number;
  reuseL: number;
  surplusL: number;
  streetL: number;
  tankers: number;
  savings: number;
}

const LINKS: LinkDef[] = [
  { from: "kitchen", to: "biogas", loop: "waste", value: (m) => `${Math.round(m.wasteKg).toLocaleString("en-IN")} kg` },
  { from: "biogas", to: "pumps", loop: "waste", value: (m) => `${Math.round(m.biogasKWh)} kWh` },
  { from: "solar", to: "pumps", loop: "solar", value: (m) => `${Math.round(m.solarKWh).toLocaleString("en-IN")} kWh` },
  { from: "pumps", to: "tank", loop: "solar", value: (m) => `${Math.round(m.solarKWh + m.biogasKWh).toLocaleString("en-IN")} kWh clean` },
  { from: "rain", to: "pit", loop: "rain", value: (m) => fmtL(m.rechargeL) },
  { from: "rain", to: "drains", loop: "rain", value: (m) => `${fmtL(m.streetL)} to street` },
  { from: "stp", to: "reuse", loop: "reuse", value: (m) => fmtL(m.reuseL) },
  { from: "stp", to: "green", loop: "reuse", value: (m) => fmtL(m.surplusL) },
  { from: "pit", to: "stp", loop: "reuse", value: () => "top-up if quality passes" },
  { from: "reuse", to: "tank", loop: "save", value: (m) => `${m.tankers.toFixed(1)} tankers` },
  { from: "tank", to: "bill", loop: "save", value: (m) => `${Math.round(m.shiftedKWh)} kWh off-peak` },
];

function pathFor(a: NodeDef, b: NodeDef) {
  const x1 = a.x + 62;
  const y1 = a.y;
  const x2 = b.x - 62;
  const y2 = b.y;
  if (a.x >= b.x - 30 && a.x <= b.x + 30) {
    const dir = b.y > a.y ? 1 : -1;
    return `M${a.x} ${a.y + dir * 26} C${a.x} ${(a.y + b.y) / 2}, ${b.x} ${(a.y + b.y) / 2}, ${b.x} ${b.y - dir * 26}`;
  }
  const mx = (x1 + x2) / 2;
  return `M${x1} ${y1} C${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
}

function LoopsPage() {
  const sum = useLocalitySummary();
  const loc = useLocality();
  const queue = useActionQueue();
  const dispatch = useApp((s) => s.dispatch);
  const [selected, setSelected] = useState<NodeId>("tank");
  const [focus, setFocus] = useState<LoopId | "all">("all");

  const metrics: Metrics = useMemo(
    () => ({
      wasteKg: sum.wasteDivertedKg,
      biogasKWh: sum.hubs.reduce((a, h) => a + h.biogasKWh, 0),
      solarKWh: sum.solarKWh,
      shiftedKWh: sum.kwhShifted,
      rechargeL: sum.rechargeL,
      reuseL: sum.reuseL,
      surplusL: sum.surplusL,
      streetL: sum.streetL,
      tankers: sum.tankersAvoided,
      savings: sum.savingsRs,
    }),
    [sum],
  );

  const node = NODE[selected];
  const loop = LOOP_BY_ID[node.loop];
  const nextAction = queue.find((a) => a.loop === node.loop && a.status === "pending") ?? queue.find((a) => a.loop === node.loop);

  return (
    <div className="mx-auto max-w-[1500px]">
      <PageHeader title="Loops" description={`Live flows for ${loc.name} across all hubs, where every output becomes an input. Select any box to see what happens there and the action the engine would dispatch. Use the filter to follow one loop.`}>
        <Select value={focus} onValueChange={(v) => setFocus(v as LoopId | "all")}>
          <SelectTrigger aria-label="Highlight a loop" className="h-9 w-48 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All loops</SelectItem>
            {LOOPS.map((l) => <SelectItem key={l.id} value={l.id}>{l.short}</SelectItem>)}
          </SelectContent>
        </Select>
      </PageHeader>

      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <Panel bodyClass="p-2 md:p-3">
          <svg viewBox="0 0 980 480" className="h-auto w-full" role="img" aria-label="Flow diagram of the five loops with live values on each link">
            <defs>
              {LOOPS.map((l) => (
                <marker key={l.id} id={`arrow-${l.id}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M0 0L10 5L0 10z" fill={l.color} />
                </marker>
              ))}
            </defs>
            {LINKS.map((l, i) => {
              const a = NODE[l.from];
              const b = NODE[l.to];
              const color = LOOP_BY_ID[l.loop].color;
              const dim = focus !== "all" && focus !== l.loop;
              const d = pathFor(a, b);
              const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 + (a.x >= b.x - 30 && a.x <= b.x + 30 ? 0 : 0) };
              const val = l.value(metrics);
              return (
                <g key={i} opacity={dim ? 0.12 : 1} style={{ transition: "opacity .3s" }}>
                  <path d={d} fill="none" stroke={color} strokeOpacity={0.25} strokeWidth={5} strokeLinecap="round" />
                  <path d={d} fill="none" stroke={color} strokeWidth={2} strokeDasharray="6 10" strokeLinecap="round" className="animate-flow" markerEnd={`url(#arrow-${l.loop})`} />
                  <g transform={`translate(${mid.x} ${mid.y})`}>
                    <rect x={-val.length * 3.4 - 8} y={-10} width={val.length * 6.8 + 16} height={20} rx={10} fill="var(--surface)" stroke={color} strokeOpacity={0.5} />
                    <text textAnchor="middle" y={4} fontSize={10.5} fill="var(--foreground)" className="tabular" style={{ fontFamily: "var(--font-mono)" }}>{val}</text>
                  </g>
                </g>
              );
            })}
            {NODES.map((n) => {
              const color = LOOP_BY_ID[n.loop].color;
              const Icon = LOOP_BY_ID[n.loop].icon;
              const active = selected === n.id;
              const dim = focus !== "all" && focus !== n.loop;
              return (
                <g key={n.id} transform={`translate(${n.x - 62} ${n.y - 26})`} opacity={dim ? 0.25 : 1} tabIndex={0} role="button" aria-label={`${n.label}: ${n.sub}`} aria-pressed={active} onClick={() => setSelected(n.id)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelected(n.id); } }} style={{ cursor: "pointer", transition: "opacity .3s", outline: "none" }}>
                  <rect width={124} height={52} rx={14} fill="var(--surface)" stroke={color} strokeWidth={active ? 2.5 : 1} strokeOpacity={active ? 1 : 0.55} />
                  {active && <rect width={124} height={52} rx={14} fill={color} fillOpacity={0.12} />}
                  <foreignObject x={8} y={13} width={26} height={26}>
                    <div style={{ color }} className="grid size-6 place-items-center"><Icon className="size-4" aria-hidden /></div>
                  </foreignObject>
                  <text x={38} y={22} fontSize={11.5} fontWeight={600} fill="var(--foreground)">{n.label}</text>
                  <text x={38} y={37} fontSize={9} fill="var(--muted-foreground)">{n.sub.length > 22 ? `${n.sub.slice(0, 21)}…` : n.sub}</text>
                </g>
              );
            })}
            <g transform="translate(790 70)">
              <rect width={160} height={74} rx={14} fill="var(--surface)" stroke="var(--primary-glow)" strokeOpacity={0.6} />
              <text x={14} y={24} fontSize={9.5} fill="var(--muted-foreground)" style={{ textTransform: "uppercase", letterSpacing: 1 }}>Loop Score</text>
              <text x={14} y={56} fontSize={28} fontWeight={700} fill="var(--primary-glow)" style={{ fontFamily: "var(--font-display)" }}>{sum.score.toFixed(1)}</text>
              <text x={150} y={56} fontSize={10} textAnchor="end" fill="var(--muted-foreground)">of 100</text>
              <text x={150} y={24} fontSize={9.5} textAnchor="end" fill="var(--loop-save)">{fmtRs(metrics.savings)} saved</text>
            </g>
          </svg>
        </Panel>

        <div className="space-y-4">
          <AnimatePresence mode="wait">
            <motion.div key={selected} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <Panel
                title={node.label}
                subtitle={<><span className="block"><strong className="text-foreground">Fed by:</strong> {node.fedBy}</span><span className="mt-1 block"><strong className="text-foreground">Feeds:</strong> {node.feeds}</span><span className="mt-2 block">{loop.why}</span></>}
                action={<LoopChip loop={node.loop} />}
              >
                <p className="text-sm text-muted-foreground">{node.what}</p>
                <div className="mt-4 rounded-lg border p-3">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Next action for this loop</p>
                  {nextAction ? (
                    <div className="mt-1.5 space-y-2">
                      <p className="text-sm font-medium">{nextAction.title}</p>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-muted-foreground">{nextAction.assignee} · by {nextAction.deadline}</span>
                        {nextAction.status === "pending" ? (
                          <Button size="sm" variant="hero" onClick={() => dispatch(nextAction, "Officer")}><Send /> Dispatch</Button>
                        ) : (
                          <StatusPill status={nextAction.status} />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{nextAction.reason}</p>
                    </div>
                  ) : (
                    <p className="mt-1 text-xs text-muted-foreground">Nothing to dispatch for this loop right now. Try the Storm day scenario.</p>
                  )}
                </div>
              </Panel>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

    </div>
  );
}
