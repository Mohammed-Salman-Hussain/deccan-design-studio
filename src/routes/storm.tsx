import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Area, Bar, CartesianGrid, ComposedChart, Legend, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CheckCircle2, ChevronLeft, Clock, ChevronRight, CloudLightning, CloudRain, Droplets, Pause, Play, RotateCcw, Send, Sun, Waves, Zap, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useApp } from "@/store/app";
import { fmtL, useLocality } from "@/lib/hooks";
import { generateActions } from "@/lib/sim/actions";
import { formatClock, localityHourly, summarizeLocality, weatherAt } from "@/lib/sim/engine";
import { PageHeader } from "@/components/ll/primitives";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/storm")({
  head: () => ({
    meta: [
      { title: "Storm Simulator — LoopLocal" },
      { name: "description", content: "Run a storm day end to end: forecast, flagged drains, dispatched tasks, tanks filled on solar, recharge pits opened, outage ridden through." },
      { property: "og:title", content: "Storm Simulator — LoopLocal" },
      { property: "og:description", content: "One storm, eight steps, before and after." },
    ],
  }),
  component: StormPage,
});

interface StepDef {
  key: string;
  title: string;
  clock: number;
  icon: LucideIcon;
}

const STEP_DEFS: StepDef[] = [
  { key: "forecast", title: "Forecast arrives", clock: 480, icon: CloudRain },
  { key: "flag", title: "Risks flagged", clock: 540, icon: Waves },
  { key: "dispatch", title: "Crews dispatched", clock: 570, icon: Send },
  { key: "tanks", title: "Tanks fill on solar", clock: 840, icon: Sun },
  { key: "pits", title: "Recharge pits open", clock: 1020, icon: Droplets },
  { key: "outage", title: "Power cut begins", clock: 1140, icon: Zap },
  { key: "carry", title: "Tank carries the hub", clock: 1260, icon: CheckCircle2 },
  { key: "recharge", title: "Rain goes into the ground", clock: 1400, icon: CloudLightning },
];

const LAST = STEP_DEFS.length - 1;
const STEP_MS = 3200;
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

