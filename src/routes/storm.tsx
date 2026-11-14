import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Area, Bar, CartesianGrid, ComposedChart, Legend, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CheckCircle2, CloudLightning, CloudRain, Droplets, Play, RotateCcw, Send, Sun, Waves, Wrench, Zap, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/store/app";
import { fmtL, useLocality, useLocalitySummary } from "@/lib/hooks";
import { generateActions } from "@/lib/sim/actions";
import { formatClock, localityHourly, summarizeLocality } from "@/lib/sim/engine";
import { PageHeader, Panel, Stat } from "@/components/ll/primitives";
import { AnimatedNumber } from "@/components/ll/AnimatedNumber";
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
  color: string;
}

const STEP_DEFS: StepDef[] = [
  { key: "forecast", title: "Forecast arrives", clock: 480, icon: CloudRain, color: "var(--loop-rain)" },
  { key: "flag", title: "Engine flags 2 drains and 1 pump line", clock: 540, icon: Waves, color: "var(--loop-save)" },
  { key: "dispatch", title: "Tasks dispatched to workers", clock: 570, icon: Send, color: "var(--primary-glow)" },
  { key: "tanks", title: "Tanks fill on solar", clock: 840, icon: Sun, color: "var(--loop-solar)" },
  { key: "pits", title: "Recharge pits open", clock: 1020, icon: Droplets, color: "var(--loop-reuse)" },
  { key: "outage", title: "Outage hits", clock: 1140, icon: Zap, color: "var(--destructive)" },
  { key: "carry", title: "Tank carries the hub through", clock: 1260, icon: CheckCircle2, color: "var(--success)" },
  { key: "recharge", title: "Runoff recharges the ground", clock: 1400, icon: CloudLightning, color: "var(--loop-rain)" },
];

const STEP_MS = 2800;
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
  const now = useLocalitySummary();

  const [step, setStep] = useState(-1);
  const [running, setRunning] = useState(false);
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

  const enter = (i: number) => {
    const def = STEP_DEFS[i];
    set({ clock: def.clock, playing: false });
    switch (def.key) {
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
    setStep(i);
  };

  useEffect(() => {
    if (!running) return;
    if (step >= STEP_DEFS.length - 1) {
      setRunning(false);
      return;
    }
    timer.current = window.setTimeout(() => enter(step + 1), STEP_MS);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, step]);

  const run = () => {
    if (scenario !== "storm") setScenario("storm");
    setRole("officer");
    setRunning(true);
    enter(0);
  };

  const reset = () => {
    setRunning(false);
    setStep(-1);
    set({ clock: 630, playing: true });
  };

  const detail = (key: string): string => {
    switch (key) {
      case "forecast": return "38 mm/h from 6 pm, winds to 48 km/h, and a discom cut announced for 7 pm to midnight.";
      case "flag": return `${flaggedDrains.map((a) => a.place).join(" and ")} are most likely to choke. ${pumpLine ? pumpLine.title : "One pump line"} needs a check.`;
      case "dispatch": return `${flagged.length} tasks sent to sanitation, pump and plumber crews, each with place, reason and deadline.`;
      case "tanks": return `${loc.hubs.length} hubs pump on rooftop solar and reach full tanks before 4 pm.`;
      case "pits": return `${loc.hubs.reduce((a, h) => a + h.pits, 0)} recharge pits across the locality take roof runoff once the rain starts.`;
      case "outage": return "Grid supply drops. Hubs without a stored-water plan start running dry.";
      case "carry": return `Hubs run with water on tap for ${outageHoursWithWater.toFixed(1)} of ${outageHours.toFixed(1)} outage hours.`;
      case "recharge": return `${fmtL(end.rechargeL)} recharged. Street runoff is ${fmtL(end.streetL)} instead of ${fmtL(end.streetBaseL)}.`;
      default: return "";
    }
  };

  const dispatchedCount = Object.values(tasks).filter((t) => flagged.some((f) => f.id === t.id)).length;
  const done = step >= STEP_DEFS.length - 1 && !running;

  const cards = [
    { label: "Runoff reaching the street", icon: Waves, color: "var(--loop-rain)", after: fmtL(end.streetL), before: fmtL(end.streetBaseL), better: end.streetL < end.streetBaseL },
    { label: "Outage hours with water", icon: Zap, color: "var(--loop-solar)", after: `${outageHoursWithWater.toFixed(1)} of ${outageHours.toFixed(1)} h`, before: `${outageBaseWithWater.toFixed(1)} of ${outageHours.toFixed(1)} h`, better: outageHoursWithWater >= outageBaseWithWater },
    { label: "Water shortage", icon: Droplets, color: "var(--loop-reuse)", after: fmtL(end.shortageL), before: fmtL(end.shortageBaseL), better: end.shortageL <= end.shortageBaseL },
    { label: "Litres recharged", icon: CloudRain, color: "var(--loop-save)", after: fmtL(end.rechargeL), before: "little to none", better: true },
  ];

  return (
    <div className="mx-auto max-w-[1300px]">
      <PageHeader title="Storm Simulator" description="Press the button and watch the Core read the forecast, flag the risks, dispatch crews, fill tanks on solar and ride through the outage.">
        {done && <Button variant="glass" onClick={reset}><RotateCcw /> Resume normal clock</Button>}
        <Button variant="hero" size="lg" onClick={run} disabled={running} aria-label="Run Storm Day">
          {done ? <RotateCcw /> : <Play />} {running ? "Storm running…" : done ? "Run it again" : "Run Storm Day"}
        </Button>
      </PageHeader>

      <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
        <Panel title="Storm timeline" subtitle={step >= 0 ? `Simulated time ${formatClock(STEP_DEFS[Math.max(0, step)].clock)}` : "Ready to run"} icon={CloudLightning}>
          <ol className="relative space-y-1">
            {STEP_DEFS.map((s, i) => {
              const state = i < step ? "done" : i === step ? "active" : "todo";
              return (
                <li key={s.key} className="relative flex gap-3 pb-3">
                  {i < STEP_DEFS.length - 1 && <span className="absolute left-[15px] top-8 h-[calc(100%-1.5rem)] w-px bg-border" aria-hidden />}
                  <motion.span animate={{ scale: state === "active" ? 1.1 : 1 }} className={cn("relative z-10 grid size-8 shrink-0 place-items-center rounded-full border", state === "todo" ? "bg-muted/40 text-muted-foreground" : "text-foreground")} style={state !== "todo" ? { background: `color-mix(in oklab, ${s.color} 22%, var(--surface))`, borderColor: s.color } : undefined}>
                    <s.icon className="size-4" aria-hidden />
                    {state === "active" && running && <span className="absolute inset-0 animate-pulse-ring rounded-full" style={{ background: s.color }} />}
                  </motion.span>
                  <div className={cn("min-w-0 flex-1 transition-opacity", state === "todo" && "opacity-50")}>
                    <p className="flex items-center justify-between gap-2 text-sm font-medium">
                      <span>{s.title}</span>
                      <span className="font-mono text-[10px] text-muted-foreground">{formatClock(s.clock)}</span>
                    </p>
                    <AnimatePresence initial={false}>
                      {state !== "todo" && (
                        <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-0.5 overflow-hidden text-xs text-muted-foreground">{detail(s.key)}</motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </li>
              );
            })}
          </ol>
          {step >= 2 && (
            <div className="mt-2 rounded-lg bg-brand-yellow/50 p-3 text-xs">
              <p className="flex items-center gap-1.5 font-medium"><Wrench className="size-3.5 text-primary-glow" aria-hidden /> {dispatchedCount} tasks now in the Field Worker queue</p>
              <p className="mt-1 text-muted-foreground">Open the <Link to="/command" onClick={() => setRole("worker")} className="text-primary-glow underline-offset-4 hover:underline">Field Worker view</Link> to complete one and watch the Loop Score move.</p>
            </div>
          )}
        </Panel>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Stat label="Loop Score" value={<AnimatedNumber value={now.score} decimals={1} />} sub="live" color="var(--primary-glow)" />
            <Stat label="Tankers avoided" value={<AnimatedNumber value={now.tankersAvoided} decimals={1} />} sub="so far" color="var(--loop-save)" />
            <Stat label="Street runoff so far" value={fmtL(now.streetL)} sub={`vs ${fmtL(now.streetBaseL)} without`} color="var(--destructive)" />
          </div>

          <Panel title="Tank level through the storm" subtitle="Average across hubs, with and without LoopLocal. Shaded band is the power cut." icon={Droplets}>
            <div className="h-64 w-full" role="img" aria-label="Chart of average tank level over 24 hours with and without LoopLocal, with the outage window shaded">
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
                  <Area yAxisId="l" type="monotone" dataKey="tank" name="Tank with LoopLocal" stroke="var(--loop-reuse)" fill="var(--loop-reuse)" fillOpacity={0.22} strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title="Before and after" subtitle="Full storm day, same locality, same weather" icon={CheckCircle2}>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {cards.map((c) => (
                <div key={c.label} className="rounded-xl border p-3">
                  <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground"><c.icon className="size-3.5" style={{ color: c.color }} aria-hidden /> {c.label}</p>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <div><p className="text-[10px] uppercase text-muted-foreground">Without</p><p className="font-display text-base font-semibold tabular text-muted-foreground">{c.before}</p></div>
                    <div><p className="text-[10px] uppercase text-muted-foreground">With</p><p className={cn("font-display text-base font-semibold tabular", c.better ? "text-success" : "text-warning")}>{c.after}</p></div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