function StormPage() {
  const loc = useLocality();
  const set = useApp((s) => s.set);
  const setScenario = useApp((s) => s.setScenario);
  const setRole = useApp((s) => s.setRole);
  const dispatchMany = useApp((s) => s.dispatchMany);
  const addNotice = useApp((s) => s.addNotice);
  const log = useApp((s) => s.log);
  const tasks = useApp((s) => s.tasks);
  const scenario = useApp((s) => s.scenario);

  const [step, setStep] = useState(-1);
  const [running, setRunning] = useState(false);
  const reached = useRef(-1);
  const timer = useRef<number | null>(null);

  const stormActions = useMemo(() => generateActions(loc, "storm"), [loc]);
  const flagged = useMemo(() => stormActions.filter((a) => /drain-|pumpline|topup|pits$/.test(a.id)), [stormActions]);
  const flaggedDrains = flagged.filter((a) => a.id.includes("drain-"));
  const pumpLine = flagged.find((a) => a.id.endsWith("pumpline"));

  const end = useMemo(() => summarizeLocality(loc, "storm", 1439, 0), [loc]);
  const hourly = useMemo(() => localityHourly(loc, "storm"), [loc]);
  const outageHoursWithWater = avg(end.hubs.map((h) => h.outageCoveredHours));
  const outageBaseWithWater = avg(end.hubs.map((h) => h.outageCoveredBaseHours));
  const outageHours = avg(end.hubs.map((h) => h.outageHours));

  /** Runs the side effects of one step, once. */
  const effects = (key: string) => {
    switch (key) {
      case "forecast":
        log("Core engine", "Storm forecast ingested — 38 mm/h expected from 6 pm, discom cut 7 pm to midnight");
        break;
      case "flag":
        log("Core engine", `Flagged ${flaggedDrains.map((a) => a.title.replace("Clear Drain ", "").replace(" before 6 pm", "")).join(" and ")} and ${pumpLine ? "pump line PL-3" : "one pump line"}`);
        break;
      case "dispatch":
        dispatchMany(flagged, "Core engine");
        break;
      case "tanks":
        addNotice({ kind: "info", title: "Tanks filling on solar", body: "Pumps are running in sunlit hours so every overhead tank is full before the 7 pm cut." });
        break;
      case "pits":
        addNotice({ kind: "storm", title: "Recharge pits open", body: "Roof runoff is being diverted into recharge pits ahead of the rain." });
        break;
      case "outage":
        addNotice({ kind: "outage", title: "Planned power cut", body: "Section power is off from 7 pm. Your tank and the biogas genset keep the pumps going." });
        break;
      case "carry":
        log("Core engine", "Outage under way — hubs are supplying water from stored tank volume");
        break;
      case "recharge":
        addNotice({ kind: "success", title: "Storm handled", body: `${fmtL(end.rechargeL)} of runoff went into the ground instead of the street.` });
        break;
    }
  };

  const go = (i: number) => {
    for (let k = reached.current + 1; k <= i; k++) effects(STEP_DEFS[k].key);
    reached.current = Math.max(reached.current, i);
    set({ clock: STEP_DEFS[i].clock, playing: false });
    setStep(i);
  };

  useEffect(() => {
    if (!running) return;
    if (step >= LAST) {
      setRunning(false);
      return;
    }
    timer.current = window.setTimeout(() => go(step + 1), STEP_MS);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, step]);

  const done = step >= LAST && !running;

  const start = () => {
    if (scenario !== "storm") setScenario("storm");
    setRole("officer");
    reached.current = -1;
    setRunning(true);
    go(0);
  };
  const toggle = () => {
    if (running) setRunning(false);
    else if (done || step < 0) start();
    else setRunning(true);
  };
  const reset = () => {
    setRunning(false);
    setStep(-1);
    reached.current = -1;
    set({ clock: 630, playing: true });
  };
  const manual = (i: number) => {
    if (scenario !== "storm") setScenario("storm");
    setRunning(false);
    go(Math.max(0, Math.min(LAST, i)));
  };

  const detail = (key: string): string => {
    switch (key) {
      case "forecast": return "38 mm/h from 6 pm, winds to 48 km/h, and a power cut announced for 7 pm to midnight.";
      case "flag": return `${flaggedDrains.map((a) => a.place).join(" and ")} are most likely to choke. ${pumpLine ? pumpLine.title : "One pump line"} needs a check.`;
      case "dispatch": return `${flagged.length} tasks go to sanitation, pump and plumber crews, each with place, reason and deadline.`;
      case "tanks": return `${loc.hubs.length} hubs pump on rooftop solar and have full tanks before the cut.`;
      case "pits": return `${loc.hubs.reduce((a, h) => a + h.pits, 0)} recharge pits take roof runoff once the rain starts.`;
      case "outage": return "The grid drops. Buildings without stored water start running dry; LoopHubs keep going.";
      case "carry": return `Water stays on for ${outageHoursWithWater.toFixed(1)} of ${outageHours.toFixed(1)} outage hours.`;
      case "recharge": return `${fmtL(end.rechargeL)} goes into the ground. Street runoff is ${fmtL(end.streetL)} instead of ${fmtL(end.streetBaseL)}.`;
      default: return "Press Run storm day. The Core reads the forecast, flags the risks, sends crews, fills tanks on solar and rides through the power cut.";
    }
  };

  const dispatchedCount = Object.values(tasks).filter((t) => flagged.some((f) => f.id === t.id)).length;
  const cur = step >= 0 ? STEP_DEFS[step] : null;

  const cards = [
    { label: "Runoff reaching the street", before: fmtL(end.streetBaseL), after: fmtL(end.streetL) },
    { label: "Water during the power cut", before: `${outageBaseWithWater.toFixed(1)} of ${outageHours.toFixed(1)} h`, after: `${outageHoursWithWater.toFixed(1)} of ${outageHours.toFixed(1)} h` },
    { label: "Rain put back in the ground", before: "little to none", after: fmtL(end.rechargeL) },
  ];

  const shownClock = cur ? cur.clock : STEP_DEFS[0].clock;
  const w = weatherAt("storm", shownClock / 60);
  const tankNow = tankFor(step);
  const feed = step >= 0 ? STEP_DEFS.slice(0, step + 1).reverse() : [];

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader title="Storm Simulator" description="Run a storm day and watch the Core read the forecast, flag the risks, dispatch crews, fill tanks on solar and ride through the outage. Step through at your own pace with the arrows or the timeline.">
        <Button variant="hero" onClick={toggle} aria-label={running ? "Pause" : "Run Storm Day"}>
          {running ? <><Pause /> Pause</> : done ? <><RotateCcw /> Run again</> : step < 0 ? <><Play /> Run storm day</> : <><Play /> Resume</>}
        </Button>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="glass overflow-hidden rounded-xl">
          <div className="flex flex-wrap gap-2 border-b p-3">
            <Readout icon={Clock} label="Time" value={step >= 0 ? formatClock(shownClock) : "—"} />
            <Readout icon={CloudRain} label="Rain" value={step >= 0 ? `${w.rainMm.toFixed(0)} mm/h` : "—"} tone="var(--loop-rain)" />
            <Readout icon={Zap} label="Grid" value={step >= 0 ? (w.outage ? "Cut" : "On") : "—"} tone={w.outage && step >= 0 ? "var(--destructive)" : "var(--loop-solar)"} />
            <Readout icon={Droplets} label="LoopHub tank" value={step >= 0 ? `${tankNow}%` : "—"} tone="var(--loop-rain)" />
          </div>

          <Scene step={step} />

          <div className="flex items-center gap-3 border-t p-3">
            <Button variant="glass" size="icon" aria-label="Previous step" disabled={step <= 0} onClick={() => manual(step - 1)}><ChevronLeft /></Button>
            <ol className="grid flex-1 grid-cols-8 gap-1.5" aria-label="Storm timeline">
              {STEP_DEFS.map((sd, i) => (
                <li key={sd.key}>
                  <button
                    onClick={() => manual(i)}
                    aria-label={`${sd.title} at ${formatClock(sd.clock)}`}
                    aria-current={i === step ? "step" : undefined}
                    title={sd.title}
                    className="group block w-full text-center"
                  >
                    <span className={cn("block h-1.5 w-full rounded-full transition-colors", i <= step ? "bg-primary" : "bg-muted group-hover:bg-accent")} />
                    <span className={cn("mt-1 hidden font-mono text-[10px] sm:block", i === step ? "font-semibold text-foreground" : "text-muted-foreground")}>{formatClock(sd.clock)}</span>
                  </button>
                </li>
              ))}
            </ol>
            <Button variant="glass" size="icon" aria-label="Next step" disabled={step >= LAST} onClick={() => manual(step + 1)}><ChevronRight /></Button>
          </div>
        </div>

        <aside className="glass flex flex-col overflow-hidden rounded-xl lg:max-h-[calc(100dvh-12rem)]" aria-label="Live events">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h2 className="text-sm font-semibold">Live events</h2>
            <span className="font-mono text-xs text-muted-foreground">{feed.length} of {STEP_DEFS.length}</span>
          </div>
          <ol className="flex-1 space-y-0 overflow-y-auto" role="log" aria-live="polite">
            {feed.length === 0 && (
              <li className="p-5 text-sm text-muted-foreground">Press Run storm day. Events appear here as the Core reads the forecast, flags risks, sends crews and rides through the power cut.</li>
            )}
            <AnimatePresence initial={false}>
              {feed.map((ev, idx) => (
                <motion.li key={ev.key} layout initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className={cn("flex gap-3 border-b px-4 py-3 last:border-b-0", idx === 0 && "bg-accent")}>
                  <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-primary/15 text-primary-glow"><ev.icon className="size-3.5" aria-hidden /></span>
                  <div className="min-w-0">
                    <p className="flex items-baseline justify-between gap-2 text-sm font-medium"><span>{ev.title}</span><span className="font-mono text-[11px] font-normal text-muted-foreground">{formatClock(ev.clock)}</span></p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{detail(ev.key)}</p>
                    {ev.key === "dispatch" && dispatchedCount > 0 && (
                      <Link to="/command" onClick={() => setRole("worker")} className="mt-1.5 inline-block text-xs font-medium text-primary-glow underline-offset-4 hover:underline">Open the field crew's queue</Link>
                    )}
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ol>
        </aside>
      </div>

      <AnimatePresence>
        {done && (
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-5" aria-label="Before and after">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Before and after</h2>
              <Button variant="ghost" size="sm" onClick={reset}><RotateCcw /> Back to a normal day</Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {cards.map((c) => (
                <div key={c.label} className="glass rounded-xl p-4">
                  <p className="text-xs text-muted-foreground">{c.label}</p>
                  <p className="mt-3 font-display text-2xl font-semibold tabular text-primary-glow">{c.after}</p>
                  <p className="mt-1 text-xs text-muted-foreground">with LoopLocal, against {c.before} without</p>
                </div>
              ))}
            </div>

            <Accordion type="single" collapsible className="mt-3">
              <AccordionItem value="chart" className="glass rounded-xl border px-4">
                <AccordionTrigger className="text-sm font-medium hover:no-underline">Tank level through the storm</AccordionTrigger>
                <AccordionContent>
                  <p className="mb-2 text-xs text-muted-foreground">Average across hubs, with and without LoopLocal. The shaded band is the power cut.</p>
                  <div className="h-60 w-full" role="img" aria-label="Chart of average tank level over 24 hours with and without LoopLocal, with the outage window shaded">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={hourly} margin={{ top: 6, right: 8, bottom: 0, left: -12 }}>
                        <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} interval={3} />
                        <YAxis yAxisId="l" domain={[0, 100]} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} unit="%" />
                        <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} unit="mm" />
                        <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <ReferenceArea yAxisId="l" x1="19:00" x2="23:00" fill="var(--destructive)" fillOpacity={0.1} />
                        <Bar yAxisId="r" dataKey="rain" name="Rain (mm/h)" fill="var(--loop-rain)" fillOpacity={0.35} />
                        <Area yAxisId="l" type="monotone" dataKey="tankBase" name="Tank without LoopLocal" stroke="var(--muted-foreground)" fill="var(--muted-foreground)" fillOpacity={0.08} strokeDasharray="4 3" />
                        <Area yAxisId="l" type="monotone" dataKey="tank" name="Tank with LoopLocal" stroke="var(--loop-rain)" fill="var(--loop-rain)" fillOpacity={0.22} strokeWidth={2} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}

const HUB_H = 150;

const tankFor = (step: number) => (step < 3 ? 42 : step <= 4 ? 100 : step === 5 ? 88 : step === 6 ? 72 : 70);

function Readout({ icon: Icon, label, value, tone }: { icon: LucideIcon; label: string; value: string; tone?: string }) {
  return (
    <div className="flex min-w-[104px] items-center gap-2.5 rounded-lg border bg-card px-3 py-1.5">
      <Icon className="size-4 shrink-0" style={{ color: tone ?? "var(--muted-foreground)" }} aria-hidden />
      <div className="leading-tight">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="font-mono text-sm font-medium tabular">{value}</p>
      </div>
    </div>
  );
}

/** A small illustrated street that changes with the storm step. */
function Scene({ step }: { step: number }) {
  const cloudy = step >= 3;
  const raining = step >= 4;
  const night = step >= 5;
  const sunny = step < 3;
  const tank = tankFor(step);
  const cut = step >= 5;
  const buildings = [
    { x: 40, w: 120, h: 130 },
    { x: 190, w: 100, h: 170 },
    { x: 320, w: 190, h: HUB_H, hub: true },
    { x: 540, w: 110, h: 150 },
    { x: 680, w: 100, h: 120 },
    { x: 810, w: 110, h: 160 },
  ];
  const GROUND = 250;
  const T = { x: 360, y: GROUND - HUB_H - 54, w: 52, h: 44 };

  return (
    <svg viewBox="0 0 960 300" className="block h-auto w-full" role="img" aria-label={`Illustrated street during the storm, step ${step + 1} of ${STEP_DEFS.length}. The LoopHub tank is ${tank} percent full.${cut ? " The grid is out but the hub keeps its lights on." : ""}`}>
      <rect width="960" height="300" style={{ fill: night ? "var(--scene-sky-night)" : cloudy ? "var(--scene-sky-cloud)" : "var(--scene-sky-day)", transition: "fill 1s" }} />
      <circle cx="120" cy="64" r="30" fill="var(--loop-solar)" style={{ opacity: sunny ? 1 : 0, transition: "opacity 1s" }} />
      <g fill="var(--scene-cloud)" style={{ opacity: cloudy ? (night ? 0.35 : 0.9) : 0, transition: "opacity 1s" }}>
        <ellipse cx="200" cy="56" rx="64" ry="18" /><ellipse cx="250" cy="42" rx="46" ry="15" />
        <ellipse cx="520" cy="50" rx="70" ry="19" /><ellipse cx="800" cy="60" rx="60" ry="17" /><ellipse cx="850" cy="46" rx="40" ry="14" />
      </g>
      {raining && (
        <g stroke="var(--loop-rain)" strokeWidth="1.5" opacity="0.55" className="animate-rain">
          {Array.from({ length: 70 }, (_, i) => (
            <line key={i} x1={(i * 14) % 960} y1={-30 + ((i * 37) % 60)} x2={((i * 14) % 960) - 5} y2={-10 + ((i * 37) % 60)} />
          ))}
        </g>
      )}

      <rect y={GROUND} width="960" height="50" style={{ fill: "var(--scene-ground)" }} />

      {buildings.map((b, bi) => {
        const lit = b.hub || !cut;
        const cols = Math.max(2, Math.floor((b.w - 16) / 28));
        const rows = Math.max(2, Math.floor((b.h - 20) / 36));
        return (
          <g key={bi}>
            <rect x={b.x} y={GROUND - b.h} width={b.w} height={b.h} rx={4} fill={b.hub ? "var(--card)" : "var(--muted)"} stroke="var(--border)" />
            {Array.from({ length: rows }, (_, r) =>
              Array.from({ length: cols }, (_, c) => (
                <rect key={`${r}-${c}`} x={b.x + 12 + c * ((b.w - 24) / cols)} y={GROUND - b.h + 14 + r * 36} width={14} height={20} rx={2} style={{ fill: lit ? (((r * 3 + c * 5) % 7) > 1 ? "var(--scene-window-lit)" : "var(--scene-window)") : "var(--scene-window-off)", transition: "fill 0.8s" }} />
              )),
            )}
          </g>
        );
      })}

      {/* LoopHub roof: solar panels and tank */}
      <g>
        <rect x={430} y={GROUND - HUB_H - 12} width={70} height={10} rx={2} fill="var(--loop-solar)" style={{ opacity: step === 3 ? 1 : 0.8 }} />
        <rect x={T.x} y={T.y} width={T.w} height={T.h} rx={8} fill="var(--card)" stroke="var(--foreground)" strokeWidth={2} />
        <clipPath id="storm-tank"><rect x={T.x} y={T.y} width={T.w} height={T.h} rx={8} /></clipPath>
        <g clipPath="url(#storm-tank)">
          <motion.rect x={T.x} width={T.w} fill="var(--loop-rain)" initial={false} animate={{ y: T.y + T.h * (1 - tank / 100), height: T.h * (tank / 100) }} transition={{ duration: 1.2, ease: "easeOut" }} />
        </g>
        <text x={T.x + T.w / 2} y={T.y - 6} textAnchor="middle" fontSize="11" fontWeight={600} fill="var(--foreground)">LoopHub tank {tank}%</text>
      </g>

      {/* drains */}
      {[200, 600].map((x, i) => (
        <g key={x}>
          <rect x={x} y={GROUND + 6} width={90} height={10} rx={3} fill="var(--card)" stroke="var(--border)" />
          <motion.rect x={x + 2} y={GROUND + 8} height={6} rx={2} fill="var(--loop-rain)" initial={false} animate={{ width: raining ? (step >= 4 && i === 0 ? 40 : 82) : 14 }} transition={{ duration: 1.2 }} />
          {step >= 1 && (
            <circle cx={x + 45} cy={GROUND + 32} r={9} fill={step >= 4 ? "var(--primary)" : "var(--warning)"} style={{ transition: "fill 0.6s" }} />
          )}
          {step >= 1 && <text x={x + 45} y={GROUND + 36} textAnchor="middle" fontSize="11" fontWeight={700} fill="var(--card)">{step >= 4 ? "✓" : "!"}</text>}
        </g>
      ))}
      <text x={245} y={GROUND + 52} textAnchor="middle" fontSize="11" fill="var(--foreground)" opacity={0.7}>Drains</text>

      {/* recharge pit */}
      <g>
        <rect x={420} y={GROUND + 10} width={80} height={32} rx={4} fill="var(--card)" stroke="var(--border)" />
        <motion.rect x={422} width={76} rx={3} fill="var(--loop-rain)" initial={false} animate={{ y: GROUND + 40 - (step >= 7 ? 26 : step >= 4 ? 12 : 0), height: step >= 7 ? 26 : step >= 4 ? 12 : 0 }} transition={{ duration: 1.4 }} />
        <text x={460} y={GROUND + 52} textAnchor="middle" fontSize="11" fill="var(--foreground)" opacity={0.7}>Recharge pit</text>
      </g>
    </svg>
  );
}
